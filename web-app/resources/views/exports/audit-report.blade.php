<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Full Audit Report &mdash; {{ $report->site_url }}</title>
@php
  $coverBg   = $agency ? ($agency['primary_color']   ?? '#1a1a2e') : '#1a1a2e';
  $sectionBg = $agency ? ($agency['secondary_color'] ?? '#2d3748') : '#2d3748';
@endphp
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }

  .cover { padding: 50px 50px 40px; background: {{ $coverBg }}; color: #fff; }
  .cover-label { font-size: 11px; color: #cbd5e0; margin-bottom: 6px; letter-spacing: 1px; text-transform: uppercase; }
  .cover-title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 4px; word-break: break-all; }
  .cover-url   { font-size: 13px; color: #e2e8f0; margin-bottom: 16px; word-break: break-all; }
  .cover-meta  { font-size: 10px; color: #a0aec0; margin-top: 4px; }
  .agency-logo { max-height: 56px; max-width: 200px; margin-bottom: 18px; display: block; }

  .score-badge { display: inline-block; padding: 6px 20px; border-radius: 30px; font-size: 20px;
                 font-weight: 700; color: #fff; margin-top: 14px; }
  .score-green  { background: #38a169; }
  .score-yellow { background: #d69e2e; }
  .score-red    { background: #e53e3e; }

  .section { margin: 20px 30px; page-break-inside: avoid; }
  .section-header { background: {{ $sectionBg }}; color: #fff; padding: 8px 14px;
                    border-radius: 6px 6px 0 0; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
  .section-body { border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; padding: 14px; }

  .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; }
  .pill-green  { background: #c6f6d5; color: #276749; }
  .pill-red    { background: #fed7d7; color: #9b2c2c; }
  .pill-yellow { background: #fefcbf; color: #744210; }
  .pill-gray   { background: #e2e8f0; color: #4a5568; }

  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { padding: 5px 8px; border: 1px solid #e2e8f0; font-size: 10px; text-align: left; vertical-align: top; }
  th { background: #f7fafc; font-weight: 700; }
  tr:nth-child(even) { background: #f7fafc; }

  .url-cell { word-break: break-all; font-size: 9px; color: #4a5568; }
  .found-on  { font-size: 9px; color: #718096; word-break: break-all; }

  .deduction-item { padding: 3px 0; border-bottom: 1px dashed #e2e8f0; font-size: 10px; color: #e53e3e; }

  .footer { margin: 30px; font-size: 9px; color: #a0aec0; text-align: center;
             border-top: 1px solid #e2e8f0; padding-top: 10px; }

  .screenshot-grid { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .screenshot-cell { width: 50%; padding: 6px; border: none; vertical-align: top; }
  .screenshot-img { width: 100%; max-height: 150px; border: 1px solid #e2e8f0; border-radius: 4px; }
  .screenshot-badge { display: inline-block; padding: 1px 7px; border-radius: 8px; font-size: 8px;
                       font-weight: 700; background: {{ $sectionBg }}; color: #fff; margin: 5px 0 3px; }
  .screenshot-caption { font-size: 9px; color: #2d3748; word-break: break-all; }
  .screenshot-code { font-size: 8px; color: #718096; word-break: break-all; font-family: monospace; margin-top: 2px; }
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  @if($agency && $agency['logo_path'])
    <img src="{{ $agency['logo_path'] }}" class="agency-logo" alt="Logo" />
  @elseif($agency && $agency['name'])
    <div style="font-size:20px; font-weight:700; color:#fff; margin-bottom:18px;">{{ $agency['name'] }}</div>
  @else
    <div style="font-size:20px; font-weight:700; color:#fff; margin-bottom:18px;">4utest</div>
  @endif

  <div class="cover-label">Full Audit Report</div>

  @if($report->name)
    <div class="cover-title">{{ $report->name }}</div>
  @endif
  <div class="cover-url">{{ $report->site_url }}</div>
  <div class="cover-meta">Generated: {{ $report->created_at?->format('d M Y H:i') }}</div>

  @if($report->health_score !== null)
    @php
      $score = $report->health_score;
      $cls   = $score >= 80 ? 'score-green' : ($score >= 50 ? 'score-yellow' : 'score-red');
    @endphp
    <div class="score-badge {{ $cls }}">Health Score: {{ $score }}/100</div>
  @endif
</div>

<!-- Score Deductions -->
@if(!empty($report->score_deductions))
<div class="section">
  <div class="section-header">Score Deductions</div>
  <div class="section-body">
    @foreach($report->score_deductions as $ded)
      <div class="deduction-item">&#8722; {{ $ded }}</div>
    @endforeach
  </div>
</div>
@endif

<!-- Screenshot Gallery -->
@php
  $screenshots = \App\Support\PdfScreenshotGallery::build(
      $report->performance_result,
      $report->broken_resources_result,
      $report->accessibility_result,
      $report->site_url
  );
@endphp
@if(!empty($screenshots))
<div class="section">
  <div class="section-header">Screenshot Gallery</div>
  <div class="section-body">
    <table class="screenshot-grid">
      @foreach(array_chunk($screenshots, 2) as $pair)
        <tr>
          @foreach($pair as $shot)
            <td class="screenshot-cell">
              <span class="screenshot-badge">{{ $shot['badge'] }}</span><br>
              <img src="{{ $shot['path'] }}" class="screenshot-img" alt="{{ $shot['badge'] }} screenshot">
              <div class="screenshot-caption">{{ $shot['caption'] }}</div>
              @if($shot['code'])
                <div class="screenshot-code">{{ $shot['code'] }}</div>
              @endif
            </td>
          @endforeach
          @if(count($pair) === 1)
            <td class="screenshot-cell"></td>
          @endif
        </tr>
      @endforeach
    </table>
  </div>
</div>
@endif

<!-- SEO & Schema -->
@if($report->seo_schema_result)
@php $seo = $report->seo_schema_result; @endphp
<div class="section">
  <div class="section-header">SEO &amp; Schema</div>
  <div class="section-body">
    <table>
      <tr><th>Check</th><th>Status</th><th>Details</th></tr>
      <tr>
        <td>Meta Title</td>
        <td><span class="pill {{ ($seo['meta_title']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-red' }}">{{ $seo['meta_title']['status'] ?? '-' }}</span></td>
        <td class="url-cell">{{ $seo['meta_title']['value'] ?? '' }}</td>
      </tr>
      <tr>
        <td>Meta Description</td>
        <td><span class="pill {{ ($seo['meta_description']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-red' }}">{{ $seo['meta_description']['status'] ?? '-' }}</span></td>
        <td>Length: {{ $seo['meta_description']['length'] ?? '-' }} chars</td>
      </tr>
      <tr>
        <td>H1 Tags</td>
        <td><span class="pill {{ ($seo['h1_tags']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-yellow' }}">{{ $seo['h1_tags']['status'] ?? '-' }}</span></td>
        <td>Count: {{ $seo['h1_tags']['count'] ?? '-' }}</td>
      </tr>
      <tr>
        <td>Canonical URL</td>
        <td><span class="pill {{ ($seo['canonical']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-yellow' }}">{{ $seo['canonical']['status'] ?? '-' }}</span></td>
        <td class="url-cell">{{ $seo['canonical']['url'] ?? 'Not set' }}</td>
      </tr>
      <tr>
        <td>Structured Data</td>
        <td><span class="pill {{ ($seo['schema_validation']['has_valid_schema'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($seo['schema_validation']['has_valid_schema'] ?? false) ? 'Valid' : 'Missing/Invalid' }}</span></td>
        <td></td>
      </tr>
      <tr>
        <td>Open Graph</td>
        <td><span class="pill {{ ($seo['open_graph']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-yellow' }}">{{ $seo['open_graph']['status'] ?? '-' }}</span></td>
        <td></td>
      </tr>
      <tr>
        <td>Image Alt Text</td>
        <td><span class="pill {{ ($seo['image_alt_text']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-yellow' }}">{{ $seo['image_alt_text']['status'] ?? '-' }}</span></td>
        <td>Missing: {{ $seo['image_alt_text']['missing_count'] ?? '-' }}</td>
      </tr>
      <tr>
        <td>robots.txt</td>
        <td><span class="pill {{ ($seo['technical_seo']['robots_txt']['exists'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($seo['technical_seo']['robots_txt']['exists'] ?? false) ? 'Present' : 'Missing' }}</span></td>
        <td></td>
      </tr>
      <tr>
        <td>sitemap.xml</td>
        <td><span class="pill {{ ($seo['technical_seo']['sitemap_xml']['exists'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($seo['technical_seo']['sitemap_xml']['exists'] ?? false) ? 'Present' : 'Missing' }}</span></td>
        <td></td>
      </tr>
    </table>
  </div>
</div>
@endif

<!-- Security -->
@if($report->security_result)
@php $sec = $report->security_result; @endphp
<div class="section">
  <div class="section-header">Security &amp; Infrastructure</div>
  <div class="section-body">
    <table>
      <tr><th>Check</th><th>Status</th><th>Details</th></tr>
      <tr>
        <td>SSL Certificate</td>
        <td><span class="pill {{ ($sec['ssl']['ssl_valid'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($sec['ssl']['ssl_valid'] ?? false) ? 'Valid' : 'Invalid' }}</span></td>
        <td>Expires in: {{ $sec['ssl']['ssl_days_left'] ?? '-' }} days &mdash; Issuer: {{ $sec['ssl']['ssl_issuer'] ?? '-' }}</td>
      </tr>
      <tr>
        <td>HTTPS Redirect</td>
        <td><span class="pill {{ ($sec['https_redirect']['redirects_to_https'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($sec['https_redirect']['redirects_to_https'] ?? false) ? 'Yes' : 'No' }}</span></td>
        <td></td>
      </tr>
      <tr>
        <td>Mixed Content</td>
        <td><span class="pill {{ !($sec['mixed_content']['has_mixed_content'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($sec['mixed_content']['has_mixed_content'] ?? false) ? 'Found' : 'None' }}</span></td>
        <td></td>
      </tr>
      <tr>
        <td>Security Headers</td>
        <td><span class="pill pill-gray">{{ $sec['security_headers']['score'] ?? '-' }}/6</span></td>
        <td>
          @foreach(array_keys($sec['security_headers']['headers_present'] ?? []) as $hdr)
            <span class="pill pill-green">{{ $hdr }}</span>&nbsp;
          @endforeach
          @foreach($sec['security_headers']['headers_missing'] ?? [] as $hdr)
            <span class="pill pill-red">{{ $hdr }}</span>&nbsp;
          @endforeach
        </td>
      </tr>
      @if(!empty($sec['security_headers']['info_disclosure']))
      <tr>
        <td>Information Disclosure</td>
        <td><span class="pill pill-yellow">{{ count($sec['security_headers']['info_disclosure']) }} header(s)</span></td>
        <td>
          @foreach($sec['security_headers']['info_disclosure'] as $hdr => $value)
            <span class="pill pill-yellow">{{ $hdr }}: {{ $value }}</span>&nbsp;
          @endforeach
        </td>
      </tr>
      @endif
      <tr>
        <td>SPF Record</td>
        <td><span class="pill {{ ($sec['dns_security']['spf_record_exists'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($sec['dns_security']['spf_record_exists'] ?? false) ? 'Present' : 'Missing' }}</span></td>
        <td></td>
      </tr>
      <tr>
        <td>DMARC Record</td>
        <td><span class="pill {{ ($sec['dns_security']['dmarc_record_exists'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($sec['dns_security']['dmarc_record_exists'] ?? false) ? 'Present' : 'Missing' }}</span></td>
        <td></td>
      </tr>
    </table>
  </div>
</div>
@endif

<!-- Performance -->
@if($report->performance_result)
@php $perf = $report->performance_result; @endphp
<div class="section">
  <div class="section-header">Performance</div>
  <div class="section-body">
    <table>
      <tr><th>Metric</th><th>Value</th><th>Rating</th></tr>
      <tr>
        <td>TTFB</td>
        <td>{{ $perf['metrics']['ttfb_ms'] ?? '-' }} ms</td>
        <td>@php $ttfb = $perf['metrics']['ttfb_ms'] ?? null; @endphp
          @if($ttfb !== null)<span class="pill {{ $ttfb <= 400 ? 'pill-green' : ($ttfb <= 800 ? 'pill-yellow' : 'pill-red') }}">{{ $ttfb <= 400 ? 'Good' : ($ttfb <= 800 ? 'Needs Improvement' : 'Poor') }}</span>@endif
        </td>
      </tr>
      <tr>
        <td>LCP (Desktop)</td>
        <td>{{ $perf['metrics']['desktop']['lcp_ms'] ?? '-' }} ms</td>
        <td>@php $lcp = $perf['metrics']['desktop']['lcp_ms'] ?? null; @endphp
          @if($lcp !== null)<span class="pill {{ $lcp <= 2500 ? 'pill-green' : ($lcp <= 4000 ? 'pill-yellow' : 'pill-red') }}">{{ $lcp <= 2500 ? 'Good' : ($lcp <= 4000 ? 'Needs Improvement' : 'Poor') }}</span>@endif
        </td>
      </tr>
      <tr>
        <td>LCP (Mobile)</td>
        <td>{{ $perf['metrics']['mobile']['lcp_ms'] ?? '-' }} ms</td>
        <td>@php $lcpM = $perf['metrics']['mobile']['lcp_ms'] ?? null; @endphp
          @if($lcpM !== null)<span class="pill {{ $lcpM <= 2500 ? 'pill-green' : ($lcpM <= 4000 ? 'pill-yellow' : 'pill-red') }}">{{ $lcpM <= 2500 ? 'Good' : ($lcpM <= 4000 ? 'Needs Improvement' : 'Poor') }}</span>@endif
        </td>
      </tr>
      @php $fcpD = $perf['metrics']['desktop']['fcp_ms'] ?? null; @endphp
      @if($fcpD !== null)
      <tr>
        <td>FCP (Desktop)</td>
        <td>{{ $fcpD }} ms</td>
        <td><span class="pill {{ $fcpD <= 1800 ? 'pill-green' : ($fcpD <= 3000 ? 'pill-yellow' : 'pill-red') }}">{{ $fcpD <= 1800 ? 'Good' : ($fcpD <= 3000 ? 'Needs Improvement' : 'Poor') }}</span></td>
      </tr>
      @endif
      @php $clsD = $perf['metrics']['desktop']['cls_score'] ?? null; @endphp
      @if($clsD !== null)
      <tr>
        <td>CLS (Desktop)</td>
        <td>{{ $clsD }}</td>
        <td><span class="pill {{ $clsD <= 0.1 ? 'pill-green' : ($clsD <= 0.25 ? 'pill-yellow' : 'pill-red') }}">{{ $clsD <= 0.1 ? 'Good' : ($clsD <= 0.25 ? 'Needs Improvement' : 'Poor') }}</span></td>
      </tr>
      @endif
      @php $clsM = $perf['metrics']['mobile']['cls_score'] ?? null; @endphp
      @if($clsM !== null)
      <tr>
        <td>CLS (Mobile)</td>
        <td>{{ $clsM }}</td>
        <td><span class="pill {{ $clsM <= 0.1 ? 'pill-green' : ($clsM <= 0.25 ? 'pill-yellow' : 'pill-red') }}">{{ $clsM <= 0.1 ? 'Good' : ($clsM <= 0.25 ? 'Needs Improvement' : 'Poor') }}</span></td>
      </tr>
      @endif
      <tr>
        <td>Compression</td>
        <td colspan="2">
          @php $compressionMatters = $perf['page_analysis']['compression_worth_flagging'] ?? false; @endphp
          <span class="pill {{ ($perf['page_analysis']['compression_enabled'] ?? false) ? 'pill-green' : ($compressionMatters ? 'pill-red' : 'pill-green') }}">
            {{ ($perf['page_analysis']['compression_enabled'] ?? false) ? 'Enabled' : ($compressionMatters ? 'Disabled' : 'Disabled — not needed for a page this small') }}
          </span>
        </td>
      </tr>
      <tr>
        <td>Render-blocking resources</td>
        <td colspan="2">{{ $perf['page_analysis']['total_render_blocking'] ?? 0 }}</td>
      </tr>
      @if(!empty($perf['page_analysis']['unminified_assets']))
      <tr>
        <td>Minification</td>
        <td colspan="2"><span class="pill pill-red">{{ count($perf['page_analysis']['unminified_assets']) }} file(s) over 10KB not minified</span></td>
      </tr>
      @endif
    </table>
  </div>
</div>
@endif

<!-- Broken Resources -->
@if($report->broken_resources_result)
@php $br = $report->broken_resources_result; @endphp
<div class="section">
  <div class="section-header">Broken Resources &mdash; Summary</div>
  <div class="section-body">
    <table>
      <tr><th>Type</th><th>Checked</th><th>Broken</th><th>%</th></tr>
      <tr>
        <td>Links</td>
        <td>{{ $br['summary']['total_links_checked'] ?? 0 }}</td>
        <td>{{ $br['summary']['broken_links_count'] ?? 0 }}</td>
        <td>{{ $br['summary']['broken_links_percentage'] ?? 0 }}%</td>
      </tr>
      <tr>
        <td>Images</td>
        <td>{{ $br['summary']['total_images_checked'] ?? 0 }}</td>
        <td>{{ $br['summary']['broken_images_count'] ?? 0 }}</td>
        <td>{{ $br['summary']['broken_images_percentage'] ?? 0 }}%</td>
      </tr>
    </table>
  </div>
</div>

@if(!empty($br['broken_links']))
<div class="section">
  <div class="section-header">Broken Links (up to 20)</div>
  <div class="section-body">
    <table>
      <tr><th style="width:40%">Broken URL</th><th style="width:8%">Code</th><th style="width:52%">Found on page</th></tr>
      @foreach($br['broken_links'] as $link)
      <tr>
        <td class="url-cell">{{ $link['url'] ?? '-' }}</td>
        <td><span class="pill pill-red">{{ $link['status_code'] ?? '-' }}</span></td>
        <td class="found-on">{{ $link['found_on'] ?? '-' }}</td>
      </tr>
      @endforeach
    </table>
  </div>
</div>
@endif

@if(!empty($br['broken_images']))
<div class="section">
  <div class="section-header">Broken Images (up to 20)</div>
  <div class="section-body">
    <table>
      <tr><th style="width:40%">Broken Image URL</th><th style="width:8%">Code</th><th style="width:52%">Found on page</th></tr>
      @foreach($br['broken_images'] as $img)
      <tr>
        <td class="url-cell">{{ $img['url'] ?? '-' }}</td>
        <td><span class="pill pill-red">{{ $img['status_code'] ?? '-' }}</span></td>
        <td class="found-on">{{ $img['found_on'] ?? '-' }}</td>
      </tr>
      @endforeach
    </table>
  </div>
</div>
@endif
@endif

<!-- Marketing & Tracking -->
@if($report->tracking_result)
@php $trk = $report->tracking_result; @endphp
<div class="section">
  <div class="section-header">Marketing &amp; Tracking</div>
  <div class="section-body">
    <table>
      <tr><th>Script</th><th>Detected</th><th>IDs Found</th></tr>
      <tr>
        <td>Google Analytics 4</td>
        <td><span class="pill {{ ($trk['tracking_scripts']['ga4']['detected'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($trk['tracking_scripts']['ga4']['detected'] ?? false) ? 'Yes' : 'No' }}</span></td>
        <td>{{ implode(', ', $trk['tracking_scripts']['ga4']['ids'] ?? []) }}</td>
      </tr>
      <tr>
        <td>Facebook Pixel</td>
        <td><span class="pill {{ ($trk['tracking_scripts']['facebook_pixel']['detected'] ?? false) ? 'pill-green' : 'pill-yellow' }}">{{ ($trk['tracking_scripts']['facebook_pixel']['detected'] ?? false) ? 'Yes' : 'No' }}</span></td>
        <td>{{ implode(', ', $trk['tracking_scripts']['facebook_pixel']['ids'] ?? []) }}</td>
      </tr>
      <tr>
        <td>TikTok Pixel</td>
        <td><span class="pill {{ ($trk['tracking_scripts']['tiktok_pixel']['detected'] ?? false) ? 'pill-green' : 'pill-gray' }}">{{ ($trk['tracking_scripts']['tiktok_pixel']['detected'] ?? false) ? 'Yes' : 'No' }}</span></td>
        <td>{{ implode(', ', $trk['tracking_scripts']['tiktok_pixel']['ids'] ?? []) }}</td>
      </tr>
    </table>
  </div>
</div>
@endif

<!-- E-Commerce Catalog -->
@if($report->catalog_result)
@php $cat = $report->catalog_result; @endphp
<div class="section">
  <div class="section-header">E-Commerce Catalog Integrity</div>
  <div class="section-body">
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Products Audited</td><td>{{ $cat['products_audited'] ?? 0 }}</td></tr>
      <tr><td>Broken Products</td><td>{{ $cat['broken_products_count'] ?? 0 }}</td></tr>
      <tr><td>Broken Percentage</td><td>{{ $cat['broken_percentage'] ?? 0 }}%</td></tr>
    </table>
    @php $brokenProducts = array_values(array_filter($cat['results'] ?? [], fn ($p) => $p['is_broken'] ?? false)); @endphp
    @if(!empty($brokenProducts))
    <table style="margin-top:10px;">
      <tr><th style="width:45%">Product URL</th><th>Price (page / schema)</th><th>Stock</th><th>Issues</th></tr>
      @foreach(array_slice($brokenProducts, 0, 15) as $prod)
      @php
        $issues = array_merge($prod['price_errors'] ?? [], $prod['stock_details'] ?? []);
        if ($prod['cart_disabled'] ?? false) { $issues[] = 'Add-to-cart disabled'; }
      @endphp
      <tr>
        <td class="url-cell">{{ $prod['url'] ?? '-' }}</td>
        <td style="font-size:9px;">{{ $prod['detected_price'] ?? '-' }} / {{ $prod['schema_price'] ?? '-' }}</td>
        <td style="font-size:9px;">{{ $prod['frontend_stock'] ?? '-' }}{{ ($prod['stock_mismatch'] ?? false) ? ' (mismatch)' : '' }}</td>
        <td style="font-size:9px;">{{ implode('; ', $issues) ?: '-' }}</td>
      </tr>
      @endforeach
    </table>
    @endif
  </div>
</div>
@endif

<!-- Accessibility -->
@if($report->accessibility_result && ($report->accessibility_result['status'] ?? '') === 'ok')
@php $acc = $report->accessibility_result; $accChecks = $acc['checks'] ?? []; @endphp
<div class="section">
  <div class="section-header">Accessibility (WCAG) &mdash; Score: {{ $acc['score'] ?? '-' }}/100</div>
  <div class="section-body">
    <table>
      <tr><th>Check</th><th>Status</th><th>Details</th></tr>
      @php
        $statusPill = fn ($s) => $s === 'pass' ? 'pill-green' : ($s === 'warn' ? 'pill-yellow' : 'pill-red');
      @endphp
      <tr>
        <td>Form Labels</td>
        <td><span class="pill {{ $statusPill($accChecks['form_labels']['status'] ?? 'fail') }}">{{ strtoupper($accChecks['form_labels']['status'] ?? '-') }}</span></td>
        <td>{{ $accChecks['form_labels']['pass'] ?? 0 }} pass / {{ $accChecks['form_labels']['fail'] ?? 0 }} fail</td>
      </tr>
      <tr>
        <td>Image Alt Text</td>
        <td><span class="pill {{ $statusPill($accChecks['image_alt']['status'] ?? 'fail') }}">{{ strtoupper($accChecks['image_alt']['status'] ?? '-') }}</span></td>
        <td>Missing: {{ $accChecks['image_alt']['missing_count'] ?? 0 }} of {{ $accChecks['image_alt']['total'] ?? 0 }}</td>
      </tr>
      <tr>
        <td>ARIA Labels</td>
        <td><span class="pill {{ $statusPill($accChecks['aria_labels']['status'] ?? 'fail') }}">{{ strtoupper($accChecks['aria_labels']['status'] ?? '-') }}</span></td>
        <td>{{ $accChecks['aria_labels']['fail'] ?? 0 }} violation(s)</td>
      </tr>
      <tr>
        <td>Heading Hierarchy</td>
        <td><span class="pill {{ $statusPill($accChecks['heading_hierarchy']['status'] ?? 'fail') }}">{{ strtoupper($accChecks['heading_hierarchy']['status'] ?? '-') }}</span></td>
        <td>{{ $accChecks['heading_hierarchy']['h1_count'] ?? 0 }} H1 / {{ $accChecks['heading_hierarchy']['total_headings'] ?? 0 }} headings</td>
      </tr>
      <tr>
        <td>Link Text</td>
        <td><span class="pill {{ $statusPill($accChecks['link_text']['status'] ?? 'fail') }}">{{ strtoupper($accChecks['link_text']['status'] ?? '-') }}</span></td>
        <td>{{ $accChecks['link_text']['fail'] ?? 0 }} vague/empty link(s)</td>
      </tr>
      <tr>
        <td>Color Contrast</td>
        <td><span class="pill {{ $statusPill($accChecks['color_contrast']['status'] ?? 'fail') }}">{{ strtoupper($accChecks['color_contrast']['status'] ?? '-') }}</span></td>
        <td>{{ $accChecks['color_contrast']['fail'] ?? 0 }} violation(s)</td>
      </tr>
      <tr>
        <td>Landmark Elements</td>
        <td><span class="pill {{ ($accChecks['landmarks']['has_main'] ?? false) ? 'pill-green' : 'pill-yellow' }}">{{ ($accChecks['landmarks']['has_main'] ?? false) ? 'Present' : 'Missing' }}</span></td>
        <td>lang: {{ ($accChecks['landmarks']['has_lang'] ?? false) ? 'Yes' : 'No' }} &mdash; Skip nav: {{ ($accChecks['landmarks']['has_skip_nav'] ?? false) ? 'Yes' : 'No' }}</td>
      </tr>
    </table>
  </div>
</div>
@endif

<!-- Fuzz Testing (opt-in) -->
@if($report->fuzz_testing_result && ($report->fuzz_testing_result['status'] ?? '') !== 'error')
@php $fuzz = $report->fuzz_testing_result; @endphp
<div class="section">
  <div class="section-header">Fuzz Testing</div>
  <div class="section-body">
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Inputs Tested</td><td>{{ $fuzz['targets_tested'] ?? 0 }}</td></tr>
      <tr><td>Requests Sent</td><td>{{ $fuzz['requests_sent'] ?? 0 }}</td></tr>
      <tr><td>Findings</td><td>{{ $fuzz['total_findings'] ?? 0 }}</td></tr>
    </table>
    @if(!empty($fuzz['findings']))
    <table style="margin-top:10px;">
      <tr><th>Type</th><th>Severity</th><th style="width:40%">URL</th><th>Parameter</th></tr>
      @foreach(array_slice($fuzz['findings'], 0, 20) as $f)
      <tr>
        <td style="font-size:9px;">{{ str_replace('_', ' ', $f['type'] ?? '-') }}</td>
        <td><span class="pill {{ ($f['severity'] ?? '') === 'high' ? 'pill-red' : (($f['severity'] ?? '') === 'medium' ? 'pill-yellow' : 'pill-gray') }}">{{ $f['severity'] ?? '-' }}</span></td>
        <td class="url-cell">{{ $f['url'] ?? '-' }}</td>
        <td style="font-size:9px;">{{ $f['param'] ?? '-' }}</td>
      </tr>
      @endforeach
    </table>
    @endif
  </div>
</div>
@endif

<div class="footer">
  @if($agency && ($agency['footer_text'] ?? null))
    {{ $agency['footer_text'] }} &mdash;
  @elseif(!$agency)
    Generated by 4utest &mdash;
  @endif
  Audit of {{ $report->site_url }} &mdash; {{ now()->format('d M Y H:i') }}
</div>

</body>
</html>
