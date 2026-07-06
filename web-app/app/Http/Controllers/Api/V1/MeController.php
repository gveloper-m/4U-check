<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'           => $user->id,
            'name'         => $user->name,
            'email'        => $user->email,
            'company_name' => $user->company_name,
            'plan'         => [
                'active'          => $user->hasActiveSubscription(),
                'is_unlimited'    => $user->is_unlimited,
                'on_trial'        => $user->onCodeTrial(),
                'trial_days_left' => $user->trialDaysLeft(),
            ],
            'usage'        => [
                'scans_this_month' => $user->scansThisMonth(),
                'monthly_limit'    => $user->monthlyLimit(),
                'remaining'        => $user->remainingScans(),
            ],
        ]);
    }
}
