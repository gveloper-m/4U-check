<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessMassEmailContact;
use App\Models\MassEmailContact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminMassEmailController extends Controller
{
    private const VALID_LOCALES = ['en', 'el', 'de', 'fr', 'es', 'nl', 'cs'];

    public function index(): Response
    {
        $contacts = MassEmailContact::latest()->paginate(50);

        $stats = [
            'total'    => MassEmailContact::count(),
            'pending'  => MassEmailContact::where('status', 'pending')->count(),
            'scanning' => MassEmailContact::whereIn('status', ['scanning', 'sending'])->count(),
            'sent'     => MassEmailContact::where('status', 'sent')->count(),
            'failed'   => MassEmailContact::whereIn('status', ['failed', 'scan_failed'])->count(),
        ];

        return Inertia::render('Admin/MassEmail/Index', [
            'contacts' => $contacts,
            'stats'    => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email'    => 'required|email|max:255',
            'website'  => 'required|url|max:500',
            'language' => 'required|in:' . implode(',', self::VALID_LOCALES),
        ]);

        MassEmailContact::create([
            'email'    => strtolower(trim($data['email'])),
            'website'  => rtrim($data['website'], '/'),
            'language' => $data['language'],
            'status'   => 'pending',
        ]);

        return back()->with('success', 'Contact added.');
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate(['csv' => 'required|file|mimes:csv,txt|max:5120']);

        $file     = $request->file('csv');
        $handle   = fopen($file->getRealPath(), 'r');
        $header   = fgetcsv($handle);
        $imported = 0;
        $skipped  = 0;

        $header     = array_map('strtolower', array_map('trim', $header ?? []));
        $emailCol   = array_search('email',    $header);
        $websiteCol = array_search('website',  $header);
        $langCol    = array_search('language', $header);

        if ($emailCol === false || $websiteCol === false) {
            fclose($handle);
            return back()->with('error', 'CSV must have "email" and "website" columns in the header row.');
        }

        while (($row = fgetcsv($handle)) !== false) {
            $email   = strtolower(trim($row[$emailCol] ?? ''));
            $website = rtrim(trim($row[$websiteCol] ?? ''), '/');
            $lang    = trim($row[$langCol] ?? 'en');

            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) { $skipped++; continue; }
            if (! filter_var($website, FILTER_VALIDATE_URL))  { $skipped++; continue; }
            if (! in_array($lang, self::VALID_LOCALES)) $lang = 'en';

            MassEmailContact::create([
                'email'    => $email,
                'website'  => $website,
                'language' => $lang,
                'status'   => 'pending',
            ]);
            $imported++;
        }

        fclose($handle);
        return back()->with('success', "Imported {$imported} contact(s)." . ($skipped ? " Skipped {$skipped} invalid rows." : ''));
    }

    public function destroy(MassEmailContact $massEmail): RedirectResponse
    {
        $massEmail->delete();
        return back()->with('success', 'Contact deleted.');
    }

    public function destroyAll(Request $request): RedirectResponse
    {
        $status = $request->input('status');
        $query  = MassEmailContact::query();
        if ($status) $query->where('status', $status);
        $count = $query->count();
        $query->delete();
        return back()->with('success', "Deleted {$count} contact(s).");
    }

    public function start(): RedirectResponse
    {
        $pending = MassEmailContact::where('status', 'pending')->get();

        if ($pending->isEmpty()) {
            return back()->with('error', 'No pending contacts to process.');
        }

        // Stagger: one new audit every 2 minutes to avoid overloading the scan queue
        foreach ($pending as $index => $contact) {
            ProcessMassEmailContact::dispatch($contact->id)
                ->delay(now()->addSeconds($index * 120));
        }

        return back()->with('success', "Queued {$pending->count()} contact(s). Emails will send as each scan completes (~2–5 min each).");
    }

    public function retry(MassEmailContact $massEmail): RedirectResponse
    {
        if (! in_array($massEmail->status, ['failed', 'scan_failed'])) {
            return back()->with('error', 'Only failed contacts can be retried.');
        }

        $massEmail->update([
            'status'        => 'pending',
            'error_message' => null,
            'audit_id'      => null,
            'share_uuid'    => null,
        ]);
        ProcessMassEmailContact::dispatch($massEmail->id);

        return back()->with('success', 'Contact queued for retry.');
    }

    public function updateLanguage(Request $request, MassEmailContact $massEmail): RedirectResponse
    {
        $request->validate(['language' => 'required|in:' . implode(',', self::VALID_LOCALES)]);
        $massEmail->update(['language' => $request->input('language')]);
        return back();
    }
}
