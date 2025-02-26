import { Request, Response } from "express";
import * as paymentService from "../services/paymentService";
import { PaymentStatus, PaymentUpdateRequest } from "../types";
import { createValidationError } from "../types/errors";

export const processPayment = async (
  req: Request<{}, {}, PaymentUpdateRequest>,
  res: Response
) => {
  try {
    const { customerId, amount } = req.body;

    if (!customerId || !amount) {
      throw createValidationError("Customer ID and amount are required");
    }

    if (amount <= 0) {
      throw createValidationError("Amount must be greater than 0");
    }

    const paymentData = {
      ...req.body,
      userId: req.user!.id,
    };

    const result = await paymentService.processPayment(paymentData);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({
      success: false,
      error: "Payment processing failed",
    });
  }
};

export const getPaymentHistory = async (
  req: Request<{ customerId: string }>,
  res: Response
) => {
  try {
    const payments = await paymentService.getPaymentHistory(
      req.params.customerId
    );
    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment history",
    });
  }
};

export const updateStatus = async (
  req: Request<{ customerId: string }, {}, { status: PaymentStatus }>,
  res: Response
) => {
  try {
    const { customerId } = req.params;
    const { status } = req.body;

    if (!Object.values(PaymentStatus).includes(status)) {
      throw createValidationError("Invalid payment status");
    }
    // Validate status
    if (!Object.values(PaymentStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment status",
      });
    }

    const result = await paymentService.updatePaymentStatus(customerId, status);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update payment status",
    });
  }
};
