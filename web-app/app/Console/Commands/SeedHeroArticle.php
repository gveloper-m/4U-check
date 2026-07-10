<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use App\Models\User;
use App\Services\BlogCoverImageService;
use Illuminate\Console\Command;

class SeedHeroArticle extends Command
{
    protected $signature   = 'blog:seed-hero-article';
    protected $description = 'One-off: insert the hand-written MCP/API lead-magnet hero article as a real published post';

    private const TITLE = 'How to Automate Website Testing With an API and an MCP Agent';

    private const META_DESCRIPTION = "Learn to automate website QA with 4uTest's API and MCP agent — run SEO, performance, security and accessibility checks straight from Claude Code or Cursor.";

    private const EXCERPT = "Manual spot-checks catch the obvious bugs and miss the ones that actually cost you rankings or revenue. Here's how to replace them with an API and an MCP agent that run on every deploy.";

    private const CONTENT = <<<'HTML'
<p>Most teams find out their website is broken from a customer, not from a dashboard. A broken checkout button, a missing <code>hreflang</code> tag that tanked a market's rankings overnight, an accessibility regression that turns into a complaint — by the time a human notices, the damage is already live. Manual spot-checks before a release catch the obvious stuff. They don't catch the stuff that actually costs you rankings, revenue, or a legal letter.</p>

<p>This guide walks through how to replace that manual spot-check with something that runs on every deploy, on a schedule, or on demand from inside your editor — using an audit API and an MCP agent instead of a person clicking through pages. It's written for the person who ends up owning "is the site okay" by default: a developer on a small team, an agency managing several client sites at once, or a solo founder who doesn't have a dedicated QA hire and isn't going to get one.</p>

<h2>Why Manual Website Checks Don't Scale</h2>

<p>Manual QA works fine when a site has ten pages and one person owns it. It stops working the moment any of these become true: multiple people ship changes, the site has more pages than one person can click through in an afternoon, or "SEO health" and "accessibility compliance" become things someone other than the developer is accountable for.</p>

<p>Three failure patterns show up constantly once a site outgrows manual checks:</p>

<ul>
  <li><strong>The silent regression.</strong> A CMS update strips a canonical tag site-wide. Nobody notices for three weeks because nothing "looks" broken — the page renders fine, it just quietly stops ranking.</li>
  <li><strong>The pre-launch scramble.</strong> A marketing campaign goes live and the tracking pixel that's supposed to measure it was removed in a redesign two sprints ago. The spend already happened before anyone checks the numbers.</li>
  <li><strong>The compliance surprise.</strong> A new component ships with a contrast ratio nobody measured. It's fine until an accessibility complaint or an audit turns it into a fire drill.</li>
</ul>

<p>None of these require a person to have been careless. They require a system that checks the things a person would eventually forget to check, on a cadence a person wouldn't have the patience for.</p>

<p>There's also a scale problem that has nothing to do with anyone's diligence. Clicking through ten pages by hand to check for broken links is tedious but doable. Doing it for four hundred product pages, every time a template changes, isn't something any human is going to keep doing reliably — not because they're lazy, but because it's genuinely not a good use of a person's time. That's the actual case for automation: not that people are bad at QA, but that some QA work is mechanical enough that a person doing it by hand is the expensive option.</p>

<h2>What an Automated Website Audit API Actually Checks</h2>

<p>An audit API is only useful if it checks specific, real things — not a vague "SEO score." A useful automated audit covers at least these seven dimensions, each mapped to a concrete failure mode:</p>

<ul>
  <li><strong>SEO &amp; structured data</strong> — missing or duplicate title tags, absent meta descriptions, broken or missing <code>hreflang</code> pairs, invalid or missing Schema.org markup that would otherwise qualify a page for rich results.</li>
  <li><strong>Core Web Vitals &amp; performance</strong> — real LCP, CLS and FCP measurements captured from an actual rendered page (not a synthetic guess), plus render-blocking resources and unminified assets past a size threshold worth fixing.</li>
  <li><strong>Security headers &amp; infrastructure</strong> — missing HSTS, absent or misconfigured CSP, cookies missing the <code>Secure</code>/<code>HttpOnly</code> flags, TLS misconfiguration.</li>
  <li><strong>Broken links &amp; images</strong> — dead internal and outbound links, broken image sources, crawled across the site rather than just the homepage.</li>
  <li><strong>Marketing tracking hygiene</strong> — whether GA4, Meta Pixel, or TikTok Pixel are actually firing where the marketing team assumes they are.</li>
  <li><strong>WCAG accessibility</strong> — insufficient color contrast, missing alt text, unlabeled form fields, keyboard-trap risks.</li>
  <li><strong>E-commerce catalogue integrity</strong> — product pages missing price or availability schema, broken product images, pages that 404 despite still being linked from a category page.</li>
</ul>

<p>The value of running all seven together, rather than one tool per concern, is that a single scan gives you one health score and one report to act on — instead of six browser tabs and no combined picture of what actually matters this week.</p>

<p>One detail worth knowing if your site is a React, Vue, or any other JavaScript-rendered app: a plain HTTP fetch of the page only sees the empty shell your framework ships before it hydrates — no real title, no real content, no real links. A useful audit needs to render the page in an actual browser first, the same way a visitor's browser would, before checking any of the above. Anything that skips that step will report a JS-rendered site as broken when it isn't — missing H1, zero internal links, no structured data — none of it real, all of it just an artifact of checking the wrong HTML.</p>

<h2>Running Your First Automated Audit via the API</h2>

<h3>Authenticating and sending your first request</h3>

<p>Every 4uTest account with an active plan can generate an API key from account settings. Requests are authenticated with a standard Bearer token:</p>

<pre><code>curl -X POST https://4utest.com/api/v1/scans \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "name": "Pre-deploy check"
  }'</code></pre>

<p>That call queues a full seven-module audit and returns a scan ID immediately — the audit itself runs in the background, since a real headless-browser-driven scan of a multi-page site takes longer than a single HTTP request should ever block for.</p>

<h3>Reading the response and the health score</h3>

<p>Poll the same scan by ID until it reports a terminal status:</p>

<pre><code>curl https://4utest.com/api/v1/scans/{id} \
  -H "Authorization: Bearer YOUR_API_KEY"</code></pre>

<p>The response includes an overall health score plus a per-module breakdown — something close to a top-level score, a status per audit dimension, and a list of individual findings each tagged with a severity. That per-module breakdown is what makes the response useful to a script rather than just a person: a CI job can check "did the security module specifically regress" without having to parse prose out of a report.</p>

<p>This is also where a CI job makes a simple pass/warn/fail decision, based on whether the score — or a specific module's findings — crossed a threshold you define. That last part matters more than the score itself. A static "must be 100/100" gate will fail constantly on findings that don't matter at your site's scale. A gate on <em>score didn't drop</em>, or <em>no new critical findings</em>, is the one worth wiring into a pipeline.</p>

<h2>Going Further: Auditing Your Site From Your Editor With an MCP Agent</h2>

<h3>What MCP actually gets you, practically</h3>

<p>Model Context Protocol (MCP) lets an AI coding agent — Claude Code, Cursor, or anything else that speaks MCP — call real tools instead of just generating text. Once 4uTest's MCP agent is connected, the agent can trigger a real scan, read the real result, and act on it inside the same conversation where you're already writing code. You're not switching to a dashboard, copying a URL, waiting, then switching back to explain the result to your AI assistant by hand — the agent does all three steps itself.</p>

<h3>Prompts that actually get used, not demo prompts</h3>

<p>In practice, this looks like typing something close to normal language into an agent that already has the MCP tools available:</p>

<ul>
  <li>"Audit my staging site before I deploy this branch."</li>
  <li>"Check WCAG compliance on the new pricing page I just built."</li>
  <li>"Compare this scan against last week's — did anything regress?"</li>
</ul>

<p>The agent runs the scan, reads the JSON result, and reports back in the same terms you asked in — not a raw payload dump. That's the actual point of the integration: the audit becomes a step in your normal workflow instead of a separate tool you have to remember to open.</p>

<h3>Wiring a scan into a pre-deploy step</h3>

<p>The same API call from the previous section works identically from a CI job — a GitHub Actions step, a pre-deploy hook, or a Claude Code slash command, can call <code>POST /api/v1/scans</code> against a staging URL, poll for completion, and fail the pipeline if the health score drops below whatever threshold your team has agreed on. The mechanism is the same whether a human triggers it conversationally or a pipeline triggers it automatically — the only difference is who's asking.</p>

<h2>Building a Recurring Automated QA Workflow</h2>

<h3>Scheduling recurring scans</h3>

<p>Not every check belongs in a pre-deploy gate — some things drift slowly and are better caught on a schedule than on every single commit. A nightly or weekly scan, triggered by a cron job or a scheduled CI workflow calling the same API, catches the regressions that don't come from your own deploys: a third-party script that started injecting a broken tag, a CMS auto-update that changed a template, a certificate that's about to expire.</p>

<h3>Alerting on regressions, not fluctuations</h3>

<p>The fastest way to get an automated QA workflow ignored is to alert on every scan regardless of whether anything meaningful changed. Score a baseline, then alert only when: the score drops by more than a small tolerance, a new <em>critical</em>-severity finding appears, or a previously-passing check starts failing. Everything else — an occasional flaky third-party script timeout, a one-point score wobble — should stay silent. A workflow people mute within a week isn't automation, it's noise with extra steps.</p>

<p>Ownership matters here too. A scan that only the developer who set it up ever looks at will quietly stop mattering the day that person is on vacation or moves to a different project. Route the alert to wherever the team already pays attention — a shared Slack channel, the same place deploy notifications go — not a personal inbox. The goal is for a regression to be everyone's problem to notice, not one person's problem to remember to check for.</p>

<h2>Common Mistakes Teams Make When Automating QA</h2>

<ul>
  <li><strong>Testing everything with equal weight.</strong> Not every finding deserves to block a deploy. A missing <code>alt</code> attribute on a decorative icon and a broken checkout link are not the same severity — treat them that way in your gate logic, not just in the report's UI.</li>
  <li><strong>Never revisiting thresholds as the site grows.</strong> A gate tuned for a 20-page site will either be uselessly loose or absurdly strict once the site is 400 pages. Revisit the threshold when the site's shape changes, not just when it was first set up.</li>
  <li><strong>Treating the first scan's score as the bar.</strong> Sites that have never been audited before often start in the 50s and 60s — not because they're badly built, but because nobody has looked yet. The number that matters is the trend from your own baseline, not an absolute score compared to someone else's site.</li>
</ul>

<p>Automating this doesn't mean removing judgment from the process — it means moving the judgment call to where you set the thresholds, instead of re-making it by hand every single time a page ships.</p>

<p>Tools like <a href="https://4utest.com">4uTest</a> run all seven of these checks in a single scan and expose them through both a dashboard and an API — so whichever workflow above fits your team, the same scan powers all of it.</p>

<p>The teams that stop dreading their own deploys aren't the ones with the fewest bugs. They're the ones who found out about the bug from a scan instead of from a customer.</p>
HTML;

    public function handle(BlogCoverImageService $coverImageService): int
    {
        if (BlogPost::where('title', self::TITLE)->exists()) {
            $this->info('Hero article already exists — nothing to do.');
            return self::SUCCESS;
        }

        $authorId = User::where('is_admin', true)->value('id') ?? User::first()?->id;
        if (! $authorId) {
            $this->error('No user found to attribute this post to. Create at least one user first.');
            return self::FAILURE;
        }

        $slug = BlogPost::generateSlug(self::TITLE);

        $post = BlogPost::create([
            'user_id'          => $authorId,
            'locale'           => 'en',
            'title'            => self::TITLE,
            'slug'             => $slug,
            'excerpt'          => self::EXCERPT,
            'meta_description' => self::META_DESCRIPTION,
            'content'          => self::CONTENT,
            'featured_image'   => $coverImageService->generate(self::TITLE, $slug),
            'status'           => 'published',
            'published_at'     => now(),
        ]);

        $this->info("Published: /blog/{$post->slug}");
        return self::SUCCESS;
    }
}
