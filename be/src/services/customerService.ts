import { elasticClient } from "../config/elasticsearch";
import {
  Customer,
  PaymentStatus,
  SearchParams,
  SortField,
  SortOrder,
} from "../types";
import { createConflictError, createNotFoundError } from "../types/errors";
import { logger } from "../utils/logger";
import {
  notifyNewCustomer,
  notifyPaymentOverdue,
  notifyPaymentUpdate,
} from "./websocketService";

export const checkAndNotifyOverduePayment = (customer: Customer) => {
  const dueDate = new Date(customer.paymentDueDate);
  const isOverdue =
    dueDate < new Date() && customer.paymentStatus === PaymentStatus.PENDING;

  if (isOverdue) {
    notifyPaymentOverdue({
      customerId: customer.id,
      customerName: customer.name,
      dueDate: customer.paymentDueDate,
      amount: customer.outstandingAmount,
    });
  }
};

export const ensureCustomersIndex = async () => {
  try {
    const indexExists = await elasticClient.indices.exists({
      index: "customers",
    });

    if (!indexExists) {
      await elasticClient.indices.create({
        index: "customers",
        body: {
          mappings: {
            properties: {
              name: {
                type: "text",
                fields: {
                  keyword: { type: "keyword" },
                },
              },
              email: {
                type: "text",
                fields: {
                  keyword: { type: "keyword" },
                },
              },
              phone: { type: "keyword" },
              outstandingAmount: { type: "float" },
              paymentDueDate: { type: "date" },
              paymentStatus: { type: "keyword" },
              createdAt: { type: "date" },
              updatedAt: { type: "date" },
            },
          },
        },
      });
      console.log("Customers index created successfully");
    }
  } catch (error) {
    console.error("Error ensuring customers index:", error);
    throw error;
  }
};

export const searchCustomers = async (params: SearchParams) => {
  try {
    // First, check and update overdue payments
    let overdueUpdates = 0;

    // First, find and update overdue payments
    const now = new Date();
    const overdueCustomers = await elasticClient.search({
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

    // Update overdue customers if any found
    if (overdueCustomers.hits.total.value > 0) {
      const bulkOperations = overdueCustomers.hits.hits.flatMap((hit) => [
        { update: { _index: "customers", _id: hit._id } },
        {
          doc: {
            paymentStatus: PaymentStatus.OVERDUE,
            updatedAt: now.toISOString(),
          },
        },
      ]);

      if (bulkOperations.length > 0) {
        const bulkResponse = await elasticClient.bulk({
          refresh: true,
          body: bulkOperations,
        });

        overdueUpdates = bulkOperations.length / 2;

        // Send notifications for newly overdue customers
        overdueCustomers.hits.hits.forEach((hit) => {
          const customer = hit._source;
          notifyPaymentOverdue({
            customerId: hit._id,
            customerName: customer.name,
            dueDate: customer.paymentDueDate,
            amount: customer.outstandingAmount,
          });
          notifyPaymentUpdate(hit._id, PaymentStatus.OVERDUE);
        });
      }
    }

    // Continue with the regular search...
    const {
      searchTerm,
      paymentStatus,
      dueDateStart,
      dueDateEnd,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
      sortField = SortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = params;

    // Build query
    const must: any[] = [];
    const filter: any[] = [];

    // Search term query - only add if not empty string
    if (searchTerm && searchTerm.trim() !== "") {
      must.push({
        bool: {
          should: [
            {
              match_phrase_prefix: {
                name: {
                  query: searchTerm,
                  boost: 2,
                },
              },
            },
            {
              match: {
                email: {
                  query: searchTerm,
                  operator: "and",
                },
              },
            },
            {
              match: {
                phone: {
                  query: searchTerm,
                  operator: "and",
                },
              },
            },
          ],
          minimum_should_match: 1,
        },
      });
    }

    // Payment status filter - handle single status or array
    if (paymentStatus) {
      const statusArray = Array.isArray(paymentStatus)
        ? paymentStatus
        : [paymentStatus];
      if (statusArray.length > 0) {
        filter.push({
          terms: {
            paymentStatus: statusArray,
          },
        });
      }
    }

    // Due date range filter - only add if dates are valid
    if (dueDateStart?.trim() || dueDateEnd?.trim()) {
      const dateRange: any = { range: { paymentDueDate: {} } };

      if (dueDateStart?.trim()) {
        dateRange.range.paymentDueDate.gte = dueDateStart;
      }

      if (dueDateEnd?.trim()) {
        dateRange.range.paymentDueDate.lte = dueDateEnd;
      }

      filter.push(dateRange);
    }

    // Amount range filter - only add if numbers are valid
    if (minAmount || maxAmount) {
      const amountRange: any = { range: { outstandingAmount: {} } };

      if (minAmount !== undefined && !isNaN(Number(minAmount))) {
        amountRange.range.outstandingAmount.gte = Number(minAmount);
      }

      if (maxAmount !== undefined && !isNaN(Number(maxAmount))) {
        amountRange.range.outstandingAmount.lte = Number(maxAmount);
      }

      filter.push(amountRange);
    }

    // Build sort
    let sort: any[] = [];

    // Handle different sort fields
    switch (sortField) {
      case SortField.NAME:
        sort.push({ "name.keyword": { order: sortOrder } });
        break;
      case SortField.EMAIL:
        sort.push({ "email.keyword": { order: sortOrder } });
        break;
      case SortField.PAYMENT_DUE_DATE:
        sort.push({ paymentDueDate: { order: sortOrder } });
        break;
      case SortField.OUTSTANDING_AMOUNT:
        sort.push({ outstandingAmount: { order: sortOrder } });
        break;
      case SortField.PAYMENT_STATUS:
        sort.push({ paymentStatus: { order: sortOrder } });
        break;
      default:
        sort.push({ createdAt: { order: sortOrder } });
    }

    // Execute search with updated query
    const result = await elasticClient.search({
      index: "customers",
      body: {
        from: (Number(page) - 1) * Number(limit),
        size: Number(limit),
        query:
          must.length === 0 && filter.length === 0
            ? { match_all: {} }
            : {
                bool: {
                  ...(must.length > 0 && { must }),
                  ...(filter.length > 0 && { filter }),
                },
              },
        sort,
        aggs: {
          status_counts: {
            terms: {
              field: "paymentStatus",
            },
          },
          total_outstanding: {
            sum: {
              field: "outstandingAmount",
            },
          },
          avg_outstanding: {
            avg: {
              field: "outstandingAmount",
            },
          },
          overdue_amount: {
            sum: {
              field: "outstandingAmount",
              script: {
                source: "doc['paymentStatus'].value == 'OVERDUE' ? _value : 0",
              },
            },
          },
        },
      },
    });

    const customers = result.hits.hits.map((hit) => ({
      id: hit._id,
      ...(hit._source as Customer),
    }));

    return {
      customers,
      total: result.hits.total,
      aggregations: result.aggregations,
      page: Number(page),
      limit: Number(limit),
      overdueUpdates,
    };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

export const createCustomer = async (customerData: Customer) => {
  try {
    // Check if customer exists with exact email match
    const existingCustomer = await elasticClient.search({
      index: "customers",
      body: {
        query: {
          term: {
            "email.keyword": customerData.email.toLowerCase(), // Use keyword field for exact match
          },
        },
      },
    });

    // Log the search results for debugging
    console.log("Existing customer search results:", {
      email: customerData.email,
      hits: existingCustomer.hits.hits,
      total: existingCustomer.hits.total,
    });

    if (existingCustomer.hits.total.value > 0) {
      throw {
        statusCode: 409,
        type: "CONFLICT_ERROR",
        message: "Customer with this email already exists",
      };
    }

    // Create new customer
    const now = new Date();
    const result = await elasticClient.index({
      index: "customers",
      body: {
        ...customerData,
        email: customerData.email.toLowerCase(), // Store email in lowercase
        createdAt: now,
        updatedAt: now,
      },
      refresh: true,
    });

    return {
      id: result._id,
      ...customerData,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Create customer error:", error);
    throw error;
  }
};

export const updateCustomer = async (
  id: string,
  updates: Partial<Customer>
) => {
  try {
    // First check if customer exists
    const exists = await elasticClient.exists({
      index: "customers",
      id,
    });

    if (!exists) {
      throw createNotFoundError("Customer");
    }

    const result = await elasticClient.update({
      index: "customers",
      id,
      body: {
        doc: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      refresh: true,
    });

    return result;
  } catch (error) {
    console.error("Update customer error:", error);
    throw error;
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    // First check if customer exists
    const exists = await elasticClient.exists({
      index: "customers",
      id,
    });

    if (!exists) {
      return null;
    }

    const result = await elasticClient.delete({
      index: "customers",
      id,
      refresh: true,
    });

    return result;
  } catch (error) {
    console.error("Delete customer error:", error);
    throw error;
  }
};
