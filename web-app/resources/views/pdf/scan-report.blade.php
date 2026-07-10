<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color: #18181b; background: #fff; }

  .header { background: #7c3aed; color: #fff; padding: 24px 32px; }
  .header h1 { font-size: 22px; font-weight: bold; letter-spacing: -0.5px; }
  .header p  { font-size: 12px; opacity: 0.85; margin-top: 4px; }

  .meta { padding: 16px 32px; background: #f4f4f5; border-bottom: 1px solid #e4e4e7; }
  .meta table { width: 100%; }
  .meta td { padding: 3px 0; font-size: 11px; color: #52525b; }
  .meta td:first-child { font-weight: bold; color: #18181b; width: 140px; }

  .score-section { text-align: center; padding: 20px 32px; border-bottom: 1px solid #e4e4e7; }
  .score-circle {
    display: inline-block;
    width: 100px; height: 100px;
    border-radius: 50%;
    text-align: center;
    font-size: 38px; font-weight: bold;
    color: #fff;
    padding-top: 22px;
    line-height: 1.3;
    margin-bottom: 8px;
  }
  .score-good   { background: #16a34a; }
  .score-ok     { background: #ca8a04; }
  .score-bad    { background: #dc2626; }
  .score-label  { font-size: 13px; color: #52525b; margin-top: 6px; }

  .section { padding: 16px 32px; border-bottom: 1px solid #e4e4e7; }
  .section h2 { font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #3f3f46; border-left: 3px solid #7c3aed; padding-left: 8px; }

  .module-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #f4f4f5; }
  .module-name { font-size: 11px; color: #3f3f46; }
  .badge { font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 10px; }
  .badge-ok    { background: #dcfce7; color: #15803d; }
  .badge-warn  { background: #fef9c3; color: #a16207; }
  .badge-error { background: #fee2e2; color: #b91c1c; }

  .detail-table { width: 100%; margin-top: 8px; border-collapse: collapse; }
  .detail-table td { font-size: 10px; padding: 3px 6px; border-bottom: 1px solid #f4f4f5; color: #52525b; }
  .detail-table td:first-child { color: #71717a; width: 200px; }
  .detail-table td.ok   { color: #15803d; font-weight: bold; }
  .detail-table td.warn { color: #a16207; font-weight: bold; }
  .detail-table td.bad  { color: #b91c1c; font-weight: bold; }

  .deductions { padding: 16px 32px; border-bottom: 1px solid #e4e4e7; }
  .deductions h2 { font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #3f3f46; border-left: 3px solid #dc2626; padding-left: 8px; }
  .deduction-item { font-size: 11px; color: #52525b; padding: 3px 0; }
  .deduction-item::before { content: "- "; color: #dc2626; }

  .footer { padding: 14px 32px; background: #f4f4f5; }
  .footer p { font-size: 10px; color: #a1a1aa; }
  .footer a { color: #7c3aed; text-decoration: none; }

  .no-issues { font-size: 11px; color: #16a34a; font-style: italic; }
  .module-block { margin-bottom: 14px; }
  .module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .module-title { font-size: 12px; font-weight: bold; color: #3f3f46; }

  .screenshot-grid { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .screenshot-cell { width: 50%; padding: 6px; border: none; vertical-align: top; }
  .screenshot-img { width: 100%; max-height: 150px; border: 1px solid #e4e4e7; border-radius: 4px; }
  .screenshot-badge { display: inline-block; padding: 1px 7px; border-radius: 8px; font-size: 8px;
                       font-weight: bold; background: #7c3aed; color: #fff; margin: 5px 0 3px; }
  .screenshot-caption { font-size: 9px; color: #3f3f46; word-break: break-all; }
  .screenshot-code { font-size: 8px; color: #71717a; word-break: break-all; font-family: monospace; margin-top: 2px; }
</style>
</head>
<body>

<div class="header">
  <h1>4uTest — Audit Report</h1>
  <p>Automated website health scan</p>
</div>

<div class="meta">
  <table>
    <tr><td>Scan Name</td><td>{{ $scan->name }}</td></tr>
    <tr><td>Site URL</td><td>{{ $scan->site_url }}</td></tr>
    <tr><td>Scan Date</td><td>{{ now()->format('d M Y, H:i') }} UTC</td></tr>
    <tr><td>Full Report</td><td>{{ $reportUrl }}</td></tr>
  </table>
</div>

<div class="score-section">
  @php
    $scoreClass = $score >= 70 ? 'score-good' : ($score >= 40 ? 'score-ok' : 'score-bad');
    $scoreLabel = $score >= 70 ? 'Good' : ($score >= 40 ? 'Needs Improvement' : 'Critical Issues');
  @endphp
  <div class="score-circle {{ $scoreClass }}">{{ $score ?? '?' }}</div>
  <div class="score-label">Health Score &mdash; {{ $scoreLabel }}</div>
</div>

@php
  function statusColor(string $status): string {
    return match($status) { 'OK','ok','PASS','true','yes' => 'ok', 'WARNING','warn','SLOW' => 'warn', default => 'bad' };
  }
  $seo   = $report->seo_schema_result       ? json_decode($report->seo_schema_result, true)       : null;
  $sec   = $report->security_result         ? json_decode($report->security_result, true)         : null;
  $cat   = $report->catalog_result          ? json_decode($report->catalog_result, true)          : null;
  $trk   = $report->tracking_result         ? json_decode($report->tracking_result, true)         : null;
  $br    = $report->broken_resources_result ? json_decode($report->broken_resources_result, true) : null;
  $perf  = $report->performance_result      ? json_decode($report->performance_result, true)      : null;
  $a11y  = $report->accessibility_result    ? json_decode($report->accessibility_result, true)    : null;
  $screenshots = \App\Support\PdfScreenshotGallery::build($perf, $br, $a11y, $scan->site_url);
@endphp

@if(!empty($screenshots))
{{-- ======================== SCREENSHOT GALLERY ======================== --}}
<div class="section">
  <h2>Screenshot Gallery</h2>
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
@endif

{{-- ======================== SEO & SCHEMA ======================== --}}
<div class="section">
  <h2>SEO &amp; Schema</h2>
  @if($seo && ($seo['status'] ?? '') === 'ok')
    <table class="detail-table">
      @php $mt = $seo['meta_title'] ?? []; @endphp
      <tr>
        <td>Meta Title</td>
        <td class="{{ ($mt['status'] ?? '') === 'OK' ? 'ok' : 'bad' }}">
          {{ $mt['status'] ?? '?' }}
          @if(isset($mt['length'])) ({{ $mt['length'] }} chars) @endif
        </td>
      </tr>
      @php $md = $seo['meta_description'] ?? []; @endphp
      <tr>
        <td>Meta Description</td>
        <td class="{{ ($md['status'] ?? '') === 'OK' ? 'ok' : 'bad' }}">
          {{ $md['status'] ?? '?' }}
          @if(isset($md['length'])) ({{ $md['length'] }} chars) @endif
        </td>
      </tr>
      @php $h1 = $seo['h1_tags'] ?? []; @endphp
      <tr>
        <td>H1 Tags</td>
        <td class="{{ ($h1['status'] ?? '') === 'OK' ? 'ok' : 'bad' }}">
          {{ $h1['status'] ?? '?' }}
          @if(isset($h1['count'])) ({{ $h1['count'] }} found) @endif
        </td>
      </tr>
      @php $can = $seo['canonical'] ?? []; @endphp
      <tr>
        <td>Canonical URL</td>
        <td class="{{ ($can['status'] ?? '') === 'OK' ? 'ok' : (($can['status'] ?? '') === 'MISSING' ? 'bad' : 'warn') }}">
          {{ $can['status'] ?? '?' }}
        </td>
      </tr>
      @php $og = $seo['open_graph'] ?? []; @endphp
      <tr>
        <td>Open Graph Tags</td>
        <td class="{{ ($og['status'] ?? '') === 'OK' ? 'ok' : 'bad' }}">
          {{ $og['status'] ?? '?' }}
          @if(isset($og['tags_count'])) ({{ $og['tags_count'] }} tags) @endif
        </td>
      </tr>
      @php $schema = $seo['schema_validation'] ?? []; @endphp
      <tr>
        <td>Structured Data</td>
        <td class="{{ ($schema['has_valid_schema'] ?? false) ? 'ok' : 'bad' }}">
          {{ ($schema['has_valid_schema'] ?? false) ? 'Present' : 'Missing' }}
          @if(!empty($schema['schema_types'])) — {{ implode(', ', (array)$schema['schema_types']) }} @endif
        </td>
      </tr>
      @php $alt = $seo['image_alt_text'] ?? []; @endphp
      <tr>
        <td>Image Alt Text</td>
        <td class="{{ ($alt['status'] ?? '') === 'OK' ? 'ok' : 'warn' }}">
          {{ $alt['status'] ?? '?' }}
          @if(isset($alt['missing_count'])) ({{ $alt['missing_count'] }} missing) @endif
        </td>
      </tr>
      @php $tech = $seo['technical_seo'] ?? []; @endphp
      <tr>
        <td>robots.txt</td>
        <td class="{{ ($tech['robots_txt']['exists'] ?? false) ? 'ok' : 'bad' }}">
          {{ ($tech['robots_txt']['exists'] ?? false) ? 'Found' : 'Missing' }}
        </td>
      </tr>
      <tr>
        <td>sitemap.xml</td>
        <td class="{{ ($tech['sitemap_xml']['exists'] ?? false) ? 'ok' : 'bad' }}">
          {{ ($tech['sitemap_xml']['exists'] ?? false) ? 'Found' : 'Missing' }}
        </td>
      </tr>
    </table>
  @else
    <p style="font-size:11px;color:#71717a;">{{ ($seo['status'] ?? '') === 'error' ? ($seo['error'] ?? 'Error') : 'Not available' }}</p>
  @endif
</div>

{{-- ======================== SECURITY ======================== --}}
<div class="section">
  <h2>Security &amp; Infrastructure</h2>
  @if($sec && ($sec['status'] ?? '') === 'ok')
    <table class="detail-table">
      @php $ssl = $sec['ssl'] ?? []; @endphp
      <tr>
        <td>SSL Certificate</td>
        <td class="{{ ($ssl['ssl_valid'] ?? false) ? 'ok' : 'bad' }}">
          {{ ($ssl['ssl_valid'] ?? false) ? 'Valid' : 'Invalid / Missing' }}
          @if(isset($ssl['ssl_days_left'])) — {{ $ssl['ssl_days_left'] }} days left @endif
        </td>
      </tr>
      @php $https = $sec['https_redirect'] ?? []; @endphp
      <tr>
        <td>HTTPS Redirect</td>
        <td class="{{ ($https['redirects_to_https'] ?? true) ? 'ok' : 'bad' }}">
          {{ ($https['redirects_to_https'] ?? true) ? 'Yes' : 'No' }}
        </td>
      </tr>
      @php $mixed = $sec['mixed_content'] ?? []; @endphp
      <tr>
        <td>Mixed Content</td>
        <td class="{{ ($mixed['has_mixed_content'] ?? false) ? 'bad' : 'ok' }}">
          {{ ($mixed['has_mixed_content'] ?? false) ? 'Found' : 'None' }}
        </td>
      </tr>
      @php $headers = $sec['security_headers'] ?? []; @endphp
      <tr>
        <td>Security Headers Score</td>
        <td class="{{ ($headers['score'] ?? 0) >= 5 ? 'ok' : (($headers['score'] ?? 0) >= 3 ? 'warn' : 'bad') }}">
          {{ $headers['score'] ?? 0 }} / {{ $headers['total'] ?? 6 }}
          @if(!empty($headers['missing']))
            — Missing: {{ implode(', ', (array)$headers['missing']) }}
          @endif
        </td>
      </tr>
      @php $dns = $sec['dns_security'] ?? []; @endphp
      <tr>
        <td>SPF Record</td>
        <td class="{{ ($dns['spf_record_exists'] ?? false) ? 'ok' : 'bad' }}">
          {{ ($dns['spf_record_exists'] ?? false) ? 'Present' : 'Missing' }}
        </td>
      </tr>
      <tr>
        <td>DMARC Record</td>
        <td class="{{ ($dns['dmarc_record_exists'] ?? false) ? 'ok' : 'bad' }}">
          {{ ($dns['dmarc_record_exists'] ?? false) ? 'Present' : 'Missing' }}
        </td>
      </tr>
    </table>
  @else
    <p style="font-size:11px;color:#71717a;">{{ ($sec['status'] ?? '') === 'error' ? ($sec['error'] ?? 'Error') : 'Not available' }}</p>
  @endif
</div>

{{-- ======================== PERFORMANCE ======================== --}}
<div class="section">
  <h2>Performance</h2>
  @if($perf && ($perf['status'] ?? '') === 'ok')
    @php $metrics = $perf['metrics'] ?? []; $pageAnalysis = $perf['page_analysis'] ?? []; @endphp
    <table class="detail-table">
      @if(isset($metrics['ttfb_ms']))
      <tr>
        <td>TTFB (Time to First Byte)</td>
        <td class="{{ $metrics['ttfb_ms'] <= 600 ? 'ok' : ($metrics['ttfb_ms'] <= 1500 ? 'warn' : 'bad') }}">
          {{ $metrics['ttfb_ms'] }}ms
          @if($metrics['ttfb_ms'] <= 600) (Fast) @elseif($metrics['ttfb_ms'] <= 1500) (Slow) @else (Very Slow) @endif
        </td>
      </tr>
      @endif
      @if(isset($metrics['page_size_kb']))
      <tr>
        <td>Page Size</td>
        <td>{{ $metrics['page_size_kb'] }} KB</td>
      </tr>
      @endif
      @if(isset($metrics['requests_count']))
      <tr>
        <td>HTTP Requests</td>
        <td>{{ $metrics['requests_count'] }}</td>
      </tr>
      @endif
      <tr>
        <td>Compression (Gzip/Brotli)</td>
        <td class="{{ ($pageAnalysis['compression_enabled'] ?? false) ? 'ok' : (($pageAnalysis['compression_worth_flagging'] ?? false) ? 'bad' : 'ok') }}">
          {{ ($pageAnalysis['compression_enabled'] ?? false) ? 'Enabled' : (($pageAnalysis['compression_worth_flagging'] ?? false) ? 'Not Enabled' : 'Not enabled — not needed for a page this small') }}
        </td>
      </tr>
      @if(isset($pageAnalysis['total_render_blocking']))
      <tr>
        <td>Render-Blocking Resources</td>
        <td class="{{ $pageAnalysis['total_render_blocking'] == 0 ? 'ok' : 'warn' }}">
          {{ $pageAnalysis['total_render_blocking'] }}
        </td>
      </tr>
      @endif
      @if(!empty($pageAnalysis['unminified_assets']))
      <tr>
        <td>Minification</td>
        <td class="bad">
          {{ count($pageAnalysis['unminified_assets']) }} file(s) over 10KB not minified
        </td>
      </tr>
      @endif
    </table>
  @else
    <p style="font-size:11px;color:#71717a;">{{ ($perf['status'] ?? '') === 'error' ? ($perf['error'] ?? 'Error') : 'Not available' }}</p>
  @endif
</div>

{{-- ======================== ACCESSIBILITY ======================== --}}
<div class="section">
  <h2>Accessibility (WCAG)</h2>
  @if($a11y && ($a11y['status'] ?? '') === 'ok')
    @php $checks = $a11y['checks'] ?? []; @endphp
    <table class="detail-table">
      @php $formLabels = $checks['form_labels'] ?? []; @endphp
      <tr>
        <td>Form Labels</td>
        <td class="{{ ($formLabels['fail'] ?? 0) == 0 ? 'ok' : 'bad' }}">
          {{ ($formLabels['fail'] ?? 0) == 0 ? 'All labeled' : ($formLabels['fail'] ?? 0) . ' unlabeled input(s)' }}
        </td>
      </tr>
      @php $imgAlt = $checks['image_alt'] ?? []; @endphp
      <tr>
        <td>Image Alt Text</td>
        <td class="{{ ($imgAlt['missing_count'] ?? 0) == 0 ? 'ok' : (($imgAlt['missing_count'] ?? 0) <= 5 ? 'warn' : 'bad') }}">
          {{ ($imgAlt['missing_count'] ?? 0) == 0 ? 'All present' : ($imgAlt['missing_count'] ?? 0) . ' missing' }}
        </td>
      </tr>
      @php $aria = $checks['aria_labels'] ?? []; @endphp
      <tr>
        <td>ARIA Labels</td>
        <td class="{{ ($aria['fail'] ?? 0) == 0 ? 'ok' : 'warn' }}">
          {{ ($aria['fail'] ?? 0) == 0 ? 'OK' : ($aria['fail'] ?? 0) . ' element(s) missing ARIA name' }}
        </td>
      </tr>
      @php $headings = $checks['heading_hierarchy'] ?? []; @endphp
      <tr>
        <td>Heading Hierarchy</td>
        <td class="{{ empty($headings['issues']) ? 'ok' : 'warn' }}">
          {{ empty($headings['issues']) ? 'Correct' : count($headings['issues']) . ' issue(s) found' }}
        </td>
      </tr>
      @php $landmarks = $checks['landmarks'] ?? []; @endphp
      <tr>
        <td>HTML lang attribute</td>
        <td class="{{ ($landmarks['has_lang'] ?? true) ? 'ok' : 'bad' }}">
          {{ ($landmarks['has_lang'] ?? true) ? 'Present' : 'Missing' }}
        </td>
      </tr>
      <tr>
        <td>&lt;main&gt; landmark</td>
        <td class="{{ ($landmarks['has_main'] ?? true) ? 'ok' : 'warn' }}">
          {{ ($landmarks['has_main'] ?? true) ? 'Present' : 'Missing' }}
        </td>
      </tr>
      @php $contrast = $checks['color_contrast'] ?? []; @endphp
      <tr>
        <td>Color Contrast</td>
        <td class="{{ ($contrast['fail'] ?? 0) == 0 ? 'ok' : (($contrast['fail'] ?? 0) <= 2 ? 'warn' : 'bad') }}">
          {{ ($contrast['fail'] ?? 0) == 0 ? 'No violations' : ($contrast['fail'] ?? 0) . ' violation(s)' }}
        </td>
      </tr>
    </table>
  @else
    <p style="font-size:11px;color:#71717a;">{{ ($a11y['status'] ?? '') === 'error' ? ($a11y['error'] ?? 'Error') : 'Not available' }}</p>
  @endif
</div>

{{-- ======================== BROKEN RESOURCES ======================== --}}
<div class="section">
  <h2>Broken Resources</h2>
  @if($br && ($br['status'] ?? '') === 'ok')
    @php $summary = $br['summary'] ?? []; @endphp
    <table class="detail-table">
      <tr>
        <td>Broken Links</td>
        <td class="{{ ($summary['broken_links_count'] ?? 0) == 0 ? 'ok' : (($summary['broken_links_count'] ?? 0) <= 10 ? 'warn' : 'bad') }}">
          {{ $summary['broken_links_count'] ?? 0 }}
          @if(isset($summary['total_links_checked'])) / {{ $summary['total_links_checked'] }} checked @endif
        </td>
      </tr>
      <tr>
        <td>Broken Images</td>
        <td class="{{ ($summary['broken_images_count'] ?? 0) == 0 ? 'ok' : 'bad' }}">
          {{ $summary['broken_images_count'] ?? 0 }}
          @if(isset($summary['total_images_checked'])) / {{ $summary['total_images_checked'] }} checked @endif
        </td>
      </tr>
    </table>
  @else
    <p style="font-size:11px;color:#71717a;">{{ ($br['status'] ?? '') === 'error' ? ($br['error'] ?? 'Error') : 'Not available' }}</p>
  @endif
</div>

{{-- ======================== MARKETING TRACKING ======================== --}}
<div class="section">
  <h2>Marketing &amp; Tracking</h2>
  @if($trk && ($trk['status'] ?? '') === 'ok')
    @php $scripts = $trk['tracking_scripts'] ?? []; @endphp
    <table class="detail-table">
      @foreach(['ga4' => 'Google Analytics 4', 'google_tag_manager' => 'Google Tag Manager', 'facebook_pixel' => 'Facebook Pixel', 'google_ads' => 'Google Ads', 'hotjar' => 'Hotjar', 'tiktok_pixel' => 'TikTok Pixel'] as $key => $label)
        @if(isset($scripts[$key]))
          <tr>
            <td>{{ $label }}</td>
            <td class="{{ ($scripts[$key]['detected'] ?? false) ? 'ok' : 'warn' }}">
              {{ ($scripts[$key]['detected'] ?? false) ? 'Detected' : 'Not Found' }}
            </td>
          </tr>
        @endif
      @endforeach
    </table>
  @else
    <p style="font-size:11px;color:#71717a;">{{ ($trk['status'] ?? '') === 'error' ? ($trk['error'] ?? 'Error') : 'Not available' }}</p>
  @endif
</div>

{{-- ======================== CATALOG ======================== --}}
@if($cat && ($cat['status'] ?? '') === 'ok' && ($cat['products_audited'] ?? 0) > 0)
<div class="section">
  <h2>E-commerce Catalog</h2>
  <table class="detail-table">
    <tr>
      <td>Products Audited</td>
      <td>{{ $cat['products_audited'] ?? 0 }}</td>
    </tr>
    <tr>
      <td>Broken / Incomplete Products</td>
      <td class="{{ ($cat['broken_percentage'] ?? 0) == 0 ? 'ok' : (($cat['broken_percentage'] ?? 0) <= 10 ? 'warn' : 'bad') }}">
        {{ $cat['broken_percentage'] ?? 0 }}%
      </td>
    </tr>
  </table>
</div>
@endif

{{-- ======================== DEDUCTIONS ======================== --}}
@if(!empty($deductions))
<div class="deductions">
  <h2>Score Deductions</h2>
  @foreach($deductions as $d)
    <div class="deduction-item">{{ $d }}</div>
  @endforeach
</div>
@else
<div class="deductions">
  <h2>Score Deductions</h2>
  <p class="no-issues">No issues found — perfect score!</p>
</div>
@endif

<div class="footer">
  <p>Generated by <a href="https://4utest.io">4uTest</a> &mdash; Automated website auditing &mdash; {{ now()->format('Y') }}</p>
  <p style="margin-top:4px;">View the full interactive report at: <a href="{{ $reportUrl }}">{{ $reportUrl }}</a></p>
</div>

</body>
</html>
