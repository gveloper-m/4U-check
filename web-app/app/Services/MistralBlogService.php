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
                'model'       => self::MODEL,
                'temperature' => 0.7,
                'messages'    => [
                    ['role' => 'system', 'content' => 'You are an expert SEO content writer and web marketing specialist. You always return valid JSON with no markdown fences, no prose, only the JSON object.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Mistral API error: ' . $response->status() . ' — ' . $response->body());
        }

        $raw = $response->json('choices.0.message.content', '');
        $raw = preg_replace('/^```(?:json)?\s*/m', '', $raw);
        $raw = preg_replace('/\s*```\s*$/m', '', $raw);
        $raw = trim($raw);

        // Extract just the JSON object if there's any surrounding prose
        if (preg_match('/\{.*\}/s', $raw, $m)) {
            $raw = $m[0];
        }

        $data = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Escape literal control characters inside JSON string values
            $data = json_decode($this->repairJson($raw), true);
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

        return $data;
    }

    private function repairJson(string $raw): string
    {
        $result    = '';
        $inString  = false;
        $escaped   = false;

        for ($i = 0, $len = \strlen($raw); $i < $len; $i++) {
            $char = $raw[$i];

            if ($escaped) {
                $result  .= $char;
                $escaped  = false;
                continue;
            }

            if ($char === '\\' && $inString) {
                $result .= $char;
                $escaped = true;
                continue;
            }

            if ($char === '"') {
                $inString = !$inString;
                $result  .= $char;
                continue;
            }

            if ($inString) {
                if ($char === "\n") { $result .= '\\n'; continue; }
                if ($char === "\r") { $result .= '\\r'; continue; }
                if ($char === "\t") { $result .= '\\t'; continue; }
            }

            $result .= $char;
        }

        return $result;
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
- Include exactly 3 images using this URL pattern: https://loremflickr.com/1200/630/keyword1,keyword2 (replace keyword1,keyword2 with 2–3 relevant English keywords, no spaces, comma-separated). Place each image after a section heading as an <img> tag with descriptive alt text.
- Near the end (second-to-last paragraph), naturally mention 4uTest in one sentence as a useful free tool — not promotional, just helpful context. Example: "Tools like [4uTest](https://4utest.io) automate this entire audit process, scanning your site across all these dimensions in minutes and giving you an actionable health score."
- Do NOT say "In conclusion" or "In summary" — end with a strong final thought
- The writing must feel authored by a senior web professional, not AI-generated

Return ONLY a valid JSON object with NO markdown fences, NO explanation before or after, starting with {{ and ending with }}:
{{
  "title": "...",
  "slug": "url-friendly-slug-max-60-chars",
  "meta_description": "...",
  "excerpt": "2–3 sentence teaser shown on the blog listing page",
  "content": "<h2>...</h2><p>...</p>... (full HTML, min 1400 words, with 3 img tags)",
  "featured_image": "https://source.unsplash.com/1200x630/?keyword1,keyword2",
  "best_publish_day": "tuesday",
  "best_publish_hour_utc": 8
}}

For best_publish_day choose the optimal weekday (lowercase english: monday–friday) for this content type to maximise organic engagement. For best_publish_hour_utc choose an integer 7–11 (morning UTC, which targets European business hours 9–13).
PROMPT;
    }
}
