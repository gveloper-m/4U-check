<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Elorus invoicing integration.
 *
 * Triggered on every paid Stripe invoice. Determines the correct document type,
 * VAT treatment, and myDATA classification based on the customer's country and
 * whether they are a VAT-registered business.
 *
 * Four customer categories (matching Greek tax law for a GR-based SaaS):
 *
 *   GR_B2B     → Τιμολόγιο 1.1, ΦΠΑ 24%
 *   GR_B2C     → Απόδειξη 11.1, ΦΠΑ 24%
 *   EU_B2B     → Τιμολόγιο 1.1, ΦΠΑ 0% (Reverse Charge / Άρθρο 14) — VIES validated
 *   EU_B2C     → Απόδειξη 11.1, ΦΠΑ χώρας πελάτη (OSS) — requires Stripe Tax
 *   NON_EU_B2B → Τιμολόγιο 1.1, ΦΠΑ 0% (Εξαγωγή / Άρθρο 14)
 *   NON_EU_B2C → Απόδειξη 11.1, ΦΠΑ 0% (Εκτός πεδίου ΕΕ)
 *
 * Required env vars (look up IDs from your Elorus dashboard via the API):
 *   ELORUS_API_TOKEN
 *   ELORUS_ORGANIZATION_ID
 *   ELORUS_TAX_24_ID           → GET /v1.0/{org}/taxdefinitions/ — the 24% ΦΠΑ entry
 *   ELORUS_DOCTYPE_INVOICE_ID  → GET /v1.0/{org}/documenttypes/ — Τιμολόγιο Πώλησης 1.1
 *   ELORUS_DOCTYPE_RECEIPT_ID  → GET /v1.0/{org}/documenttypes/ — Απόδειξη Λιανικής 11.1
 */
class ElorusService
{
    private const BASE_URL = 'https://api.elorus.com/v1.0/';

    /** ISO 3166-1 alpha-2 codes of all EU member states. */
    private const EU_COUNTRIES = [
        'AT','BE','BG','CY','CZ','DE','DK','EE','GR','ES','FI',
        'FR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL',
        'PT','RO','SE','SI','SK',
    ];

    /** VIES REST API uses "EL" for Greece, ISO uses "GR". */
    private const ISO_TO_VIES = ['GR' => 'EL'];

    private string $token;
    private string $orgId;

    public function __construct()
    {
        $this->token = (string) config('services.elorus.api_token', '');
        $this->orgId = (string) config('services.elorus.organization_id', '');
    }

    public function isConfigured(): bool
    {
        return $this->token !== '' && $this->orgId !== '';
    }

    // ── Public entry point ────────────────────────────────────────────────────

    /**
     * Create the correct Elorus document for a paid Stripe invoice.
     * Never throws — all errors are logged and swallowed so webhook responses
     * are never blocked by accounting issues.
     */
    public function createDocumentFromInvoice(User $user, array $invoice): void
    {
        if (! $this->isConfigured()) {
            Log::info('[Elorus] Not configured — skipping document creation.');
            return;
        }

        try {
            $this->process($user, $invoice);
        } catch (\Throwable $e) {
            Log::error('[Elorus] Document creation failed', [
                'error'      => $e->getMessage(),
                'invoice_id' => $invoice['id'] ?? null,
                'user_id'    => $user->id,
            ]);
        }
    }

    // ── Core processing ───────────────────────────────────────────────────────

    private function process(User $user, array $invoice): void
    {
        $country   = $invoice['customer_address']['country'] ?? null;
        $taxIds    = $invoice['customer_tax_ids'] ?? [];
        $vatNumber = ! empty($taxIds) ? ($taxIds[0]['value'] ?? null) : null;

        // Fall back to the VAT number stored at subscribe-time
        $vatNumber = $vatNumber ?: ($user->vat_number ?: null);

        if (! $country) {
            Log::warning('[Elorus] No country on Stripe invoice — cannot create document.', [
                'invoice_id' => $invoice['id'],
            ]);
            return;
        }

        // Cache billing country on the user record
        if ($user->billing_country !== $country) {
            $user->update(['billing_country' => $country]);
        }

        [$category, $vatRate, $doctypeKey] = $this->categorise($country, $vatNumber);

        Log::info("[Elorus] Processing invoice: category={$category} vat={$vatRate}% doctype={$doctypeKey}", [
            'invoice_id' => $invoice['id'],
            'user_id'    => $user->id,
            'country'    => $country,
        ]);

        $doctypeId = (int) config("services.elorus.{$doctypeKey}_id", 0);
        if ($doctypeId === 0) {
            Log::error("[Elorus] Document type ID for '{$doctypeKey}' is not configured in ELORUS_DOCTYPE_*");
            return;
        }

        $contactId = $this->findOrCreateContact($user, $vatNumber, $country);
        $rows      = $this->buildRows($invoice, $vatRate);

        $payload = [
            'documenttype_id' => $doctypeId,
            'client_id'       => $contactId,
            'date'            => now()->format('Y-m-d'),
            'draft'           => false,
            'rows'            => $rows,
        ];

        // myDATA VAT exemption category for 0% documents
        if ($vatRate === 0) {
            $payload['vat_exempt_category'] = $this->myDataExemptCategory($category);
        }

        $doc = $this->post('invoices/', $payload);

        Log::info('[Elorus] Document created successfully', [
            'elorus_document_id' => $doc['id'] ?? null,
            'elorus_number'      => $doc['full_number'] ?? null,
            'user_id'            => $user->id,
            'invoice_id'         => $invoice['id'],
        ]);
    }

    // ── Customer categorisation ───────────────────────────────────────────────

    /**
     * Returns [category_label, vat_rate_percent, doctype_config_key].
     *
     * EU B2C VAT rate: when Stripe Tax is enabled the invoice already contains
     * the correct local-rate tax — we extract it in buildRows(). When Stripe Tax
     * is disabled we default to 0% and log a warning; enable STRIPE_TAX_ENABLED
     * and Elorus OSS for full compliance.
     */
    private function categorise(string $country, ?string $vatNumber): array
    {
        $isGR = $country === 'GR';
        $isEU = in_array($country, self::EU_COUNTRIES, true) && ! $isGR;

        if ($isGR) {
            return $vatNumber
                ? ['GR_B2B',     24, 'doctype_invoice_id']
                : ['GR_B2C',     24, 'doctype_receipt_id'];
        }

        if ($isEU) {
            if ($vatNumber && $this->validateVies($country, $vatNumber)) {
                return ['EU_B2B', 0, 'doctype_invoice_id'];
            }
            // EU B2C — OSS; Stripe Tax provides the correct local rate
            return ['EU_B2C', -1, 'doctype_receipt_id'];   // -1 = derive from Stripe
        }

        // Non-EU (third countries)
        return $vatNumber
            ? ['NON_EU_B2B', 0, 'doctype_invoice_id']
            : ['NON_EU_B2C', 0, 'doctype_receipt_id'];
    }

    // ── VIES VAT validation ───────────────────────────────────────────────────

    private function validateVies(string $countryIso, string $vatNumber): bool
    {
        try {
            $viesCode = self::ISO_TO_VIES[$countryIso] ?? $countryIso;
            // Remove country prefix that some providers include (e.g. "DE123…" → "123…")
            $vatClean = (string) preg_replace('/^[A-Z]{2}/i', '', $vatNumber);

            $resp = Http::timeout(10)->get(
                "https://ec.europa.eu/taxation_customs/vies/rest-api/ms/{$viesCode}/vat/{$vatClean}"
            );

            if ($resp->successful()) {
                return (bool) ($resp->json('isValid') ?? false);
            }
        } catch (\Throwable $e) {
            Log::warning('[Elorus] VIES check failed — treating as B2C', [
                'country' => $countryIso,
                'error'   => $e->getMessage(),
            ]);
        }

        return false;
    }

    // ── Elorus contact management ─────────────────────────────────────────────

    private function findOrCreateContact(User $user, ?string $vatNumber, string $country): int
    {
        // Reuse cached Elorus contact ID to avoid duplicates
        if ($user->elorus_contact_id) {
            return (int) $user->elorus_contact_id;
        }

        // Search by VAT number
        if ($vatNumber) {
            $results = $this->get('contacts/?search=' . urlencode($vatNumber) . '&is_client=true');
            if (! empty($results['results'])) {
                $id = (int) $results['results'][0]['id'];
                $user->update(['elorus_contact_id' => $id]);
                return $id;
            }
        }

        // Create new contact
        $contact = $this->post('contacts/', [
            'name'                    => $user->company_name ?: $user->name,
            'is_client'               => true,
            'email'                   => $user->email,
            'tax_registration_number' => $vatNumber ?? '',
            'country'                 => $country,
        ]);

        $id = (int) $contact['id'];
        $user->update(['elorus_contact_id' => $id]);

        return $id;
    }

    // ── Invoice row construction ──────────────────────────────────────────────

    private function buildRows(array $invoice, int $vatRate): array
    {
        $tax24Id       = (int) config('services.elorus.tax_24_id', 0);
        $stripeHasTax  = (int) ($invoice['tax'] ?? 0) > 0;
        $rows          = [];

        foreach ($invoice['lines']['data'] as $line) {
            $amountCents = (int) $line['amount'];

            if ($vatRate === 24 && ! $stripeHasTax) {
                // Amount is VAT-inclusive (Stripe didn't add tax separately):
                // back-calculate the net amount so Elorus can add 24% on top.
                $netCents = (int) round($amountCents / 1.24);
            } elseif ($vatRate === -1) {
                // EU B2C / OSS: Stripe Tax already separated net + tax.
                // Use subtotal line amount as the net.
                $netCents = (int) ($line['amount_excluding_tax'] ?? $amountCents);
            } else {
                // 0% VAT or Stripe already separated net: use amount as-is.
                $netCents = $amountCents;
            }

            $row = [
                'description' => $line['description'] ?? 'Subscription',
                'qty'         => (string) ($line['quantity'] ?? 1),
                'unit_value'  => number_format($netCents / 100, 2, '.', ''),
                'taxes'       => [],
            ];

            if ($vatRate === 24 && $tax24Id > 0) {
                $row['taxes'] = [['id' => $tax24Id]];
            } elseif ($vatRate === -1 && $stripeHasTax) {
                // OSS: include the Stripe-computed tax amount as a note row
                // (full OSS requires Elorus OSS mode + per-country tax definitions)
                $taxCents         = (int) ($invoice['tax'] ?? 0);
                $row['description'] .= sprintf(
                    ' (OSS VAT %s%%: +€%.2f)',
                    $this->ossVatRate($invoice),
                    $taxCents / 100,
                );
            }

            $rows[] = $row;
        }

        return $rows;
    }

    /** Derive effective OSS VAT rate from Stripe Tax amounts. */
    private function ossVatRate(array $invoice): string
    {
        $subtotal = (int) ($invoice['subtotal'] ?? 0);
        $tax      = (int) ($invoice['tax']      ?? 0);

        if ($subtotal > 0 && $tax > 0) {
            return number_format(($tax / $subtotal) * 100, 0);
        }

        return '?';
    }

    // ── myDATA exemption mapping ──────────────────────────────────────────────

    /**
     * Maps customer category to Elorus/myDATA VAT exemption category code.
     * Elorus will include the correct legal text on the document.
     */
    private function myDataExemptCategory(string $category): string
    {
        return match ($category) {
            'EU_B2B'      => '1',   // Αντίστροφη επιβάρυνση — Άρθρο 14 Κώδικα ΦΠΑ
            'NON_EU_B2B',
            'NON_EU_B2C',
            'EU_B2C'      => '7',   // Εκτός πεδίου ΦΠΑ (εξαγωγές / τρίτες χώρες)
            default       => '7',
        };
    }

    // ── HTTP helpers ──────────────────────────────────────────────────────────

    private function get(string $endpoint): array
    {
        $resp = Http::withToken($this->token)
            ->timeout(20)
            ->get(self::BASE_URL . $this->orgId . '/' . $endpoint);

        if (! $resp->successful()) {
            throw new \RuntimeException(
                "Elorus GET {$endpoint} → HTTP {$resp->status()}: {$resp->body()}"
            );
        }

        return $resp->json() ?? [];
    }

    private function post(string $endpoint, array $data): array
    {
        $resp = Http::withToken($this->token)
            ->timeout(20)
            ->post(self::BASE_URL . $this->orgId . '/' . $endpoint, $data);

        if (! $resp->successful()) {
            throw new \RuntimeException(
                "Elorus POST {$endpoint} → HTTP {$resp->status()}: {$resp->body()}"
            );
        }

        return $resp->json() ?? [];
    }
}
