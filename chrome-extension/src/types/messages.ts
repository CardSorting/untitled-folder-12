// Type definitions for extension messages
import { TextProcessingOptions, TextProcessingSettings } from './settings';

// Message Types
export type MessageType = 
    | 'contentScriptReady'
    | 'processText'
    | 'contextMenuAction'
    | 'updateSettings'
    | 'taskStatus'
    | 'getDebugInfo';

// Base Message Interface
export interface BaseMessage {
    type: MessageType;
}

// Content Script Ready Message
export interface ContentScriptReadyMessage extends BaseMessage {
    type: 'contentScriptReady';
}

// Process Text Message
export interface ProcessTextMessage extends BaseMessage {
    type: 'processText';
    text: string;
    options?: TextProcessingOptions;
}

// Context Menu Action Message
export interface ContextMenuActionMessage extends BaseMessage {
    type: 'contextMenuAction';
    menuId: string;
    text?: string;
    settings?: TextProcessingSettings;
}

// Update Settings Message
export interface UpdateSettingsMessage extends BaseMessage {
    type: 'updateSettings';
    settings: TextProcessingSettings;
}

// Task Status Message
export interface TaskStatusMessage extends BaseMessage {
    type: 'taskStatus';
    taskId: string;
}

// Get Debug Info Message
export interface GetDebugInfoMessage extends BaseMessage {
    type: 'getDebugInfo';
}

// Extension Message Type
export type ExtensionMessage = 
    | ContentScriptReadyMessage
    | ProcessTextMessage
    | ContextMenuActionMessage
    | UpdateSettingsMessage
    | TaskStatusMessage
    | GetDebugInfoMessage;

// Response Types
export type ExtensionResponse = 
    | ContentScriptReadyResponse
    | ProcessTextResponse
    | ContextMenuActionResponse
    | UpdateSettingsResponse
    | TaskStatusResponse
    | GetDebugInfoResponse
    | ErrorResponse;

// Base Response Interface
export interface BaseResponse {
    error?: string;
    code?: string;
    debug?: Record<string, any>;
}

// Base Error Response
export interface BaseErrorResponse extends BaseResponse {
    status: 'error';
    error: string;
    code: string;
}

// Content Script Ready Response
export type ContentScriptReadyResponse = 
    | { status: 'acknowledged'; debug?: Record<string, any>; }
    | BaseErrorResponse;

// Process Text Response
export type ProcessTextResponse = 
    | { status: 'processing' | 'completed'; taskId: string; result?: string; debug?: Record<string, any>; }
    | BaseErrorResponse;

// Context Menu Action Response
export type ContextMenuActionResponse = 
    | { status: 'processing'; taskId: string; debug?: Record<string, any>; }
    | BaseErrorResponse;

// Update Settings Response
export type UpdateSettingsResponse = 
    | { status: 'updated'; settings: TextProcessingSettings; debug?: Record<string, any>; }
    | BaseErrorResponse;

// Task Status Response
export type TaskStatusResponse = 
    | { status: 'pending' | 'processing' | 'completed'; progress?: number; result?: string; debug?: Record<string, any>; }
    | BaseErrorResponse;

// Get Debug Info Response
export type GetDebugInfoResponse = {
    extensionId: string;
    manifestVersion: 2 | 3;
    permissions: string[];
    hostPermissions: string[];
    timestamp: number;
    error?: string;
    code?: string;
    debug?: Record<string, any>;
};

// Error Response
export interface ErrorResponse extends BaseResponse {
    error: string;
}
