<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{ $emailSubject }}</title>
<style>
  body { margin:0; padding:0; background:#0f172a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .wrap { max-width:600px; margin:40px auto; background:#1e293b; border-radius:12px; overflow:hidden; }
  .header { background:linear-gradient(135deg,#7c3aed,#5b21b6); padding:32px 40px; }
  .header h1 { margin:0; color:#fff; font-size:20px; font-weight:700; }
  .header p  { margin:4px 0 0; color:#c4b5fd; font-size:13px; }
  .body { padding:32px 40px; color:#e2e8f0; }
  .greeting { font-size:16px; margin-bottom:20px; color:#f1f5f9; }
  .message { font-size:15px; line-height:1.7; color:#cbd5e1; white-space:pre-line; }
  .footer { padding:24px 40px; border-top:1px solid #334155; font-size:12px; color:#64748b; }
  .footer a { color:#7c3aed; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>{{ config('app.name') }}</h1>
    <p>Message from the team</p>
  </div>
  <div class="body">
    <p class="greeting">Hi {{ $recipient->name }},</p>
    <div class="message">{{ $emailBody }}</div>
  </div>
  <div class="footer">
    This message was sent by an administrator of <a href="{{ config('app.url') }}">{{ config('app.name') }}</a>.
    If you have questions, reply to this email or open a support ticket.
  </div>
</div>
</body>
</html>
