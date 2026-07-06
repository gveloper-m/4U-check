<?php

namespace App\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['error' => 'API key required. Pass it as a Bearer token.'], 401);
        }

        $hash   = hash('sha256', $token);
        $apiKey = ApiKey::where('key_hash', $hash)->with('user')->first();

        if (! $apiKey) {
            return response()->json(['error' => 'Invalid API key.'], 401);
        }

        if ($apiKey->expires_at && $apiKey->expires_at->isPast()) {
            return response()->json(['error' => 'API key expired.'], 401);
        }

        $user = $apiKey->user;

        if (! $user->hasActiveSubscription()) {
            return response()->json(['error' => 'Active subscription required to use the API.'], 403);
        }

        $apiKey->update(['last_used_at' => now()]);

        Auth::login($user);

        return $next($request);
    }
}
