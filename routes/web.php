<?php

use App\Http\Controllers\Admin\BlogController as AdminBlogController;
use App\Http\Controllers\Admin\MonitoringController as AdminMonitoringController;
use App\Http\Controllers\Admin\TicketController as AdminTicketController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AgencyController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\SharedReportController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CookieConsentController;
use App\Http\Controllers\DashboardController;
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

// Public
Route::get('/', fn () => Inertia::render('Welcome'))->name('home');
Route::get('/terms', fn () => Inertia::render('Terms'))->name('terms');
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

    Route::post('/language', [LanguageController::class, 'update'])->name('language.update');
    Route::post('/agency', [AgencyController::class, 'update'])->name('agency.update');

    Route::get('/billing', [BillingController::class, 'index'])->name('billing');
    Route::post('/billing/subscribe', [BillingController::class, 'subscribe'])->name('billing.subscribe');
    Route::post('/billing/portal', [BillingController::class, 'portal'])->name('billing.portal');

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
    Route::get('/blog/{blog}/edit', [AdminBlogController::class, 'edit'])->name('blog.edit');
    Route::patch('/blog/{blog}', [AdminBlogController::class, 'update'])->name('blog.update');
    Route::delete('/blog/{blog}', [AdminBlogController::class, 'destroy'])->name('blog.destroy');

    Route::get('/tickets', [AdminTicketController::class, 'index'])->name('tickets.index');
    Route::get('/tickets/{ticket}', [AdminTicketController::class, 'show'])->name('tickets.show');
    Route::post('/tickets/{ticket}/reply', [AdminTicketController::class, 'reply'])->name('tickets.reply');
    Route::patch('/tickets/{ticket}/status', [AdminTicketController::class, 'updateStatus'])->name('tickets.status');

    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}', [AdminUserController::class, 'show'])->name('users.show');
    Route::post('/users/{user}/toggle-admin', [AdminUserController::class, 'toggleAdmin'])->name('users.toggle-admin');
    Route::post('/users/{user}/toggle-unlimited', [AdminUserController::class, 'toggleUnlimited'])->name('users.toggle-unlimited');

    Route::get('/monitoring', [AdminMonitoringController::class, 'index'])->name('monitoring.index');
});

// Stripe webhook — CSRF-exempt (see bootstrap/app.php), signature verified by Cashier internals
Route::post('/stripe/webhook', [\Laravel\Cashier\Http\Controllers\WebhookController::class, 'handleWebhook'])->name('cashier.webhook');
