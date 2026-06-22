<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(): Response
    {
        $posts = BlogPost::with('author:id,name')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Admin/Blog/Index', ['posts' => $posts]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Blog/Edit', ['post' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title'          => 'required|string|max:255',
            'excerpt'        => 'nullable|string|max:500',
            'content'        => 'required|string',
            'featured_image' => 'nullable|url|max:500',
            'status'         => 'required|in:draft,published',
        ]);

        $data['slug']         = BlogPost::generateSlug($data['title']);
        $data['user_id']      = auth()->id();
        $data['published_at'] = $data['status'] === 'published' ? now() : null;

        $post = BlogPost::create($data);

        return redirect()->route('admin.blog.edit', $post)->with('success', 'Post created.');
    }

    public function edit(BlogPost $blog): Response
    {
        return Inertia::render('Admin/Blog/Edit', ['post' => $blog]);
    }

    public function update(Request $request, BlogPost $blog): RedirectResponse
    {
        $data = $request->validate([
            'title'          => 'required|string|max:255',
            'excerpt'        => 'nullable|string|max:500',
            'content'        => 'required|string',
            'featured_image' => 'nullable|url|max:500',
            'status'         => 'required|in:draft,published',
        ]);

        if ($data['status'] === 'published' && ! $blog->published_at) {
            $data['published_at'] = now();
        } elseif ($data['status'] === 'draft') {
            $data['published_at'] = null;
        }

        $blog->update($data);

        return back()->with('success', 'Post updated.');
    }

    public function destroy(BlogPost $blog): RedirectResponse
    {
        $blog->delete();
        return redirect()->route('admin.blog.index')->with('success', 'Post deleted.');
    }
}
