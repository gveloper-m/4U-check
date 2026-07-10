<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    {{-- Static pages --}}
    <url>
        <loc>{{ url('/') }}</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>{{ url('/blog') }}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>{{ url('/pricing') }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>{{ url('/terms') }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
    </url>
    <url>
        <loc>{{ url('/privacy') }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
    </url>
    <url>
        <loc>{{ url('/refund') }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
    </url>

    {{-- Free single-purpose tools --}}
    @foreach (['broken-link-checker', 'schema-validator', 'core-web-vitals-test', 'security-headers-checker', 'tracking-pixel-checker', 'accessibility-checker', 'ecommerce-catalog-checker'] as $tool)
    <url>
        <loc>{{ url('/tools/' . $tool) }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    @endforeach

    {{-- Accessibility checker per platform --}}
    @foreach (['wordpress', 'shopify', 'webflow', 'wix'] as $platform)
    <url>
        <loc>{{ url('/accessibility-checker/' . $platform) }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    @endforeach

    {{-- Performance auditor per framework --}}
    @foreach (['nextjs', 'wordpress', 'shopify', 'react'] as $framework)
    <url>
        <loc>{{ url('/performance-auditor/' . $framework) }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    @endforeach

    {{-- Comparison pages --}}
    @foreach (['4utest-vs-google-pagespeed', '4utest-vs-gtmetrix', '4utest-vs-ahrefs-site-audit'] as $slug)
    <url>
        <loc>{{ url('/compare/' . $slug) }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    @endforeach

    {{-- Industry checklists --}}
    @foreach (['ecommerce', 'saas', 'agencies'] as $industry)
    <url>
        <loc>{{ url('/checklist/' . $industry) }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    @endforeach

    {{-- Blog posts --}}
    @foreach ($posts as $post)
    <url>
        <loc>{{ url('/blog/' . $post->slug) }}</loc>
        <lastmod>{{ ($post->updated_at ?? $post->published_at)->format('Y-m-d') }}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    @endforeach

</urlset>
