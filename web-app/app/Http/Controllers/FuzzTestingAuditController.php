<?php

namespace App\Http\Controllers;

use App\Traits\FetchesWebPages;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;

/**
 * Opt-in fuzz testing module. Only ever fuzzes GET-based inputs — query string
 * parameters discovered while crawling, and inputs on <form method="get">
 * elements (e.g. search boxes). POST forms are never touched, so there is no
 * risk of triggering a real checkout, account deletion, newsletter signup, or
 * any other state-changing action on the target site.
 *
 * For each discovered input it substitutes a curated set of edge-case /
 * malicious-pattern payloads and looks for signs the target mishandles them:
 * server errors, reflected-unescaped-input (possible XSS), leaked SQL/debug
 * error text, or drastically slower responses.
 */
class FuzzTestingAuditController extends Controller
{
    use FetchesWebPages;

    private const MAX_PAGES         = 8;
    private const MAX_TARGETS       = 6;
    private const MAX_REQUESTS      = 45;
    private const REQUEST_TIMEOUT   = 10;
    private const SLOW_THRESHOLD_MS = 8000;

    private const REFLECTED_PAYLOADS = [
        '<script>alert(1)</script>',
        '"><img src=x onerror=alert(1)>',
    ];

    private const SQL_ERROR_SIGNATURES = [
        'sql syntax', 'mysql_fetch', 'ora-01756', 'sqlite3::', 'sqlstate',
        'syntax error at or near', 'unclosed quotation mark', 'pg_query(', 'odbc_exec',
    ];

    private const DEBUG_ERROR_SIGNATURES = [
        'stack trace:', 'whoops', 'fatal error', 'uncaught exception',
        'traceback (most recent call last)', 'warning: ', 'notice: undefined',
        'exception in thread', 'at eval (',
    ];

    public function performAudit(string $url): array
    {
        try {
            $targets = $this->discoverTargets($url);

            if (empty($targets)) {
                return [
                    'status'         => 'ok',
                    'url'            => $url,
                    'targets_tested' => 0,
                    'requests_sent'  => 0,
                    'findings'       => [],
                    'summary'        => ['total_findings' => 0, 'reflected_input' => 0, 'server_error' => 0, 'error_disclosure' => 0, 'slow_response' => 0],
                    'note'           => 'No fuzzable GET parameters or GET forms were found on the crawled pages.',
                ];
            }

            $baselineMs   = $this->measureBaseline($url);
            $payloads     = $this->payloads();
            $findings     = [];
            $requestsSent = 0;

            foreach ($targets as $target) {
                if ($requestsSent >= self::MAX_REQUESTS) {
                    break;
                }
                foreach ($payloads as $label => $payload) {
                    if ($requestsSent >= self::MAX_REQUESTS) {
                        break;
                    }
                    usleep(random_int(150000, 350000));
                    $requestsSent++;

                    $testUrl = $this->buildFuzzedUrl($target['action'], $target['baseParams'], $target['param'], $payload);

                    try {
                        $start    = microtime(true);
                        $response = Http::withHeaders($this->browserHeaders())
                            ->timeout(self::REQUEST_TIMEOUT)
                            ->get($testUrl);
                        $elapsedMs = (int) ((microtime(true) - $start) * 1000);
                    } catch (\Throwable $e) {
                        continue; // connection/timeout noise isn't a finding
                    }

                    $issue = $this->analyzeResponse($response->status(), $response->body(), $payload, $elapsedMs, $baselineMs);
                    if ($issue) {
                        $findings[] = array_merge($issue, [
                            'url'          => $testUrl,
                            'param'        => $target['param'],
                            'payload_type' => $label,
                            'source'       => $target['source'],
                        ]);
                    }
                }
            }

            $findings = $this->dedupeFindings($findings);

            return [
                'status'         => 'ok',
                'url'            => $url,
                'targets_tested' => count($targets),
                'requests_sent'  => $requestsSent,
                'findings'       => array_slice($findings, 0, 20),
                'summary'        => [
                    'total_findings'   => count($findings),
                    'reflected_input'  => count(array_filter($findings, fn ($f) => $f['type'] === 'reflected_input')),
                    'server_error'     => count(array_filter($findings, fn ($f) => $f['type'] === 'server_error')),
                    'error_disclosure' => count(array_filter($findings, fn ($f) => $f['type'] === 'error_disclosure')),
                    'slow_response'    => count(array_filter($findings, fn ($f) => $f['type'] === 'slow_response')),
                ],
            ];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    /**
     * @return array<string, string> payload label => payload value
     */
    private function payloads(): array
    {
        return [
            'empty'              => '',
            'long_string'        => str_repeat('A', 4000),
            'negative_number'    => '-1',
            'huge_number'        => '99999999999999999999',
            'unicode'            => "héllo世界🚀",
            'sql_quote'          => "' OR '1'='1",
            'sql_comment'        => "'; DROP TABLE users; --",
            'xss_script'         => self::REFLECTED_PAYLOADS[0],
            'xss_attr'           => self::REFLECTED_PAYLOADS[1],
            'path_traversal'     => '../../../../etc/passwd',
            'null_byte'          => "value\0end",
            'template_injection' => '{{7*7}}${7*7}',
            'crlf_injection'     => "test\r\nSet-Cookie: fuzz=1",
        ];
    }

    /**
     * Crawl a handful of same-host pages looking for fuzzable GET surfaces:
     * the entry URL's own query string, query strings on discovered links,
     * and inputs on <form method="get"> elements. POST forms are skipped
     * entirely — this module never submits state-changing requests.
     *
     * @return array<int, array{action: string, param: string, baseParams: array, source: string}>
     */
    private function discoverTargets(string $pageUrl): array
    {
        $host    = parse_url($pageUrl, PHP_URL_HOST);
        $targets = [];
        $seen    = [];

        $this->collectQueryTargets($pageUrl, $seen, $targets);

        $visited = [];
        $queue   = [$pageUrl];
        $pages   = 0;

        while (! empty($queue) && $pages < self::MAX_PAGES && count($targets) < self::MAX_TARGETS * 3) {
            $current = array_shift($queue);
            if (isset($visited[$current])) {
                continue;
            }
            $visited[$current] = true;
            $pages++;

            try {
                $html = $this->fetchHtml($current);
            } catch (\Throwable $e) {
                continue;
            }

            $crawler = new Crawler($html, $current);

            $crawler->filter('a[href]')->each(function (Crawler $node) use (&$targets, &$seen, &$queue, &$visited, $host, $current) {
                $href = $node->attr('href');
                if (empty($href) || str_starts_with($href, 'javascript:') || str_starts_with($href, 'mailto:') || str_starts_with($href, 'tel:') || str_starts_with($href, '#')) {
                    return;
                }
                $abs = $this->toAbsoluteUrl($href, $current);
                if ((parse_url($abs, PHP_URL_HOST) ?? '') !== $host) {
                    return;
                }
                if (str_contains($abs, '?')) {
                    $this->collectQueryTargets($abs, $seen, $targets);
                } elseif (! isset($visited[$abs])) {
                    $queue[] = $abs;
                }
            });

            $crawler->filter('form')->each(function (Crawler $node) use (&$targets, $host, $current) {
                $method = strtolower($node->attr('method') ?: 'get');
                if ($method !== 'get') {
                    return; // never fuzz POST forms
                }
                $action    = $node->attr('action') ?: $current;
                $actionAbs = $this->toAbsoluteUrl($action, $current);
                if ((parse_url($actionAbs, PHP_URL_HOST) ?? '') !== $host) {
                    return;
                }

                $baseParams = [];
                $names      = [];
                $node->filter('input, select, textarea')->each(function (Crawler $input) use (&$baseParams, &$names) {
                    $name = $input->attr('name');
                    if (empty($name)) {
                        return;
                    }
                    $type = strtolower($input->attr('type') ?: 'text');
                    if (in_array($type, ['submit', 'button', 'file', 'image', 'reset'], true)) {
                        return;
                    }
                    $names[]            = $name;
                    $baseParams[$name]  = $input->attr('value') ?: '1';
                });

                foreach (array_unique($names) as $name) {
                    $targets[] = [
                        'action'     => $actionAbs,
                        'param'      => $name,
                        'baseParams' => $baseParams,
                        'source'     => 'get_form',
                    ];
                }
            });
        }

        return array_slice($targets, 0, self::MAX_TARGETS);
    }

    private function collectQueryTargets(string $url, array &$seen, array &$targets): void
    {
        $parts = parse_url($url);
        if (empty($parts['query'])) {
            return;
        }
        parse_str($parts['query'], $params);
        $action = strtok($url, '?');

        foreach (array_keys($params) as $name) {
            $key = $action . '|' . $name;
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $targets[]  = [
                'action'     => $action,
                'param'      => $name,
                'baseParams' => $params,
                'source'     => 'query_param',
            ];
        }
    }

    private function toAbsoluteUrl(string $url, string $base): string
    {
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            return $url;
        }
        $baseParts = parse_url($base);
        $scheme    = $baseParts['scheme'] ?? 'https';
        $host      = $baseParts['host'] ?? '';
        $authority = $host . (isset($baseParts['port']) ? ':' . $baseParts['port'] : '');

        if (str_starts_with($url, '//')) {
            return $scheme . ':' . $url;
        }
        if (str_starts_with($url, '/')) {
            return $scheme . '://' . $authority . $url;
        }

        $basePath = rtrim(dirname($baseParts['path'] ?? '/'), '/');
        return $scheme . '://' . $authority . $basePath . '/' . ltrim($url, './');
    }

    private function buildFuzzedUrl(string $action, array $baseParams, string $targetParam, string $payload): string
    {
        $params                = $baseParams;
        $params[$targetParam]  = $payload;
        $query                 = http_build_query($params);
        return $action . ($query ? '?' . $query : '');
    }

    private function measureBaseline(string $url): ?int
    {
        try {
            $start = microtime(true);
            Http::withHeaders($this->browserHeaders())->timeout(self::REQUEST_TIMEOUT)->get($url);
            return (int) ((microtime(true) - $start) * 1000);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function analyzeResponse(int $status, string $body, string $payload, int $elapsedMs, ?int $baselineMs): ?array
    {
        if ($status >= 500) {
            return [
                'type'        => 'server_error',
                'severity'    => 'high',
                'status_code' => $status,
                'evidence'    => "Server returned HTTP {$status} for this input.",
            ];
        }

        $bodyLower = strtolower($body);

        foreach (self::SQL_ERROR_SIGNATURES as $sig) {
            if (str_contains($bodyLower, $sig)) {
                return [
                    'type'        => 'error_disclosure',
                    'severity'    => 'high',
                    'status_code' => $status,
                    'evidence'    => "Response body contains a possible SQL error signature (\"{$sig}\").",
                ];
            }
        }

        foreach (self::DEBUG_ERROR_SIGNATURES as $sig) {
            if (str_contains($bodyLower, $sig)) {
                return [
                    'type'        => 'error_disclosure',
                    'severity'    => 'medium',
                    'status_code' => $status,
                    'evidence'    => "Response body contains a possible debug/stack-trace disclosure (\"{$sig}\").",
                ];
            }
        }

        if (in_array($payload, self::REFLECTED_PAYLOADS, true) && str_contains($body, $payload)) {
            return [
                'type'        => 'reflected_input',
                'severity'    => 'high',
                'status_code' => $status,
                'evidence'    => 'The payload was reflected back in the response unescaped — possible XSS.',
            ];
        }

        if ($baselineMs !== null && $elapsedMs > self::SLOW_THRESHOLD_MS && $elapsedMs > $baselineMs * 4) {
            return [
                'type'        => 'slow_response',
                'severity'    => 'low',
                'status_code' => $status,
                'evidence'    => "Response took {$elapsedMs}ms vs a ~{$baselineMs}ms baseline — this input may cause excessive processing time.",
            ];
        }

        return null;
    }

    private function dedupeFindings(array $findings): array
    {
        $seen = [];
        $out  = [];
        foreach ($findings as $f) {
            $key = $f['type'] . '|' . $f['param'] . '|' . $f['source'];
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $out[]      = $f;
        }
        return $out;
    }
}
