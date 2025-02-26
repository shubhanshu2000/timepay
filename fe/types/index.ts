// src/types/index.ts
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  outstandingAmount: number;
  paymentDueDate: Date | string;
  paymentStatus: PaymentStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  OVERDUE = "OVERDUE",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string; // For display purposes
  amount: number;
  status: PaymentStatus;
  paymentDate: string;
  transactionId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Date | string;
  data?: any;
}

export enum NotificationType {
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYMENT_OVERDUE = "PAYMENT_OVERDUE",
  CUSTOMER_ADDED = "CUSTOMER_ADDED",
}

export enum SortField {
  NAME = "name",
  EMAIL = "email",
  PAYMENT_DUE_DATE = "paymentDueDate",
  OUTSTANDING_AMOUNT = "outstandingAmount",
  PAYMENT_STATUS = "paymentStatus",
  CREATED_AT = "createdAt",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

// API Response Types
export interface ApiResponse {
  message?: string;
  success: boolean;
  data: Customer[];
  pagination: {
    total: {
      value: number;
      relation: string;
    };
    page: number;
    limit: number;
  };
  aggregations: {
    status_counts: {
      buckets: Array<{
        key: string;
        doc_count: number;
      }>;
    };
    total_outstanding: {
      value: number;
    };
    avg_outstanding: {
      value: number;
    };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Aggregations {
  status_counts: {
    buckets: Array<{
      key: string;
      doc_count: number;
    }>;
  };
  total_outstanding: {
    value: number;
  };
  avg_outstanding: {
    value: number;
  };
}

// Search/Filter Types
export interface CustomerFilters {
  searchTerm?: string;
  paymentStatus?: PaymentStatus;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: Date | string;
  toDate?: Date | string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Form Types
export interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  outstandingAmount: number;
  paymentDueDate: string;
  paymentStatus: PaymentStatus;
}

export interface BulkUploadResponse {
  success: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  details: {
    successful: Array<{
      row: number;
      id: string;
      email: string;
    }>;
    failed: Array<{
      row: number;
      data: any;
      errors: string[];
    }>;
  };
}
