<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TrialCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class TrialCodeController extends Controller
{
    public function index(): InertiaResponse
    {
        $codes = TrialCode::with(['usedBy:id,name,email', 'createdBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($c) => [
                'id'         => $c->id,
                'code'       => $c->code,
                'note'       => $c->note,
                'created_by' => $c->createdBy?->name,
                'used_by'    => $c->usedBy ? ['id' => $c->usedBy->id, 'name' => $c->usedBy->name, 'email' => $c->usedBy->email] : null,
                'used_at'    => $c->used_at?->toISOString(),
                'expires_at' => $c->expires_at?->toISOString(),
                'site_url'   => $c->site_url,
                'created_at' => $c->created_at->toISOString(),
                'is_used'    => $c->isUsed(),
                'is_active'  => $c->isActive(),
            ]);

        return Inertia::render('Admin/TrialCodes/Index', ['codes' => $codes]);
    }

    public function store(Request $request): RedirectResponse
    {
        $code = strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));

        while (TrialCode::where('code', $code)->exists()) {
            $code = strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        }

        TrialCode::create([
            'code'       => $code,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', "Trial code generated: {$code}");
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
}
