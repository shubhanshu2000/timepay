// src/components/customers/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Customer, PaymentStatus } from "@/types";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { PaymentForm } from "../payments/PaymentForm";
import { apiCall, endpoints } from "@/lib/api";
import { toast } from "sonner";
import { CustomerForm } from "./CustomerForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "outstandingAmount",
    header: "Outstanding Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("outstandingAmount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return formatted;
    },
  },
  {
    accessorKey: "paymentDueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("paymentDueDate"));
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Status",
    cell: ({ row }) => {
      const status: PaymentStatus = row.getValue("paymentStatus");
      return (
        <div
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${
            status === PaymentStatus.COMPLETED
              ? "bg-green-100 text-green-800"
              : status === PaymentStatus.PENDING
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const customer = row.original;
      const [showPayment, setShowPayment] = useState(false);
      const [showEditDialog, setShowEditDialog] = useState(false);
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [isLoading, setIsLoading] = useState(false);

      const handleDelete = async () => {
        try {
          setIsLoading(true);
          await apiCall(endpoints.customers.delete(customer.id!), "DELETE");
          toast.success("Customer deleted successfully");
          table.options.meta?.refreshData();
        } catch (error) {
          toast.error("Failed to delete customer");
        } finally {
          setIsLoading(false);
          setShowDeleteDialog(false);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setShowPayment(true)}>
                Process Payment
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                Edit customer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                Delete customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Payment Dialog */}
          <Dialog open={showPayment} onOpenChange={setShowPayment}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Process Payment</DialogTitle>
              </DialogHeader>
              <PaymentForm
                customerId={customer.id!}
                customerName={customer.name}
                onSuccess={() => {
                  setShowPayment(false);
                  table.options.meta?.refreshData();
                }}
                onCancel={() => setShowPayment(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
              </DialogHeader>
              <CustomerForm
                initialData={customer}
                onSuccess={() => {
                  setShowEditDialog(false);
                  table.options.meta?.refreshData();
                  toast.success("Customer updated successfully");
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {customer.name}'s account and
                  remove their data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Deleting...
                    </div>
                  ) : (
                    "Delete Customer"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    },
  },
];
