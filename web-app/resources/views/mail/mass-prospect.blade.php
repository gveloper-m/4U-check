<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body  { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .card { background: #fff; border-radius: 8px; max-width: 580px; margin: 0 auto; padding: 36px 40px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1   { color: #18181b; font-size: 20px; margin: 0 0 16px; }
  p    { color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 14px; }
  .score-box { background: #faf5ff; border: 2px solid #7c3aed; border-radius: 10px; padding: 18px 22px; margin: 20px 0; }
  .score-box .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #7c3aed; margin: 0 0 6px; }
  .score-num { font-size: 48px; font-weight: 800; color: #7c3aed; line-height: 1; }
  .score-num span { font-size: 22px; font-weight: 400; color: #a78bfa; }
  .score-bar-bg  { background: #e5e7eb; border-radius: 999px; height: 8px; margin-top: 12px; }
  .score-bar-fill{ background: #7c3aed; border-radius: 999px; height: 8px; }
  .issues-box { background: #fefce8; border-left: 4px solid #eab308; border-radius: 6px; padding: 14px 18px; margin: 20px 0; }
  .issues-box h3 { font-size: 13px; font-weight: 700; color: #713f12; margin: 0 0 10px; }
  .issues-box ul { margin: 0; padding-left: 18px; }
  .issues-box li { font-size: 13px; color: #78350f; margin-bottom: 5px; }
  .report-link { display: inline-block; margin: 18px 0 0; background: #7c3aed; color: #fff; padding: 12px 26px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 700; }
  .features { margin: 24px 0 0; }
  .features h3 { font-size: 13px; font-weight: 700; color: #18181b; margin: 0 0 10px; }
  .features ul { margin: 0; padding-left: 20px; }
  .features li { font-size: 13px; color: #52525b; margin-bottom: 5px; }
  .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
  .footer  { font-size: 11px; color: #a1a1aa; line-height: 1.6; }
  .brand   { display: flex; align-items: center; gap: 8px; margin-bottom: 22px; }
  .brand-dot { width: 28px; height: 28px; background: #7c3aed; border-radius: 6px; display: inline-block; }
  .brand-name { font-size: 15px; font-weight: 700; color: #18181b; }
</style>
</head>
<body>
<div class="card">

  <div class="brand">
    <span class="brand-dot"></span>
    <span class="brand-name">4uTest</span>
  </div>

  <p>{{ $greeting }}</p>
  <p>{!! $intro !!}</p>

  {{-- Score --}}
  <div class="score-box">
    <p class="label">{{ $scoreLabel }}</p>
    <div class="score-num">{{ $score }}<span>/100</span></div>
    <div class="score-bar-bg">
      <div class="score-bar-fill" style="width: {{ $score }}%;"></div>
    </div>
  </div>

  {{-- Top issues --}}
  @if(!empty($issues))
  <div class="issues-box">
    <h3>{{ $issuesTitle }}</h3>
    <ul>
      @foreach($issues as $issue)
      <li>{{ $issue }}</li>
      @endforeach
    </ul>
  </div>
  @endif

  {{-- Report link --}}
  <p>{{ $reportLabel }}:</p>
  <a href="{{ $shareUrl }}" class="report-link">View Report →</a>

  <hr class="divider">

  {{-- Features --}}
  <div class="features">
    <h3>{{ $featuresTitle }}:</h3>
    <ul>
      @foreach($features as $feature)
      <li>{{ $feature }}</li>
      @endforeach
    </ul>
  </div>

  <hr class="divider">

  <a href="{{ $appUrl }}/register" class="report-link" style="background:#18181b;">{{ $ctaText }}</a>

  <hr class="divider">

  <p class="footer">{{ $footer }}</p>
  <p class="footer" style="margin-top:8px;">4uTest · <a href="{{ $appUrl }}" style="color:#7c3aed;">4utest.io</a></p>

</div>
</body>
</html>
