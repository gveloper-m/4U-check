<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class MarketingPageController extends Controller
{
    private const ACCESSIBILITY_PLATFORMS = [
        'wordpress' => [
            'name'  => 'WordPress',
            'intro' => 'Most WordPress accessibility problems come from the theme and page-builder plugins, not WordPress core itself — which is why the same site can look fine and still fail WCAG checks after a theme update.',
            'issues' => [
                'Default and marketplace themes shipping body text under the 4.5:1 contrast ratio, especially light-grey-on-white "muted" text styles',
                'Page builders (Elementor, Divi, WPBakery) generating decorative `<div>` buttons with no keyboard focus state',
                'Featured images and gallery blocks published without alt text, since the media library never requires it',
                'Contact Form 7 and similar plugins rendering `<input>` fields with a placeholder instead of an associated `<label>`',
                'Skip-to-content links either missing entirely or hidden behind a theme\'s off-canvas menu CSS',
            ],
        ],
        'shopify' => [
            'name'  => 'Shopify',
            'intro' => 'Shopify\'s hosted checkout is generally solid, but the storefront theme — especially customized Dawn/Debut variants — is where accessibility regressions creep in with every "just add this app" install.',
            'issues' => [
                'Quick-view and cart-drawer apps that trap keyboard focus once opened, with no way to tab back out',
                'Product swatches (color/size variants) built as background-image `<div>`s with no accessible name at all',
                'Announcement bars and marketing apps injecting low-contrast text over busy background images',
                'Product image galleries missing alt text on anything beyond the first/featured image',
                'Sticky "add to cart" bars covering focus outlines on the page content beneath them',
            ],
        ],
        'webflow' => [
            'name'  => 'Webflow',
            'intro' => 'Webflow gives designers pixel-level control, which is exactly how accessibility gaps happen — nothing stops a design from using color alone to convey state, or interactive elements built from a `<div>` instead of a real button.',
            'issues' => [
                '"Div-as-button" interactions (custom hover/click states on a plain `<div>`) with no keyboard access and no ARIA role',
                'Color-only form validation states (a red border with no text explaining what\'s wrong)',
                'CMS collection list images published without a bound alt text field, so every item ships blank',
                'Custom cursor/animation interactions that override default focus outlines with nothing to replace them',
                'Heading levels chosen for visual size ("this looks like an H2") rather than actual document structure',
            ],
        ],
        'wix' => [
            'name'  => 'Wix',
            'intro' => 'Wix\'s drag-and-drop editor makes it easy to layer text over images and absolutely-position elements anywhere — both of which are common sources of contrast and reading-order problems that a visual check alone won\'t catch.',
            'issues' => [
                'Text boxes placed over photo backgrounds with no contrast check between the two',
                'Absolutely-positioned elements that create a confusing tab order unrelated to their visual position',
                'Strip/gallery widgets that autoplay without a visible pause control',
                'Icons used as the only signal for a state or action, with no accompanying text or aria-label',
                'Mobile-view-only elements that are hidden from screen readers but still targetable by keyboard, or vice versa',
            ],
        ],
    ];

    private const PERFORMANCE_FRAMEWORKS = [
        'nextjs' => [
            'name'  => 'Next.js',
            'intro' => 'Next.js can hit excellent Core Web Vitals out of the box — the regressions usually come from opting out of its own optimizations, not from the framework itself.',
            'issues' => [
                'Using a plain `<img>` tag instead of `next/image`, losing automatic responsive sizing and lazy loading',
                'Client-side data fetching in a component that blocks LCP, instead of fetching in a Server Component or `getServerSideProps`',
                'Custom fonts loaded via a `<link>` tag instead of `next/font`, causing layout shift when the font swaps in',
                'Large third-party scripts (chat widgets, A/B testing tools) loaded without the `next/script` `lazyOnload` strategy',
                'Client Components used by default where a Server Component would ship less JavaScript to the browser',
            ],
        ],
        'wordpress' => [
            'name'  => 'WordPress',
            'intro' => 'WordPress performance problems are rarely about WordPress itself — they\'re almost always plugin bloat, an unoptimized theme, or shared hosting straining under real traffic.',
            'issues' => [
                'Render-blocking CSS/JS queued by page-builder plugins that load on every page, even ones that don\'t use that builder',
                'Full-size images uploaded straight from a phone with no compression or responsive `srcset`',
                'No object caching (Redis/Memcached) on shared hosting, so every page load re-runs the same database queries',
                'Google Fonts loaded from Google\'s CDN instead of self-hosted, adding an extra DNS lookup and connection',
                'Multiple analytics/marketing plugins each injecting their own copy of jQuery or similar shared libraries',
            ],
        ],
        'shopify' => [
            'name'  => 'Shopify',
            'intro' => 'Shopify\'s infrastructure is fast by default — the score usually drops from theme customizations and apps stacking their own scripts on top of that solid base.',
            'issues' => [
                'Each installed app injecting its own `<script>` tag into the theme, often unminified and render-blocking',
                'Product images served at full resolution instead of through Shopify\'s built-in `image_url` size transforms',
                'Third-party review/upsell widgets that fetch their data client-side after the page has already rendered, causing layout shift',
                'Custom theme sections adding unused CSS across every template because they were duplicated instead of shared',
                'Sticky headers and cart drawers built with heavy DOM manipulation, especially on smaller devices',
            ],
        ],
        'react' => [
            'name'  => 'React (SPA)',
            'intro' => 'A client-rendered React app trades "the browser can show something instantly" for "the browser has to run JavaScript before it can show anything" — the audit itself needs a real headless browser to see past the empty shell.',
            'issues' => [
                'A large single JS bundle with no code-splitting, so the whole app downloads before anything can render',
                'No server-side rendering or static pre-rendering, so LCP waits on the full JS bundle parsing and executing',
                'Images imported directly into components without lazy loading below the fold',
                'Heavy client-side state libraries or chart libraries loaded eagerly on the initial route instead of on demand',
                'Web fonts loaded after the JS bundle instead of preloaded in the document head, causing a visible font swap',
            ],
        ],
    ];

    private const COMPARISONS = [
        '4utest-vs-google-pagespeed' => [
            'competitor' => 'Google PageSpeed Insights',
            'intro'      => 'PageSpeed Insights is the reference tool for Core Web Vitals — and it should stay in your bookmarks for that. It measures one thing, in real depth. 4uTest measures that plus six other dimensions a performance-only tool was never built to check.',
            'rows' => [
                ['criterion' => 'Core Web Vitals (LCP, CLS, FCP)', 'us' => 'Yes — desktop + mobile', 'them' => 'Yes, and very thorough'],
                ['criterion' => 'Broken links & images across the site', 'us' => 'Yes, full-site crawl', 'them' => 'No'],
                ['criterion' => 'SEO & structured data validation', 'us' => 'Yes', 'them' => 'Basic Lighthouse SEO checks only'],
                ['criterion' => 'Security headers & SSL', 'us' => 'Yes', 'them' => 'No'],
                ['criterion' => 'WCAG accessibility', 'us' => 'Yes, 7 dedicated checks', 'them' => 'Basic axe-core subset'],
                ['criterion' => 'Marketing pixel verification', 'us' => 'Yes (GA4, Meta, TikTok)', 'them' => 'No'],
                ['criterion' => 'API / MCP agent access', 'us' => 'Yes', 'them' => 'API yes, no MCP agent'],
            ],
            'verdict' => 'Keep PageSpeed Insights for a quick one-page vitals check. Reach for 4uTest when you need to know if the whole site — not just one page\'s speed — is actually healthy.',
        ],
        '4utest-vs-gtmetrix' => [
            'competitor' => 'GTmetrix',
            'intro'      => 'GTmetrix is a strong waterfall-level performance tool for engineers who want to see exactly which request is slow. 4uTest doesn\'t try to out-waterfall GTmetrix — it covers the six other things GTmetrix was never scoped to check.',
            'rows' => [
                ['criterion' => 'Request waterfall detail', 'us' => 'High-level render-blocking list', 'them' => 'Full request-by-request waterfall'],
                ['criterion' => 'Multi-page site crawling', 'us' => 'Yes, up to hundreds of pages per scan', 'them' => 'One page per test'],
                ['criterion' => 'Broken links & images', 'us' => 'Yes', 'them' => 'No'],
                ['criterion' => 'SEO & schema markup', 'us' => 'Yes', 'them' => 'No'],
                ['criterion' => 'Accessibility (WCAG)', 'us' => 'Yes', 'them' => 'No'],
                ['criterion' => 'Combined health score across dimensions', 'us' => 'Yes', 'them' => 'Performance grade only'],
            ],
            'verdict' => 'If you\'re debugging exactly why one page is slow, GTmetrix\'s waterfall wins. If you want to know the health of an entire site across performance, SEO, security, and accessibility in one pass, that\'s what 4uTest is built for.',
        ],
        '4utest-vs-ahrefs-site-audit' => [
            'competitor' => "Ahrefs Site Audit",
            'intro'      => 'Ahrefs Site Audit is one of the deepest technical-SEO crawlers available, backed by Ahrefs\' own backlink index. 4uTest doesn\'t compete on SEO crawl depth — it adds performance, security, accessibility and pixel checks that a pure-SEO crawler doesn\'t attempt.',
            'rows' => [
                ['criterion' => 'Technical SEO crawl depth', 'us' => 'Core checks: titles, meta, schema, headings', 'them' => 'Very deep — 100+ SEO-specific checks'],
                ['criterion' => 'Backlink data', 'us' => 'Not offered', 'them' => 'Yes — Ahrefs\' core strength'],
                ['criterion' => 'Core Web Vitals', 'us' => 'Yes, real browser-measured', 'them' => 'Limited'],
                ['criterion' => 'Security headers & SSL', 'us' => 'Yes', 'them' => 'No'],
                ['criterion' => 'WCAG accessibility', 'us' => 'Yes', 'them' => 'No'],
                ['criterion' => 'Marketing pixel verification', 'us' => 'Yes', 'them' => 'No'],
                ['criterion' => 'Pricing model', 'us' => 'Flat subscription, API included', 'them' => 'Bundled into a broader, pricier SEO suite'],
            ],
            'verdict' => 'If backlink research is central to your SEO work, you still need Ahrefs. For teams that just need to know a site is technically healthy — not just well-linked — 4uTest covers more ground per scan at a fraction of the cost.',
        ],
    ];

    private const CHECKLISTS = [
        'ecommerce' => [
            'name'  => 'E-commerce',
            'intro' => 'An online store fails differently than a brochure site: a broken add-to-cart button or a stock mismatch costs revenue the same day it happens, not eventually.',
            'sections' => [
                ['heading' => 'Catalogue integrity', 'items' => [
                    'Every product page has a price the schema and the visible page agree on',
                    'In-stock/out-of-stock status matches between structured data and the actual add-to-cart button state',
                    'No product images are broken or missing on the pages you rely on for conversion',
                    'Add-to-cart buttons are not silently disabled on any product page',
                ]],
                ['heading' => 'Performance', 'items' => [
                    'Product and category pages pass Core Web Vitals on mobile, where most retail traffic lands first',
                    'Checkout pages in particular are not blocked by render-blocking third-party scripts',
                ]],
                ['heading' => 'Trust & tracking', 'items' => [
                    'HTTPS is enforced site-wide, including the checkout and account pages',
                    'GA4 and your ad platform pixels are actually firing on the pages marketing assumes they are — especially the order-confirmation page',
                ]],
                ['heading' => 'SEO', 'items' => [
                    'Product schema (Product, Offer, AggregateRating) validates without errors',
                    'Category pages aren\'t accidentally set to noindex after a CMS migration',
                ]],
            ],
        ],
        'saas' => [
            'name'  => 'SaaS',
            'intro' => 'A SaaS site\'s job is to convert a visitor into a signup, then keep the docs and marketing pages from quietly rotting as the product ships weekly.',
            'sections' => [
                ['heading' => 'Conversion path', 'items' => [
                    'Pricing and signup pages load fast — this is the page you paid the most to get someone to see',
                    'No broken links on the pricing, docs, or integrations pages, since those get linked from ads and outreach',
                    'Signup/login forms have properly labelled fields (screen-reader and autofill both depend on this)',
                ]],
                ['heading' => 'Security', 'items' => [
                    'HSTS and a real CSP are set, especially if the marketing site shares a domain with the app',
                    'SPF/DMARC configured correctly — SaaS companies send a lot of transactional email and deliverability depends on this',
                ]],
                ['heading' => 'SEO', 'items' => [
                    'Docs and blog content has valid canonical tags so duplicate parameter URLs don\'t split ranking signal',
                    'Structured data (SoftwareApplication/Product) is present on the pricing page for potential rich results',
                ]],
                ['heading' => 'Accessibility', 'items' => [
                    'Dashboard/app screenshots used in marketing pages have descriptive alt text, not just "screenshot.png"',
                    'Color contrast holds up in both the marketing site\'s light and dark themes if you support both',
                ]],
            ],
        ],
        'agencies' => [
            'name'  => 'Agencies',
            'intro' => 'When you\'re responsible for a portfolio of client sites instead of one, the checklist is less about any single check and more about catching regressions across all of them without checking each one by hand.',
            'sections' => [
                ['heading' => 'Baseline before handoff', 'items' => [
                    'Run a full audit right before a client site goes live, and save the report as your delivery baseline',
                    'Confirm tracking pixels the client\'s marketing team expects are actually firing before you hand off',
                    'Check security headers are set — this is an easy, high-value item to include in every launch checklist',
                ]],
                ['heading' => 'Ongoing monitoring', 'items' => [
                    'Schedule a recurring scan per client site instead of relying on someone remembering to check',
                    'Set an alert threshold per client (a score drop, not just an absolute number) since client sites vary wildly in baseline',
                    'Re-run a scan after any CMS or plugin update you didn\'t personally control',
                ]],
                ['heading' => 'Reporting to clients', 'items' => [
                    'Use a white-label or branded PDF export when reporting findings, so it reads as your agency\'s QA process',
                    'Track score trend over time per client, not just a single point-in-time number — trend is what justifies retainer work',
                ]],
            ],
        ],
    ];

    public function accessibilityPlatform(string $platform): Response
    {
        $config = self::ACCESSIBILITY_PLATFORMS[$platform] ?? abort(404);

        return Inertia::render('Marketing/PlatformTool', [
            'platform' => array_merge(['slug' => $platform], $config),
            'tool'     => 'accessibility-checker',
            'kind'     => 'accessibility',
            'seo'      => [
                'title'       => "Free {$config['name']} Accessibility Checker (WCAG) — 4utest",
                'description' => "Check any {$config['name']} site for WCAG accessibility issues for free — color contrast, alt text, form labels, and the specific problems {$config['name']} sites run into most.",
                'canonical'   => url('/accessibility-checker/' . $platform),
                'type'        => 'website',
                'image'       => config('app.url') . '/og-image.png',
            ],
        ]);
    }

    public function performanceFramework(string $framework): Response
    {
        $config = self::PERFORMANCE_FRAMEWORKS[$framework] ?? abort(404);

        return Inertia::render('Marketing/PlatformTool', [
            'platform' => array_merge(['slug' => $framework], $config),
            'tool'     => 'core-web-vitals-test',
            'kind'     => 'performance',
            'seo'      => [
                'title'       => "Free {$config['name']} Performance Auditor (Core Web Vitals) — 4utest",
                'description' => "Test a {$config['name']} site's Core Web Vitals for free, and see the specific performance issues {$config['name']} sites run into most.",
                'canonical'   => url('/performance-auditor/' . $framework),
                'type'        => 'website',
                'image'       => config('app.url') . '/og-image.png',
            ],
        ]);
    }

    public function compare(string $slug): Response
    {
        $config = self::COMPARISONS[$slug] ?? abort(404);

        return Inertia::render('Marketing/Compare', [
            'compare' => array_merge(['slug' => $slug], $config),
            'seo'     => [
                'title'       => "4uTest vs {$config['competitor']} — 4utest",
                'description' => "How 4uTest compares to {$config['competitor']}: what each tool checks, where they overlap, and when to use which one.",
                'canonical'   => url('/compare/' . $slug),
                'type'        => 'website',
                'image'       => config('app.url') . '/og-image.png',
            ],
        ]);
    }

    public function checklist(string $industry): Response
    {
        $config = self::CHECKLISTS[$industry] ?? abort(404);

        return Inertia::render('Marketing/Checklist', [
            'checklist' => array_merge(['slug' => $industry], $config),
            'seo'       => [
                'title'       => "{$config['name']} Website Audit Checklist — 4utest",
                'description' => "A practical {$config['name']} website audit checklist covering performance, SEO, security, and accessibility — run every check for free.",
                'canonical'   => url('/checklist/' . $industry),
                'type'        => 'website',
                'image'       => config('app.url') . '/og-image.png',
            ],
        ]);
    }
}
