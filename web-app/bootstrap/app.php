<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'subscription' => \App\Http\Middleware\RequireActiveSubscription::class,
            'admin'        => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'api-key'      => \App\Middleware\AuthenticateApiKey::class,
        ]);

        // Paddle sends real POST requests without CSRF tokens
        $middleware->preventRequestForgery(except: [
            'paddle/webhook',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Render branded error pages for Inertia XHR requests
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $e, Request $request) {
            $status = $response->getStatusCode();
            if (
                $request->header('X-Inertia') &&
                in_array($status, [401, 403, 404, 419, 429, 500, 503]) &&
                view()->exists("errors.{$status}")
            ) {
                return response()->view("errors.{$status}", [], $status);
            }
            return $response;
        });
    })->create();
