export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    is_unlimited: boolean;
    is_admin: boolean;
    phone?: string | null;
    company_name?: string | null;
    company_site?: string | null;
    stripe_id?: string;
    pm_type?: string;
    pm_last_four?: string;
}

export interface FullAuditReport {
    id: number;
    user_id: number;
    name?: string;
    site_url: string;
    status: 'running' | 'completed' | 'failed';
    health_score?: number;
    score_deductions?: string[];
    seo_schema_result?: Record<string, unknown>;
    security_result?: Record<string, unknown>;
    catalog_result?: Record<string, unknown>;
    tracking_result?: Record<string, unknown>;
    broken_resources_result?: Record<string, unknown>;
    performance_result?: Record<string, unknown>;
    accessibility_result?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface ScheduledScan {
    id: number;
    user_id: number;
    name: string;
    site_url: string;
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
    is_active: boolean;
    notify_email: boolean;
    last_run_at?: string;
    next_run_at: string;
    last_report_id?: number;
    created_at: string;
    updated_at: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};
