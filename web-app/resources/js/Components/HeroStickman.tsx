/**
 * Decorative mascot: a stick figure that patrols back and forth beneath the
 * hero heading, with a running gait + periodic jumps. Pure CSS animation
 * (keyframes defined in resources/css/app.css) — no animation library is a
 * dependency of this project, so this stays consistent with that.
 * Color follows currentColor (black in light theme, white in dark) via the
 * text-gray-900 dark:text-white classes below.
 */
export default function HeroStickman() {
    return (
        <div className="hero-stickman-track" aria-hidden="true">
            <div className="hero-stickman text-gray-900 dark:text-white">
                <svg viewBox="0 0 46 90" className="h-full w-full overflow-visible">
                    <circle cx="23" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="3.5" />
                    <line x1="23" y1="19" x2="23" y2="52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="23" cy="24" r="2.2" fill="currentColor" />
                    <circle cx="23" cy="52" r="2.2" fill="currentColor" />
                    <g className="hero-stickman-limb hero-stickman-arm-l" style={{ transformOrigin: '23px 24px' }}>
                        <line x1="23" y1="24" x2="12" y2="45" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                    </g>
                    <g className="hero-stickman-limb hero-stickman-arm-r" style={{ transformOrigin: '23px 24px' }}>
                        <line x1="23" y1="24" x2="34" y2="45" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                    </g>
                    <g className="hero-stickman-limb hero-stickman-leg-l" style={{ transformOrigin: '23px 52px' }}>
                        <line x1="23" y1="52" x2="12" y2="82" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                    </g>
                    <g className="hero-stickman-limb hero-stickman-leg-r" style={{ transformOrigin: '23px 52px' }}>
                        <line x1="23" y1="52" x2="34" y2="82" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                    </g>
                </svg>
            </div>
        </div>
    );
}
