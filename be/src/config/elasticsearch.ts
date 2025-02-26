import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

export const elasticClient = new Client({
  node: process.env.ELASTICSEARCH_NODE,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME as string,
    password: process.env.ELASTICSEARCH_PASSWORD as string,
  },
});

export const initializeElasticsearch = async () => {
  try {
    const indexExists = await elasticClient.indices.exists({
      index: "customers",
    });

    if (!indexExists) {
      await elasticClient.indices.create({
        index: "customers",
        body: {
          settings: {
            analysis: {
              analyzer: {
                email_analyzer: {
                  type: "custom",
                  tokenizer: "uax_url_email",
                  filter: ["lowercase", "unique"],
                },
              },
            },
          },
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
                analyzer: "email_analyzer",
                fields: {
                  keyword: { type: "keyword", normalizer: "lowercase" },
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

      console.log("Customers index created with email mapping");
    }

    const paymentsIndexExists = await elasticClient.indices.exists({
      index: "payments",
    });

    if (!paymentsIndexExists) {
      await elasticClient.indices.create({
        index: "payments",
        body: {
          mappings: {
            properties: {
              customerId: { type: "keyword" },
              amount: { type: "float" },
              status: { type: "keyword" },
              paymentMethod: { type: "keyword" },
              paymentDate: { type: "date" },
              transactionId: { type: "keyword" },
              notes: { type: "text" },
            },
          },
        },
      });
    }

    const notificationsIndexExists = await elasticClient.indices.exists({
      index: "notifications",
    });

    if (!notificationsIndexExists) {
      await elasticClient.indices.create({
        index: "notifications",
        body: {
          mappings: {
            properties: {
              type: { type: "keyword" },
              message: { type: "text" },
              data: { type: "object" },
              read: { type: "boolean" },
              createdAt: { type: "date" },
              userId: { type: "keyword" },
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Elasticsearch initialization error:", error);
    throw error;
  }
};
