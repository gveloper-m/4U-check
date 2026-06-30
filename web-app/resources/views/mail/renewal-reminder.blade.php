<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1 { color: #18181b; font-size: 20px; margin: 0 0 8px; }
  p  { color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
  .box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
  .box-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; }
  .box-row span:first-child { color: #71717a; }
  .box-row span:last-child { color: #18181b; font-weight: 600; }
  .btn { display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; }
  .footer { margin-top: 24px; font-size: 12px; color: #a1a1aa; }
</style>
</head>
<body>
<div class="card">
  <h1>Your subscription renews in 7 days</h1>
  <p>Hi {{ $user->name }}, just a heads-up — your 4uTest subscription will automatically renew on <strong>{{ $renewalDate }}</strong>.</p>

  <div class="box">
    <div class="box-row"><span>Plan</span><span>{{ $plan }}</span></div>
    <div class="box-row"><span>Renewal date</span><span>{{ $renewalDate }}</span></div>
    <div class="box-row"><span>Amount</span><span>{{ $amount }}</span></div>
  </div>

  <p>No action needed if you want to continue — your subscription will renew automatically. If you'd like to update your payment method, change your plan, or cancel, you can do that from the billing page.</p>

  <a href="{{ $billingUrl }}" class="btn" style="display:inline-block;background:#7c3aed;color:#ffffff !important;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
    Manage Subscription
  </a>

  <div class="footer">
    <p>4uTest &mdash; Automated website auditing</p>
    <p>You received this because renewal reminders are enabled. <a href="{{ config('app.url') }}/profile" style="color:#7c3aed;">Update preferences</a></p>
  </div>
</div>
</body>
</html>
