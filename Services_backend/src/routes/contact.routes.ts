import { Router } from "express";
import { ContactController } from "../controllers/ContactController";
import { contactRateLimiter } from "../middlewares/contactRateLimiter";

const router = Router();

router.post("/", contactRateLimiter, ContactController.send);

export default router;
