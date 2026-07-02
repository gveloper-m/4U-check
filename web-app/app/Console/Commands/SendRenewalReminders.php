<?php

namespace App\Console\Commands;

use App\Mail\RenewalReminderMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use LemonSqueezy\Laravel\Subscription;

class SendRenewalReminders extends Command
{
    protected $signature   = 'emails:renewal-reminders';
    protected $description = 'Send renewal reminder emails to users whose subscription renews in 7 days';

    public function handle(): void
    {
        $targetDate  = now()->addDays(7)->format('d M Y');
        $windowStart = now()->addDays(7)->startOfDay();
        $windowEnd   = now()->addDays(7)->endOfDay();

        Subscription::where('status', 'active')
            ->whereBetween('renews_at', [$windowStart, $windowEnd])
            ->with('billable')
            ->get()
            ->each(function (Subscription $sub) use ($targetDate) {
                /** @var User|null $user */
                $user = $sub->billable;

                if (! $user instanceof User || ! $user->notify_renewal_reminder) {
                    return;
                }

                $yearlyVariantId = config('lemon-squeezy.yearly_variant_id');
                $isYearly        = $yearlyVariantId && $sub->variant_id === (string) $yearlyVariantId;

                $plan   = $isYearly ? 'Pro Yearly — €199.99/year' : 'Pro Monthly — €19.99/month';
                $amount = $isYearly ? '€199.99' : '€19.99';

                Mail::to($user->email)->queue(new RenewalReminderMail(
                    user:        $user,
                    plan:        $plan,
                    renewalDate: $targetDate,
                    amount:      $amount,
                    billingUrl:  config('app.url') . '/billing',
                ));
            });

        $this->info('Renewal reminder emails queued.');
    }
}
