import {Router} from "express";
import {asyncHandler} from "@/utils/handlers";
import {validate, verifyToken} from "@/app/middleware";
import * as homeController from "@/app/controllers/HomeController";
import * as homeRequest from "@/app/requests/HomeRequest";
import {getTotalBookingsPerDay} from "@/app/requests/HomeRequest";

const router = Router()

router.get(
    "/",
    asyncHandler(verifyToken),
    asyncHandler(homeController.getStatistics)
)

router.get(
    "/bookings-per-day",
    asyncHandler(verifyToken),
    asyncHandler(validate(homeRequest.getTotalBookingsPerDay)),
    asyncHandler(homeRequest.checkParams),
    asyncHandler(homeController.getBookingQuantityPerDay)
)

export default router
