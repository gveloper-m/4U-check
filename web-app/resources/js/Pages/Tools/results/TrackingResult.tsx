import { Panel, StatCard, StatGrid, Row, SectionTitle, EmptyGood } from '../Shared';

interface TrackingPlatform {
    detected: boolean;
    ids: string[];
}

interface Data {
    site_url: string;
    pages_crawled: number;
    tracking_scripts: {
        ga4: TrackingPlatform;
        facebook_pixel: TrackingPlatform;
        tiktok_pixel: TrackingPlatform;
    };
    executed_at: string;
}

interface PlatformConfig {
    key: keyof Data['tracking_scripts'];
    label: string;
    notDetectedHint: string;
}

const PLATFORMS: PlatformConfig[] = [
    {
        key: 'ga4',
        label: 'Google Analytics 4',
        notDetectedHint:
            'No gtag.js or Google Tag Manager reference was found on the pages crawled — if you expect analytics here, check your tag manager setup.',
    },
    {
        key: 'facebook_pixel',
        label: 'Meta / Facebook Pixel',
        notDetectedHint: 'No Meta/Facebook Pixel base code (fbq(...)) was found.',
    },
    {
        key: 'tiktok_pixel',
        label: 'TikTok Pixel',
        notDetectedHint: 'No TikTok Pixel snippet (ttq.load(...)) was found.',
    },
];

export default function TrackingResult({ data }: { data: Data }) {
    const detectedCount = PLATFORMS.filter((p) => data.tracking_scripts[p.key].detected).length;

    return (
        <div>
            <StatGrid>
                <StatCard label="Pages crawled" value={data.pages_crawled} />
                <StatCard label="Platforms detected" value={`${detectedCount} / ${PLATFORMS.length}`} tone={detectedCount > 0 ? 'good' : 'neutral'} />
                <StatCard label="Executed" value={data.executed_at} tone="neutral" />
            </StatGrid>

            <SectionTitle>Tracking scripts</SectionTitle>
            <div className="space-y-3">
                {PLATFORMS.map((platform) => {
                    const info = data.tracking_scripts[platform.key];
                    return (
                        <Panel key={platform.key}>
                            <Row
                                label={platform.label}
                                value={info.detected ? 'Detected' : 'Not detected'}
                                ok={info.detected}
                            />
                            {info.detected ? (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 break-all">
                                    ID{info.ids.length > 1 ? 's' : ''}: {info.ids.length > 0 ? info.ids.join(', ') : 'N/A'}
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{platform.notDetectedHint}</div>
                            )}
                        </Panel>
                    );
                })}
            </div>

            {detectedCount === PLATFORMS.length && (
                <div className="mt-4">
                    <EmptyGood text="All checked tracking platforms are present on this site." />
                </div>
            )}
        </div>
    );
}
