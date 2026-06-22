<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use Illuminate\Console\Command;

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
        }

        return self::SUCCESS;
    }
}
