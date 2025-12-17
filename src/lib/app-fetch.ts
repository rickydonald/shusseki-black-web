import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

const appFetch = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5173/api",
    withCredentials: true,
    timeout: 10000,
});

appFetch.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("authToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers["Accept"] = "application/json";

        return config;
    },
    (error: AxiosError) => {
        console.error("Request error:", error.message);
        return Promise.reject(error);
    }
);

appFetch.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response) {
            const { status, data } = error.response;
            switch (status) {
                case 401:
                    console.warn("Unauthorized — maybe redirect to login?");
                    break;
                case 403:
                    console.warn("Forbidden — you don’t have access.");
                    break;
                case 404:
                    console.warn("Not Found:", data);
                    break;
                case 500:
                    console.error("Server error:", data);
                    break;
            }
        } else if (error.request) {
            console.error("No response received from server.");
        } else {
            console.error("Error setting up request:", error.message);
        }

        return Promise.reject(error);
    }
);

export default appFetch;