<?php

namespace App\Services;

class BlogCoverImageService
{
    private const WIDTH  = 1200;
    private const HEIGHT = 630;

    // Dark-to-vivid pairs, all drawn from the app's violet brand family (see
    // the "violet-600" hero buttons in Landing.tsx) plus a few adjacent hues
    // so consecutive posts don't look identical. Picked by hashing the title,
    // not randomly — same title always renders the same cover.
    private const PALETTES = [
        [[24, 12, 48], [124, 58, 237]],   // near-black -> violet-600
        [[17, 24, 39], [109, 40, 217]],   // slate-900 -> violet-700
        [[49, 10, 101], [192, 132, 252]], // deep purple -> violet-300
        [[15, 23, 42], [99, 102, 241]],   // slate-900 -> indigo-500
        [[30, 27, 75], [217, 70, 239]],   // indigo-950 -> fuchsia-500
        [[20, 8, 40], [56, 189, 248]],    // deep violet -> sky-400 accent
    ];

    private function fontPath(bool $bold = false): string
    {
        return base_path('vendor/dompdf/dompdf/lib/fonts/' . ($bold ? 'DejaVuSans-Bold.ttf' : 'DejaVuSans.ttf'));
    }

    /**
     * Render a branded 1200x630 cover image for a blog post and store it
     * under public storage. Replaces per-post stock photos (LoremFlickr),
     * whose shallow photo pool for abstract B2B keywords kept returning
     * near-identical images across different posts — this is generated
     * from the app's own brand palette instead, so it never depends on a
     * third party's photo inventory.
     */
    public function generate(string $title, string $slug): string
    {
        $hash        = crc32($slug !== '' ? $slug : $title);
        $palette     = self::PALETTES[$hash % count(self::PALETTES)];
        $patternType = (int) floor($hash / count(self::PALETTES)) % 4;

        $im = imagecreatetruecolor(self::WIDTH, self::HEIGHT);
        $this->drawGradient($im, $palette[0], $palette[1]);
        $this->drawPattern($im, $patternType, $palette[1]);
        $this->drawWordmark($im);
        $this->drawTitle($im, $title);

        $relative = 'blog-covers/' . $hash . '-' . substr(sha1($slug . $title), 0, 10) . '.png';
        $absolute = storage_path('app/public/' . $relative);
        if (! is_dir(dirname($absolute))) {
            mkdir(dirname($absolute), 0755, true);
        }

        imagepng($im, $absolute);
        imagedestroy($im);

        return url('storage/' . $relative);
    }

    private function drawGradient($im, array $top, array $bottom): void
    {
        for ($y = 0; $y < self::HEIGHT; $y++) {
            $t = $y / (self::HEIGHT - 1);
            $r = (int) round($top[0] + ($bottom[0] - $top[0]) * $t);
            $g = (int) round($top[1] + ($bottom[1] - $top[1]) * $t);
            $b = (int) round($top[2] + ($bottom[2] - $top[2]) * $t);
            $color = imagecolorallocate($im, $r, $g, $b);
            imageline($im, 0, $y, self::WIDTH - 1, $y, $color);
        }
    }

    private function drawPattern($im, int $type, array $accent): void
    {
        $overlay = imagecolorallocatealpha($im, $accent[0], $accent[1], $accent[2], 105);

        switch ($type) {
            case 0: // diagonal stripes, bottom-right
                for ($x = -self::HEIGHT; $x < self::WIDTH; $x += 46) {
                    imagesetthickness($im, 10);
                    imageline($im, $x, self::HEIGHT, $x + self::HEIGHT, 0, $overlay);
                }
                break;

            case 1: // dot grid, bottom-right corner
                for ($gx = self::WIDTH - 60; $gx > self::WIDTH - 420; $gx -= 48) {
                    for ($gy = self::HEIGHT - 60; $gy > self::HEIGHT - 320; $gy -= 48) {
                        imagefilledellipse($im, $gx, $gy, 10, 10, $overlay);
                    }
                }
                break;

            case 2: // concentric arcs, bottom-right
                for ($radius = 120; $radius <= 640; $radius += 80) {
                    imagesetthickness($im, 3);
                    imagearc($im, self::WIDTH + 40, self::HEIGHT + 40, $radius, $radius, 180, 270, $overlay);
                }
                break;

            default: // angled bars, top-right corner
                for ($x = self::WIDTH - 40; $x > self::WIDTH - 460; $x -= 54) {
                    $poly = [$x, 0, $x + 26, 0, $x - 90, 260, $x - 116, 260];
                    imagefilledpolygon($im, $poly, $overlay);
                }
        }
    }

    private function drawWordmark($im): void
    {
        $white = imagecolorallocate($im, 255, 255, 255);
        $violet = imagecolorallocate($im, 196, 181, 253); // violet-300, for the "test" half

        $x = 64;
        $y = 90;
        $size = 30;

        imagettftext($im, $size, 0, $x, $y, $white, $this->fontPath(true), '4u');
        $box = imagettfbbox($size, 0, $this->fontPath(true), '4u');
        $x += abs($box[2] - $box[0]);
        imagettftext($im, $size, 0, $x, $y, $violet, $this->fontPath(true), 'test');
    }

    private function drawTitle($im, string $title): void
    {
        $white    = imagecolorallocate($im, 255, 255, 255);
        $maxWidth = self::WIDTH - 128; // 64px margin each side, matches the wordmark's left inset

        $fontFile = $this->fontPath(true);
        $lines    = [];
        $size     = 68;

        foreach ([68, 60, 52, 46, 40] as $candidate) {
            $lines = $this->wrapText($title, $fontFile, $candidate, $maxWidth);
            if (count($lines) <= 4) {
                $size = $candidate;
                break;
            }
            $size = $candidate; // smallest tried so far; keep even if still >4 lines
        }

        $lineHeight = (int) round($size * 1.35);
        $blockHeight = $lineHeight * count($lines);
        $startY = (int) round((self::HEIGHT - $blockHeight) / 2) + $size;

        foreach ($lines as $i => $line) {
            imagettftext($im, $size, 0, 64, $startY + $i * $lineHeight, $white, $fontFile, $line);
        }
    }

    private function wrapText(string $text, string $fontFile, float $size, int $maxWidth): array
    {
        $words   = preg_split('/\s+/', trim($text)) ?: [];
        $lines   = [];
        $current = '';

        foreach ($words as $word) {
            $test = $current === '' ? $word : $current . ' ' . $word;
            $box  = imagettfbbox($size, 0, $fontFile, $test);
            $width = abs($box[2] - $box[0]);

            if ($width > $maxWidth && $current !== '') {
                $lines[]  = $current;
                $current  = $word;
            } else {
                $current = $test;
            }
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        return $lines ?: [$text];
    }
}
