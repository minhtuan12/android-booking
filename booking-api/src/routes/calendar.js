import {Router} from "express";
import {asyncHandler} from "../utils/handlers";
import {verifyToken, validate} from "../app/middleware";
import * as calenderRequest from "../app/requests/CalendarRequest";
import * as calenderController from "../app/controllers/CalendarController";

const router = Router();

router.put(
    "/",
    asyncHandler(verifyToken),
    asyncHandler(validate(calenderRequest.createAndUpdate)),
    asyncHandler(calenderController.createAndUpdate)
);
router.get(
    "/week",
    asyncHandler(verifyToken),
    asyncHandler(calenderController.detailWeek)
);

router.get(
    "/day",
    asyncHandler(verifyToken),
    asyncHandler(calenderController.detailDay)
);

router.get(
    "/bookingConfig",
    asyncHandler(verifyToken),
    asyncHandler(calenderController.detail)
);

export default router;