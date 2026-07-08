<?php

namespace App\Support;

/**
 * Builds the same screenshot gallery shown on the web results page and the
 * public share page (homepage overview, broken links, broken images, color
 * contrast violations) for use in PDF exports, where dompdf needs absolute
 * filesystem paths rather than URLs (isRemoteEnabled is disabled).
 */
class PdfScreenshotGallery
{
    /**
     * @param array|null $perf   decoded performance_result
     * @param array|null $broken decoded broken_resources_result
     * @param array|null $a11y   decoded accessibility_result
     * @return array<int, array{path: string, caption: string, code: ?string, badge: string}>
     */
    public static function build(?array $perf, ?array $broken, ?array $a11y, string $siteUrl): array
    {
        $items = [];

        $pages = $perf['screenshots']['pages'] ?? null;
        if (is_array($pages) && ! empty($pages)) {
            foreach ($pages as $page) {
                if (! is_array($page) || empty($page['screenshot']) || ! is_string($page['screenshot'])) {
                    continue;
                }
                if ($path = self::resolve($page['screenshot'])) {
                    $pageUrl = (string) ($page['url'] ?? $siteUrl);
                    $items[] = [
                        'path'    => $path,
                        'caption' => $pageUrl === $siteUrl ? 'Homepage overview' : $pageUrl,
                        'code'    => $pageUrl,
                        'badge'   => $pageUrl === $siteUrl ? 'Overview' : 'Page',
                    ];
                }
            }
        } else {
            // Fall back to the legacy single-homepage shape for older reports
            // generated before per-page screenshots existed.
            $homepage = $perf['screenshots']['homepage'] ?? null;
            if (is_string($homepage) && $path = self::resolve($homepage)) {
                $items[] = [
                    'path'    => $path,
                    'caption' => 'Homepage overview',
                    'code'    => $siteUrl,
                    'badge'   => 'Overview',
                ];
            }
        }

        foreach (($broken['broken_links'] ?? []) as $link) {
            if (! is_array($link) || empty($link['screenshot']) || ! is_string($link['screenshot'])) {
                continue;
            }
            if ($path = self::resolve($link['screenshot'])) {
                $items[] = [
                    'path'    => $path,
                    'caption' => (string) ($link['url'] ?? ''),
                    'code'    => isset($link['found_on']) ? ('Found on: ' . $link['found_on']) : null,
                    'badge'   => 'Broken link',
                ];
            }
        }

        foreach (($broken['broken_images'] ?? []) as $img) {
            if (! is_array($img) || empty($img['screenshot']) || ! is_string($img['screenshot'])) {
                continue;
            }
            if ($path = self::resolve($img['screenshot'])) {
                $items[] = [
                    'path'    => $path,
                    'caption' => (string) ($img['url'] ?? ''),
                    'code'    => isset($img['found_on']) ? ('Found on: ' . $img['found_on']) : null,
                    'badge'   => 'Broken image',
                ];
            }
        }

        $violations = $a11y['checks']['color_contrast']['violations'] ?? [];
        foreach ((is_array($violations) ? $violations : []) as $v) {
            if (! is_array($v) || empty($v['screenshot']) || ! is_string($v['screenshot'])) {
                continue;
            }
            if ($path = self::resolve($v['screenshot'])) {
                $items[] = [
                    'path'    => $path,
                    'caption' => 'Color contrast violation',
                    'code'    => isset($v['selector']) ? (string) $v['selector'] : null,
                    'badge'   => 'Contrast',
                ];
            }
        }

        return $items;
    }

    private static function resolve(string $relative): ?string
    {
        $absolute = storage_path('app/public/' . $relative);
        return file_exists($absolute) ? $absolute : null;
    }
}
