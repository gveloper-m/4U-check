<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Traits\FetchesWebPages;

class SecurityInfrastructureController extends Controller
{
    use FetchesWebPages;

    public function auditSecurityInfrastructure(Request $request): JsonResponse
    {
        $validated = $request->validate(['page_url' => 'required|url']);

        try {
            $result = $this->performAudit($validated['page_url']);
            return response()->json(array_merge(['success' => true], $result), 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    public function performAudit(string $pageUrl): array
    {
        $parsedUrl = parse_url($pageUrl);
        $domain    = $parsedUrl['host'] ?? '';
        $scheme    = strtolower($parsedUrl['scheme'] ?? 'https');

        if (empty($domain)) {
            throw new \Exception('Could not extract domain from the provided URL.');
        }

        $sslResult          = $this->checkSsl($domain, $scheme);
        $mixedContentResult = $this->checkMixedContent($pageUrl, $scheme);
        $dnsResult          = $this->checkDnsRecords($domain);
        $headersResult      = $this->checkSecurityHeaders($pageUrl);
        $httpsRedirect      = $this->checkHttpsRedirect($domain, $scheme);

        DB::table('security_infrastructure_audits')->insert([
            'site_url'            => $pageUrl,
            'ssl_valid'           => $sslResult['ssl_valid'],
            'ssl_days_left'       => $sslResult['ssl_days_left'],
            'has_mixed_content'   => $mixedContentResult['has_mixed_content'],
            'spf_record_exists'   => $dnsResult['spf_record_exists'],
            'dmarc_record_exists' => $dnsResult['dmarc_record_exists'],
            'executed_at'         => now(),
        ]);

        return [
            'site_url'        => $pageUrl,
            'domain'          => $domain,
            'ssl'             => $sslResult,
            'mixed_content'   => $mixedContentResult,
            'dns_security'    => $dnsResult,
            'security_headers'=> $headersResult,
            'https_redirect'  => $httpsRedirect,
            'executed_at'     => now(),
        ];
    }

    public function getAuditHistory(Request $request): JsonResponse
    {
        try {
            $query = DB::table('security_infrastructure_audits');

            if ($request->has('site_url')) {
                $query->where('site_url', $request->query('site_url'));
            }

            $audits = $query->latest('executed_at')->paginate(10);

            return response()->json([
                'success' => true,
                'audits'  => $audits,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], 400);
        }
    }

    // -------------------------------------------------------------------------
    // SSL certificate check via native stream sockets (no external dependencies)
    // -------------------------------------------------------------------------

    private function checkSsl(string $domain, string $scheme): array
    {
        $result = [
            'ssl_valid'     => false,
            'ssl_days_left' => null,
            'ssl_expiry'    => null,
            'ssl_issuer'    => null,
            'ssl_subject'   => null,
            'error'         => null,
            'warning'       => null,
        ];

        if ($scheme !== 'https') {
            $result['error'] = 'Site is not using HTTPS — SSL check skipped.';
            return $result;
        }

        try {
            $context = stream_context_create([
                'ssl' => [
                    'capture_peer_cert'  => true,
                    'verify_peer'        => false,
                    'verify_peer_name'   => false,
                    'allow_self_signed'  => true,
                ],
            ]);

            $socket = @stream_socket_client(
                "ssl://{$domain}:443",
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT,
                $context
            );

            if (! $socket) {
                $result['error'] = "SSL connection failed: {$errstr} (errno {$errno})";
                return $result;
            }

            $params = stream_context_get_params($socket);
            $cert   = $params['options']['ssl']['peer_certificate'] ?? null;
            fclose($socket);

            if (! $cert) {
                $result['error'] = 'Peer certificate could not be retrieved.';
                return $result;
            }

            $certData = openssl_x509_parse($cert);
            $validTo  = (int) ($certData['validTo_time_t'] ?? 0);
            $daysLeft = (int) (($validTo - time()) / 86400);

            $result['ssl_valid']     = $daysLeft > 0;
            $result['ssl_days_left'] = $daysLeft;
            $result['ssl_expiry']    = date('Y-m-d', $validTo);
            $result['ssl_issuer']    = $certData['issuer']['O']  ?? $certData['issuer']['CN']  ?? null;
            $result['ssl_subject']   = $certData['subject']['CN'] ?? null;

            if ($daysLeft <= 0) {
                $result['error'] = 'SSL certificate has expired.';
            } elseif ($daysLeft <= 30) {
                $result['warning'] = "SSL certificate expires in {$daysLeft} days — renew soon.";
            }

        } catch (\Throwable $e) {
            $result['error'] = 'SSL check exception: ' . $e->getMessage();
        }

        return $result;
    }

    // -------------------------------------------------------------------------
    // Mixed-content detection: HTTP assets on an HTTPS page
    // -------------------------------------------------------------------------

    private function checkMixedContent(string $url, string $scheme): array
    {
        $result = [
            'has_mixed_content'    => false,
            'mixed_content_items'  => [],
            'error'                => null,
        ];

        if ($scheme !== 'https') {
            $result['error'] = 'Mixed-content check applies only to HTTPS pages.';
            return $result;
        }

        try {
            $response = Http::withHeaders($this->browserHeaders())->timeout(20)->get($url);

            if (! $response->successful()) {
                $result['error'] = "Could not fetch page for mixed-content check (HTTP {$response->status()}).";
                return $result;
            }

            $html = $response->body();

            // Tag attributes that can load external resources
            $patterns = [
                'script[src]'  => '/<script[^>]+src=["\']http:\/\/([^"\']+)["\']/i',
                'link[href]'   => '/<link[^>]+href=["\']http:\/\/([^"\']+)["\']/i',
                'img[src]'     => '/<img[^>]+src=["\']http:\/\/([^"\']+)["\']/i',
                'iframe[src]'  => '/<iframe[^>]+src=["\']http:\/\/([^"\']+)["\']/i',
                'audio[src]'   => '/<audio[^>]+src=["\']http:\/\/([^"\']+)["\']/i',
                'video[src]'   => '/<video[^>]+src=["\']http:\/\/([^"\']+)["\']/i',
                'source[src]'  => '/<source[^>]+src=["\']http:\/\/([^"\']+)["\']/i',
                'object[data]' => '/<object[^>]+data=["\']http:\/\/([^"\']+)["\']/i',
            ];

            foreach ($patterns as $tag => $pattern) {
                if (preg_match_all($pattern, $html, $matches, PREG_SET_ORDER)) {
                    $result['has_mixed_content'] = true;
                    foreach ($matches as $match) {
                        $result['mixed_content_items'][] = [
                            'element' => $tag,
                            'url'     => 'http://' . $match[1],
                        ];
                    }
                }
            }

        } catch (\Throwable $e) {
            $result['error'] = 'Mixed-content check error: ' . $e->getMessage();
        }

        return $result;
    }

    // -------------------------------------------------------------------------
    // DNS email security records: SPF, DMARC, common DKIM selectors
    // -------------------------------------------------------------------------

    private function checkDnsRecords(string $domain): array
    {
        $rootDomain = $this->extractRootDomain($domain);

        $result = [
            'root_domain'         => $rootDomain,
            'spf_record_exists'   => false,
            'spf_record'          => null,
            'dmarc_record_exists' => false,
            'dmarc_record'        => null,
            'dkim_found'          => false,
            'dkim_selector'       => null,
            'errors'              => [],
        ];

        // ---- SPF ----
        try {
            $txtRecords = @dns_get_record($rootDomain, DNS_TXT);
            if ($txtRecords === false) {
                $result['errors'][] = "DNS TXT lookup failed for {$rootDomain}";
            } else {
                foreach ($txtRecords as $rec) {
                    $txt = $this->extractTxtValue($rec);
                    if (str_starts_with($txt, 'v=spf1')) {
                        $result['spf_record_exists'] = true;
                        $result['spf_record']        = $txt;
                        break;
                    }
                }
            }
        } catch (\Throwable $e) {
            $result['errors'][] = 'SPF check error: ' . $e->getMessage();
        }

        // ---- DMARC ----
        try {
            $dmarcHost    = '_dmarc.' . $rootDomain;
            $dmarcRecords = @dns_get_record($dmarcHost, DNS_TXT);
            if ($dmarcRecords !== false) {
                foreach ($dmarcRecords as $rec) {
                    $txt = $this->extractTxtValue($rec);
                    if (str_starts_with($txt, 'v=DMARC1')) {
                        $result['dmarc_record_exists'] = true;
                        $result['dmarc_record']        = $txt;
                        break;
                    }
                }
            }
        } catch (\Throwable $e) {
            $result['errors'][] = 'DMARC check error: ' . $e->getMessage();
        }

        // ---- DKIM (probe common selectors) ----
        $selectors = ['default', 'google', 'mail', 'k1', 'key1', 'dkim', 'smtp', 'selector1', 'selector2'];
        foreach ($selectors as $selector) {
            try {
                $dkimHost    = "{$selector}._domainkey.{$rootDomain}";
                $dkimRecords = @dns_get_record($dkimHost, DNS_TXT);
                if ($dkimRecords !== false && ! empty($dkimRecords)) {
                    foreach ($dkimRecords as $rec) {
                        $txt = $this->extractTxtValue($rec);
                        if (str_contains($txt, 'v=DKIM1') || str_contains($txt, 'p=')) {
                            $result['dkim_found']    = true;
                            $result['dkim_selector'] = $selector;
                            break 2;
                        }
                    }
                }
            } catch (\Throwable) {
                // Ignore per-selector failures
            }
        }

        return $result;
    }

    // -------------------------------------------------------------------------
    // Security HTTP headers audit
    // -------------------------------------------------------------------------

    private function checkSecurityHeaders(string $url): array
    {
        $result = [
            'headers_present' => [],
            'headers_missing' => [],
            'issues'          => [],
            'info_disclosure' => [],
        ];

        $recommended = [
            'Strict-Transport-Security' => 'HSTS forces HTTPS on all future visits',
            'X-Content-Type-Options'    => 'Prevents MIME-type sniffing (set to nosniff)',
            'X-Frame-Options'           => 'Prevents clickjacking (DENY or SAMEORIGIN)',
            'Content-Security-Policy'   => 'Restricts which resources can be loaded',
            'Referrer-Policy'           => 'Controls referrer information in requests',
            'Permissions-Policy'        => 'Controls browser feature access',
        ];

        try {
            $response = Http::withHeaders($this->browserHeaders())->timeout(15)->withoutRedirecting()->get($url);

            foreach ($recommended as $header => $description) {
                $value = $response->header($header);
                if ($value) {
                    $result['headers_present'][$header] = $value;
                } else {
                    $result['headers_missing'][] = $header;
                    $result['issues'][]          = "Missing {$header}: {$description}";
                }
            }

            // Information disclosure headers
            foreach (['Server', 'X-Powered-By', 'X-AspNet-Version', 'X-Generator'] as $h) {
                $val = $response->header($h);
                if ($val) {
                    $result['info_disclosure'][$h] = $val;
                    $result['issues'][]            = "Server info exposed via {$h}: {$val}";
                }
            }

            // Flag weak X-Frame-Options values
            $xfo = $response->header('X-Frame-Options');
            if ($xfo && ! in_array(strtoupper($xfo), ['DENY', 'SAMEORIGIN'], true)) {
                $result['issues'][] = "X-Frame-Options has weak value: {$xfo}";
            }

            // Flag missing 'nosniff' on X-Content-Type-Options
            $xcto = $response->header('X-Content-Type-Options');
            if ($xcto && strtolower($xcto) !== 'nosniff') {
                $result['issues'][] = "X-Content-Type-Options should be 'nosniff', got: {$xcto}";
            }

        } catch (\Throwable $e) {
            $result['issues'][] = 'Security headers check error: ' . $e->getMessage();
        }

        $result['score'] = count($recommended) - count($result['headers_missing']);
        $result['status'] = $result['score'] >= 5 ? 'OK' : ($result['score'] >= 3 ? 'WARN' : 'BAD');

        return $result;
    }

    // -------------------------------------------------------------------------
    // HTTPS redirect check: does http:// redirect to https://
    // -------------------------------------------------------------------------

    private function checkHttpsRedirect(string $domain, string $scheme): array
    {
        $result = ['redirects_to_https' => null, 'issues' => []];

        if ($scheme === 'https') {
            try {
                $httpUrl  = "http://{$domain}/";
                $response = Http::withHeaders($this->browserHeaders())->timeout(10)->withoutRedirecting()->get($httpUrl);

                $location       = $response->header('Location') ?? '';
                $statusCode     = $response->status();
                $isRedirect     = in_array($statusCode, [301, 302, 307, 308], true);
                $toHttps        = $isRedirect && str_starts_with($location, 'https://');

                $result['redirects_to_https'] = $toHttps;
                $result['http_status_code']   = $statusCode;
                $result['redirect_location']  = $location ?: null;

                if (! $toHttps) {
                    if (! $isRedirect) {
                        $result['issues'][] = "http:// URL returns HTTP {$statusCode} without redirect — should redirect to https://";
                    } else {
                        $result['issues'][] = "http:// redirects but not to https:// (Location: {$location})";
                    }
                }
            } catch (\Throwable $e) {
                $result['redirects_to_https'] = null;
                $result['issues'][]           = 'HTTPS redirect check error: ' . $e->getMessage();
            }
        } else {
            $result['redirects_to_https'] = null;
            $result['issues'][]           = 'Site is not using HTTPS — no redirect check performed';
        }

        return $result;
    }

    /**
     * DNS_TXT records expose the value as either 'txt' or inside 'entries' depending
     * on the system's resolver implementation.
     */
    private function extractTxtValue(array $record): string
    {
        if (isset($record['txt'])) {
            return $record['txt'];
        }
        if (isset($record['entries']) && is_array($record['entries'])) {
            return implode('', $record['entries']);
        }
        return '';
    }

    /**
     * Strip subdomains to get the registrable root domain.
     * Handles common compound TLDs (e.g. .co.uk, .com.gr).
     */
    private function extractRootDomain(string $domain): string
    {
        $parts = explode('.', $domain);

        if (count($parts) <= 2) {
            return $domain;
        }

        $compoundTlds = [
            'co.uk', 'co.nz', 'co.in', 'co.za', 'co.jp',
            'com.au', 'com.br', 'com.gr', 'com.tr', 'com.mx',
            'org.uk', 'net.au', 'gov.uk',
        ];

        $lastTwo = implode('.', array_slice($parts, -2));
        if (in_array($lastTwo, $compoundTlds, true)) {
            return implode('.', array_slice($parts, -3));
        }

        return implode('.', array_slice($parts, -2));
    }
}
