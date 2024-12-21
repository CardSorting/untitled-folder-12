// Types for Celery task management
export interface CeleryTask {
    id: string;
    name: string;
    args: any[];
    status: string;
    result: any;
    error: string | null;
    retries: number;
}

export interface CeleryTaskResult {
    status: string;
    result: any;
    error: string | null;
}

export interface CeleryTaskStatus {
    taskId: string;
    status: string;
    result?: any;
    error?: string;
    message?: string;
}

export interface TaskResponse {
    task_id: string;
    status: string;
    result?: any;
    error?: string;
    message?: string;
}

export interface HealthCheckResponse {
    status: string;
    version: string;
    uptime: number;
}
