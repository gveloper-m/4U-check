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
    language?: string;
    is_agency?: boolean;
    agency_logo?: string | null;
    agency_primary_color?: string | null;
    agency_secondary_color?: string | null;
    agency_footer_text?: string | null;
}

export interface FullAuditReport {
    id: number;
    user_id: number;
    name?: string;
    site_url: string;
    status: 'running' | 'completed' | 'failed';
    share_uuid?: string | null;
    share_enabled?: boolean;
    health_score?: number;
    score_deductions?: import('@/lib/deductions').Deduction[];
    seo_schema_result?: Record<string, unknown>;
    security_result?: Record<string, unknown>;
    catalog_result?: Record<string, unknown>;
    tracking_result?: Record<string, unknown>;
    broken_resources_result?: Record<string, unknown>;
    performance_result?: Record<string, unknown>;
    accessibility_result?: Record<string, unknown>;
    fuzz_requested?: boolean;
    fuzz_testing_result?: Record<string, unknown>;
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
    last_report?: {
        id: number;
        health_score: number | null;
        status: string;
    } | null;
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
    prev_page_url: string | null;
    next_page_url: string | null;
}

export interface TicketAttachment {
    id: number;
    ticket_message_id: number;
    filename: string;
    path: string;
    url: string;
}

export interface TicketMessage {
    id: number;
    ticket_id: number;
    user_id: number;
    body: string;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string; is_admin?: boolean };
    attachments?: TicketAttachment[];
}

export interface Ticket {
    id: number;
    user_id: number;
    subject: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string; email: string; company_name?: string | null };
    messages?: TicketMessage[];
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        openTicketsCount?: number | null;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};
