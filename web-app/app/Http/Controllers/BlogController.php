<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Illuminate\Support\Str;
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

        return Inertia::render('Blog/Index', [
            'posts' => $posts,
            'seo'   => [
                'title'       => 'Blog — 4utest',
                'description' => 'Tips, guides, and updates on website auditing, SEO, security, and performance.',
                'canonical'   => url('/blog'),
                'type'        => 'website',
                'image'       => config('app.url') . '/og-image.png',
            ],
        ]);
    }

    public function show(string $slug): Response
    {
        $post = BlogPost::where('slug', $slug)
            ->where('status', 'published')
            ->with('author:id,name')
            ->firstOrFail();

        $description = $post->meta_description
            ?? $post->excerpt
            ?? Str::limit(strip_tags($post->content), 160);

        return Inertia::render('Blog/Show', [
            'post' => $post,
            'seo'  => [
                'title'        => $post->title . ' — 4utest Blog',
                'description'  => $description,
                'canonical'    => url('/blog/' . $post->slug),
                'type'         => 'article',
                'image'        => $post->featured_image ?? config('app.url') . '/og-image.png',
                'published_at' => $post->published_at->toIso8601String(),
                'author'       => $post->author->name,
                'schema'       => [
                    '@context'      => 'https://schema.org',
                    '@type'         => 'Article',
                    'headline'      => $post->title,
                    'description'   => $description,
                    'image'         => $post->featured_image ?? config('app.url') . '/og-image.png',
                    'datePublished' => $post->published_at->toIso8601String(),
                    'dateModified'  => $post->updated_at->toIso8601String(),
                    'author'        => [
                        '@type' => 'Person',
                        'name'  => $post->author->name,
                    ],
                    'publisher' => [
                        '@type' => 'Organization',
                        'name'  => '4utest',
                        'url'   => config('app.url'),
                    ],
                    'mainEntityOfPage' => [
                        '@type' => 'WebPage',
                        '@id'   => url('/blog/' . $post->slug),
                    ],
                ],
            ],
        ]);
    }
}
