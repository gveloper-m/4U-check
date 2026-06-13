<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(): Response
    {
        $posts = BlogPost::published()
            ->with('author:id,name')
            ->select('id', 'user_id', 'title', 'slug', 'excerpt', 'featured_image', 'published_at')
            ->paginate(9);

        return Inertia::render('Blog/Index', ['posts' => $posts]);
    }

    public function show(string $slug): Response
    {
        $post = BlogPost::where('slug', $slug)
            ->where('status', 'published')
            ->with('author:id,name')
            ->firstOrFail();

        return Inertia::render('Blog/Show', ['post' => $post]);
    }
}
