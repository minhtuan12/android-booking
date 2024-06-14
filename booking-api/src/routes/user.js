import {Router} from "express";
import {asyncHandler} from "../utils/handlers";
import {verifyToken, validate} from "../app/middleware";
import * as userRequest from "../app/requests/UserRequest";
import * as userController from "../app/controllers/UserController";

const router = Router();

router.get(
    "/",
    asyncHandler(verifyToken),
    asyncHandler(validate(userRequest.readRoot)),
    asyncHandler(userController.readRoot)
);
router.get(
    "/:id",
    asyncHandler(verifyToken),
    asyncHandler(userRequest.checkUserId),
    asyncHandler(userController.readItem)
);
router.post(
    "/",
    asyncHandler(verifyToken),
    asyncHandler(validate(userRequest.createItem)),
    asyncHandler(userController.createItem)
);
router.put(
    "/:id",
    asyncHandler(verifyToken),
    asyncHandler(userRequest.checkUserId),
    asyncHandler(validate(userRequest.updateItem)),
    asyncHandler(userController.updateItem)
);
router.delete(
    "/:id",
    asyncHandler(verifyToken),
    asyncHandler(userRequest.checkUserId),
    asyncHandler(userController.removeItem)
);
router.patch(
    "/:id/reset-password",
    asyncHandler(verifyToken),
    asyncHandler(userRequest.checkUserId),
    asyncHandler(validate(userRequest.resetPassword)),
    asyncHandler(userController.resetPassword)
);

export default router;
