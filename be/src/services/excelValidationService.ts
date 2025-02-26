import xlsx from "xlsx";
import { Customer } from "../types";

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    column: string;
    message: string;
  }>;
  validData: Partial<Customer>[];
}

export const validateExcelFile = (buffer: Buffer): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    validData: [],
  };

  try {
    // Read Excel file
    const workbook = xlsx.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Required columns
    const requiredColumns = [
      "name",
      "email",
      "outstandingAmount",
      "paymentDueDate",
      "paymentStatus",
    ];

    // Validate structure
    const firstRow = data[0] as any;
    requiredColumns.forEach((column) => {
      if (!(column in firstRow)) {
        result.errors.push({
          row: 0,
          column,
          message: `Missing required column: ${column}`,
        });
      }
    });

    if (result.errors.length > 0) {
      result.isValid = false;
      return result;
    }

    // Validate each row
    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2; // Excel row number (1-based + header)

      // Validate name
      if (!row.name || typeof row.name !== "string") {
        result.errors.push({
          row: rowNumber,
          column: "name",
          message: "Name is required and must be text",
        });
      }

      // Validate email
      if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        result.errors.push({
          row: rowNumber,
          column: "email",
          message: "Invalid email format",
        });
      }

      // Validate amount
      if (isNaN(row.outstandingAmount)) {
        result.errors.push({
          row: rowNumber,
          column: "outstandingAmount",
          message: "Outstanding amount must be a number",
        });
      }

      // Validate date
      const dueDate = new Date(row.paymentDueDate);
      if (isNaN(dueDate.getTime())) {
        result.errors.push({
          row: rowNumber,
          column: "paymentDueDate",
          message: "Invalid date format",
        });
      }

      // Validate status
      if (!["PENDING", "COMPLETED", "OVERDUE"].includes(row.paymentStatus)) {
        result.errors.push({
          row: rowNumber,
          column: "paymentStatus",
          message: "Invalid payment status",
        });
      }

      // If row is valid, add to validData
      if (!result.errors.some((error) => error.row === rowNumber)) {
        result.validData.push({
          name: row.name,
          email: row.email,
          phone: row.phone,
          outstandingAmount: parseFloat(row.outstandingAmount),
          paymentDueDate: new Date(row.paymentDueDate),
          paymentStatus: row.paymentStatus,
        });
      }
    });

    result.isValid = result.errors.length === 0;
    return result;
  } catch (error) {
    result.isValid = false;
    result.errors.push({
      row: 0,
      column: "",
      message: "Failed to parse Excel file. Please check the file format.",
    });
    return result;
  }
};
