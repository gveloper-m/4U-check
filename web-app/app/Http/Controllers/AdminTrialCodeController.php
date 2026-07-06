<?php

namespace App\Http\Controllers;

use App\Models\TrialCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AdminTrialCodeController extends Controller
{
    public function index(): InertiaResponse
    {
        $codes = TrialCode::with(['usedBy:id,name,email', 'createdBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($c) => [
                'id'           => $c->id,
                'code'         => $c->code,
                'note'         => $c->note,
                'created_by'   => $c->createdBy?->name,
                'used_by'      => $c->usedBy ? ['id' => $c->usedBy->id, 'name' => $c->usedBy->name, 'email' => $c->usedBy->email] : null,
                'used_at'      => $c->used_at?->toISOString(),
                'expires_at'   => $c->expires_at?->toISOString(),
                'active_until' => $c->active_until?->toISOString(),
                'premium_days' => $c->premium_days ?? 7,
                'max_uses'     => $c->max_uses,        // null = single-use
                'use_count'    => $c->use_count ?? 0,
                'site_url'     => $c->site_url,
                'created_at'   => $c->created_at->toISOString(),
                'is_used'      => $c->isUsed(),
                'is_fully_used'=> $c->isFullyUsed(),
                'is_redeemable'=> $c->isRedeemable(),
                'is_expired'   => $c->isDateExpired(),
            ]);

        return Inertia::render('Admin/TrialCodes/Index', ['codes' => $codes]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code'         => 'nullable|string|max:64|unique:trial_codes,code',
            'note'         => 'nullable|string|max:500',
            'max_uses'     => 'nullable|integer|min:2|max:9999',
            'active_until' => 'nullable|date|after:now',
            'premium_days' => 'required|integer|min:1|max:3650',
        ]);

        $code = isset($validated['code']) && $validated['code'] !== ''
            ? strtoupper(trim($validated['code']))
            : $this->generateUniqueCode();

        if (TrialCode::where('code', $code)->exists()) {
            return back()->withErrors(['code' => 'This code already exists.'])->withInput();
        }

        TrialCode::create([
            'code'         => $code,
            'note'         => $validated['note'] ?? null,
            'max_uses'     => $validated['max_uses'] ?? null,
            'active_until' => $validated['active_until'] ?? null,
            'premium_days' => $validated['premium_days'],
            'created_by'   => $request->user()->id,
            'use_count'    => 0,
        ]);

        return back()->with('success', "Trial code created: {$code}");
    }

    public function updateNote(Request $request, TrialCode $trialCode): RedirectResponse
    {
        $validated = $request->validate(['note' => 'nullable|string|max:500']);
        $trialCode->update(['note' => $validated['note'] ?? null]);
        return back();
    }

    public function destroy(TrialCode $trialCode): RedirectResponse
    {
        abort_if($trialCode->isUsed(), 422, 'Cannot delete a code that has already been used.');
        $trialCode->delete();
        return back()->with('success', 'Code deleted.');
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        } while (TrialCode::where('code', $code)->exists());

        return $code;
    }
}
