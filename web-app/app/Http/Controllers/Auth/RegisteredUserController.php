<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\FullAuditReport;
use App\Models\TrialCode;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password'              => ['required', 'confirmed', Rules\Password::defaults()],
            'phone'                 => 'nullable|string|max:30|unique:users,phone',
            'company_name'          => 'nullable|string|max:255',
            'primary_site'          => 'required|url|max:255',
            'trial_code'            => 'nullable|string|max:32',
            'is_agency'             => 'boolean',
            'agency_primary_color'  => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'agency_secondary_color'=> ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        // Validate trial code before creating the user
        $trialCode = null;
        if ($request->filled('trial_code')) {
            $trialCode = TrialCode::where('code', strtoupper(trim($request->trial_code)))
                ->whereNull('used_by')
                ->first();
            if (! $trialCode) {
                throw ValidationException::withMessages([
                    'trial_code' => 'This trial code is invalid or has already been used.',
                ]);
            }
        }

        $user = User::create([
            'name'                  => $request->name,
            'email'                 => $request->email,
            'password'              => Hash::make($request->password),
            'phone'                 => $request->phone,
            'company_name'          => $request->company_name,
            'company_site'          => $request->primary_site,
            'is_agency'             => $request->boolean('is_agency'),
            'agency_primary_color'  => $request->input('agency_primary_color'),
            'agency_secondary_color'=> $request->input('agency_secondary_color'),
        ]);

        $user->monitoredSites()->create([
            'url'        => $request->primary_site,
            'is_primary' => true,
            'label'      => null,
        ]);

        if ($trialCode) {
            $trialCode->update([
                'used_by'    => $user->id,
                'used_at'    => now(),
                'expires_at' => now()->addDays(7),
                'site_url'   => $request->primary_site,
            ]);
            $user->forceFill(['trial_ends_at' => now()->addDays(7)])->save();
        }

        // Claim the guest scan if this browser has one
        $claimedReportId = null;
        $guestToken = $request->cookie('guest_scan_token');
        if ($guestToken) {
            $claimed = DB::table('full_audit_reports')
                ->whereNull('user_id')
                ->where('guest_token', $guestToken)
                ->select('id')
                ->first();

            if ($claimed) {
                DB::table('full_audit_reports')
                    ->where('id', $claimed->id)
                    ->update(['user_id' => $user->id, 'updated_at' => now()]);
                $claimedReportId = $claimed->id;
            }
        }

        event(new Registered($user));

        Auth::login($user);

        if ($claimedReportId) {
            return redirect()->route('audits.show', $claimedReportId);
        }

        return redirect(route('billing', absolute: false));
    }
}
