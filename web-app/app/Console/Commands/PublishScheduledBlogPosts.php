<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PublishScheduledBlogPosts extends Command
{
    protected $signature   = 'blog:publish-scheduled';
    protected $description = 'Publish blog posts whose scheduled_at time has passed';

    public function handle(): int
    {
        $published = BlogPost::where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($published as $post) {
            $post->update([
                'status'       => 'published',
                'published_at' => $post->scheduled_at,
            ]);
            $this->line("Published: [{$post->id}] {$post->title}");
        }

        if ($published->isEmpty()) {
            $this->line('No scheduled posts due.');
        } else {
            $this->pingSitemapIndexers();
        }

        return self::SUCCESS;
    }

    private function pingSitemapIndexers(): void
    {
        $sitemap = urlencode(url('/sitemap.xml'));
        $targets = [
            "https://www.google.com/ping?sitemap={$sitemap}",
            "https://www.bing.com/ping?sitemap={$sitemap}",
        ];
        foreach ($targets as $url) {
            try {
                Http::timeout(10)->get($url);
                $this->line("Pinged: {$url}");
            } catch (\Exception $e) {
                Log::warning("Sitemap ping failed: {$url} — {$e->getMessage()}");
            }
        }
    }
}
