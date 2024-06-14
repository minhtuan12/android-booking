import {Router} from "express";
import {asyncHandler} from "../utils/handlers";
import {verifyToken, validate, upload, verifyGoogleToken} from "../app/middleware";
import * as authRequest from "../app/requests/AuthRequest";
import * as authController from "../app/controllers/AuthController";

const router = Router();

router.post(
    "/google",
    asyncHandler(verifyGoogleToken),
    asyncHandler(authController.loginWithGoogle)
);
router.post(
    "/logout",
    asyncHandler(verifyToken),
    asyncHandler(authController.logout)
);
router.get(
    "/me",
    asyncHandler(verifyToken),
    asyncHandler(authController.me)
);
router.put(
    "/update-profile",
    asyncHandler(verifyToken),
    asyncHandler(upload),
    asyncHandler(validate(authRequest.updateMe)),
    asyncHandler(authController.updateMe)
);

export default router;
