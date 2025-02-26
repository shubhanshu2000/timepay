import { Request, Response } from "express";
import * as customerService from "../services/customerService";
import { Customer, PaymentStatus, SearchParams } from "../types";
import xlsx from "xlsx";
import { EXCEL_HEADERS } from "../constants/excelTemplate";
import { createValidationError } from "../types/errors";

export const searchCustomers = async (
  req: Request<{}, {}, {}, SearchParams>,
  res: Response
) => {
  try {
    const result = await customerService.searchCustomers(req.query);

    res.json({
      success: true,
      data: result.customers,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
      aggregations: result.aggregations,
    });
  } catch (error) {
    console.error("Search customers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search customers",
    });
  }
};

export const createCustomer = async (
  req: Request<{}, {}, Customer>,
  res: Response
) => {
  try {
    if (!req.body.email || !req.body.name) {
      throw createValidationError("Name and email are required");
    }

    const result = await customerService.createCustomer(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create customer",
    });
  }
};

export const updateCustomer = async (
  req: Request<{ id: string }, {}, Partial<Customer>>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await customerService.updateCustomer(id, updates);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: {
        id,
        ...updates,
      },
    });
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update customer",
    });
  }
};

export const deleteCustomer = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const result = await customerService.deleteCustomer(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete customer",
    });
  }
};

export const bulkUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw createValidationError("Please upload an Excel file");
    }

    // Validate file size
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: "File size too large. Maximum size is 5MB",
      });
    }

    try {
      // Try to read Excel file
      const workbook = xlsx.read(req.file.buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = xlsx.utils.sheet_to_json(sheet);

      // Check if file is empty
      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Excel file is empty",
        });
      }

      // Validate headers
      const fileHeaders = Object.keys(rows[0] || {});
      const missingHeaders = EXCEL_HEADERS.filter(
        (header) => !fileHeaders.includes(header)
      );

      if (missingHeaders.length > 0) {
        throw createValidationError(
          `Missing required columns: ${missingHeaders.join(", ")}`
        );
      }

      const results: {
        total: number;
        successful: {
          row: number;
          id: string;
          email: string;
          name: string; // Added
          paymentStatus: string; // Added
          outstandingAmount: number; // Added
        }[];
        failed: { row: number; data: any; errors: string[] }[];
      } = {
        total: rows.length,
        successful: [],
        failed: [],
      };

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // Excel row number (accounting for header)

        try {
          // Validate row data
          const validationErrors = validateCustomerData(row);

          if (validationErrors.length > 0) {
            results.failed.push({
              row: rowNumber,
              data: row,
              errors: validationErrors,
            });
            continue;
          }

          // Format data
          const customerData = {
            name: row.name,
            email: row.email.toLowerCase(),
            phone: row.phone ? row.phone.toString() : undefined,
            outstandingAmount: parseFloat(row.outstandingAmount),
            paymentDueDate:
              typeof row.paymentDueDate === "number"
                ? new Date((row.paymentDueDate - 25569) * 86400 * 1000)
                : new Date(row.paymentDueDate),
            paymentStatus: row.paymentStatus,
          };

          // Create customer
          const customer = await customerService.createCustomer(customerData);
          results.successful.push({
            row: rowNumber,
            id: customer._id,
            email: customer.email,
            name: customer.name,
            paymentStatus: customer.paymentStatus,
            outstandingAmount: customer.outstandingAmount,
          });
        } catch (error) {
          results.failed.push({
            row: rowNumber,
            data: row,
            errors: [(error as Error).message],
          });
        }
      }

      // Return detailed summary
      res.json({
        success: true,
        summary: {
          total: results.total,
          successful: results.successful.length,
          failed: results.failed.length,
        },
        details: {
          successful: results.successful,
          failed: results.failed,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid Excel file format",
      });
    }
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process Excel file",
    });
  }
};

function validateCustomerData(row: any): string[] {
  const errors = [];

  // Name validation
  if (!row.name) {
    errors.push("Name is required");
  }

  // Email validation
  if (!row.email) {
    errors.push("Email is required");
  } else if (!isValidEmail(row.email)) {
    errors.push("Invalid email format");
  }

  // Phone validation
  if (row.phone) {
    const phoneStr = row.phone.toString();
    if (phoneStr.length !== 10) {
      errors.push("Phone number must be 10 digits");
    } else if (!/^\d+$/.test(phoneStr)) {
      errors.push("Phone number must contain only digits");
    }
  }

  // Outstanding amount validation
  if (row.outstandingAmount === undefined || row.outstandingAmount === "") {
    errors.push("Outstanding amount is required");
  } else if (isNaN(parseFloat(row.outstandingAmount))) {
    errors.push("Outstanding amount must be a number");
  } else if (parseFloat(row.outstandingAmount) < 0) {
    errors.push("Outstanding amount cannot be negative");
  }

  // Payment due date validation
  if (!row.paymentDueDate) {
    errors.push("Payment due date is required");
  } else {
    let date;
    if (typeof row.paymentDueDate === "number") {
      // Convert Excel date number to JS Date
      date = new Date((row.paymentDueDate - 25569) * 86400 * 1000);
    } else {
      date = new Date(row.paymentDueDate);
    }

    if (isNaN(date.getTime())) {
      errors.push("Invalid date format (use YYYY-MM-DD or valid Excel date)");
    }
  }

  // Payment status validation
  if (!row.paymentStatus) {
    errors.push("Payment status is required");
  } else if (
    ![
      PaymentStatus.PENDING,
      PaymentStatus.COMPLETED,
      PaymentStatus.OVERDUE,
    ].includes(row.paymentStatus)
  ) {
    errors.push(
      `Invalid payment status. Must be one of: ${Object.values(
        PaymentStatus
      ).join(", ")}`
    );
  }

  return errors;
}

// In your bulkUpload function, update the customerData formatting:

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}
