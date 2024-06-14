import {Router} from "express";
import {asyncHandler} from "../utils/handlers";
import * as BookingController from "../app/controllers/BookingController";
import {verifyToken} from "@/app/middleware";

const router = Router();

router.get(
    "/",
    asyncHandler(verifyToken),
    asyncHandler(BookingController.readRoot)
);

export default router;
