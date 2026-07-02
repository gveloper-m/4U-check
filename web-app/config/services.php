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


];
