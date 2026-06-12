<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Full Audit Report — {{ $report['site_url'] }}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }

  /* Cover */
  .cover { padding: 60px 50px; background: #1a1a2e; color: #fff; min-height: 200px; }
  .cover h1 { font-size: 26px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
  .cover .url { font-size: 13px; color: #a0aec0; word-break: break-all; margin-bottom: 20px; }
  .cover .meta { font-size: 10px; color: #718096; }

  /* Health score badge */
  .score-badge { display: inline-block; padding: 6px 18px; border-radius: 30px; font-size: 20px;
                 font-weight: 700; color: #fff; margin-top: 14px; }
  .score-green  { background: #38a169; }
  .score-yellow { background: #d69e2e; }
  .score-red    { background: #e53e3e; }

  /* Sections */
  .section { margin: 24px 30px; page-break-inside: avoid; }
  .section-header { background: #2d3748; color: #fff; padding: 8px 14px; border-radius: 6px 6px 0 0;
                    font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
  .section-body { border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; padding: 14px; }

  /* Status pills */
  .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; }
  .pill-ok     { background: #c6f6d5; color: #276749; }
  .pill-warn   { background: #fefcbf; color: #744210; }
  .pill-bad    { background: #fed7d7; color: #742a2a; }
  .pill-miss   { background: #e2e8f0; color: #4a5568; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #edf2f7; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px;
       padding: 5px 8px; text-align: left; color: #4a5568; }
  td { padding: 5px 8px; border-bottom: 1px solid #edf2f7; vertical-align: top; word-break: break-all; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f7fafc; }

  /* KV rows */
  .kv { display: flex; padding: 4px 0; border-bottom: 1px solid #edf2f7; }
  .kv:last-child { border-bottom: none; }
  .kv-label { width: 200px; min-width: 200px; font-weight: 600; color: #4a5568; font-size: 10px; }
  .kv-value { flex: 1; color: #1a202c; font-size: 10px; word-break: break-word; }

  .error-box { background: #fff5f5; border: 1px solid #feb2b2; border-radius: 4px; padding: 8px 12px;
               color: #742a2a; font-size: 10px; }
  .none-found { color: #a0aec0; font-style: italic; font-size: 10px; padding: 6px 0; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>

{{-- ===== COVER ===== --}}
<div class="cover">
  <h1>Full Site Audit Report</h1>
  <div class="url">{{ $report['site_url'] }}</div>
  <div class="meta">Generated: {{ $report['generated_at'] }}</div>
  @php
    $score = $report['health_score'];
    $scoreClass = $score >= 80 ? 'score-green' : ($score >= 50 ? 'score-yellow' : 'score-red');
    $scoreLabel = $score >= 80 ? 'Healthy' : ($score >= 50 ? 'Needs Work' : 'Critical');
  @endphp
  <div class="score-badge {{ $scoreClass }}">Health Score: {{ $score }}/100 — {{ $scoreLabel }}</div>
</div>

{{-- ===== 1. SEO SCHEMA ===== --}}
@php $seo = $report['audits']['seo_schema'] ?? []; @endphp
<div class="section">
  <div class="section-header">1 · SEO &amp; Structured Data</div>
  <div class="section-body">
    @if(($seo['status'] ?? '') === 'error')
      <div class="error-box">Audit failed: {{ $seo['error'] }}</div>
    @else
      <div class="kv">
        <div class="kv-label">Meta Title</div>
        <div class="kv-value">
          <span class="pill pill-{{ ($seo['meta_title']['status'] ?? '') === 'OK' ? 'ok' : 'warn' }}">{{ $seo['meta_title']['status'] ?? '—' }}</span>
          &nbsp;{{ $seo['meta_title']['value'] ?? '—' }}
          ({{ $seo['meta_title']['length'] ?? 0 }} chars)
        </div>
      </div>
      <div class="kv">
        <div class="kv-label">Meta Description</div>
        <div class="kv-value">
          <span class="pill pill-{{ ($seo['meta_description']['status'] ?? '') === 'OK' ? 'ok' : 'warn' }}">{{ $seo['meta_description']['status'] ?? '—' }}</span>
          &nbsp;{{ Str::limit($seo['meta_description']['value'] ?? '—', 120) }}
          ({{ $seo['meta_description']['length'] ?? 0 }} chars)
        </div>
      </div>
      <div class="kv">
        <div class="kv-label">H1 Tags</div>
        <div class="kv-value">
          <span class="pill pill-{{ ($seo['h1_tags']['status'] ?? '') === 'OK' ? 'ok' : 'bad' }}">{{ $seo['h1_tags']['status'] ?? '—' }}</span>
          &nbsp;Count: {{ $seo['h1_tags']['count'] ?? 0 }}
        </div>
      </div>
      <div class="kv">
        <div class="kv-label">Canonical URL</div>
        <div class="kv-value">
          <span class="pill pill-{{ ($seo['canonical']['status'] ?? '') === 'OK' ? 'ok' : (($seo['canonical']['status'] ?? '') === 'MISMATCH' ? 'bad' : 'miss') }}">{{ $seo['canonical']['status'] ?? 'MISSING' }}</span>
          &nbsp;{{ $seo['canonical']['url'] ?? 'not set' }}
        </div>
      </div>
      <div class="kv">
        <div class="kv-label">Structured Data (JSON-LD)</div>
        <div class="kv-value">
          @if($seo['schema_validation']['has_valid_schema'] ?? false)
            <span class="pill pill-ok">VALID</span>&nbsp;
            Types found:
            @foreach($seo['schema_validation']['schemas_found'] ?? [] as $s)
              <strong>{{ $s['type'] ?? '?' }}</strong>{{ ! $loop->last ? ', ' : '' }}
            @endforeach
          @else
            <span class="pill pill-miss">NONE</span>
          @endif
        </div>
      </div>
      @if(! empty($seo['schema_validation']['errors'] ?? []))
        <div style="margin-top:6px; padding:6px 8px; background:#fff5f5; border-radius:4px; font-size:9px; color:#742a2a;">
          @foreach($seo['schema_validation']['errors'] as $err)
            &bull; {{ $err }}<br>
          @endforeach
        </div>
      @endif
    @endif
  </div>
</div>

{{-- ===== 2. SECURITY ===== --}}
@php $sec = $report['audits']['security'] ?? []; @endphp
<div class="section">
  <div class="section-header">2 · Security, SSL &amp; Email Deliverability</div>
  <div class="section-body">
    @if(($sec['status'] ?? '') === 'error')
      <div class="error-box">Audit failed: {{ $sec['error'] }}</div>
    @else
      {{-- SSL --}}
      <div class="kv">
        <div class="kv-label">SSL Certificate</div>
        <div class="kv-value">
          @if($sec['ssl']['ssl_valid'] ?? false)
            <span class="pill pill-ok">VALID</span>&nbsp;
            Expires: {{ $sec['ssl']['ssl_expiry'] ?? '—' }}
            ({{ $sec['ssl']['ssl_days_left'] ?? '?' }} days left)
            &mdash; Issuer: {{ $sec['ssl']['ssl_issuer'] ?? '—' }}
          @else
            <span class="pill pill-bad">INVALID</span>&nbsp;{{ $sec['ssl']['error'] ?? '' }}
          @endif
          @if($sec['ssl']['warning'] ?? null)
            <span class="pill pill-warn">WARN</span>&nbsp;{{ $sec['ssl']['warning'] }}
          @endif
        </div>
      </div>
      <div class="kv">
        <div class="kv-label">Mixed Content</div>
        <div class="kv-value">
          @if($sec['mixed_content']['has_mixed_content'] ?? false)
            <span class="pill pill-bad">FOUND</span>&nbsp;
            {{ count($sec['mixed_content']['mixed_content_items'] ?? []) }} insecure asset(s) detected
          @else
            <span class="pill pill-ok">CLEAN</span>
          @endif
        </div>
      </div>
      <div class="kv">
        <div class="kv-label">SPF Record</div>
        <div class="kv-value">
          <span class="pill pill-{{ ($sec['dns_security']['spf_record_exists'] ?? false) ? 'ok' : 'bad' }}">{{ ($sec['dns_security']['spf_record_exists'] ?? false) ? 'PRESENT' : 'MISSING' }}</span>
          &nbsp;{{ Str::limit($sec['dns_security']['spf_record'] ?? '', 100) }}
        </div>
      </div>
      <div class="kv">
        <div class="kv-label">DMARC Record</div>
        <div class="kv-value">
          <span class="pill pill-{{ ($sec['dns_security']['dmarc_record_exists'] ?? false) ? 'ok' : 'bad' }}">{{ ($sec['dns_security']['dmarc_record_exists'] ?? false) ? 'PRESENT' : 'MISSING' }}</span>
          &nbsp;{{ Str::limit($sec['dns_security']['dmarc_record'] ?? '', 100) }}
        </div>
      </div>
      <div class="kv">
        <div class="kv-label">DKIM</div>
        <div class="kv-value">
          <span class="pill pill-{{ ($sec['dns_security']['dkim_found'] ?? false) ? 'ok' : 'miss' }}">{{ ($sec['dns_security']['dkim_found'] ?? false) ? 'FOUND (selector: '.$sec['dns_security']['dkim_selector'].')' : 'NOT DETECTED' }}</span>
        </div>
      </div>
    @endif
  </div>
</div>

{{-- ===== 3. PERFORMANCE ===== --}}
@php $perf = $report['audits']['performance'] ?? []; @endphp
<div class="section">
  <div class="section-header">3 · Performance Metrics</div>
  <div class="section-body">
    @if(($perf['status'] ?? '') === 'error')
      <div class="error-box">Audit failed: {{ $perf['error'] }}</div>
    @else
      <div class="kv"><div class="kv-label">Pages Tested</div><div class="kv-value">{{ $perf['pages_tested'] ?? 0 }}</div></div>
      <div class="kv">
        <div class="kv-label">TTFB (avg)</div>
        <div class="kv-value">
          @php $ttfb = $perf['metrics']['ttfb_ms'] ?? null; @endphp
          @if($ttfb !== null)
            <span class="pill pill-{{ $ttfb <= 400 ? 'ok' : ($ttfb <= 800 ? 'warn' : 'bad') }}">{{ $ttfb }}ms</span>
          @else <span class="none-found">—</span> @endif
        </div>
      </div>
      <table>
        <tr><th>Viewport</th><th>FCP</th><th>LCP</th><th>CLS</th></tr>
        @foreach(['desktop','mobile'] as $vp)
        @php $m = $perf['metrics'][$vp] ?? []; @endphp
        <tr>
          <td>{{ ucfirst($vp) }}</td>
          <td>{{ $m['fcp_ms'] !== null ? $m['fcp_ms'].'ms' : '—' }}</td>
          <td>
            @php $lcp = $m['lcp_ms'] ?? null; @endphp
            @if($lcp !== null)
              <span class="pill pill-{{ $lcp <= 2500 ? 'ok' : ($lcp <= 4000 ? 'warn' : 'bad') }}">{{ $lcp }}ms</span>
            @else —
            @endif
          </td>
          <td>
            @php $cls = $m['cls_score'] ?? null; @endphp
            @if($cls !== null)
              <span class="pill pill-{{ $cls <= 0.1 ? 'ok' : ($cls <= 0.25 ? 'warn' : 'bad') }}">{{ $cls }}</span>
            @else — @endif
          </td>
        </tr>
        @endforeach
      </table>
    @endif
  </div>
</div>

{{-- ===== 4. MARKETING TRACKING ===== --}}
@php $trk = $report['audits']['marketing_tracking'] ?? []; @endphp
<div class="section">
  <div class="section-header">4 · Marketing Tracking Scripts</div>
  <div class="section-body">
    @if(($trk['status'] ?? '') === 'error')
      <div class="error-box">Audit failed: {{ $trk['error'] }}</div>
    @else
      <div class="kv"><div class="kv-label">Pages Crawled</div><div class="kv-value">{{ $trk['pages_crawled'] ?? 0 }}</div></div>
      @foreach(['ga4' => 'Google Analytics 4', 'facebook_pixel' => 'Facebook / Meta Pixel', 'tiktok_pixel' => 'TikTok Pixel'] as $key => $label)
        @php $t = $trk['tracking_scripts'][$key] ?? []; @endphp
        <div class="kv">
          <div class="kv-label">{{ $label }}</div>
          <div class="kv-value">
            <span class="pill pill-{{ ($t['detected'] ?? false) ? 'ok' : 'miss' }}">{{ ($t['detected'] ?? false) ? 'DETECTED' : 'NOT FOUND' }}</span>
            @if(! empty($t['ids'] ?? []))&nbsp;IDs: {{ implode(', ', $t['ids']) }}@endif
          </div>
        </div>
      @endforeach
    @endif
  </div>
</div>

{{-- ===== 5. CATALOG INTEGRITY ===== --}}
@php $cat = $report['audits']['catalog_integrity'] ?? []; @endphp
<div class="section">
  <div class="section-header">5 · E-Commerce Catalog Integrity</div>
  <div class="section-body">
    @if(($cat['status'] ?? '') === 'error')
      <div class="error-box">Audit failed: {{ $cat['error'] }}</div>
    @elseif(($cat['product_pages_found'] ?? 0) === 0)
      <div class="none-found">No product pages detected (site may use JavaScript rendering).</div>
    @else
      <div class="kv"><div class="kv-label">Pages Crawled</div><div class="kv-value">{{ $cat['pages_crawled'] ?? 0 }}</div></div>
      <div class="kv"><div class="kv-label">Product Pages Found</div><div class="kv-value">{{ $cat['product_pages_found'] ?? 0 }}</div></div>
      <div class="kv">
        <div class="kv-label">Broken Products</div>
        <div class="kv-value">
          @php $pct = $cat['broken_percentage'] ?? 0; @endphp
          <span class="pill pill-{{ $pct === 0 ? 'ok' : ($pct <= 10 ? 'warn' : 'bad') }}">{{ $cat['broken_products_count'] ?? 0 }} / {{ $cat['products_audited'] ?? 0 }} ({{ $pct }}%)</span>
        </div>
      </div>
      @if(! empty($cat['results'] ?? []))
        <table>
          <tr><th>URL</th><th>Price Error</th><th>Stock</th><th>Cart Disabled</th></tr>
          @foreach($cat['results'] as $r)
          <tr>
            <td>{{ Str::limit($r['url'] ?? '', 60) }}</td>
            <td><span class="pill pill-{{ ($r['has_price_error'] ?? false) ? 'bad' : 'ok' }}">{{ ($r['has_price_error'] ?? false) ? 'YES' : 'NO' }}</span></td>
            <td>{{ $r['frontend_stock'] ?? '—' }}@if($r['stock_mismatch'] ?? false) <span class="pill pill-bad">MISMATCH</span>@endif</td>
            <td><span class="pill pill-{{ ($r['cart_disabled'] ?? false) ? 'bad' : 'ok' }}">{{ ($r['cart_disabled'] ?? false) ? 'YES' : 'NO' }}</span></td>
          </tr>
          @endforeach
        </table>
      @endif
    @endif
  </div>
</div>

{{-- ===== 6. BROKEN RESOURCES ===== --}}
@php $br = $report['audits']['broken_resources'] ?? []; @endphp
<div class="section">
  <div class="section-header">6 · Broken Links &amp; Images</div>
  <div class="section-body">
    @if(($br['status'] ?? '') === 'error')
      <div class="error-box">Audit failed: {{ $br['error'] }}</div>
    @else
      <div class="kv"><div class="kv-label">Pages Crawled</div><div class="kv-value">{{ $br['pages_crawled'] ?? 0 }}</div></div>
      <div class="kv">
        <div class="kv-label">Links Checked</div>
        <div class="kv-value">
          {{ $br['summary']['total_links_checked'] ?? 0 }} total —
          <span class="pill pill-{{ ($br['summary']['broken_links_count'] ?? 0) === 0 ? 'ok' : 'bad' }}">{{ $br['summary']['broken_links_count'] ?? 0 }} broken ({{ $br['summary']['broken_links_percentage'] ?? 0 }}%)</span>
        </div>
      </div>
      <div class="kv">
        <div class="kv-label">Images Checked</div>
        <div class="kv-value">
          {{ $br['summary']['total_images_checked'] ?? 0 }} total —
          <span class="pill pill-{{ ($br['summary']['broken_images_count'] ?? 0) === 0 ? 'ok' : 'bad' }}">{{ $br['summary']['broken_images_count'] ?? 0 }} broken ({{ $br['summary']['broken_images_percentage'] ?? 0 }}%)</span>
        </div>
      </div>
      @if(! empty($br['broken_links'] ?? []))
        <p style="margin-top:8px;font-weight:600;font-size:10px;">Broken Links (first 20):</p>
        <table>
          <tr><th>URL</th><th>Status</th></tr>
          @foreach($br['broken_links'] as $link)
          <tr>
            <td>{{ Str::limit($link['url'] ?? '', 80) }}</td>
            <td><span class="pill pill-bad">{{ $link['status_code'] ?? $link['error'] ?? '?' }}</span></td>
          </tr>
          @endforeach
        </table>
      @endif
      @if(! empty($br['broken_images'] ?? []))
        <p style="margin-top:8px;font-weight:600;font-size:10px;">Broken Images (first 20):</p>
        <table>
          <tr><th>URL</th><th>Status</th></tr>
          @foreach($br['broken_images'] as $img)
          <tr>
            <td>{{ Str::limit($img['url'] ?? '', 80) }}</td>
            <td><span class="pill pill-bad">{{ $img['status_code'] ?? $img['error'] ?? '?' }}</span></td>
          </tr>
          @endforeach
        </table>
      @endif
      @if(empty($br['broken_links'] ?? []) && empty($br['broken_images'] ?? []))
        <div class="none-found">&#10003; No broken links or images found.</div>
      @endif
    @endif
  </div>
</div>

</body>
</html>
