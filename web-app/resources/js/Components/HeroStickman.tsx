import { useEffect, useRef, useState } from 'react';

/**
 * Decorative mascot: a stick figure that patrols back and forth beneath the
 * hero heading, with a running gait + periodic jumps. Pure CSS keyframe
 * animation (defined in resources/css/app.css) — no animation library is a
 * dependency of this project, so this stays consistent with that.
 * Color follows currentColor (black in light theme, white in dark) via the
 * text-gray-900 dark:text-white classes below.
 *
 * Scroll-follow: renders inline (normal document flow, right under the
 * heading) while the heading is in view. An IntersectionObserver — not
 * position: sticky — detects when the heading scrolls out of view and
 * switches it to position: fixed in a corner for the rest of the page.
 * Sticky was tried first and dropped: its "stuck" range is bound to its
 * parent element's height, which is fiddly to size correctly (too tall and
 * it overlaps whatever comes after the heading; too short and the follow
 * effect is barely noticeable — confirmed on the live site: an over-tight
 * wrapper made it look like it wasn't following scroll at all). Fixed
 * positioning has neither failure mode: it's viewport-relative by
 * definition, so "follows scroll" always just works.
 */
export default function HeroStickman() {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [isFixed, setIsFixed] = useState(false);

    useEffect(() => {
        const el = anchorRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsFixed(!entry.isIntersecting),
            { rootMargin: '-88px 0px 0px 0px' }, // account for the fixed h-16 header
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            {/* Invisible anchor marking where the heading is — observed instead of
                the stickman itself, since the stickman's own position changes. */}
            <div ref={anchorRef} style={{ height: 1 }} aria-hidden="true" />
            <div
                className={
                    isFixed
                        ? 'hero-stickman-track hero-stickman-track--fixed'
                        : 'hero-stickman-track'
                }
                aria-hidden="true"
            >
                <div className="hero-stickman text-gray-900 dark:text-white">
                    <svg viewBox="0 0 46 90" className="h-full w-full overflow-visible">
                        <circle cx="23" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="6" />
                        <line x1="23" y1="19" x2="23" y2="52" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        <circle cx="23" cy="24" r="3.4" fill="currentColor" />
                        <circle cx="23" cy="52" r="3.4" fill="currentColor" />
                        <g className="hero-stickman-limb hero-stickman-arm-l" style={{ transformOrigin: '23px 24px' }}>
                            <line x1="23" y1="24" x2="12" y2="45" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        </g>
                        <g className="hero-stickman-limb hero-stickman-arm-r" style={{ transformOrigin: '23px 24px' }}>
                            <line x1="23" y1="24" x2="34" y2="45" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        </g>
                        <g className="hero-stickman-limb hero-stickman-leg-l" style={{ transformOrigin: '23px 52px' }}>
                            <line x1="23" y1="52" x2="12" y2="82" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        </g>
                        <g className="hero-stickman-limb hero-stickman-leg-r" style={{ transformOrigin: '23px 52px' }}>
                            <line x1="23" y1="52" x2="34" y2="82" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        </g>
                    </svg>
                </div>
            </div>
        </>
    );
}
