<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ApiKeyController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->validate(['name' => ['required', 'string', 'max:60']]);

        $user = $request->user();

        if ($user->apiKeys()->count() >= 5) {
            return back()->withErrors(['name' => 'Maximum 5 API keys allowed. Revoke one first.']);
        }

        ['raw' => $raw, 'hash' => $hash, 'prefix' => $prefix] = ApiKey::generate();

        $user->apiKeys()->create([
            'name'       => $request->name,
            'key_hash'   => $hash,
            'key_prefix' => $prefix,
        ]);

        return back()->with('new_api_key', $raw);
    }

    public function destroy(Request $request, ApiKey $apiKey): RedirectResponse
    {
        abort_unless($apiKey->user_id === $request->user()->id, 403);
        $apiKey->delete();

        return back();
    }
}
