import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { initializeElasticsearch } from "./config/elasticsearch";
import { errorHandler } from "./middlewares/errorHandler";
import customerRoutes from "./routes/customerRoute";
import authRoutes from "./routes/authRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { initializeWebSocket } from "./services/websocketService";
import { requestLogger } from "./middlewares/requestLogger";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket
initializeWebSocket(server);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);
app.use(requestLogger);

initializeElasticsearch().catch(console.error);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
});
