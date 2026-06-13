<?php

use App\Http\Controllers\Admin\BlogController as AdminBlogController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CookieConsentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScheduledScanController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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

    Route::get('/billing', [BillingController::class, 'index'])->name('billing');
    Route::post('/billing/subscribe', [BillingController::class, 'subscribe'])->name('billing.subscribe');
    Route::post('/billing/portal', [BillingController::class, 'portal'])->name('billing.portal');

    // Subscription required for audits
    Route::middleware('subscription')->group(function () {
        Route::get('/audits', [AuditController::class, 'index'])->name('audits.index');
        Route::post('/audits', [AuditController::class, 'store'])->name('audits.store');
        Route::get('/audits/compare', [AuditController::class, 'compare'])->name('audits.compare');
        Route::get('/audits/{report}', [AuditController::class, 'show'])->name('audits.show');
        Route::get('/audits/{report}/status', [AuditController::class, 'status'])->name('audits.status');
        Route::delete('/audits/{report}', [AuditController::class, 'destroy'])->name('audits.destroy');
        Route::get('/audits/{report}/export/pdf', [AuditController::class, 'exportPdf'])->name('audits.export.pdf');
        Route::get('/audits/{report}/export/csv', [AuditController::class, 'exportCsv'])->name('audits.export.csv');

        Route::resource('scheduled-scans', ScheduledScanController::class);
        Route::post('/scheduled-scans/{scheduledScan}/run-now', [ScheduledScanController::class, 'runNow'])->name('scheduled-scans.run-now');
        Route::post('/scheduled-scans/{scheduledScan}/toggle', [ScheduledScanController::class, 'toggle'])->name('scheduled-scans.toggle');
    });
});

// Admin: blog management
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/blog', [AdminBlogController::class, 'index'])->name('blog.index');
    Route::get('/blog/create', [AdminBlogController::class, 'create'])->name('blog.create');
    Route::post('/blog', [AdminBlogController::class, 'store'])->name('blog.store');
    Route::get('/blog/{blog}/edit', [AdminBlogController::class, 'edit'])->name('blog.edit');
    Route::patch('/blog/{blog}', [AdminBlogController::class, 'update'])->name('blog.update');
    Route::delete('/blog/{blog}', [AdminBlogController::class, 'destroy'])->name('blog.destroy');
});

// Stripe webhook (no auth)
Route::post('/stripe/webhook', [BillingController::class, 'webhook'])->name('cashier.webhook');
