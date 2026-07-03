<?php

namespace App\Listeners;

use Illuminate\Support\Facades\DB;
use Laravel\Paddle\Events\SubscriptionUpdated;

class HandlePaddleSubscriptionUpdated
{
    public function handle(SubscriptionUpdated $event): void
    {
        $payload      = $event->payload;
        $nextBilledAt = $payload['data']['next_billed_at'] ?? null;

        if (! $nextBilledAt) {
            return;
        }

        DB::table('subscriptions')
            ->where('paddle_id', $payload['data']['id'])
            ->update(['next_billed_at' => $nextBilledAt]);
    }
}
