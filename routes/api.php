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

Route::get('/health', function () {
    try {
        // Check database connection
        \DB::connection()->getPdo();
        
        // Check Redis connection
        Redis::ping();
        
        return response()->json([
            'status' => 'healthy',
            'message' => 'Application is running successfully',
            'database' => 'connected',
            'redis' => 'connected',
            'timestamp' => now(),
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'unhealthy',
            'message' => 'Service connectivity check failed',
            'error' => $e->getMessage(),
            'timestamp' => now(),
        ], 503);
    }
});

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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
