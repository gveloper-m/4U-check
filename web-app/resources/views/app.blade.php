<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
            (function(){var t=localStorage.getItem('4utest_theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');})();
        </script>

        @php
            $seo       = $page['props']['seo'] ?? [];
            $seoTitle  = $seo['title']       ?? config('app.name') . ' — Website Audit Platform';
            $seoDesc   = $seo['description'] ?? '4utest runs 7 deep audits in parallel — SEO, security, performance, broken links, e-commerce, marketing tracking, and accessibility — giving you a complete health score in minutes.';
            $ogType    = $seo['type']        ?? 'website';
            $ogImage   = $seo['image']       ?? config('app.url') . '/og-image.png';
            $canonical = $seo['canonical']   ?? url()->current();
        @endphp

        <title inertia>{{ $seoTitle }}</title>
        <meta name="description"  content="{{ $seoDesc }}">
        <link rel="canonical"     href="{{ $canonical }}">

        {{-- Open Graph --}}
        <meta property="og:type"        content="{{ $ogType }}">
        <meta property="og:title"       content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDesc }}">
        <meta property="og:url"         content="{{ $canonical }}">
        <meta property="og:image"       content="{{ $ogImage }}">
        <meta property="og:site_name"   content="4utest">
        <meta property="og:locale"      content="{{ str_replace('-', '_', str_replace('_', '-', app()->getLocale())) }}">

        {{-- Twitter / X Cards --}}
        <meta name="twitter:card"        content="summary_large_image">
        <meta name="twitter:title"       content="{{ $seoTitle }}">
        <meta name="twitter:description" content="{{ $seoDesc }}">
        <meta name="twitter:image"       content="{{ $ogImage }}">

        @if (!empty($seo['published_at']))
            <meta property="article:published_time" content="{{ $seo['published_at'] }}">
        @endif
        @if (!empty($seo['author']))
            <meta property="article:author" content="{{ $seo['author'] }}">
        @endif

        {{-- JSON-LD structured data --}}
        @if (!empty($seo['schema']))
            <script type="application/ld+json">{!! json_encode($seo['schema'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
        @endif

        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="alternate icon" href="/favicon.ico">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
