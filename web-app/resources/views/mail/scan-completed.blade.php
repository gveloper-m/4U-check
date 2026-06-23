<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1 { color: #18181b; font-size: 20px; margin: 0 0 8px; }
  p  { color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
  .score { display: inline-block; background: #7c3aed; color: #fff; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; text-align: center; font-size: 22px; font-weight: bold; margin: 16px 0; }
  .btn { display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; }
  .footer { margin-top: 24px; font-size: 12px; color: #a1a1aa; }
</style>
</head>
<body>
<div class="card">
  <h1>Your scheduled scan is complete</h1>
  <p><strong>{{ $scan->name }}</strong> finished scanning <strong>{{ $scan->site_url }}</strong>.</p>
  @if($score !== null)
  <p>Health score:</p>
  <div class="score">{{ $score }}</div>
  @endif
  <br>
  <a href="{{ $reportUrl }}" class="btn" style="display:inline-block;background:#7c3aed;color:#ffffff !important;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">View Full Report</a>
  <div class="footer">
    <p>4utest &mdash; Automated website auditing</p>
    <p>You received this because email notifications are enabled for this scheduled scan.</p>
  </div>
</div>
</body>
</html>
