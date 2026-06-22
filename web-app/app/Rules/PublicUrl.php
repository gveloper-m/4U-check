<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PublicUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $parsed = parse_url((string) $value);

        if (! $parsed || empty($parsed['host'])) {
            $fail('The :attribute must be a valid URL.');
            return;
        }

        $scheme = strtolower($parsed['scheme'] ?? '');
        if (! in_array($scheme, ['http', 'https'], true)) {
            $fail('The :attribute must use http or https.');
            return;
        }

        $host = $parsed['host'];

        // Reject raw IP addresses that are private/reserved
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            if (! filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                $fail('The :attribute must not point to a private or reserved IP address.');
                return;
            }
        }

        // Resolve hostname to IP and check the resolved address
        $ip = gethostbyname($host);
        if ($ip === $host) {
            // gethostbyname returns the input unchanged when it can't resolve
            $fail('The :attribute hostname could not be resolved.');
            return;
        }

        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            $fail('The :attribute must resolve to a public IP address.');
        }
    }
}
