<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function sitemap(): Response
    {
        $posts = BlogPost::published()
            ->select('slug', 'updated_at', 'published_at')
            ->get();

        return response()
            ->view('sitemap', compact('posts'))
            ->header('Content-Type', 'application/xml; charset=utf-8');
    }

    public function robots(): Response
    {
        return response()
            ->view('robots')
            ->header('Content-Type', 'text/plain; charset=utf-8');
    }
}
