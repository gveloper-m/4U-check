<?php

namespace App\Http\Controllers;

use App\Rules\PublicUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FreeToolController extends Controller
{
    /**
     * Each entry maps a public URL slug to one of the 7 audit modules'
     * standalone performAudit() method (no queue, no full_audit_reports row
     * — the same synchronous entry point RunAuditorJob itself calls). Copy
     * kept here rather than scattered per-page since it's the one place a
     * new tool page needs to be registered.
     */
    private const TOOLS = [
        'broken-link-checker' => [
            'auditor'     => BrokenResourceController::class,
            'title'       => 'Free Broken Link Checker',
            'tagline'     => 'Crawl a site and find every dead link and broken image, with a screenshot of where each one lives.',
            'description' => 'Scan any website for broken links and broken images for free. See exactly which pages they\'re on, with a cropped screenshot of the broken element.',
        ],
        'schema-validator' => [
            'auditor'     => SeoSchemaAuditController::class,
            'title'       => 'Free Schema & SEO Markup Validator',
            'tagline'     => 'Check title tags, meta descriptions, structured data, and heading structure in one pass.',
            'description' => 'Validate a page\'s Schema.org structured data, title tag, meta description, canonical URL, and heading hierarchy for free.',
        ],
        'core-web-vitals-test' => [
            'auditor'     => PerformanceAuditController::class,
            'title'       => 'Free Core Web Vitals Test',
            'tagline'     => 'Real LCP, CLS, and FCP measurements from an actual rendered page — desktop and mobile.',
            'description' => 'Test a website\'s Core Web Vitals (LCP, CLS, FCP) for free on both desktop and mobile, plus render-blocking resources and asset compression.',
        ],
        'security-headers-checker' => [
            'auditor'     => SecurityInfrastructureController::class,
            'title'       => 'Free Security Headers Checker',
            'tagline'     => 'Check HSTS, CSP, SSL, DNS security (SPF/DMARC), and mixed content in one scan.',
            'description' => 'Check any website\'s security headers, SSL certificate, DNS email security records, and mixed-content issues for free.',
        ],
        'tracking-pixel-checker' => [
            'auditor'     => TrackingAuditController::class,
            'title'       => 'Free Tracking Pixel Checker',
            'tagline'     => 'Confirm GA4, Meta Pixel, and TikTok Pixel are actually firing where you think they are.',
            'description' => 'Check whether GA4, Meta Pixel, and TikTok Pixel are actually installed and firing on a website, for free.',
        ],
        'accessibility-checker' => [
            'auditor'     => AccessibilityAuditController::class,
            'title'       => 'Free WCAG Accessibility Checker',
            'tagline'     => 'Color contrast, missing alt text, form labels, and landmark structure, scored out of 100.',
            'description' => 'Run a free WCAG accessibility check on any page: color contrast, image alt text, form labels, ARIA, and heading structure.',
        ],
        'ecommerce-catalog-checker' => [
            'auditor'     => EcommerceCatalogAuditController::class,
            'title'       => 'Free E-commerce Catalog Checker',
            'tagline'     => 'Find product pages with price errors, stock mismatches, or a disabled add-to-cart button.',
            'description' => 'Scan an online store for product pages with pricing errors, stock mismatches between schema and the page, or broken add-to-cart buttons.',
        ],
    ];

    public function show(string $tool): Response
    {
        $config = self::TOOLS[$tool] ?? abort(404);

        return Inertia::render('Tools/Show', [
            'tool' => array_merge(['slug' => $tool], $config),
            'seo'  => [
                'title'       => $config['title'] . ' — 4utest',
                'description' => $config['description'],
                'canonical'   => url('/tools/' . $tool),
                'type'        => 'website',
                'image'       => config('app.url') . '/og-image.png',
            ],
        ]);
    }

    public function scan(string $tool, Request $request): JsonResponse
    {
        $config = self::TOOLS[$tool] ?? abort(404);

        try {
            $validated = $request->validate([
                'url' => ['required', 'url', 'max:2048', new PublicUrl],
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->validator->errors()->first()], 422);
        }

        $url = rtrim($validated['url'], '/');

        try {
            $result = app($config['auditor'])->performAudit($url);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Could not scan that URL. Double-check it\'s reachable and try again.'], 422);
        }

        return response()->json($result);
    }
}
