<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1 { color: #18181b; font-size: 20px; margin: 0 0 4px; }
  .subject { color: #7c3aed; font-size: 14px; margin: 0 0 20px; }
  .meta { color: #71717a; font-size: 12px; margin: 0 0 16px; }
  .message-body { background: #f9f9fb; border-left: 3px solid #7c3aed; border-radius: 4px; padding: 16px; color: #18181b; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
  .btn { display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 20px; }
  .footer { margin-top: 24px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 16px; }
</style>
</head>
<body>
<div class="card">
  <h1>You have a new reply</h1>
  <p class="subject">{{ $ticket->subject }}</p>
  <p class="meta">Ticket #{{ $ticket->id }} &mdash; Support Team replied:</p>
  <div class="message-body">{{ $message->body }}</div>
  <a href="{{ $ticketUrl }}" class="btn" style="display:inline-block;background:#7c3aed;color:#ffffff !important;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;margin-top:20px;">View Full Conversation</a>
  <div class="footer">
    <p>4utest &mdash; Automated website auditing</p>
    <p>You received this email because you have an open support ticket.</p>
  </div>
</div>
</body>
</html>
