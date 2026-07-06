<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use App\Models\User;
use App\Services\MistralBlogService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AutoGenerateBlogPost extends Command
{
    protected $signature   = 'blog:auto-generate {--locale=en}';
    protected $description = 'Auto-generate and immediately publish a new blog post via Mistral AI';

    // 80 distinct topics — enough for 40 days at twice-daily before any repeat
    private const TOPIC_POOL = [
        // SEO
        'Why website performance directly impacts your SEO rankings and conversions',
        'The complete guide to technical SEO audits for modern websites',
        'How broken links silently destroy your search engine ranking',
        'Core Web Vitals explained: LCP, CLS, and INP — what they are and how to fix them',
        'E-commerce product page SEO: the definitive checklist',
        'How to audit your website meta tags for maximum SEO impact',
        'Canonical URLs and duplicate content: avoiding the most common pitfalls',
        'XML sitemaps: why they matter and how to generate them correctly',
        'robots.txt mistakes that accidentally block Google from your site',
        'How to write meta descriptions that increase click-through rates',
        'H1 tags and heading hierarchy: the complete SEO structure guide',
        'Open Graph tags: controlling how your pages look when shared on social media',
        'JSON-LD structured data: how schema markup boosts search visibility',
        'Image SEO: alt text, file names, and compression best practices',
        'Internal linking strategy: how it distributes SEO equity across your site',
        'Crawl budget explained: why large sites need to manage it carefully',
        'Thin content and how Google penalises it — and what to do about it',

        // Security
        'Security headers every website must have in 2025',
        'HTTP Strict Transport Security (HSTS): what it is and how to enable it',
        'Content Security Policy for web developers: a practical implementation guide',
        'SSL certificates: how to check validity, renew, and prevent expiry surprises',
        'Mixed content errors: what causes them and how to fix every case',
        'SPF and DMARC records: protecting your domain from email spoofing',
        'X-Frame-Options and clickjacking prevention explained',
        'What your HTTP response headers reveal about your server stack',
        'HTTPS redirect configuration: why getting it right matters for SEO and security',
        'Referrer-Policy and Permissions-Policy headers: why they matter for privacy',

        // Performance
        'How to measure and improve Time to First Byte (TTFB) on any server',
        'Render-blocking resources: how to identify and eliminate them for faster pages',
        'Gzip vs Brotli compression: which should your server use and why',
        'Largest Contentful Paint (LCP): the most impactful Core Web Vital to fix',
        'Cumulative Layout Shift (CLS): why your page jumps and exactly how to stop it',
        'Reducing page weight: the practical guide to cutting load time',
        'Browser caching strategies that actually improve repeat visit speed',
        'WebP and AVIF images: why you should convert and how to automate it',
        'Lazy loading images and iframes: implementation guide with real examples',
        'Critical rendering path: understanding and optimising the sequence',
        'Font loading performance: how web fonts slow down your site and what to do',

        // Broken Links & Crawling
        'How broken links hurt your SEO and user experience — measured',
        'The difference between 301, 302, and 404 status codes and when to use each',
        'Redirect chains and loops: how to find and fix them before Google does',
        'Why external links break and how to monitor them automatically',
        'Site crawling 101: how search engine bots navigate your website',

        // E-commerce
        'E-commerce SEO: how to optimise product pages for Google Shopping',
        'Product schema markup step by step: price, availability, and reviews',
        'Cart abandonment signals your website audit should flag immediately',
        'Trust signals that directly increase e-commerce conversion rates',
        'Stock status and pricing consistency: why schema accuracy matters for ads',
        'Checkout UX problems that silently kill conversion rates',
        'Category page SEO for e-commerce: structure, content, and crawlability',

        // Accessibility
        'Web accessibility auditing: the business case beyond legal compliance',
        'WCAG 2.1 AA explained: what every web developer must know',
        'How to write alt text that genuinely helps screen reader users',
        'Colour contrast ratios: testing and fixing accessibility failures at scale',
        'Keyboard navigation: how to test your site and fix what is broken',
        'ARIA labels: when to use them and when they make things worse',
        'Form labels and accessibility: the most common mistakes and how to avoid them',
        'Skip navigation links: a small change with huge accessibility impact',
        'Focus management in single-page applications: the forgotten accessibility requirement',

        // Marketing Tracking
        'Marketing pixel hygiene: why tracking consistency directly affects ROI',
        'How to audit your Google Analytics 4 implementation for accuracy',
        'Google Tag Manager: the most common setup mistakes developers make',
        'Meta Pixel vs GA4: understanding the overlap, conflicts, and deduplication',
        'How to find and eliminate duplicate tracking code on your website',
        'TikTok Pixel complete setup guide for e-commerce websites',
        'Why your conversion tracking is undercounting and how to verify it',
        'Server-side tagging explained: privacy, accuracy, and when to switch',

        // Agency / Business
        'How automated website monitoring catches regressions before your users do',
        'White-label website auditing: how digital agencies deliver more value',
        'How to present website audit results to non-technical clients',
        'Monthly website maintenance checklist every agency should follow',
        'Website health scores: how to interpret them and prioritise fixes',
        'The ROI of regular website audits for e-commerce and service businesses',
        'How to build a recurring website monitoring service for agency clients',
        'Website auditing vs penetration testing: what is the difference',
        'Why a seven-dimension audit beats a single-metric SEO checker',
        'How to onboard a new client site in under 30 minutes with automated audits',
    ];

    public function handle(): int
    {
        $locale = $this->option('locale') ?: 'en';
        $apiKey = config('services.mistral.api_key');

        if (empty($apiKey)) {
            $this->error('MISTRAL_API_KEY is not configured — skipping.');
            return self::FAILURE;
        }

        $topic = $this->pickTopic();
        $this->line("Generating: \"{$topic}\"");

        try {
            $data = app(MistralBlogService::class)->generate($locale, $topic);
        } catch (\Exception $e) {
            $this->error("AI generation failed: {$e->getMessage()}");
            Log::error('blog:auto-generate failed', ['topic' => $topic, 'error' => $e->getMessage()]);
            return self::FAILURE;
        }

        $authorId = User::where('is_admin', true)->value('id') ?? User::first()?->id;
        if (! $authorId) {
            $this->error('No users found in the database — cannot create post.');
            return self::FAILURE;
        }

        $post = BlogPost::create([
            'user_id'          => $authorId,
            'locale'           => $locale,
            'title'            => $data['title'],
            'slug'             => BlogPost::generateSlug($data['slug'] ?? $data['title']),
            'excerpt'          => $data['excerpt'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
            'content'          => $data['content'],
            'featured_image'   => $data['featured_image'] ?? null,
            'status'           => 'published',
            'published_at'     => now(),
            'scheduled_at'     => null,
        ]);

        $this->info("Published: [{$post->id}] {$post->title}");
        Log::info('blog:auto-generate succeeded', ['post_id' => $post->id, 'title' => $post->title]);

        $this->pingSitemapIndexers();

        return self::SUCCESS;
    }

    private function pickTopic(): string
    {
        $existingTitles = BlogPost::pluck('title')
            ->map(fn($t) => strtolower($t))
            ->toArray();

        // Shuffle so we don't always start from the top of the list
        $pool = self::TOPIC_POOL;
        shuffle($pool);

        foreach ($pool as $candidate) {
            if (! $this->tooSimilarToExisting($candidate, $existingTitles)) {
                return $candidate;
            }
        }

        // Entire pool exhausted — generate a year-stamped variant so it's genuinely fresh
        $year = now()->year;
        $fallbacks = [
            "Complete website SEO and performance audit guide for {$year}",
            "Website security checklist: what every site must have in {$year}",
            "Core Web Vitals benchmarks and optimisation strategies for {$year}",
            "E-commerce conversion rate optimisation through technical auditing in {$year}",
            "Accessibility and WCAG compliance roadmap for web teams in {$year}",
        ];
        shuffle($fallbacks);

        foreach ($fallbacks as $fallback) {
            if (! $this->tooSimilarToExisting($fallback, $existingTitles)) {
                return $fallback;
            }
        }

        // Absolute last resort
        return "Website audit best practices and checklist for {$year} — part " . (BlogPost::count() + 1);
    }

    private function tooSimilarToExisting(string $candidate, array $existingTitles): bool
    {
        $words = array_filter(
            explode(' ', strtolower($candidate)),
            fn($w) => strlen($w) > 5
        );

        if (empty($words)) {
            return false;
        }

        foreach ($existingTitles as $existing) {
            $hits = 0;
            foreach ($words as $word) {
                if (str_contains($existing, $word)) {
                    $hits++;
                }
            }
            // More than 45% of significant words overlap → too similar
            if (($hits / count($words)) > 0.45) {
                return true;
            }
        }

        return false;
    }

    private function pingSitemapIndexers(): void
    {
        $sitemap = urlencode(url('/sitemap.xml'));
        foreach (["https://www.google.com/ping?sitemap={$sitemap}", "https://www.bing.com/ping?sitemap={$sitemap}"] as $url) {
            try {
                Http::timeout(10)->get($url);
            } catch (\Exception $e) {
                Log::warning("Sitemap ping failed: {$url} — {$e->getMessage()}");
            }
        }
    }
}
