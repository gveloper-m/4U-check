<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// MCP Agent heartbeat — token auth (no session/CSRF needed)
Route::post('/agent/heartbeat', [\App\Http\Controllers\Api\McpAgentController::class, 'heartbeat'])
    ->middleware('throttle:120,1');

Route::get('/health', function () {
    try {
        \DB::connection()->getPdo();
        Redis::ping();
        return response()->json(['status' => 'healthy', 'timestamp' => now()], 200);
    } catch (\Exception $e) {
        \Log::error('Health check failed', ['error' => $e->getMessage()]);
        return response()->json(['status' => 'unhealthy', 'timestamp' => now()], 503);
    }
});

// REST API v1 — authenticated via API key (Bearer token)
Route::prefix('v1')->middleware(['api-key', 'throttle:60,1'])->group(function () {
    Route::get('me',               [\App\Http\Controllers\Api\V1\MeController::class,   'show']);
    Route::get('sites',            [\App\Http\Controllers\Api\V1\SiteController::class, 'index']);
    Route::get('scans',            [\App\Http\Controllers\Api\V1\ScanController::class, 'index']);
    Route::post('scans',           [\App\Http\Controllers\Api\V1\ScanController::class, 'store']);
    Route::get('scans/{id}',       [\App\Http\Controllers\Api\V1\ScanController::class, 'show']);
    Route::get('scans/{id}/pdf',   [\App\Http\Controllers\Api\V1\ScanController::class, 'pdf']);
    Route::get('scans/{id}/csv',   [\App\Http\Controllers\Api\V1\ScanController::class, 'csv']);
});

// Legacy single-module API routes — protected, throttled
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::post('/audit/broken-resources', [\App\Http\Controllers\BrokenResourceController::class, 'auditBrokenResources']);
    Route::get('/audit/broken-resources', [\App\Http\Controllers\BrokenResourceController::class, 'getAuditHistory']);

    Route::post('/audit/performance', [\App\Http\Controllers\PerformanceAuditController::class, 'auditPerformance']);
    Route::get('/audit/performance', [\App\Http\Controllers\PerformanceAuditController::class, 'getAuditHistory']);

    Route::post('/audit/marketing-tracking', [\App\Http\Controllers\TrackingAuditController::class, 'auditMarketingTracking']);
    Route::get('/audit/marketing-tracking', [\App\Http\Controllers\TrackingAuditController::class, 'getAuditHistory']);

    Route::post('/audit/catalog-integrity', [\App\Http\Controllers\EcommerceCatalogAuditController::class, 'auditCatalogIntegrity']);
    Route::get('/audit/catalog-integrity', [\App\Http\Controllers\EcommerceCatalogAuditController::class, 'getAuditHistory']);

    Route::post('/audit/seo-schema', [\App\Http\Controllers\SeoSchemaAuditController::class, 'auditSeoSchema']);
    Route::get('/audit/seo-schema', [\App\Http\Controllers\SeoSchemaAuditController::class, 'getAuditHistory']);

    Route::post('/audit/security-infrastructure', [\App\Http\Controllers\SecurityInfrastructureController::class, 'auditSecurityInfrastructure']);
    Route::get('/audit/security-infrastructure', [\App\Http\Controllers\SecurityInfrastructureController::class, 'getAuditHistory']);

    Route::post('/audit/full-report', [\App\Http\Controllers\FullAuditReportController::class, 'generate']);
    Route::get('/audit/full-report/status/{id}', [\App\Http\Controllers\FullAuditReportController::class, 'status']);
    Route::get('/audit/full-report', [\App\Http\Controllers\FullAuditReportController::class, 'history']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
