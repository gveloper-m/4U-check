<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Lemon Squeezy API Key
    |--------------------------------------------------------------------------
    | Found in: app.lemonsqueezy.com → Settings → API
    */
    'api_key' => env('LEMON_SQUEEZY_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Lemon Squeezy Store ID
    |--------------------------------------------------------------------------
    | Numeric store ID from your LS dashboard URL.
    */
    'store' => env('LEMON_SQUEEZY_STORE'),

    /*
    |--------------------------------------------------------------------------
    | Webhook Signing Secret
    |--------------------------------------------------------------------------
    | Found in: your LS store → Settings → Webhooks → signing secret
    */
    'signing_secret' => env('LEMON_SQUEEZY_SIGNING_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Plan Variant IDs
    |--------------------------------------------------------------------------
    | Found in your LS product → Variants → variant ID (numeric).
    */
    'monthly_variant_id' => env('LEMON_SQUEEZY_MONTHLY_VARIANT_ID'),
    'yearly_variant_id'  => env('LEMON_SQUEEZY_YEARLY_VARIANT_ID'),
];
