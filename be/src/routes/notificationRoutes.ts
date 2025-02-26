import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import { auth } from "../middlewares/auth";

const router = Router();

router.get("/", auth, notificationController.getNotifications);
router.put("/:id/read", auth, notificationController.markAsRead);
router.put("/mark-all-read", auth, notificationController.markAllAsRead);

export default router;
