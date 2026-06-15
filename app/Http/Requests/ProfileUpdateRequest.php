<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'email'        => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'phone'        => ['nullable', 'string', 'max:30'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'company_site' => ['nullable', 'url', 'max:255'],
            'language'     => ['nullable', 'string', 'in:en,el,de,fr,es,nl,cs'],
        ];
    }
}
