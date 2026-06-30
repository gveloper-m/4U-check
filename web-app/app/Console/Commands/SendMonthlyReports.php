<?php

namespace App\Console\Commands;

use App\Mail\MonthlyReportMail;
use App\Models\FullAuditReport;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendMonthlyReports extends Command
{
    protected $signature   = 'emails:monthly-report';
    protected $description = 'Send mid-month audit summary emails to subscribed users';

    public function handle(): void
    {
        $monthLabel = now()->subMonth()->format('F Y');
        $start      = now()->subMonth()->startOfMonth();
        $end        = now()->subMonth()->endOfMonth();

        User::where('notify_monthly_report', true)
            ->where(function ($q) {
                $q->where('is_unlimited', true)
                  ->orWhereHas('subscriptions', fn ($s) => $s->where('stripe_status', 'active'));
            })
            ->each(function (User $user) use ($monthLabel, $start, $end) {
                $reports = FullAuditReport::where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$start, $end])
                    ->get(['site_url', 'health_score']);

                $totalScans     = $reports->count();
                $sitesMonitored = $user->monitoredSites()->count();
                $avgScore       = $totalScans > 0 ? $reports->avg('health_score') : null;

                $bestSite  = null;
                $worstSite = null;

                if ($totalScans > 0) {
                    $best  = $reports->sortByDesc('health_score')->first();
                    $worst = $reports->sortBy('health_score')->first();

                    $bestSite  = ['url' => $best->site_url,  'score' => $best->health_score];
                    $worstSite = ['url' => $worst->site_url, 'score' => $worst->health_score];

                    // Don't repeat if best and worst are the same site
                    if ($best->site_url === $worst->site_url) {
                        $worstSite = null;
                    }
                }

                Mail::to($user->email)->queue(new MonthlyReportMail(
                    user:           $user,
                    monthLabel:     $monthLabel,
                    totalScans:     $totalScans,
                    sitesMonitored: $sitesMonitored,
                    avgScore:       $avgScore,
                    bestSite:       $bestSite,
                    worstSite:      $worstSite,
                ));
            });

        $this->info('Monthly report emails queued.');
    }
}
