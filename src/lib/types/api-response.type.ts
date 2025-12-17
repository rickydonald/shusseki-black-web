export type ErrorCode = "invalid_csrf_token" | "missing_parameters" | "attendance_data_not_found";
export interface LoginResponse {
    response: boolean;
    error?: string;
    errorCode?: ErrorCode;
    redirectUrl?: string;
}