<?php

namespace App\Http\Controllers;

use DOMDocument;
use DOMXPath;
use Illuminate\Support\Facades\Http;

class AccessibilityAuditController extends Controller
{
    private const TIMEOUT = 20;

    private const VAGUE_LINK_TEXT = [
        'click here', 'here', 'read more', 'more', 'link', 'this',
        'click', 'details', 'info', 'learn more', 'view', 'see more',
        'go', 'continue', 'next', 'prev', 'previous', 'start', 'begin',
    ];

    private const NAMED_COLORS = [
        'white'       => [255, 255, 255],
        'black'       => [0, 0, 0],
        'red'         => [255, 0, 0],
        'green'       => [0, 128, 0],
        'lime'        => [0, 255, 0],
        'blue'        => [0, 0, 255],
        'yellow'      => [255, 255, 0],
        'orange'      => [255, 165, 0],
        'purple'      => [128, 0, 128],
        'gray'        => [128, 128, 128],
        'grey'        => [128, 128, 128],
        'silver'      => [192, 192, 192],
        'navy'        => [0, 0, 128],
        'teal'        => [0, 128, 128],
        'maroon'      => [128, 0, 0],
        'fuchsia'     => [255, 0, 255],
        'aqua'        => [0, 255, 255],
        'cyan'        => [0, 255, 255],
        'darkgray'    => [169, 169, 169],
        'darkgrey'    => [169, 169, 169],
        'lightgray'   => [211, 211, 211],
        'lightgrey'   => [211, 211, 211],
        'whitesmoke'  => [245, 245, 245],
        'gainsboro'   => [220, 220, 220],
        'transparent' => null,
    ];

    // ─── Public entry point ──────────────────────────────────────────────────

    public function performAudit(string $url): array
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (compatible; 4utest-accessibility/1.0)',
                'Accept'     => 'text/html,application/xhtml+xml',
            ])->timeout(self::TIMEOUT)->get($url);

            if (! $response->successful()) {
                return $this->errorResult("HTTP {$response->status()}");
            }

            $html = $response->body();

            $dom = new DOMDocument();
            libxml_use_internal_errors(true);
            $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
            libxml_clear_errors();

            $xpath = new DOMXPath($dom);

            $checks = [
                'form_labels'       => $this->checkFormLabels($dom, $xpath),
                'image_alt'         => $this->checkImageAlt($dom, $xpath),
                'aria_labels'       => $this->checkAriaLabels($dom, $xpath),
                'heading_hierarchy' => $this->checkHeadingHierarchy($dom, $xpath),
                'link_text'         => $this->checkLinkText($dom, $xpath),
                'landmarks'         => $this->checkLandmarks($dom, $xpath),
                'color_contrast'    => $this->checkColorContrast($html, $xpath, $dom),
            ];

            $score = $this->computeScore($checks);

            return [
                'status' => 'ok',
                'url'    => $url,
                'score'  => $score,
                'checks' => $checks,
            ];
        } catch (\Throwable $e) {
            return $this->errorResult($e->getMessage());
        }
    }

    // ─── Check 1: Form Labels ────────────────────────────────────────────────

    private function checkFormLabels(DOMDocument $dom, DOMXPath $xpath): array
    {
        $violations = [];
        $pass = 0;

        // Build map of label[for] → label text
        $labelMap = [];
        foreach ($xpath->query('//label[@for]') as $label) {
            $for = $label->getAttribute('for');
            $labelMap[$for] = trim($label->textContent);
        }

        $inputQuery = '//input[not(@type="hidden") and not(@type="submit") and not(@type="button") and not(@type="reset") and not(@type="image")]|//textarea|//select';
        foreach ($xpath->query($inputQuery) as $input) {
            $id          = $input->getAttribute('id');
            $ariaLabel   = $input->getAttribute('aria-label');
            $ariaLabelBy = $input->getAttribute('aria-labelledby');
            $title       = $input->getAttribute('title');
            $type        = $input->getAttribute('type') ?: 'text';
            $name        = $input->getAttribute('name') ?: $input->nodeName;

            // Check if wrapped in a <label>
            $inLabel = false;
            $parent  = $input->parentNode;
            while ($parent) {
                if ($parent instanceof \DOMElement && strtolower($parent->nodeName) === 'label') {
                    $inLabel = true;
                    break;
                }
                $parent = $parent->parentNode ?? null;
            }

            $hasLabel = $inLabel
                || ($id && isset($labelMap[$id]))
                || ! empty($ariaLabel)
                || ! empty($ariaLabelBy)
                || ! empty($title);

            if ($hasLabel) {
                $pass++;
            } else {
                $violations[] = [
                    'element'      => $input->nodeName,
                    'type'         => $type,
                    'name'         => $name,
                    'id'           => $id ?: null,
                    'issue'        => 'No associated label',
                    'html_snippet' => mb_substr(@$dom->saveHTML($input) ?: '', 0, 250),
                ];
            }
        }

        $total = $pass + count($violations);

        return [
            'status'     => count($violations) === 0 ? 'pass' : (count($violations) <= 2 ? 'warn' : 'fail'),
            'pass'       => $pass,
            'fail'       => count($violations),
            'total'      => $total,
            'violations' => array_slice($violations, 0, 50),
        ];
    }

    // ─── Check 2: Image Alt Text ─────────────────────────────────────────────

    private function checkImageAlt(DOMDocument $dom, DOMXPath $xpath): array
    {
        $missing    = [];
        $withAlt    = 0;
        $decorative = 0;

        foreach ($xpath->query('//img') as $img) {
            if (! $img->hasAttribute('alt')) {
                $src        = $img->getAttribute('src') ?: '(no src)';
                $parentTag  = ($img->parentNode instanceof \DOMElement) ? $img->parentNode->nodeName : null;
                $parentHref = ($img->parentNode instanceof \DOMElement) ? $img->parentNode->getAttribute('href') : null;
                $missing[]  = [
                    'src'          => $src,
                    'issue'        => 'Missing alt attribute',
                    'parent_tag'   => $parentTag,
                    'parent_href'  => $parentHref ?: null,
                    'html_snippet' => mb_substr(@$dom->saveHTML($img) ?: '', 0, 250),
                ];
            } elseif ($img->getAttribute('alt') === '') {
                $decorative++; // empty alt = intentionally decorative, fine
            } else {
                $withAlt++;
            }
        }

        $total = $withAlt + $decorative + count($missing);

        return [
            'status'        => count($missing) === 0 ? 'pass' : (count($missing) <= 3 ? 'warn' : 'fail'),
            'total'         => $total,
            'with_alt'      => $withAlt,
            'decorative'    => $decorative,
            'missing_count' => count($missing),
            'violations'    => array_slice($missing, 0, 20),
        ];
    }

    // ─── Check 3: ARIA Labels on Interactive Elements ────────────────────────

    private function checkAriaLabels(DOMDocument $dom, DOMXPath $xpath): array
    {
        $violations = [];
        $pass       = 0;

        // Buttons with no text and no aria-label
        foreach ($xpath->query('//button') as $button) {
            $text      = trim($button->textContent);
            $ariaLabel = $button->getAttribute('aria-label');
            $ariaLbdBy = $button->getAttribute('aria-labelledby');

            if (empty($text) && empty($ariaLabel) && empty($ariaLbdBy)) {
                $violations[] = [
                    'element'      => 'button',
                    'issue'        => 'Button has no accessible name (no text, aria-label, or aria-labelledby)',
                    'html_snippet' => mb_substr(@$dom->saveHTML($button) ?: '', 0, 250),
                ];
            } else {
                $pass++;
            }
        }

        // Links that contain only an image with no alt text
        foreach ($xpath->query('//a[not(normalize-space(text()))]') as $link) {
            $ariaLabel = $link->getAttribute('aria-label');
            $ariaLbdBy = $link->getAttribute('aria-labelledby');
            if (! empty($ariaLabel) || ! empty($ariaLbdBy)) {
                $pass++;
                continue;
            }
            // Check if any child img has a non-empty alt
            $hasImgAlt = false;
            foreach ($xpath->query('.//img', $link) as $img) {
                if (! empty($img->getAttribute('alt'))) {
                    $hasImgAlt = true;
                    break;
                }
            }
            $textContent = trim($link->textContent);
            if (empty($textContent) && ! $hasImgAlt) {
                $href = $link->getAttribute('href') ?: '(no href)';
                $violations[] = [
                    'element'      => 'a',
                    'href'         => $href,
                    'issue'        => 'Link has no accessible name',
                    'html_snippet' => mb_substr(@$dom->saveHTML($link) ?: '', 0, 250),
                ];
            } else {
                $pass++;
            }
        }

        // iframes without title
        foreach ($xpath->query('//iframe') as $iframe) {
            $title = $iframe->getAttribute('title');
            if (empty($title)) {
                $violations[] = [
                    'element'      => 'iframe',
                    'src'          => $iframe->getAttribute('src') ?: '(no src)',
                    'issue'        => 'iframe has no title attribute',
                    'html_snippet' => mb_substr(@$dom->saveHTML($iframe) ?: '', 0, 250),
                ];
            } else {
                $pass++;
            }
        }

        // input type=image without alt
        foreach ($xpath->query('//input[@type="image"]') as $input) {
            $alt = $input->getAttribute('alt');
            if (empty($alt)) {
                $violations[] = [
                    'element'      => 'input[type=image]',
                    'src'          => $input->getAttribute('src') ?: '(no src)',
                    'issue'        => 'Image button missing alt text',
                    'html_snippet' => mb_substr(@$dom->saveHTML($input) ?: '', 0, 250),
                ];
            } else {
                $pass++;
            }
        }

        return [
            'status'     => count($violations) === 0 ? 'pass' : (count($violations) <= 2 ? 'warn' : 'fail'),
            'pass'       => $pass,
            'fail'       => count($violations),
            'violations' => array_slice($violations, 0, 100),
        ];
    }

    // ─── Check 4: Heading Hierarchy ──────────────────────────────────────────

    private function checkHeadingHierarchy(DOMDocument $dom, DOMXPath $xpath): array
    {
        $headings = [];
        foreach ($xpath->query('//*[self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6]') as $h) {
            $level      = (int) substr($h->nodeName, 1);
            $headings[] = ['level' => $level, 'text' => mb_substr(trim($h->textContent), 0, 80)];
        }

        $issues    = [];
        $h1Count   = count(array_filter($headings, fn($h) => $h['level'] === 1));
        $prevLevel = 0;

        // Multiple H1s inside separate <article> elements is valid HTML5 — the standard
        // pattern for archive/blog-list pages. Only flag if H1s are not article-scoped.
        $articleCount   = $xpath->query('//article')->length;
        $h1sInArticles  = 0;
        if ($h1Count > 1 && $articleCount > 0) {
            foreach ($xpath->query('//h1') as $h1) {
                $parent = $h1->parentNode;
                while ($parent) {
                    if ($parent instanceof \DOMElement && strtolower($parent->nodeName) === 'article') {
                        $h1sInArticles++;
                        break;
                    }
                    $parent = $parent->parentNode ?? null;
                }
            }
        }
        $allH1sInArticles = $h1Count > 1 && $h1sInArticles === $h1Count;

        if ($h1Count === 0) {
            $issues[] = 'No H1 tag found on the page';
        } elseif ($h1Count > 1 && !$allH1sInArticles) {
            $issues[] = "Multiple H1 tags ({$h1Count}) on a single-topic page — one H1 per page is recommended";
        }

        foreach ($headings as $i => $heading) {
            if ($i === 0) {
                $prevLevel = $heading['level'];
                continue;
            }
            if ($heading['level'] > $prevLevel + 1) {
                $issues[] = "Heading level skipped: H{$prevLevel} → H{$heading['level']} (\"" . mb_substr($heading['text'], 0, 40) . "\")";
            }
            $prevLevel = $heading['level'];
        }

        return [
            'status'         => count($issues) === 0 ? 'pass' : (count($issues) === 1 ? 'warn' : 'fail'),
            'headings'       => array_slice($headings, 0, 30),
            'h1_count'       => $h1Count,
            'total_headings' => count($headings),
            'issues'         => $issues,
        ];
    }

    // ─── Check 5: Link Text Quality ──────────────────────────────────────────

    private function checkLinkText(DOMDocument $dom, DOMXPath $xpath): array
    {
        $violations = [];
        $pass       = 0;

        foreach ($xpath->query('//a[@href]') as $link) {
            $text      = strtolower(trim($link->textContent));
            $ariaLabel = $link->getAttribute('aria-label');

            if (! empty($ariaLabel)) {
                $pass++;
                continue;
            }

            if (empty($text)) {
                $violations[] = [
                    'href'  => $link->getAttribute('href'),
                    'issue' => 'Link has no visible text and no aria-label',
                ];
                continue;
            }

            if (in_array($text, self::VAGUE_LINK_TEXT, true)) {
                $violations[] = [
                    'href'  => $link->getAttribute('href'),
                    'text'  => $text,
                    'issue' => "Vague link text: \"{$text}\"",
                ];
            } else {
                $pass++;
            }
        }

        return [
            'status'     => count($violations) === 0 ? 'pass' : (count($violations) <= 3 ? 'warn' : 'fail'),
            'pass'       => $pass,
            'fail'       => count($violations),
            'violations' => array_slice($violations, 0, 20),
        ];
    }

    // ─── Check 6: Landmarks & Meta ───────────────────────────────────────────

    private function checkLandmarks(DOMDocument $dom, DOMXPath $xpath): array
    {
        $htmlEl = $xpath->query('//html')->item(0);
        $lang   = $htmlEl instanceof \DOMElement ? $htmlEl->getAttribute('lang') : '';

        $titleNodes = $xpath->query('//head/title');
        $title      = '';
        if ($titleNodes->length > 0) {
            $title = trim($titleNodes->item(0)->textContent);
        }

        $hasMain    = $xpath->query('//main|//*[@role="main"]')->length > 0;
        $hasNav     = $xpath->query('//nav|//*[@role="navigation"]')->length > 0;
        $hasHeader  = $xpath->query('//header|//*[@role="banner"]')->length > 0;
        $hasFooter  = $xpath->query('//footer|//*[@role="contentinfo"]')->length > 0;

        // Skip navigation: first link or a link near the top with href="#..." pattern pointing to content
        $skipNavFound = false;
        $firstLinks   = $xpath->query('//a[starts-with(@href,"#")]');
        for ($i = 0; $i < min(5, $firstLinks->length); $i++) {
            $href = strtolower($firstLinks->item($i)->getAttribute('href'));
            if (preg_match('/#(main|content|skip|primary|wrapper)/', $href)) {
                $skipNavFound = true;
                break;
            }
        }

        $issues = [];
        if (empty($lang)) {
            $issues[] = 'html element missing lang attribute';
        }
        if (empty($title)) {
            $issues[] = 'Page missing <title>';
        }
        if (! $hasMain) {
            $issues[] = 'No <main> landmark or role="main" found';
        }
        if (! $skipNavFound) {
            $issues[] = 'No skip navigation link found (recommended for keyboard users)';
        }

        return [
            'status'         => count($issues) === 0 ? 'pass' : (count($issues) <= 2 ? 'warn' : 'fail'),
            'has_lang'       => ! empty($lang),
            'lang'           => $lang,
            'has_title'      => ! empty($title),
            'title'          => $title,
            'has_main'       => $hasMain,
            'has_nav'        => $hasNav,
            'has_header'     => $hasHeader,
            'has_footer'     => $hasFooter,
            'has_skip_nav'   => $skipNavFound,
            'issues'         => $issues,
        ];
    }

    // ─── Check 7: Color Contrast ─────────────────────────────────────────────

    private function checkColorContrast(string $html, DOMXPath $xpath, DOMDocument $dom): array
    {
        $violations = [];
        $pass       = 0;

        // Step 1: parse inline styles on elements
        foreach ($xpath->query('//*[@style]') as $el) {
            $style = $el->getAttribute('style');
            $color = $this->extractCssColor($style, 'color');
            $bg    = $this->extractCssColor($style, 'background-color')
                  ?? $this->extractCssColor($style, 'background');
            if ($color && $bg) {
                $rgb1 = $this->parseColor($color);
                $rgb2 = $this->parseColor($bg);
                if ($rgb1 && $rgb2) {
                    $ratio   = $this->contrastRatio($rgb1, $rgb2);
                    $tagName = $el instanceof \DOMElement ? $el->nodeName : 'element';
                    if ($ratio >= 4.5) {
                        $pass++;
                    } else {
                        $elClass = $el instanceof \DOMElement ? mb_substr($el->getAttribute('class'), 0, 80) : null;
                        $elId    = $el instanceof \DOMElement ? $el->getAttribute('id') : null;
                        $violations[] = [
                            'element'      => $tagName,
                            'class'        => $elClass ?: null,
                            'id'           => $elId ?: null,
                            'fg_color'     => $color,
                            'bg_color'     => $bg,
                            'ratio'        => round($ratio, 2),
                            'required'     => 4.5,
                            'source'       => 'inline-style',
                            'html_snippet' => mb_substr(@$dom->saveHTML($el) ?: '', 0, 200),
                        ];
                    }
                }
            }
        }

        // Step 2: parse <style> blocks for rules with explicit color + background-color
        preg_match_all('/<style[^>]*>(.*?)<\/style>/is', $html, $styleMatches);
        foreach ($styleMatches[1] as $css) {
            $rulePairs = $this->extractCssRuleColorPairs($css);
            foreach ($rulePairs as $pair) {
                $rgb1 = $this->parseColor($pair['color']);
                $rgb2 = $this->parseColor($pair['bg']);
                if ($rgb1 && $rgb2) {
                    $ratio = $this->contrastRatio($rgb1, $rgb2);
                    if ($ratio >= 4.5) {
                        $pass++;
                    } else {
                        $violations[] = [
                            'selector' => mb_substr($pair['selector'], 0, 80),
                            'fg_color' => $pair['color'],
                            'bg_color' => $pair['bg'],
                            'ratio'    => round($ratio, 2),
                            'required' => 4.5,
                            'source'   => 'stylesheet',
                        ];
                    }
                }
            }
        }

        $uniqueViolations = array_slice(array_values(
            array_unique(array_map('serialize', $violations)) === false
                ? $violations
                : array_map('unserialize', array_keys(array_flip(array_map('serialize', $violations))))
        ), 0, 15);

        return [
            'status'     => count($violations) === 0 ? 'pass' : (count($violations) <= 2 ? 'warn' : 'fail'),
            'pass'       => $pass,
            'fail'       => count($violations),
            'note'       => 'Checks explicit inline styles and <style> blocks only; inherited colors not evaluated',
            'violations' => $uniqueViolations,
        ];
    }

    // ─── Color contrast helpers ───────────────────────────────────────────────

    private function extractCssRuleColorPairs(string $css): array
    {
        $pairs = [];
        // Strip comments
        $css = preg_replace('/\/\*.*?\*\//s', '', $css);
        // Match CSS rules
        preg_match_all('/([^{}]+)\{([^{}]+)\}/s', $css, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $selector   = trim($match[1]);
            $body       = $match[2];
            $color      = $this->extractCssColor($body, 'color');
            $bg         = $this->extractCssColor($body, 'background-color')
                       ?? $this->extractCssColor($body, 'background');
            if ($color && $bg) {
                $pairs[] = ['selector' => $selector, 'color' => $color, 'bg' => $bg];
            }
        }
        return $pairs;
    }

    private function extractCssColor(string $css, string $property): ?string
    {
        // Match property: value; (handles multi-line, optional semicolon at end)
        if (preg_match('/' . preg_quote($property, '/') . '\s*:\s*([^;}\n]+)/i', $css, $m)) {
            $val = trim($m[1]);
            // Skip CSS variables
            if (str_starts_with($val, 'var(')) return null;
            return strtolower($val);
        }
        return null;
    }

    private function parseColor(string $color): ?array
    {
        $color = trim(strtolower($color));

        // Named color
        if (isset(self::NAMED_COLORS[$color])) {
            return self::NAMED_COLORS[$color]; // null = transparent (skip)
        }

        // #rrggbb
        if (preg_match('/^#([0-9a-f]{6})$/', $color, $m)) {
            return [hexdec(substr($m[1], 0, 2)), hexdec(substr($m[1], 2, 2)), hexdec(substr($m[1], 4, 2))];
        }

        // #rgb
        if (preg_match('/^#([0-9a-f]{3})$/', $color, $m)) {
            $r = hexdec($m[1][0] . $m[1][0]);
            $g = hexdec($m[1][1] . $m[1][1]);
            $b = hexdec($m[1][2] . $m[1][2]);
            return [$r, $g, $b];
        }

        // rgb(r,g,b) or rgba(r,g,b,a)
        if (preg_match('/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i', $color, $m)) {
            return [(int)$m[1], (int)$m[2], (int)$m[3]];
        }

        return null;
    }

    private function relativeLuminance(array $rgb): float
    {
        [$r, $g, $b] = array_map(function ($c) {
            $c /= 255;
            return $c <= 0.04045 ? $c / 12.92 : (($c + 0.055) / 1.055) ** 2.4;
        }, $rgb);

        return 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;
    }

    private function contrastRatio(array $fg, array $bg): float
    {
        $l1 = $this->relativeLuminance($fg);
        $l2 = $this->relativeLuminance($bg);
        [$lighter, $darker] = $l1 > $l2 ? [$l1, $l2] : [$l2, $l1];
        return ($lighter + 0.05) / ($darker + 0.05);
    }

    // ─── Score computation ────────────────────────────────────────────────────

    private function computeScore(array $checks): int
    {
        $score = 100;

        $formFail  = $checks['form_labels']['fail']       ?? 0;
        $imgFail   = $checks['image_alt']['missing_count'] ?? 0;
        $ariaFail  = $checks['aria_labels']['fail']        ?? 0;
        $hIssues   = count($checks['heading_hierarchy']['issues'] ?? []);
        $linkFail  = $checks['link_text']['fail']          ?? 0;
        $lmIssues  = count($checks['landmarks']['issues']  ?? []);
        $csFail    = $checks['color_contrast']['fail']     ?? 0;

        $score -= min(25, $formFail  * 7);
        $score -= min(20, $imgFail   * 6);
        $score -= min(15, $ariaFail  * 5);
        $score -= min(20, $hIssues   * 8);
        $score -= min(10, $linkFail  * 2);
        $score -= min(20, $lmIssues  * 5);
        $score -= min(15, $csFail    * 4);

        return max(0, $score);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function errorResult(string $msg): array
    {
        return ['status' => 'error', 'error' => $msg];
    }
}
