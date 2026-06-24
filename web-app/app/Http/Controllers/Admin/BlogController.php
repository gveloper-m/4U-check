<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Services\MistralBlogService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
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
            'status'         => 'required|in:draft,published,scheduled',
            'scheduled_at'   => 'nullable|date|after:now',
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
            'status'         => 'required|in:draft,published,scheduled',
            'scheduled_at'   => 'nullable|date|after:now',
        ]);

        if ($data['status'] === 'published' && ! $blog->published_at) {
            $data['published_at'] = now();
            $data['scheduled_at'] = null;
        } elseif ($data['status'] === 'draft') {
            $data['published_at'] = null;
            $data['scheduled_at'] = null;
        }

        $blog->update($data);

        return back()->with('success', 'Post updated.');
    }

    public function destroy(BlogPost $blog): RedirectResponse
    {
        $blog->delete();
        return redirect()->route('admin.blog.index')->with('success', 'Post deleted.');
    }

    public function aiGenerate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => 'required|in:en,el,de,fr,es,nl,cs',
            'topic'  => 'nullable|string|max:300',
        ]);

        try {
            $service = new MistralBlogService();
            $data    = $service->generate($validated['locale'], $validated['topic'] ?? '');
        } catch (\RuntimeException $e) {
            return back()->with('error', 'AI generation failed: ' . $e->getMessage());
        } catch (\Exception $e) {
            return back()->with('error', 'Unexpected error during AI generation. Please try again.');
        }

        $scheduledAt = $this->calculateScheduledAt(
            $data['best_publish_day'],
            (int) $data['best_publish_hour_utc']
        );

        $slug = BlogPost::generateSlug($data['slug'] ?? $data['title']);

        $post = BlogPost::create([
            'user_id'          => $request->user()->id,
            'locale'           => $validated['locale'],
            'title'            => $data['title'],
            'slug'             => $slug,
            'excerpt'          => $data['excerpt'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
            'content'          => $data['content'],
            'featured_image'   => $data['featured_image'] ?? null,
            'status'           => 'scheduled',
            'published_at'     => null,
            'scheduled_at'     => $scheduledAt,
        ]);

        return redirect()->route('admin.blog.edit', $post)
            ->with('success', "AI article scheduled for " . $scheduledAt->format('D, M j Y @ H:i') . ' UTC. You can edit it before it goes live.');
    }

    private function calculateScheduledAt(string $day, int $hourUtc): Carbon
    {
        $dayMap = [
            'monday' => Carbon::MONDAY, 'tuesday' => Carbon::TUESDAY,
            'wednesday' => Carbon::WEDNESDAY, 'thursday' => Carbon::THURSDAY,
            'friday' => Carbon::FRIDAY, 'saturday' => Carbon::SATURDAY,
            'sunday' => Carbon::SUNDAY,
        ];
        $targetDay = $dayMap[strtolower($day)] ?? Carbon::TUESDAY;
        $hourUtc   = max(7, min(14, $hourUtc));

        $candidate = now()->utc()->next($targetDay)->setTime($hourUtc, 0, 0);

        // If candidate is fewer than 3 hours away, push to next week
        if ($candidate->diffInHours(now()->utc(), false) > -3) {
            $candidate->addWeek();
        }

        return $candidate;
    }
}
