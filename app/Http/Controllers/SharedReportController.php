<?php

namespace App\Http\Controllers;

use App\Models\FullAuditReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SharedReportController extends Controller
{
    public function show(string $uuid): InertiaResponse
    {
        $report = FullAuditReport::where('share_uuid', $uuid)
            ->where('share_enabled', true)
            ->with('user')
            ->firstOrFail();

        $agency = $this->buildAgencyData($report);

        // Strip the user relation so no agency account data leaks to the public page
        $report->unsetRelation('user');

        return Inertia::render('Shared/Report', [
            'report' => $report,
            'agency' => $agency,
        ]);
    }

    public function pdf(string $uuid): Response
    {
        $report = FullAuditReport::where('share_uuid', $uuid)
            ->where('share_enabled', true)
            ->with('user')
            ->firstOrFail();

        $agency = $this->buildAgencyDataForPdf($report);

        $pdf = Pdf::loadView('exports.audit-report', ['report' => $report, 'agency' => $agency])
            ->setPaper('a4', 'portrait')
            ->setOptions(['defaultFont' => 'DejaVu Sans', 'isRemoteEnabled' => false]);

        $filename = 'audit-report-' . parse_url($report->site_url, PHP_URL_HOST)
            . '-' . $report->created_at->format('Ymd-His') . '.pdf';

        return $pdf->download($filename);
    }

    private function buildAgencyData(FullAuditReport $report): ?array
    {
        $user = $report->user;
        if (! $user->is_agency) {
            return null;
        }

        return [
            'name'            => $user->company_name,
            'logo_url'        => $user->agency_logo ? asset('storage/' . $user->agency_logo) : null,
            'primary_color'   => $user->agency_primary_color   ?? '#7c3aed',
            'secondary_color' => $user->agency_secondary_color ?? '#1e1b4b',
            'footer_text'     => $user->agency_footer_text,
        ];
    }

    private function buildAgencyDataForPdf(FullAuditReport $report): ?array
    {
        $user = $report->user;
        if (! $user->is_agency) {
            return null;
        }

        $logoPath = null;
        if ($user->agency_logo) {
            $path = storage_path('app/public/' . $user->agency_logo);
            if (file_exists($path)) {
                $logoPath = $path;
            }
        }

        return [
            'name'            => $user->company_name,
            'logo_path'       => $logoPath,
            'primary_color'   => $user->agency_primary_color   ?? '#7c3aed',
            'secondary_color' => $user->agency_secondary_color ?? '#1e1b4b',
            'footer_text'     => $user->agency_footer_text,
        ];
    }
}
