<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MistralBlogService
{
    private const API_URL = 'https://api.mistral.ai/v1/chat/completions';
    private const MODEL   = 'mistral-large-latest';

    private static array $LANG_NAMES = [
        'en' => 'English',
        'el' => 'Greek',
        'de' => 'German',
        'fr' => 'French',
        'es' => 'Spanish',
        'nl' => 'Dutch',
        'cs' => 'Czech',
    ];

    private static array $DEFAULT_TOPICS = [
        'Why website performance directly impacts your SEO rankings and conversions',
        'The complete guide to technical SEO audits for modern websites',
        'Security headers every website should have in {{year}}',
        'How broken links silently destroy your search engine ranking',
        'Web accessibility auditing: the business case beyond compliance',
        'E-commerce product page SEO: the definitive checklist',
        'Core Web Vitals explained: what they are and how to fix them',
        'Marketing pixel hygiene: why tracking consistency matters for ROI',
        'How automated website monitoring catches regressions before your users do',
        'The agency client onboarding checklist for website health in {{year}}',
    ];

    public function generate(string $locale = 'en', string $topic = ''): array
    {
        $apiKey = config('services.mistral.api_key');
        if (empty($apiKey)) {
            throw new \RuntimeException('MISTRAL_API_KEY is not configured.');
        }

        $language = self::$LANG_NAMES[$locale] ?? 'English';
        $year     = now()->year;

        if (empty($topic)) {
            $topic = str_replace('{{year}}', $year, self::$DEFAULT_TOPICS[array_rand(self::$DEFAULT_TOPICS)]);
        }

        $prompt = $this->buildPrompt($language, $topic);

        $response = Http::withToken($apiKey)
            ->timeout(120)
            ->post(self::API_URL, [
                'model'           => self::MODEL,
                'temperature'     => 0.7,
                // Forces Mistral to return a valid JSON object — no markdown fences, no prose
                'response_format' => ['type' => 'json_object'],
                'messages'        => [
                    ['role' => 'system', 'content' => 'You are an expert SEO content writer and web marketing specialist. You must respond with a single valid JSON object and nothing else.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Mistral API error: ' . $response->status() . ' — ' . $response->body());
        }

        $raw  = trim($response->json('choices.0.message.content', ''));
        $data = json_decode($raw, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // Last-resort: strip markdown fences and retry
            $raw  = preg_replace('/^```(?:json)?\s*/m', '', $raw);
            $raw  = preg_replace('/\s*```\s*$/m', '', $raw);
            $raw  = trim($raw);
            $data = json_decode($raw, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \RuntimeException('Mistral returned invalid JSON: ' . json_last_error_msg());
            }
        }

        $required = ['title', 'slug', 'meta_description', 'excerpt', 'content', 'featured_image', 'best_publish_day', 'best_publish_hour_utc'];
        foreach ($required as $key) {
            if (empty($data[$key])) {
                throw new \RuntimeException("Mistral response missing required field: {$key}");
            }
        }

        // Add unique lock parameters so loremflickr serves a distinct photo for each image,
        // even when the AI reuses the same keyword combination across articles.
        $data['featured_image'] = $this->lockFlickrUrl($data['featured_image']);
        $data['content']        = preg_replace_callback(
            '~(https://loremflickr\.com/[^\s"\'<>]+)~i',
            fn($m) => $this->lockFlickrUrl($m[1]),
            $data['content']
        );

        return $data;
    }

    private function lockFlickrUrl(string $url): string
    {
        // Strip any existing lock param, then add a fresh random one
        $base = preg_replace('/([?&])lock=[^&]+(&|$)/', '$1', $url);
        $base = rtrim($base, '?&');
        $sep  = str_contains($base, '?') ? '&' : '?';
        return $base . $sep . 'lock=' . random_int(1, 999999);
    }

    private function buildPrompt(string $language, string $topic): string
    {
        return <<<PROMPT
Write a complete, publication-ready blog post in {$language} on this topic: "{$topic}"

This will be published on the 4uTest blog (4utest.io) — a SaaS web audit platform that automatically checks websites for SEO, performance, security, broken resources, accessibility, e-commerce catalogue and marketing tracking issues using 7 parallel audit modules. Target audience: web developers, webmasters, digital agencies, and SEO professionals.

Requirements:
- 1400–1900 words of expert, substantive content — no filler
- SEO-optimized title: includes a high-search-volume keyword, max 65 characters, no clickbait
- Meta description: exactly 150–160 characters, includes the primary keyword, subtle value proposition
- Use proper HTML tags only: h2, h3, p, ul, ol, li, strong, em, img
- Structure: intro → 3-5 main sections with h2 headings → practical takeaways → conclusion
- Include exactly 3 images using this URL pattern: https://loremflickr.com/1200/630/keyword1,keyword2 — place each after a section heading as an <img> tag with descriptive alt text. CRITICAL: every image MUST use a completely different keyword pair that reflects THAT section's specific subtopic. Never repeat the same keyword combination. Example for an SEO article: img1="seo,search" img2="developer,code" img3="analytics,dashboard".
- Near the end (second-to-last paragraph), naturally mention 4uTest in one sentence as a useful free tool — not promotional, just helpful context. Example: "Tools like [4uTest](https://4utest.io) automate this entire audit process, scanning your site across all these dimensions in minutes and giving you an actionable health score."
- Do NOT say "In conclusion" or "In summary" — end with a strong final thought
- The writing must feel authored by a senior web professional, not AI-generated

Respond with a single JSON object (no markdown, no explanation) using exactly these keys:

  title                 — SEO-optimized, max 65 chars
  slug                  — URL-friendly, max 60 chars, lowercase hyphens only
  meta_description      — exactly 150–160 chars, includes primary keyword
  excerpt               — 2–3 sentence teaser for the blog listing page
  content               — full HTML article body, min 1400 words, using only h2 h3 p ul ol li strong em img tags
  featured_image        — use this exact pattern: https://loremflickr.com/1200/630/keyword1,keyword2 (2–3 relevant English keywords, comma-separated, no spaces)
  best_publish_day      — optimal lowercase weekday (monday–friday) for maximum organic engagement
  best_publish_hour_utc — integer 7–11 (morning UTC = European business hours 9–13)

For best_publish_day and best_publish_hour_utc, choose based on what maximises organic reach for this content type.
PROMPT;
    }
}
