<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            'name'         => 'required|string|max:255',
            'email'        => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password'     => ['required', 'confirmed', Rules\Password::defaults()],
            'phone'        => 'nullable|string|max:30',
            'company_name' => 'nullable|string|max:255',
            'company_site' => 'nullable|url|max:255',
        ]);

        $user = User::create([
            'name'         => $request->name,
            'email'        => $request->email,
            'password'     => Hash::make($request->password),
            'phone'        => $request->phone,
            'company_name' => $request->company_name,
            'company_site' => $request->company_site,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('billing', absolute: false));
    }
}
