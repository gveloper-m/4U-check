<?php

namespace App\Console\Commands;

use App\Mail\RenewalReminderMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Laravel\Paddle\Subscription;

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
            ->whereNotNull('next_billed_at')
            ->whereBetween('next_billed_at', [$windowStart, $windowEnd])
            ->with('billable')
            ->get()
            ->each(function (Subscription $sub) use ($targetDate) {
                /** @var User|null $user */
                $user = $sub->billable;

                if (! $user instanceof User || ! $user->notify_renewal_reminder) {
                    return;
                }

                $yearlyPriceId = env('PADDLE_YEARLY_PRICE_ID');
                $item          = $sub->items()->first();
                $isYearly      = $yearlyPriceId && $item?->price_id === $yearlyPriceId;

                $plan   = $isYearly ? 'Pro Yearly — €99.99/year' : 'Pro Monthly — €9.99/month';
                $amount = $isYearly ? '€99.99' : '€9.99';

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
