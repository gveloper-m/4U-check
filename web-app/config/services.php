<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'mistral' => [
        'api_key' => env('MISTRAL_API_KEY'),
    ],

    'elorus' => [
        'api_token'          => env('ELORUS_API_TOKEN'),
        'organization_id'    => env('ELORUS_ORGANIZATION_ID'),
        // GET https://api.elorus.com/v1.0/{org_id}/taxdefinitions/ → find the 24% ΦΠΑ entry
        'tax_24_id'          => env('ELORUS_TAX_24_ID'),
        // GET https://api.elorus.com/v1.0/{org_id}/documenttypes/ → find Τιμολόγιο 1.1
        'doctype_invoice_id' => env('ELORUS_DOCTYPE_INVOICE_ID'),
        // GET https://api.elorus.com/v1.0/{org_id}/documenttypes/ → find Απόδειξη 11.1
        'doctype_receipt_id' => env('ELORUS_DOCTYPE_RECEIPT_ID'),
    ],

    'stripe' => [
        'monthly_price_id'            => env('STRIPE_MONTHLY_PRICE_ID', env('STRIPE_PRICE_ID')),
        'yearly_price_id'             => env('STRIPE_YEARLY_PRICE_ID'),
        'monthly_extra_site_price_id' => env('STRIPE_MONTHLY_EXTRA_SITE_PRICE_ID'),
        'yearly_extra_site_price_id'  => env('STRIPE_YEARLY_EXTRA_SITE_PRICE_ID'),
        'tax_enabled'                 => env('STRIPE_TAX_ENABLED', false),
    ],

];
