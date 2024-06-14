import { Router } from "express";
import { asyncHandler } from "@/utils/handlers";
import { verifyToken, ensurePermission, validate, confirmedUserToken, upload } from "@/app/middleware";
import { MEMBER_PERMISSIONS } from "@/utils";
import * as groupRequest from "@/app/requests/GroupRequest";
import * as groupController from "@/app/controllers/GroupController";
import {validateExitsGroup} from "@/app/requests/GroupRequest";
const router = Router();

router.get(
    "/",
    asyncHandler(verifyToken),
    asyncHandler(groupController.getListGroup)
);

router.patch(
    "/:groupId/authorize/:userId",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.checkAuthorizationAllowed),
    asyncHandler(groupController.authorize)
)

router.get(
    "/:id/all-users",
    asyncHandler(verifyToken),
    asyncHandler(validate(groupRequest.readRoot)),
    asyncHandler(validateExitsGroup),
    asyncHandler(groupController.readRoot)
);

router.get(
    "/:id",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.validateExitsGroup),
    asyncHandler(groupRequest.validateExitUserInGroup),
    asyncHandler(groupController.detail)
);

router.get(
    "/:id/free-time/:day",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.validateExitsGroup),
    asyncHandler(groupRequest.validateExitUserInGroup),
    asyncHandler(groupController.freeTime)
);

router.get(
    "/:id/free-time",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.validateExitsGroup),
    asyncHandler(groupRequest.validateExitUserInGroup),
    asyncHandler(groupController.optionFreeTime)
);

router.post(
    "/:groupId",
    asyncHandler(verifyToken),
    asyncHandler(ensurePermission(MEMBER_PERMISSIONS.INVITE_MEMBER)),
    asyncHandler(validate(groupRequest.createItem)),
    asyncHandler(groupRequest.checkValidIdAdd),
    asyncHandler(groupRequest.checkExistUser),
    asyncHandler(groupController.createItem)
)

router.delete(
    "/:groupId/:userId",
    asyncHandler(verifyToken),
    asyncHandler(ensurePermission(MEMBER_PERMISSIONS.DELETE_MEMBER)),
    asyncHandler(groupRequest.checkValidIdRemove),
    asyncHandler(groupRequest.checkNotFoundUserId),
    asyncHandler(groupController.removeItem)
)

router.put(
    "/join-confirmed",
    asyncHandler(validate(groupRequest.checkJoinGroup)),
    asyncHandler(confirmedUserToken),
    asyncHandler(groupController.emailConfirmation)
)

router.post(
    "/",
    asyncHandler(verifyToken),
    asyncHandler(upload),
    asyncHandler(validate(groupRequest.createGroup)),
    asyncHandler(groupController.createGroup)
);

router.put(
    "/:id",
    asyncHandler(verifyToken),
    asyncHandler(upload),
    asyncHandler(groupRequest.checkGroupId),
    asyncHandler(groupRequest.checkPermissionUpdate),
    asyncHandler(validate(groupRequest.updateGroup)),
    asyncHandler(groupController.updateGroup)
);

router.delete(
    "/:id",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.checkGroupId),
    asyncHandler(groupRequest.checkPermissionDelete),
    asyncHandler(groupController.remove)
);

router.get(
    "/:id/free-users",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.checkGroupId),
    asyncHandler(validate(groupRequest.freeUsers)),
    asyncHandler(groupController.freeUsers)
);
router.get(
    "/:id/suggestion",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.checkGroupId),
    asyncHandler(validate(groupRequest.bookingSuggestion)),
    asyncHandler(groupController.bookingSuggestion)
);
router.post(
    "/:id/booking",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.checkGroupId),
    asyncHandler(groupRequest.checkPermissions("create-meeting")),
    asyncHandler(validate(groupRequest.createBooking)),
    asyncHandler(groupController.createBooking)
);

router.put(
    "/update-booking/:bookingId",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.checkBookingId),
    asyncHandler(groupRequest.checkPermissions("update-meeting")),
    asyncHandler(validate(groupRequest.updateBooking)),
    asyncHandler(groupController.updateBooking)
);

router.patch(
    "/cancel-booking/:bookingId",
    asyncHandler(verifyToken),
    asyncHandler(groupRequest.checkBookingId),
    asyncHandler(groupRequest.checkPermissions("cancel-meeting")),
    asyncHandler(groupController.cancelBooking)
);

router.patch(
    "/join-booking",
    asyncHandler(validate(groupRequest.joinBooking)),
    asyncHandler(groupRequest.checkJoinBookingToken),
    asyncHandler(groupRequest.checkBookingValid),
    asyncHandler(groupController.joinBooking)
);

export default router;
