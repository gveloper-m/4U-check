<?php

namespace App\Console\Commands;

use App\Mail\RenewalReminderMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Laravel\Cashier\Subscription;

class SendRenewalReminders extends Command
{
    protected $signature   = 'emails:renewal-reminders';
    protected $description = 'Send renewal reminder emails to users whose subscription renews in 7 days';

    public function handle(): void
    {
        $targetDay   = now()->addDays(7)->day;
        $targetMonth = now()->addDays(7)->month;
        $targetDate  = now()->addDays(7)->format('d M Y');

        Subscription::where('stripe_status', 'active')
            ->where('type', 'default')
            ->whereRaw('DAY(created_at) = ?', [$targetDay])
            ->with('owner')
            ->get()
            ->each(function (Subscription $sub) use ($targetDate, $targetMonth) {
                /** @var User|null $user */
                $user = $sub->owner;

                if (! $user || ! $user->notify_renewal_reminder) {
                    return;
                }

                $yearlyPriceId = config('services.stripe.yearly_price_id');
                $isYearly      = $yearlyPriceId && $sub->hasPrice($yearlyPriceId);

                // Yearly: only send when anniversary month matches
                if ($isYearly && now()->addDays(7)->month !== $sub->created_at->month) {
                    return;
                }

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
