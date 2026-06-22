<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AgencyController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'is_agency'             => ['boolean'],
            'agency_primary_color'  => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'agency_secondary_color'=> ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'agency_footer_text'    => ['nullable', 'string', 'max:255'],
            'agency_logo'           => ['nullable', 'image', 'mimetypes:image/jpeg,image/png,image/gif,image/webp', 'max:2048'],
            'remove_logo'           => ['boolean'],
        ]);

        $user = $request->user();
        $data = [
            'is_agency'              => $request->boolean('is_agency'),
            'agency_primary_color'   => $request->input('agency_primary_color'),
            'agency_secondary_color' => $request->input('agency_secondary_color'),
            'agency_footer_text'     => $request->input('agency_footer_text'),
        ];

        // Handle logo removal
        if ($request->boolean('remove_logo') && $user->agency_logo) {
            Storage::disk('public')->delete($user->agency_logo);
            $data['agency_logo'] = null;
        }

        // Handle logo upload
        if ($request->hasFile('agency_logo')) {
            if ($user->agency_logo) {
                Storage::disk('public')->delete($user->agency_logo);
            }
            $data['agency_logo'] = $request->file('agency_logo')
                ->store('agency-logos', 'public');
        }

        $user->update($data);

        return back()->with('success', 'Agency settings saved.');
    }
}
