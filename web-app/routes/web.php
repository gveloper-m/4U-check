<?php

use App\Http\Controllers\Admin\BlogController as AdminBlogController;
use App\Http\Controllers\Admin\MonitoringController as AdminMonitoringController;
use App\Http\Controllers\Admin\TicketController as AdminTicketController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AdminMassEmailController;
use App\Http\Controllers\AdminTrialCodeController;
use App\Http\Controllers\AgencyController;
use App\Http\Controllers\NotificationPrefsController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\SharedReportController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CookieConsentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuestScanController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScheduledScanController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public shared reports (no auth required)
Route::get('/shared/{uuid}', [SharedReportController::class, 'show'])
    ->middleware('throttle:shared-report')
    ->where('uuid', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
    ->name('shared.show');
Route::get('/shared/{uuid}/pdf', [SharedReportController::class, 'pdf'])
    ->middleware('throttle:shared-pdf')
    ->where('uuid', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
    ->name('shared.pdf');

// Sitemap & robots (no middleware, must be fast)
Route::get('/sitemap.xml', [\App\Http\Controllers\SitemapController::class, 'sitemap'])->name('sitemap');
Route::get('/robots.txt',  [\App\Http\Controllers\SitemapController::class, 'robots'])->name('robots');

// Public
Route::get('/', function (Illuminate\Http\Request $request) {
    // Authenticated users see the homepage too (with Dashboard button)
    if (auth()->check()) {
        return Inertia::render('Landing', ['alreadyScanned' => false]);
    }

    $guestToken = $request->cookie('guest_scan_token');

    $alreadyScanned = \App\Models\FullAuditReport::whereNull('user_id')
        ->where('created_at', '>', now()->subDays(30))
        ->where(function ($q) use ($request, $guestToken) {
            $q->where('guest_ip', $request->ip());
            if ($guestToken) {
                $q->orWhere('guest_token', $guestToken);
            }
        })
        ->exists();

    return Inertia::render('Landing', ['alreadyScanned' => $alreadyScanned]);
})->name('home');

// Guest free scan (no auth required)
Route::post('/scan', [GuestScanController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('scan.store');
Route::get('/scan/{uuid}/status', [GuestScanController::class, 'status'])
    ->where('uuid', '[0-9a-f-]{36}')
    ->name('scan.status');
Route::get('/terms',   fn () => Inertia::render('Terms'))->name('terms');
Route::get('/privacy', fn () => Inertia::render('Privacy'))->name('privacy');
Route::get('/refund',  fn () => Inertia::render('Refund'))->name('refund');
Route::post('/refund/request', [\App\Http\Controllers\RefundRequestController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('refund.request');
Route::get('/pricing', fn () => Inertia::render('Pricing'))->name('pricing');
Route::post('/cookie-consent', [CookieConsentController::class, 'store'])->name('cookie-consent.store');

// Blog (public)
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');

// Auth (Breeze handles: /login, /register, /forgot-password, /reset-password)
require __DIR__.'/auth.php';

// Protected
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/profile/api-keys', [\App\Http\Controllers\Profile\ApiKeyController::class, 'store'])->name('api-keys.store');
    Route::delete('/profile/api-keys/{apiKey}', [\App\Http\Controllers\Profile\ApiKeyController::class, 'destroy'])->name('api-keys.destroy');

    Route::post('/language', [LanguageController::class, 'update'])->name('language.update');
    Route::post('/agency', [AgencyController::class, 'update'])->name('agency.update');
    Route::post('/notification-prefs', [NotificationPrefsController::class, 'update'])->name('notification-prefs.update');

    Route::get('/billing', [BillingController::class, 'index'])->name('billing');
    Route::post('/billing/subscribe', [BillingController::class, 'subscribe'])->name('billing.subscribe');
    Route::post('/billing/cancel', [BillingController::class, 'cancelSubscription'])->name('billing.cancel');
    Route::post('/billing/sites', [BillingController::class, 'addSite'])->name('billing.sites.add');
    Route::post('/billing/extra-site', [BillingController::class, 'extraSite'])->name('billing.extra-site');
    Route::delete('/billing/sites/{site}', [BillingController::class, 'removeSite'])->name('billing.sites.remove');

    // Subscription required for audits
    Route::middleware('subscription')->group(function () {
        Route::get('/audits', [AuditController::class, 'index'])->name('audits.index');
        Route::post('/audits', [AuditController::class, 'store'])->middleware('throttle:audit-store')->name('audits.store');
        Route::get('/audits/compare', [AuditController::class, 'compare'])->name('audits.compare');
        Route::get('/audits/{report}', [AuditController::class, 'show'])->name('audits.show');
        Route::get('/audits/{report}/status', [AuditController::class, 'status'])->name('audits.status');
        Route::delete('/audits/{report}', [AuditController::class, 'destroy'])->name('audits.destroy');
        Route::get('/audits/{report}/export/pdf', [AuditController::class, 'exportPdf'])->name('audits.export.pdf');
        Route::get('/audits/{report}/export/csv', [AuditController::class, 'exportCsv'])->name('audits.export.csv');
        Route::post('/audits/{report}/share/toggle', [AuditController::class, 'toggleShare'])->name('audits.share.toggle');

        Route::resource('scheduled-scans', ScheduledScanController::class);
        Route::post('/scheduled-scans/{scheduledScan}/run-now', [ScheduledScanController::class, 'runNow'])->name('scheduled-scans.run-now');
        Route::post('/scheduled-scans/{scheduledScan}/toggle', [ScheduledScanController::class, 'toggle'])->name('scheduled-scans.toggle');
    });

    // MCP Agents
    Route::get('/agent', [\App\Http\Controllers\McpAgentController::class, 'index'])->name('agent.index');
    Route::post('/agent', [\App\Http\Controllers\McpAgentController::class, 'store'])->name('agent.store');
    Route::delete('/agent/{agent}', [\App\Http\Controllers\McpAgentController::class, 'destroy'])->name('agent.destroy');
    Route::post('/agent/{agent}/regenerate', [\App\Http\Controllers\McpAgentController::class, 'regenerate'])->name('agent.regenerate');
    Route::post('/agent/{agent}/sync', [\App\Http\Controllers\McpAgentController::class, 'sync'])->name('agent.sync');
    Route::post('/agent/{agent}/auto-setup', [\App\Http\Controllers\McpAgentController::class, 'autoSetup'])->name('agent.autoSetup');

    // Support tickets (all authenticated users)
    Route::get('/tickets', [TicketController::class, 'index'])->name('tickets.index');
    Route::post('/tickets', [TicketController::class, 'store'])->middleware('throttle:10,1')->name('tickets.store');
    Route::get('/tickets/{ticket}', [TicketController::class, 'show'])->name('tickets.show');
    Route::post('/tickets/{ticket}/reply', [TicketController::class, 'reply'])->middleware('throttle:20,1')->name('tickets.reply');
});

// Admin: blog management + tickets
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/blog', [AdminBlogController::class, 'index'])->name('blog.index');
    Route::get('/blog/create', [AdminBlogController::class, 'create'])->name('blog.create');
    Route::post('/blog', [AdminBlogController::class, 'store'])->name('blog.store');
    Route::post('/blog/ai-generate', [AdminBlogController::class, 'aiGenerate'])->name('blog.ai-generate');
    Route::get('/blog/{blog}/edit', [AdminBlogController::class, 'edit'])->name('blog.edit');
    Route::patch('/blog/{blog}', [AdminBlogController::class, 'update'])->name('blog.update');
    Route::delete('/blog/{blog}', [AdminBlogController::class, 'destroy'])->name('blog.destroy');

    Route::get('/tickets', [AdminTicketController::class, 'index'])->name('tickets.index');
    Route::get('/tickets/{ticket}', [AdminTicketController::class, 'show'])->name('tickets.show');
    Route::post('/tickets/{ticket}/reply', [AdminTicketController::class, 'reply'])->name('tickets.reply');
    Route::patch('/tickets/{ticket}/status', [AdminTicketController::class, 'updateStatus'])->name('tickets.status');

    Route::get('/users/export', [AdminUserController::class, 'export'])->name('users.export');
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}', [AdminUserController::class, 'show'])->name('users.show');
    Route::post('/users/{user}/toggle-admin', [AdminUserController::class, 'toggleAdmin'])->name('users.toggle-admin');
    Route::post('/users/{user}/toggle-unlimited', [AdminUserController::class, 'toggleUnlimited'])->name('users.toggle-unlimited');
    Route::post('/users/{user}/grant-crawls', [AdminUserController::class, 'grantCrawls'])->name('users.grant-crawls');
    Route::post('/users/{user}/send-email', [AdminUserController::class, 'sendEmail'])->name('users.send-email');

    Route::get('/monitoring', [AdminMonitoringController::class, 'index'])->name('monitoring.index');

    Route::get('/trial-codes', [AdminTrialCodeController::class, 'index'])->name('trial-codes.index');
    Route::post('/trial-codes', [AdminTrialCodeController::class, 'store'])->name('trial-codes.store');
    Route::patch('/trial-codes/{trialCode}/note', [AdminTrialCodeController::class, 'updateNote'])->name('trial-codes.update-note');
    Route::delete('/trial-codes/{trialCode}', [AdminTrialCodeController::class, 'destroy'])->name('trial-codes.destroy');

    Route::get('/mass-email',                                    [AdminMassEmailController::class, 'index'])->name('mass-email.index');
    Route::post('/mass-email',                                   [AdminMassEmailController::class, 'store'])->name('mass-email.store');
    Route::post('/mass-email/import',                            [AdminMassEmailController::class, 'import'])->name('mass-email.import');
    Route::post('/mass-email/start',                             [AdminMassEmailController::class, 'start'])->name('mass-email.start');
    Route::delete('/mass-email/all',                             [AdminMassEmailController::class, 'destroyAll'])->name('mass-email.destroy-all');
    Route::delete('/mass-email/{massEmail}',                     [AdminMassEmailController::class, 'destroy'])->name('mass-email.destroy');
    Route::post('/mass-email/{massEmail}/retry',                 [AdminMassEmailController::class, 'retry'])->name('mass-email.retry');
    Route::patch('/mass-email/{massEmail}/language',             [AdminMassEmailController::class, 'updateLanguage'])->name('mass-email.update-language');
});
