// src/lib/api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { useRouter } from "next/navigation";

// Define response types
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from storage
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle successful responses
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // Redirect to login
      window.location.href = "/auth/login";
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Handle forbidden access
      window.location.href = "/unauthorized";
      return Promise.reject(error);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject({
        ...error,
        message: "The requested resource was not found",
      });
    }

    // Handle 422 Validation Error
    if (error.response?.status === 422) {
      return Promise.reject({
        ...error,
        message: "Validation failed",
        errors: error.response.data.errors,
      });
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        ...error,
        message: "Network error occurred. Please check your connection.",
      });
    }

    // Handle other errors
    return Promise.reject({
      ...error,
      message: error.response?.data?.message || "An unexpected error occurred",
    });
  }
);

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export const apiCall = async <T>(
  endpoint: string,
  method: HttpMethod = "GET",
  data?: any,
  config?: Partial<AxiosRequestConfig>
): Promise<ApiResponse<T>> => {
  try {
    const response = await api.request({
      url: endpoint,
      method,
      data,
      ...config,
    });

    return response.data;
  } catch (error: any) {
    // Format error message
    const errorMessage = error.message || "An error occurred";

    // Log error (you can add more sophisticated logging here)
    console.error(`API Error: ${endpoint}`, {
      method,
      error: errorMessage,
      details: error,
    });

    // Throw formatted error
    throw new Error(errorMessage);
  }
};

// API endpoints
export const endpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
  customers: {
    search: "/customers/search",
    create: "/customers",
    update: (id: string) => `/customers/${id}`,
    delete: (id: string) => `/customers/${id}`,
    bulkUpload: "/customers/bulk-upload",
  },
  payments: {
    process: "/payments/process",
    history: (customerId: string) => `/payments/history/${customerId}`,
    updateStatus: (customerId: string) => `/payments/status/${customerId}`,
  },
  notifications: {
    list: "/notifications",
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: "/notifications/mark-all-read",
  },
};
