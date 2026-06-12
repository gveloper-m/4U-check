<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Full Audit Report &mdash; {{ $report->site_url }}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }

  .cover { padding: 60px 50px; background: #1a1a2e; color: #fff; min-height: 200px; }
  .cover h1 { font-size: 26px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
  .cover .url { font-size: 13px; color: #a0aec0; word-break: break-all; margin-bottom: 20px; }
  .cover .meta { font-size: 10px; color: #718096; }

  .score-badge { display: inline-block; padding: 6px 18px; border-radius: 30px; font-size: 20px;
                 font-weight: 700; color: #fff; margin-top: 14px; }
  .score-green  { background: #38a169; }
  .score-yellow { background: #d69e2e; }
  .score-red    { background: #e53e3e; }

  .section { margin: 24px 30px; page-break-inside: avoid; }
  .section-header { background: #2d3748; color: #fff; padding: 8px 14px; border-radius: 6px 6px 0 0;
                    font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
  .section-body { border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; padding: 14px; }

  .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; }
  .pill-green  { background: #c6f6d5; color: #276749; }
  .pill-red    { background: #fed7d7; color: #9b2c2c; }
  .pill-yellow { background: #fefcbf; color: #744210; }
  .pill-gray   { background: #e2e8f0; color: #4a5568; }

  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { padding: 5px 8px; border: 1px solid #e2e8f0; font-size: 10px; text-align: left; }
  th { background: #f7fafc; font-weight: 700; }
  tr:nth-child(even) { background: #f7fafc; }

  .deductions { margin-top: 6px; }
  .deduction-item { padding: 3px 0; border-bottom: 1px dashed #e2e8f0; font-size: 10px; color: #e53e3e; }

  .footer { margin: 30px; font-size: 9px; color: #a0aec0; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  <h1>4uTest Full Audit Report</h1>
  @if($report->name)
    <div class="url" style="color:#fff; font-size:15px;">{{ $report->name }}</div>
  @endif
  <div class="url">{{ $report->site_url }}</div>
  <div class="meta">Generated: {{ $report->created_at?->format('d M Y H:i') }}</div>
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
    <div class="deductions">
      @foreach($report->score_deductions as $ded)
        <div class="deduction-item">&#8722; {{ $ded }}</div>
      @endforeach
    </div>
  </div>
</div>
@endif

<!-- SEO & Schema -->
@if($report->seo_schema_result)
<div class="section">
  <div class="section-header">SEO &amp; Schema</div>
  <div class="section-body">
    <table>
      <tr><th>Check</th><th>Status</th><th>Details</th></tr>
      @php $seo = $report->seo_schema_result; @endphp
      <tr>
        <td>Meta Title</td>
        <td><span class="pill {{ ($seo['meta_title']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-red' }}">{{ $seo['meta_title']['status'] ?? '-' }}</span></td>
        <td>{{ $seo['meta_title']['value'] ?? '' }}</td>
      </tr>
      <tr>
        <td>Meta Description</td>
        <td><span class="pill {{ ($seo['meta_description']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-red' }}">{{ $seo['meta_description']['status'] ?? '-' }}</span></td>
        <td>Length: {{ $seo['meta_description']['length'] ?? '-' }}</td>
      </tr>
      <tr>
        <td>H1 Tags</td>
        <td><span class="pill {{ ($seo['h1_tags']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-yellow' }}">{{ $seo['h1_tags']['status'] ?? '-' }}</span></td>
        <td>Count: {{ $seo['h1_tags']['count'] ?? '-' }}</td>
      </tr>
      <tr>
        <td>Canonical</td>
        <td><span class="pill {{ ($seo['canonical']['status'] ?? '') === 'OK' ? 'pill-green' : 'pill-yellow' }}">{{ $seo['canonical']['status'] ?? '-' }}</span></td>
        <td>{{ $seo['canonical']['url'] ?? 'Not set' }}</td>
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
    </table>
  </div>
</div>
@endif

<!-- Security -->
@if($report->security_result)
<div class="section">
  <div class="section-header">Security &amp; Infrastructure</div>
  <div class="section-body">
    @php $sec = $report->security_result; @endphp
    <table>
      <tr><th>Check</th><th>Status</th><th>Details</th></tr>
      <tr>
        <td>SSL Certificate</td>
        <td><span class="pill {{ ($sec['ssl']['ssl_valid'] ?? false) ? 'pill-green' : 'pill-red' }}">{{ ($sec['ssl']['ssl_valid'] ?? false) ? 'Valid' : 'Invalid' }}</span></td>
        <td>Expires in: {{ $sec['ssl']['ssl_days_left'] ?? '-' }} days</td>
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
        <td><span class="pill pill-gray">Score: {{ $sec['security_headers']['score'] ?? '-' }}/6</span></td>
        <td></td>
      </tr>
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
<div class="section">
  <div class="section-header">Performance</div>
  <div class="section-body">
    @php $perf = $report->performance_result; @endphp
    <table>
      <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
      <tr>
        <td>TTFB</td>
        <td>{{ $perf['metrics']['ttfb_ms'] ?? '-' }} ms</td>
        <td>
          @php $ttfb = $perf['metrics']['ttfb_ms'] ?? null; @endphp
          @if($ttfb !== null)
            <span class="pill {{ $ttfb <= 400 ? 'pill-green' : ($ttfb <= 800 ? 'pill-yellow' : 'pill-red') }}">
              {{ $ttfb <= 400 ? 'Good' : ($ttfb <= 800 ? 'Needs Improvement' : 'Poor') }}
            </span>
          @endif
        </td>
      </tr>
      <tr>
        <td>LCP (Desktop)</td>
        <td>{{ $perf['metrics']['desktop']['lcp_ms'] ?? '-' }} ms</td>
        <td>
          @php $lcp = $perf['metrics']['desktop']['lcp_ms'] ?? null; @endphp
          @if($lcp !== null)
            <span class="pill {{ $lcp <= 2500 ? 'pill-green' : ($lcp <= 4000 ? 'pill-yellow' : 'pill-red') }}">
              {{ $lcp <= 2500 ? 'Good' : ($lcp <= 4000 ? 'Needs Improvement' : 'Poor') }}
            </span>
          @endif
        </td>
      </tr>
      <tr>
        <td>Compression</td>
        <td colspan="2">
          <span class="pill {{ ($perf['page_analysis']['compression_enabled'] ?? false) ? 'pill-green' : 'pill-red' }}">
            {{ ($perf['page_analysis']['compression_enabled'] ?? false) ? 'Enabled' : 'Disabled' }}
          </span>
        </td>
      </tr>
    </table>
  </div>
</div>
@endif

<!-- Broken Resources -->
@if($report->broken_resources_result)
<div class="section">
  <div class="section-header">Broken Resources</div>
  <div class="section-body">
    @php $br = $report->broken_resources_result; @endphp
    <table>
      <tr><th>Resource Type</th><th>Total Checked</th><th>Broken</th><th>Percentage</th></tr>
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
@endif

<!-- Tracking -->
@if($report->tracking_result)
<div class="section">
  <div class="section-header">Marketing &amp; Tracking</div>
  <div class="section-body">
    @php $trk = $report->tracking_result; @endphp
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

<!-- Catalog -->
@if($report->catalog_result)
<div class="section">
  <div class="section-header">E-Commerce Catalog Integrity</div>
  <div class="section-body">
    @php $cat = $report->catalog_result; @endphp
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Products Audited</td><td>{{ $cat['products_audited'] ?? 0 }}</td></tr>
      <tr><td>Broken Products</td><td>{{ $cat['broken_products_count'] ?? 0 }}</td></tr>
      <tr><td>Broken Percentage</td><td>{{ $cat['broken_percentage'] ?? 0 }}%</td></tr>
    </table>
  </div>
</div>
@endif

<div class="footer">
  Generated by 4uTest &mdash; {{ now()->format('d M Y H:i') }}
</div>
</body>
</html>
