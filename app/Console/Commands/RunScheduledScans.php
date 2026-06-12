<?php

namespace App\Console\Commands;

use App\Jobs\ProcessScheduledScan;
use App\Models\ScheduledScan;
use Illuminate\Console\Command;

class RunScheduledScans extends Command
{
    protected $signature   = 'scans:run';
    protected $description = 'Dispatch ProcessScheduledScan jobs for all due active scheduled scans';

    public function handle(): int
    {
        $due = ScheduledScan::where('is_active', true)
            ->where('next_run_at', '<=', now())
            ->get();

        $count = 0;
        foreach ($due as $scan) {
            // Update next_run_at immediately to prevent double-dispatch
            $scan->update([
                'next_run_at' => ScheduledScan::computeNextRun($scan->interval),
            ]);

            ProcessScheduledScan::dispatch($scan);
            $count++;
        }

        $this->info("Dispatched {$count} scheduled scan job(s).");

        return Command::SUCCESS;
    }
}
