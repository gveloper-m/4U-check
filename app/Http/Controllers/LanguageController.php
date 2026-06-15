<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LanguageController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'lang' => ['required', 'string', 'in:en,el,de,fr,es,nl,cs'],
        ]);

        $request->user()->update(['language' => $request->lang]);

        return back();
    }
}
