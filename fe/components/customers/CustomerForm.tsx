// src/components/customers/CustomerForm.tsx
"use client";

import { useState } from "react";
import { apiCall, endpoints } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Customer, CustomerFormData, PaymentStatus } from "@/types";

interface CustomerFormProps {
  onSuccess?: () => void;
  initialData?: Customer;
}

export function CustomerForm({ onSuccess, initialData }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    outstandingAmount: initialData?.outstandingAmount || 0,
    paymentDueDate: initialData?.paymentDueDate
      ? new Date(initialData.paymentDueDate).toISOString().split("T")[0]
      : "",
    paymentStatus: initialData?.paymentStatus || PaymentStatus.PENDING,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiCall(
        initialData
          ? endpoints.customers.update(initialData.id)
          : endpoints.customers.create,
        initialData ? "PUT" : "POST",
        formData
      );
      onSuccess?.();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outstandingAmount">Outstanding Amount</Label>
        <Input
          id="outstandingAmount"
          type="number"
          min="0"
          step="0.01"
          value={formData.outstandingAmount}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              outstandingAmount: parseFloat(e.target.value),
            }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentDueDate">Payment Due Date</Label>
        <Input
          id="paymentDueDate"
          type="date"
          value={formData.paymentDueDate}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              paymentDueDate: e.target.value,
            }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentStatus">Payment Status</Label>
        <Select
          value={formData.paymentStatus}
          onValueChange={(value: PaymentStatus) =>
            setFormData((prev) => ({ ...prev, paymentStatus: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={PaymentStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={PaymentStatus.OVERDUE}>Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {initialData ? "Updating..." : "Creating..."}
          </div>
        ) : initialData ? (
          "Update Customer"
        ) : (
          "Create Customer"
        )}
      </Button>
    </form>
  );
}
