// src/components/customers/CustomerList.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";
import { apiCall, endpoints } from "@/lib/api";
import {
  ApiResponse,
  Customer,
  PaymentStatus,
  SortField,
  SortOrder,
  NotificationType,
} from "@/types";
import { CustomerFilters } from "./CustomerFilters";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { CustomerActions } from "./CustomerActions";

export function CustomerList() {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<ApiResponse | null>(null);
  const [filters, setFilters] = useState({
    searchTerm: "" as string | undefined,
    paymentStatus: [] as PaymentStatus[] | undefined,
    dueDateStart: "" as string | undefined,
    dueDateEnd: "" as string | undefined,
    minAmount: undefined as number | undefined,
    maxAmount: undefined as number | undefined,
    sortField: SortField.CREATED_AT,
    sortOrder: SortOrder.DESC,
    page: 1,
    limit: 10,
  });

  // Refs for debouncing
  const fetchTimeoutRef = useRef<NodeJS.Timeout>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Memoized fetch function
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall<ApiResponse>(
        endpoints.customers.search,
        "GET",
        null,
        {
          params: filters,
        }
      );

      if (response.success) {
        setCustomers(response.data);
        setResponseData(response);
        setError(null);
      }
    } catch (error: any) {
      setError(error.message);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleWebSocketMessage = useCallback(
    (message: any) => {
      if (!message?.type || !message?.data) return;

      // Debounce data refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        fetchCustomers();
      }, 1000);
      console.log(message, "mesage");

      // Handle different notification types
      switch (message.type) {
        case "PAYMENT_RECEIVED":
          toast.success(message.data.message);
          break;
        case "PAYMENT_OVERDUE":
          toast.error(message.data.message);
          break;
        case "PAYMENT_UPDATE":
          toast.success(message.data.message);
          break;
        case "CUSTOMER_ADDED":
          toast.success(message.data.message);
          break;
        case "NOTIFICATION":
          // Handle generic notifications
          if (message.data.type) {
            switch (message.data.type) {
              case NotificationType.PAYMENT_RECEIVED:
                toast.success(message.data.message);
                break;
              case NotificationType.PAYMENT_OVERDUE:
                toast.error(message.data.message);
                break;
              case NotificationType.CUSTOMER_ADDED:
                toast.success(message.data.message);
                break;
            }
          }
          break;
      }
    },
    [fetchCustomers]
  );

  // WebSocket connection
  useWebSocket(handleWebSocketMessage);

  // Filter changes effect
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [filters, fetchCustomers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mt-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <CustomerActions onCustomerChange={fetchCustomers} />
      </div>

      {/* Stats Cards */}
      {responseData?.aggregations && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-600">Total Outstanding</h3>
            <p className="text-2xl font-bold">
              $
              {responseData.aggregations.total_outstanding?.value?.toFixed(2) ||
                "0.00"}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-600">Average Outstanding</h3>
            <p className="text-2xl font-bold">
              $
              {responseData.aggregations.avg_outstanding?.value?.toFixed(2) ||
                "0.00"}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-600">Status Distribution</h3>
            <div className="space-y-2 mt-2">
              {responseData.aggregations.status_counts?.buckets?.map(
                (bucket) => (
                  <div
                    key={bucket.key}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-600">{bucket.key}</span>
                    <span className="font-semibold">{bucket.doc_count}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <CustomerFilters
        onFilterChange={(newFilters) =>
          setFilters((prev) => ({
            ...prev,
            ...newFilters,
          }))
        }
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        pagination={{
          total: responseData?.pagination?.total?.value || 0,
          page: filters.page,
          limit: filters.limit,
        }}
        onPaginationChange={(page, limit) => {
          setFilters((prev) => ({
            ...prev,
            page,
            limit,
          }));
        }}
        isLoading={loading}
        onRefresh={fetchCustomers}
      />
    </div>
  );
}
