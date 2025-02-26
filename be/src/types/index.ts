import { Request } from "express";

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  outstandingAmount: number;
  paymentDueDate: Date;
  paymentStatus: PaymentStatus;
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  OVERDUE = "OVERDUE",
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

// Update SearchParams interface
export interface SearchParams {
  searchTerm?: string;
  paymentStatus?: PaymentStatus[];
  dueDateStart?: string;
  dueDateEnd?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortField?: SortField;
  sortOrder?: SortOrder;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUser {
  name: string;
  email: string;
  password: string;
}

export interface Payment {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: PaymentStatus;
  paymentDate: Date;
  transactionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
}

export interface PaymentUpdateRequest {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export enum NotificationType {
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYMENT_OVERDUE = "PAYMENT_OVERDUE",
  CUSTOMER_ADDED = "CUSTOMER_ADDED",
}

export interface Notification {
  id?: string;
  type: NotificationType;
  message: string;
  userId: string;
  read: boolean;
  data?: any;
  createdAt: Date;
}
