import { Router } from "express";
import * as paymentController from "../controllers/paymentController";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/process", auth, paymentController.processPayment);
router.get("/history/:customerId", auth, paymentController.getPaymentHistory);
router.put("/status/:customerId", auth, paymentController.updateStatus);

export default router;
