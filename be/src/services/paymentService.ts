import { elasticClient } from "../config/elasticsearch";
import {
  NotificationType,
  Payment,
  PaymentStatus,
  PaymentUpdateRequest,
} from "../types";
import {
  handlePaymentOverdue,
  handlePaymentReceived,
} from "./notificationService";
import {
  notifyPaymentOverdue,
  notifyPaymentReceived,
  notifyPaymentUpdate,
} from "./websocketService";

export const processPayment = async (paymentData: PaymentUpdateRequest) => {
  try {
    // Check if payments index exists
    const indexExists = await elasticClient.indices.exists({
      index: "payments",
    });

    if (!indexExists) {
      throw new Error(
        "Payments index not initialized. Please contact administrator."
      );
    }

    const now = new Date();

    // Create payment record
    const payment: Payment = {
      customerId: paymentData.customerId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      notes: paymentData.notes,
      status: PaymentStatus.COMPLETED, // Changed to COMPLETED since payment is processed
      paymentDate: now,
      transactionId: generateTransactionId(),
      createdAt: now,
      updatedAt: now,
    };

    // Store payment
    const paymentResult = await elasticClient.index({
      index: "payments",
      body: payment,
      refresh: true,
    });

    // Update customer payment status and amount
    const customer = await elasticClient.get({
      index: "customers",
      id: paymentData.customerId,
    });

    const customerData = customer._source;
    const newOutstandingAmount = Math.max(
      0,
      customerData.outstandingAmount - paymentData.amount
    );
    const newPaymentStatus =
      newOutstandingAmount === 0
        ? PaymentStatus.COMPLETED
        : PaymentStatus.PENDING;

    // Update customer
    await elasticClient.update({
      index: "customers",
      id: paymentData.customerId,
      body: {
        doc: {
          outstandingAmount: newOutstandingAmount,
          paymentStatus: newPaymentStatus,
          updatedAt: now,
        },
      },
      refresh: true,
    });

    await elasticClient.index({
      index: "notifications",
      body: {
        type: NotificationType.PAYMENT_RECEIVED,
        message: `Payment of $${payment.amount} received from ${customerData.name}`,
        userId: paymentData.userId,
        data: {
          paymentId: paymentResult._id,
          customerId: payment.customerId,
          amount: payment.amount,
          customerName: customerData.name,
          transactionId: payment.transactionId,
          paymentDate: payment.paymentDate,
        },
        read: false,
        createdAt: now,
      },
      refresh: true,
    });

    notifyPaymentReceived({
      paymentId: paymentResult._id,
      customerId: payment.customerId,
      customerName: customerData.name,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      transactionId: payment.transactionId,
    });

    // notifyPaymentUpdate(payment.customerId, newPaymentStatus);

    // await handlePaymentReceived(
    //   paymentData.userId,
    //   {
    //     id: paymentResult._id,
    //     ...payment,
    //     customerName: customerData.name, // Include customer name here
    //   },
    //   customerData.name
    // );
    return {
      success: true,
      payment: {
        id: paymentResult._id,
        ...payment,
      },
      customer: {
        id: paymentData.customerId,
        outstandingAmount: newOutstandingAmount,
        paymentStatus: newPaymentStatus,
      },
    };
  } catch (error) {
    console.error("Payment processing error:", error);
    throw error;
  }
};

export const checkOverduePayments = async () => {
  try {
    const now = new Date();

    const result = await elasticClient.search({
      index: "customers",
      body: {
        query: {
          bool: {
            must: [
              { term: { paymentStatus: PaymentStatus.PENDING } },
              {
                range: {
                  paymentDueDate: {
                    lt: now.toISOString(),
                  },
                },
              },
            ],
          },
        },
      },
    });

    // Process overdue payments
    const processedCustomers = await Promise.all(
      result.hits.hits.map(async (hit) => {
        const customer = hit._source;

        // Update customer status
        await elasticClient.update({
          index: "customers",
          id: hit._id,
          body: {
            doc: {
              paymentStatus: PaymentStatus.OVERDUE,
              updatedAt: now,
            },
          },
          refresh: true,
        });

        // Send notifications
        notifyPaymentOverdue({
          customerId: hit._id,
          customerName: customer.name,
          dueDate: customer.paymentDueDate,
          amount: customer.outstandingAmount,
        });

        notifyPaymentUpdate(hit._id, PaymentStatus.OVERDUE);

        await handlePaymentOverdue(customer.userId, {
          id: hit._id,
          ...customer,
        });

        return hit._id;
      })
    );

    return {
      success: true,
      overdueCount: processedCustomers.length,
      processedCustomers,
    };
  } catch (error) {
    console.error("Check overdue payments error:", error);
    throw error;
  }
};

export const getPaymentHistory = async (customerId: string) => {
  try {
    const result = await elasticClient.search({
      index: "payments",
      body: {
        query: {
          bool: {
            must: [
              {
                term: {
                  "customerId.keyword": customerId, // Use keyword field for exact match
                },
              },
            ],
          },
        },
        sort: [{ paymentDate: { order: "desc" } }],
      },
    });

    return result.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }));
  } catch (error) {
    console.error("Get payment history error:", error);
    throw error;
  }
};

export const updatePaymentStatus = async (
  customerId: string,
  status: PaymentStatus
) => {
  try {
    // Update customer payment status
    await elasticClient.update({
      index: "customers",
      id: customerId,
      body: {
        doc: {
          paymentStatus: status,
          updatedAt: new Date(),
        },
      },
      refresh: true,
    });

    // Update all payment records for this customer to the new status
    await elasticClient.updateByQuery({
      index: "payments",
      refresh: true,
      body: {
        query: {
          term: {
            "customerId.keyword": customerId,
          },
        },
        script: {
          source: `
            ctx._source.status = params.status;
            ctx._source.updatedAt = params.updatedAt;
          `,
          params: {
            status: status,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });

    // Notify via WebSocket
    notifyPaymentUpdate(customerId, status);

    return {
      success: true,
      customerId,
      status,
    };
  } catch (error) {
    console.error("Payment status update error:", error);
    throw error;
  }
};

// Helper functions
const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
};

const simulatePaymentProcessing = () => {
  return new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
};
