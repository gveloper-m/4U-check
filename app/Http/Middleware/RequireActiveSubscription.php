<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class RequireActiveSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasActiveSubscription()) {
            if ($request->inertia()) {
                return Inertia::location(route('billing'));
            }

            return redirect()->route('billing')->with('message', 'Subscription required');
        }

        return $next($request);
    }
}
