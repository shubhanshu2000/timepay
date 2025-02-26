import { elasticClient } from "../config/elasticsearch";
import { Notification, NotificationType, Customer, Payment } from "../types";
import {
  notifyClients,
  notifyNewCustomer,
  notifyPaymentOverdue,
  notifyPaymentReceived,
} from "./websocketService";

const createNotification = async (
  type: NotificationType,
  userId: string,
  message: string,
  data?: any
) => {
  try {
    const notification: Notification = {
      type,
      message,
      userId,
      data,
      read: false,
      createdAt: new Date(),
    };

    // Store in Elasticsearch only
    const result = await elasticClient.index({
      index: "notifications",
      body: notification,
      refresh: true,
    });

    return {
      id: result._id,
      ...notification,
    };
  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }
};

export const handlePaymentReceived = async (
  userId: string,
  payment: any,
  customerName: string
) => {
  // Create persistent notification
  const notification = await createNotification(
    NotificationType.PAYMENT_RECEIVED,
    userId,
    `Payment of $${payment.amount} received from ${customerName}`,
    {
      paymentId: payment.id,
      customerId: payment.customerId,
      amount: payment.amount,
      customerName,
      transactionId: payment.transactionId,
    }
  );

  // Send single WebSocket notification
  // notifyClients("NOTIFICATION", {
  //   ...notification,
  //   type: NotificationType.PAYMENT_RECEIVED,
  // });

  return notification;
};
// Payment overdue notification
export const handlePaymentOverdue = async (userId: string, customer: any) => {
  // Create persistent notification
  const notification = await createNotification(
    NotificationType.PAYMENT_OVERDUE,
    userId,
    `Payment overdue for ${customer.name}`,
    {
      customerId: customer.id,
      customerName: customer.name,
      amount: customer.outstandingAmount,
      dueDate: customer.paymentDueDate,
    }
  );

  // Send real-time WebSocket notification
  // notifyPaymentOverdue({
  //   customerId: customer.id,
  //   customerName: customer.name,
  //   amount: customer.outstandingAmount,
  //   dueDate: customer.paymentDueDate,
  // });

  return notification;
};

// New customer notification
export const handleNewCustomer = async (userId: string, customer: any) => {
  // Create persistent notification
  const notification = await createNotification(
    NotificationType.CUSTOMER_ADDED,
    userId,
    `New customer ${customer.name} has been added`,
    {
      customerId: customer.id,
      customerName: customer.name,
      email: customer.email,
    }
  );

  // Send real-time WebSocket notification
  // notifyNewCustomer({
  //   customerId: customer.id,
  //   name: customer.name,
  //   email: customer.email,
  // });

  return notification;
};

// Get notifications with pagination and filtering
// export const getNotifications = async (
//   userId: string,
//   options: {
//     page?: number;
//     limit?: number;
//     type?: NotificationType;
//     read?: boolean;
//   } = {}
// ) => {
//   try {
//     const { page = 1, limit = 10, type, read } = options;

//     const must = [{ term: { userId } }];

//     if (type) {
//       must.push({ term: { type } });
//     }

//     if (typeof read === "boolean") {
//       must.push({ term: { read } });
//     }

//     const result = await elasticClient.search({
//       index: "notifications",
//       body: {
//         from: (page - 1) * limit,
//         size: limit,
//         query: {
//           bool: { must },
//         },
//         sort: [{ createdAt: { order: "desc" } }],
//         aggs: {
//           unread_count: {
//             filter: { term: { read: false } },
//           },
//           by_type: {
//             terms: { field: "type" },
//           },
//         },
//       },
//     });

//     return {
//       notifications: result.hits.hits.map((hit) => ({
//         id: hit._id,
//         ...hit._source,
//       })),
//       total: result.hits.total,
//       unreadCount: result.aggregations?.unread_count.doc_count || 0,
//       typeCounts: result.aggregations?.by_type.buckets || [],
//     };
//   } catch (error) {
//     console.error("Get notifications error:", error);
//     throw error;
//   }
// };

// Mark notification as read
export const markAsRead = async (notificationId: string, userId: string) => {
  try {
    await elasticClient.update({
      index: "notifications",
      id: notificationId,
      body: {
        doc: {
          read: true,
        },
      },
      refresh: true,
    });

    return { success: true };
  } catch (error) {
    console.error("Mark as read error:", error);
    throw error;
  }
};
// src/services/notificationService.ts
export const markAllAsRead = async (userId: string) => {
  try {
    // First, verify the userId format and unread notifications
    console.log("Marking all notifications as read for userId:", userId);

    // Update using updateByQuery
    const result = await elasticClient.updateByQuery({
      index: "notifications",
      refresh: true,
      body: {
        query: {
          bool: {
            must: [{ term: { userId: userId } }, { term: { read: false } }],
          },
        },
        script: {
          source: "ctx._source.read = true",
          lang: "painless",
        },
      },
    });

    // Log the result for debugging
    console.log("Update result:", {
      updated: result.updated,
      total: result.total,
      failures: result.failures,
    });

    // Verify the update worked
    const verifyResult = await elasticClient.search({
      index: "notifications",
      body: {
        query: {
          bool: {
            must: [{ term: { userId: userId } }, { term: { read: false } }],
          },
        },
      },
    });

    console.log("Remaining unread notifications:", verifyResult.hits.total);

    return {
      success: true,
      message: "All notifications marked as read",
      updated: result.updated,
      total: result.total,
    };
  } catch (error) {
    console.error("Mark all as read error:", error);
    throw error;
  }
};

// Also update the getNotifications function to ensure proper query
export const getNotifications = async (
  userId: string,
  options: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    read?: boolean;
  } = {}
) => {
  try {
    const { page = 1, limit = 10, type, read } = options;

    // Build the query
    const must: any[] = [{ term: { userId: userId } }];

    if (type) {
      must.push({ term: { type: type } });
    }

    if (typeof read === "boolean") {
      must.push({ term: { read: read } });
    }

    const result = await elasticClient.search({
      index: "notifications",
      body: {
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: { must },
        },
        sort: [{ createdAt: { order: "desc" } }],
        aggs: {
          unread_count: {
            filter: { term: { read: false } },
          },
          by_type: {
            terms: { field: "type" },
          },
        },
      },
    });

    // Log for debugging
    console.log("Search result:", {
      total: result.hits.total,
      unreadCount: result.aggregations?.unread_count.doc_count,
    });

    return {
      notifications: result.hits.hits.map((hit) => ({
        id: hit._id,
        ...hit._source,
      })),
      total: result.hits.total,
      unreadCount: result.aggregations?.unread_count.doc_count || 0,
      typeCounts: result.aggregations?.by_type.buckets || [],
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    throw error;
  }
};
