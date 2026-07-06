<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sites = $request->user()->monitoredSites()->get()->map(fn ($s) => [
            'id'         => $s->id,
            'url'        => $s->url,
            'label'      => $s->label,
            'is_primary' => $s->is_primary,
        ]);

        return response()->json(['data' => $sites]);
    }
}
