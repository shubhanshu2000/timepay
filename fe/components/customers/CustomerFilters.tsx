// src/components/customers/CustomerFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentStatus, SortField, SortOrder } from "@/types";
import { Search, X } from "lucide-react";

interface CustomerFiltersProps {
  onFilterChange: (filters: {
    searchTerm?: string;
    paymentStatus?: PaymentStatus[];
    dueDateStart?: string;
    dueDateEnd?: string;
    minAmount?: number;
    maxAmount?: number;
    sortField?: SortField;
    sortOrder?: SortOrder;
  }) => void;
}

export function CustomerFilters({ onFilterChange }: CustomerFiltersProps) {
  const [filters, setFilters] = useState({
    searchTerm: "",
    paymentStatus: "ALL" as PaymentStatus | "ALL", // Changed initial value
    minAmount: "",
    maxAmount: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        ...filters,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        paymentStatus:
          filters.paymentStatus === "ALL"
            ? undefined
            : (filters.paymentStatus as PaymentStatus),
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleReset = () => {
    setFilters({
      searchTerm: "",
      paymentStatus: "ALL",
      minAmount: "",
      maxAmount: "",
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={filters.searchTerm}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
            }
            className="pl-8"
          />
        </div>

        {/* Payment Status Filter */}
        <Select
          value={filters.paymentStatus}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              paymentStatus: value as PaymentStatus | "ALL",
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={PaymentStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={PaymentStatus.OVERDUE}>Overdue</SelectItem>
          </SelectContent>
        </Select>

        {/* Amount Range */}
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min Amount"
            value={filters.minAmount}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, minAmount: e.target.value }))
            }
          />
          <span>-</span>
          <Input
            type="number"
            placeholder="Max Amount"
            value={filters.maxAmount}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))
            }
          />
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
