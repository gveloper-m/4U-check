<?php

namespace App\Http\Controllers;

use App\Models\CookieConsent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CookieConsentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $version = $request->input('version', '1.0');

        CookieConsent::create([
            'user_id'     => auth()->id(),
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'version'     => $version,
            'accepted_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }
}
