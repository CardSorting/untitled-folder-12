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
    debug?: Record<string, any>;
}

// Content Script Ready Response
export interface ContentScriptReadyResponse extends BaseResponse {
    status: 'acknowledged';
}

// Process Text Response
export interface ProcessTextResponse extends BaseResponse {
    status: 'processing' | 'completed' | 'error';
    taskId?: string;
    result?: string;
}

// Context Menu Action Response
export interface ContextMenuActionResponse extends BaseResponse {
    status?: 'processing';
    taskId?: string;
}

// Update Settings Response
export interface UpdateSettingsResponse extends BaseResponse {
    status: 'updated';
    settings: TextProcessingSettings;
}

// Task Status Response
export interface TaskStatusResponse extends BaseResponse {
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress?: number;
    result?: string;
}

// Get Debug Info Response
export interface GetDebugInfoResponse extends BaseResponse {
    extensionId: string;
    manifestVersion: 2 | 3;
    permissions: string[];
    hostPermissions: string[];
    timestamp: number;
}

// Error Response
export interface ErrorResponse extends BaseResponse {
    error: string;
}
