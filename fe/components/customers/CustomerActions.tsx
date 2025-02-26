// src/components/customers/CustomerActions.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "./CustomerForm";
import { CustomerBulkUpload } from "./CustomerBulkUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CustomerActionsProps {
  onCustomerChange: () => void;
}

export function CustomerActions({ onCustomerChange }: CustomerActionsProps) {
  const [dialog, setDialog] = useState<"new" | "upload" | null>(null);

  return (
    <div className="flex gap-2">
      <Button onClick={() => setDialog("new")}>Add Customer</Button>
      <Button variant="outline" onClick={() => setDialog("upload")}>
        Bulk Upload
      </Button>

      <Dialog open={dialog === "new"} onOpenChange={() => setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSuccess={() => {
              setDialog(null);
              onCustomerChange();
              toast.success("Customer added successfully");
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "upload"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bulk Upload Customers</DialogTitle>
          </DialogHeader>
          <CustomerBulkUpload
            onSuccess={() => {
              setDialog(null);
              onCustomerChange();
              toast.success("Customers data uploaded successfully");
            }}
            onClose={() => setDialog(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
