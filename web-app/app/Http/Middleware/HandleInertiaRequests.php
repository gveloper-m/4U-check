<?php

namespace App\Http\Middleware;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user?->only([
                    'id',
                    'name',
                    'email',
                    'email_verified_at',
                    'is_unlimited',
                    'is_admin',
                    'phone',
                    'company_name',
                    'company_site',
                    'language',
                    'is_agency',
                    'agency_logo',
                    'agency_primary_color',
                    'agency_secondary_color',
                    'agency_footer_text',
                    'free_scan_used',
                ]),
                'openTicketsCount' => $user?->is_admin
                    ? Ticket::whereIn('status', ['open', 'in_progress'])->count()
                    : null,
            ],
        ];
    }
}
