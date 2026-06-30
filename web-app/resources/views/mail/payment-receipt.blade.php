<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1 { color: #18181b; font-size: 20px; margin: 0 0 8px; }
  p  { color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
  .amount { font-size: 32px; font-weight: 700; color: #18181b; margin: 16px 0 4px; }
  .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .table td { padding: 10px 0; font-size: 14px; color: #52525b; border-bottom: 1px solid #f4f4f5; }
  .table td:last-child { text-align: right; color: #18181b; font-weight: 500; }
  .btn { display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; }
  .badge { display: inline-block; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 99px; margin-bottom: 16px; }
  .footer { margin-top: 24px; font-size: 12px; color: #a1a1aa; }
</style>
</head>
<body>
<div class="card">
  <h1>Payment confirmed</h1>
  <span class="badge">&#10003; Paid</span>

  <div class="amount">{{ $currency }} {{ $amount }}</div>
  <p style="margin-top:0;color:#71717a;font-size:13px;">{{ $invoiceDate }}</p>

  <table class="table">
    <tr><td>Invoice number</td><td>{{ $invoiceNumber }}</td></tr>
    <tr><td>Description</td><td>{{ $description }}</td></tr>
    <tr><td>Amount paid</td><td>{{ $currency }} {{ $amount }}</td></tr>
  </table>

  @if($invoicePdfUrl)
  <a href="{{ $invoicePdfUrl }}" class="btn" style="display:inline-block;background:#7c3aed;color:#ffffff !important;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
    Download Invoice PDF
  </a>
  @endif

  <div class="footer">
    <p>4uTest &mdash; Automated website auditing</p>
    <p>You received this because you have a payment notification enabled on your account.</p>
  </div>
</div>
</body>
</html>
