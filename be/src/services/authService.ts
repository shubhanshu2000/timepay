import { elasticClient } from "../config/elasticsearch";

export const ensureUsersIndex = async () => {
  try {
    const indexExists = await elasticClient.indices.exists({
      index: "users",
    });

    if (!indexExists) {
      await elasticClient.indices.create({
        index: "users",
        body: {
          mappings: {
            properties: {
              name: { type: "text" },
              email: {
                type: "text",
                fields: {
                  keyword: { type: "keyword" },
                },
              },
              password: { type: "keyword" },
              role: { type: "keyword" },
              createdAt: { type: "date" },
            },
          },
        },
      });
      console.log("Users index created successfully");
    }
  } catch (error) {
    console.error("Error ensuring users index:", error);
    throw error;
  }
};
