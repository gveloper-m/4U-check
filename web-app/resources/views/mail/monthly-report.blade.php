<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1 { color: #18181b; font-size: 20px; margin: 0 0 6px; }
  p  { color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
  .stats { display: flex; gap: 12px; margin: 20px 0; flex-wrap: wrap; }
  .stat { flex: 1; min-width: 120px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; text-align: center; }
  .stat-value { font-size: 26px; font-weight: 700; color: #7c3aed; }
  .stat-label { font-size: 12px; color: #71717a; margin-top: 2px; }
  .score-pill { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 13px; font-weight: 600; }
  .score-green  { background: #dcfce7; color: #15803d; }
  .score-amber  { background: #fef3c7; color: #92400e; }
  .score-red    { background: #fee2e2; color: #b91c1c; }
  .site-row { padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 13px; color: #52525b; display: flex; justify-content: space-between; align-items: center; }
  .btn { display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 8px; }
  .footer { margin-top: 24px; font-size: 12px; color: #a1a1aa; }
</style>
</head>
<body>
<div class="card">
  <h1>Your {{ $monthLabel }} audit summary</h1>
  <p>Hi {{ $user->name }}, here's how your monitored sites performed this month.</p>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">{{ $totalScans }}</div>
      <div class="stat-label">Scans run</div>
    </div>
    <div class="stat">
      <div class="stat-value">{{ $sitesMonitored }}</div>
      <div class="stat-label">Sites monitored</div>
    </div>
    @if($avgScore !== null)
    <div class="stat">
      <div class="stat-value">{{ $avgScore }}</div>
      <div class="stat-label">Avg health score</div>
    </div>
    @endif
  </div>

  @if($bestSite || $worstSite)
  <div style="margin: 20px 0;">
    @if($bestSite)
    <div class="site-row">
      <span>&#9650; Best: <strong>{{ $bestSite['url'] }}</strong></span>
      @php $s = $bestSite['score']; @endphp
      <span class="score-pill {{ $s >= 70 ? 'score-green' : ($s >= 40 ? 'score-amber' : 'score-red') }}">{{ $s }}</span>
    </div>
    @endif
    @if($worstSite)
    <div class="site-row" style="border-bottom:none;">
      <span>&#9660; Needs work: <strong>{{ $worstSite['url'] }}</strong></span>
      @php $s = $worstSite['score']; @endphp
      <span class="score-pill {{ $s >= 70 ? 'score-green' : ($s >= 40 ? 'score-amber' : 'score-red') }}">{{ $s }}</span>
    </div>
    @endif
  </div>
  @endif

  @if($totalScans === 0)
  <p>No scans were run this month. Set up a scheduled scan to automatically monitor your sites.</p>
  @endif

  <a href="{{ $dashboardUrl }}" class="btn" style="display:inline-block;background:#7c3aed;color:#ffffff !important;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
    View Dashboard
  </a>

  <div class="footer">
    <p>4uTest &mdash; Automated website auditing</p>
    <p>You received this because monthly report emails are enabled. <a href="{{ config('app.url') }}/profile" style="color:#7c3aed;">Update preferences</a></p>
  </div>
</div>
</body>
</html>
