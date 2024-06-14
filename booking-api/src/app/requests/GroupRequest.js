import Joi from "joi";
import { GROUP_USER_JOIN_CONFIRMATION, PER_PAGE, UUID_TRANSLATOR, MAX_STRING_SIZE, responseError, tokenUsed } from "@/utils";
import {
    Group,
    BOOKING_USER_STATUS,
    Booking,
    BookingUser,
    GroupUser,
    Permission,
    PermissionRole,
    Role,
    GROUP_USER_STATUS, User
} from "@/app/models";
import { isValidObjectId } from "mongoose";
import moment from "moment";
import { AsyncValidate } from "@/utils/types";
import { filterFreeUserFromGroup, isFreeUser  } from "../services/GroupService";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export const createGroup = {
    params: Joi.object({
        id: Joi.string().required(),
    }),
    body: Joi.object({
        name: Joi.string().trim().max(MAX_STRING_SIZE).required().label("Tên nhóm"),
        description: Joi.string().max(1000).label("description").allow(""),
        thumbnail: Joi.object({
            originalname: Joi.string().trim().label("Tên ảnh nhóm"),
            mimetype: Joi.valid(
                "image/jpeg",
                "image/png",
                "image/svg+xml",
                "image/webp",
                "image/gif"
            )
                .required()
                .label("Định dạng ảnh nhóm"),
            buffer: Joi.any()
                .required()
                .custom((value, helpers) =>
                    Buffer.isBuffer(value) ? value : helpers.error("any.invalid")
                )
                .label("Dữ liệu của ảnh nhóm"),
        }).label("Ảnh đại diện nhóm"),
    }),
};

export const updateGroup = {
    params: Joi.object({
        id: Joi.string().required(),
    }),
    body: Joi.object({
        name: Joi.string().trim().max(MAX_STRING_SIZE).required().label("Tên nhóm"),
        description: Joi.string().max(1000).label("description").allow(""),
        thumbnail: Joi.object({
            originalname: Joi.string().trim().required().label("Tên ảnh nhóm"),
            mimetype: Joi.valid(
                "image/jpeg",
                "image/png",
                "image/svg+xml",
                "image/webp",
                "image/gif"
            )
                .required()
                .label("Định dạng ảnh nhóm"),
            buffer: Joi.any()
                .required()
                .custom((value, helpers) =>
                    Buffer.isBuffer(value) ? value : helpers.error("any.invalid")
                )
                .label("Dữ liệu của ảnh nhóm"),
        }).label("Ảnh đại diện nhóm"),
    }),
};

export const checkGroupId = async function (req, res, next) {
    const _id = req.params.id;

    if (isValidObjectId(_id)) {
        const group = await Group.findOne({ _id, deleted_at: null });
        if (group) {
            req.group = group;
            return next();
        }
    }
    return responseError(res, 404, "Nhóm không tồn tại hoặc đã bị xóa");
};

export const checkPermissionUpdate = async (req, res, next) => {
    if (req.group.creator_id.equals(req.currentUser._id)) {
        return next();
    }

    const group_user = await GroupUser.findOne({
        group_id: req.group._id,
        user_id: req.currentUser._id,
        deleted_at: null,
    });

    if (group_user) {
        const permissionRoles = await PermissionRole.find({
            role_id: group_user.role_id,
        });

        if (permissionRoles) {
            for (const permissionRole of permissionRoles) {
                const permission = await Permission.findOne({
                    _id: permissionRole.permission_id,
                });
                if (permission.code === "update-group") {
                    return next();
                }
            }
        }

        return responseError(res, 403, "Bạn không có quyền truy cập chức năng này");
    } else {
        return responseError(res, 404, "Không tìm thấy nhóm");
    }
};

export const checkPermissionDelete = async (req, res, next) => {
    if (req.group.creator_id.equals(req.currentUser._id)) {
        return next();
    }

    return responseError(res, 403, "Bạn không có quyền truy cập chức năng này");
};

export async function checkAuthorizationAllowed(req, res, next) {
    const { groupId, userId } = req.params;
    if (isValidObjectId(groupId) && isValidObjectId(userId)) {
        const group = await Group.findOne({ _id: groupId, deleted_at: null });
        if (group) {
            if (!req.currentUser._id.equals(group.creator_id)) {
                return responseError(res, 403, "Bạn không có quyền truy cập chức năng này");
            }
            if (req.currentUser._id.equals(userId)) {
                return responseError(res, 403, "Không thể cấp quyền cho bản thân");
            }

            const groupUser = await GroupUser.findOne({
                group_id: group._id,
                user_id: userId,
                status: GROUP_USER_STATUS.ACCEPT,
                deleted_at: null,
            });
            if (!groupUser) {
                return responseError(res, 404, "Người dùng không phải là thành viên của nhóm");
            }

            return next();
        }
    }
    return responseError(res, 404, "Nhóm hoặc thành viên trong nhóm không tồn tại");
}

export const authorize = {
    body: Joi.object({
        allow: Joi.boolean().required().label("Cho phép quyền quản trị"),
    }),
};

export const validateExitsGroup = async (req, res, next) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return responseError(res, 404, "Nhóm không tồn tại")
    }

    const group = await Group.findById(id)

    if (!group) {
        return responseError(res, 404, "Nhóm không tồn tại")
    }
    next()
}

export const validateExitUserInGroup = async (req, res, next) => {
    const id = req.params.id;
    const currentUser = req.currentUser

    const groupUser = await GroupUser.aggregate([
        {
            $match: {
                group_id: new ObjectId(id),
                user_id: new ObjectId(currentUser._id),
                deleted_at: null
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $match: {
                'user.deleted_at': null,
            }
        },
    ])

    if (!groupUser || groupUser.length === 0) {
        return responseError(res, 403, "Bạn không có quyền truy cập nhóm")
    }

    next()
}

const error_details = {
    group: 'Nhóm lịch hẹn không tồn tại hoặc đã bị xóa',
    role: 'Vai trò người dùng không tồn tại hoặc đã bị xóa'
}

export const checkValidIdAdd = async function (req, res, next) {
    const group_id = req.params.groupId
    const role_id = req.body.role_id

    const group = isValidObjectId(group_id) ? await Group.findOne({ _id: group_id, deleted_at: null }) : null
    const role = (role_id && isValidObjectId(role_id)) ? await Role.findOne({ _id: role_id }) : null

    let flag = true

    let details = {}
    if (!group) {
        details.group = error_details.group
        flag = false
    }
    if (role_id && !role) {
        details.role = error_details.role
        flag = false
    }
    if (!flag) {
        return responseError(res, 404, 'Error', details)
    }

    req.user_emails = req.body.user_emails
    req.group_id = group_id
    req.role_id = role_id

    return next()
}

export const checkValidIdRemove = async function (req, res, next) {
    const groupId = req.params.groupId
    const userId = req.params.userId

    const group = isValidObjectId(groupId) ? await Group.findOne({ _id: groupId, deleted_at: null }) : null
    const user = isValidObjectId(userId) ? await User.findOne({ _id: userId }) : null

    let flag = true

    let details = {}
    if (!group) {
        details.group = error_details.group
        flag = false
    }
    if (!user) {
        details.user = error_details.user
        flag = false
    }

    if (!flag) {
        return responseError(res, 404, 'Error', details)
    }

    req.groupId = groupId
    req.userId = userId

    return next()
}

export const checkNotFoundUserId = async function (req, res, next) {
    const group_id = req.groupId
    const user_id = req.userId

    const user = await GroupUser.findOne({ group_id, user_id, status: GROUP_USER_STATUS.ACCEPT, deleted_at: null })

    if (!user) {
        return responseError(res, 404, 'Không tìm thấy người dùng trong nhóm')
    }
    if (user_id === req.currentUser._id.toString()) {
        return responseError(res, 400, 'Không thể xóa bản thân')
    }

    return next()
}

export const checkExistUser = async function (req, res, next) {
    const user_emails = req.user_emails

    for (const email of user_emails) {
        let user = await User.findOne({ email })

        // create new user if email not exist
        if (!user) {
            const name = 'user#' + UUID_TRANSLATOR.generate()
            const newUser = new User({ name, email })
            user = await newUser.save()
        }
    }

    return next()
}

export const readRoot = {
    params: Joi.string().required().label('ID nhóm'),
    query: Joi.object({
        page: Joi.number().integer().min(1).label("Số trang").default(1),
        per_page: Joi.number().integer().min(1).max(100).label("Số người dùng mỗi trang").default(PER_PAGE),
        field: Joi.valid("name", "email").default("name"),
        sort_order: Joi.valid("asc", "desc").default("desc"),
    }).unknown(true),
}

export const createItem = {
    params: Joi.string().required().label('ID nhóm'),
    body: Joi.object({
        user_emails: Joi.array().items(Joi.string().email().required()).unique().required().label('Email người dùng'),
    })
}

export const checkJoinGroup = {
    query: Joi.object({
        token: Joi.string().required().label("Mã xác thực tham gia nhóm"),
        type: Joi.number()
            .integer()
            .valid(GROUP_USER_JOIN_CONFIRMATION.JOIN, GROUP_USER_JOIN_CONFIRMATION.DECLINE)
            .required()
            .label("Xác nhận tham gia nhóm"),
    }),
};
export const checkPermissionCreateBooking = async (req, res, next) => {
    if (req.group.creator_id.equals(req.currentUser._id)) {
        return next();
    }

    const group_user = await GroupUser.findOne({
        group_id: req.group._id,
        user_id: req.currentUser._id,
        deleted_at: null,
    });

    if (group_user) {
        const permissionRoles = await PermissionRole.find({
            role_id: group_user.role_id,
        });

        if (permissionRoles) {
            for (const permissionRole of permissionRoles) {
                const permission = await Permission.findOne({
                    _id: permissionRole.permission_id,
                });
                if (permission.code === "create-meeting") {
                    return next();
                }
            }
        }

        return responseError(res, 403, "Bạn không có quyền truy cập chức năng này");
    } else {
        return responseError(res, 404, "Không tìm thấy nhóm");
    }
}

export const freeUsers = {
    query: Joi.object({
        start_time: Joi.number().integer().min(0).required().label("Thời gian bắt đầu"),
        end_time: Joi.number()
            .integer()
            .greater(Joi.ref("start_time"))
            .when("start_time", {
                is: Joi.number().integer().required(),
                then: Joi.custom(function (value, helpers) {
                    const startTime = moment.unix(parseInt(helpers.prefs.context.data.start_time));
                    const endTime = moment.unix(value);
                    if (
                        startTime.date() === endTime.date() &&
                        startTime.month() === endTime.month() &&
                        startTime.year() === endTime.year()
                    ) {
                        return value;
                    }
                    return helpers.message(
                        "{#label} và thời gian bắt đầu phải là thời điểm trong cùng một ngày"
                    );
                }),
            })
            .required()
            .label("Thời gian kết thúc")
            .messages({
                "number.greater": "{#label} phải lớn hơn thời gian bắt đầu",
            }),
        booking_id: Joi.string().custom(function (value) {
            if (isValidObjectId(value)) {
                return new ObjectId(value);
            } else {
                return null;
            }
        }),
    }).unknown(true),
};
export const createBooking = {
    body: Joi.object({
        title: Joi.string().trim().max(MAX_STRING_SIZE).required().label("Tiêu đề cuộc hẹn"),
        description: Joi.string().trim().allow("").required().label("Mô tả về cuộc hẹn"),
        start_time: Joi.number()
            .integer()
            .required()
            .label("Thời gian bắt đầu")
            .custom(function (value, helpers) {
                if (value > moment().unix()) {
                    return value;
                }
                return helpers.message("{#label} phải là thời điểm ở tương lai");
            }),
        end_time: Joi.number()
            .integer()
            .greater(Joi.ref("start_time"))
            .when("start_time", {
                is: Joi.number().integer().required(),
                then: Joi.custom(function (value, helpers) {
                    const startTime = moment.unix(parseInt(helpers.prefs.context.data.start_time));
                    const endTime = moment.unix(value);
                    if (
                        startTime.date() === endTime.date() &&
                        startTime.month() === endTime.month() &&
                        startTime.year() === endTime.year()
                    ) {
                        return value;
                    }
                    return helpers.message(
                        "{#label} và thời gian bắt đầu phải là thời điểm trong cùng một ngày"
                    );
                }),
            })
            .required()
            .label("Thời gian kết thúc")
            .messages({
                "number.greater": "{#label} phải lớn hơn thời gian bắt đầu",
            }),
        users: Joi.array()
            .items(
                Joi.string()
                    .trim()
                    .label("Thành viên trong nhóm")
                    .custom((value, helpers) => {
                        if (isValidObjectId(value)) {
                            return new AsyncValidate(value, async function (req) {
                                const groupUser = await GroupUser.findOne({
                                    group_id: req.group._id,
                                    user_id: value,
                                }).populate("user_id");
                                if (groupUser) {
                                    try {
                                        const startTime = helpers.prefs.context.data.start_time;
                                        const endTime = helpers.prefs.context.data.end_time;
                                        const userFree = await filterFreeUserFromGroup(
                                            req.group._id,
                                            {
                                                start_time: parseInt(startTime),
                                                end_time: parseInt(endTime),
                                            },
                                            groupUser.user_id._id
                                        );
                                        if (userFree.length > 0) {
                                            return {
                                                _id: userFree[0]._id,
                                                email: userFree[0].email,
                                            };
                                        }
                                        return helpers.message(
                                            `Thành viên ${groupUser.user_id.name} không rảnh để tham gia cuộc họp`
                                        );
                                    } catch (error) {
                                        return value;
                                    }
                                }
                                return helpers.message("Thành viên này không phải là thành viên trong nhóm");
                            });
                        }
                        return helpers.error("any.invalid");
                    })
            )
            .min(2)
            .unique((a, b) => a?.equals(b))
            .required()
            .label("Thành viên trong nhóm"),
    }),
};

export function checkPermissions(...permissions) {
    return async function (req, res, next) {
        const editor = await GroupUser.aggregate([
            {
                $match: {
                    group_id: req.group._id,
                    user_id: req.currentUser._id,
                    deleted_at: null,
                },
            },
            {
                $lookup: {
                    from: "permission_role",
                    let: { roleId: "$role_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$role_id", "$$roleId"],
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: "permissions",
                                localField: "permission_id",
                                foreignField: "_id",
                                as: "code",
                            },
                        },
                        {
                            $unwind: "$code",
                        },
                        {
                            $replaceRoot: { newRoot: "$code" },
                        },
                    ],
                    as: "permissions",
                },
            },
            {
                $project: {
                    _id: "$user_id",
                    permissions: {
                        $map: {
                            input: "$permissions",
                            as: "permissions",
                            in: "$$permissions.code",
                        },
                    },
                },
            },
        ]);
        if (editor.length === 1 && editor[0].permissions.some((i) => permissions.includes(i))) {
            return next();
        }
        return responseError(res, 403, "Bạn không có quyền truy cập chức năng này");
    };
}

export async function checkBookingId(req, res, next) {
    if (isValidObjectId(req.params.bookingId)) {
        const booking = await Booking.findOne({
            deleted_at: null,
            _id: req.params.bookingId,
            group_id: { $ne: null },
        })
        if (booking) {
            if (!booking.cancel_time) {
                if (moment().unix() < booking.start_time) {
                    const group = await Group.findOne({ _id: booking.group_id });
                    req.group = group;
                    req.booking = booking;
                    return next();
                }
                return responseError(res, 403, "Cuộc hẹn đã bắt đầu");
            }
            return responseError(res, 403, "Cuộc hẹn đã bị hủy");
        }
    }

    return responseError(res, 404, "Cuộc hẹn không tồn tại hoặc đã bị xóa");
}

export const updateBooking = {
    body: Joi.object({
        title: Joi.string().trim().max(MAX_STRING_SIZE).required().label("Tiêu đề cuộc hẹn"),
        description: Joi.string().trim().allow("").required().label("Mô tả về cuộc hẹn"),
        start_time: Joi.number()
            .integer()
            .required()
            .label("Thời gian bắt đầu")
            .custom(function (value, helpers) {
                if (value > moment().unix()) {
                    return value;
                }
                return helpers.message("{#label} phải là thời điểm ở tương lai");
            }),
        end_time: Joi.number()
            .integer()
            .greater(Joi.ref("start_time"))
            .when("start_time", {
                is: Joi.number().integer().required(),
                then: Joi.custom(function (value, helpers) {
                    const startTime = moment.unix(parseInt(helpers.prefs.context.data.start_time));
                    const endTime = moment.unix(value);
                    if (
                        startTime.date() === endTime.date() &&
                        startTime.month() === endTime.month() &&
                        startTime.year() === endTime.year()
                    ) {
                        return value;
                    }
                    return helpers.message(
                        "{#label} và thời gian bắt đầu phải là thời điểm trong cùng một ngày"
                    );
                }),
            })
            .required()
            .label("Thời gian kết thúc")
            .messages({
                "number.greater": "{#label} phải lớn hơn thời gian bắt đầu",
            }),
        users: Joi.array()
            .items(
                Joi.string()
                    .trim()
                    .label("Thành viên trong nhóm")
                    .custom((value, helpers) => {
                        if (isValidObjectId(value)) {
                            return new AsyncValidate(value, async function (req) {
                                const groupUser = await GroupUser.findOne({
                                    group_id: req.booking.group_id._id,
                                    user_id: value,
                                }).populate("user_id");
                                if (groupUser) {
                                    try {
                                        const startTime = helpers.prefs.context.data.start_time;
                                        const endTime = helpers.prefs.context.data.end_time;
                                        const userFree = await filterFreeUserFromGroup(
                                            req.booking.group_id._id,
                                            {
                                                start_time: parseInt(startTime),
                                                end_time: parseInt(endTime),
                                            },
                                            groupUser.user_id._id,
                                            req.booking._id
                                        );
                                        if (userFree.length > 0) {
                                            return {
                                                _id: userFree[0]._id,
                                                email: userFree[0].email,
                                            };
                                        }
                                        return helpers.message(
                                            `Thành viên ${groupUser.user_id.name} không rảnh để tham gia cuộc họp`
                                        );
                                    } catch (error) {
                                        return value;
                                    }
                                }
                                return helpers.message("Thành viên này không phải là thành viên trong nhóm");
                            });
                        }
                        return helpers.error("any.invalid");
                    })
            )
            .min(2)
            .unique((a, b) => a?.equals(b))
            .required()
            .label("Thành viên trong nhóm"),
    }),
};

export const joinBooking = {
    body: Joi.object({
        token: Joi.string().required().label("Mã xác thực tham gia cuộc hẹn"),
        status: Joi.number()
            .integer()
            .valid(BOOKING_USER_STATUS.ACCEPT, BOOKING_USER_STATUS.DECLINE)
            .required()
            .label("Xác nhận tham gia cuộc hẹn"),
    }),
};

export async function checkJoinBookingToken(req, res, next) {
    const token = req.body.token;
    try {
        const { booking_id, user_id, exp } = jwt.verify(token, process.env.CONFIRM_SECRET_KEY);

        const bookingUser = await BookingUser.findOne({ booking_id, user_id }).populate([
            "booking_id",
            "user_id",
        ]);
        if (!bookingUser) {
            tokenUsed.set(token, 1, exp - moment().unix());
            return responseError(res, 400, undefined, {
                type: "ExpireToken",
                message: "Bạn không còn ở trong cuộc hẹn này nữa",
                booking: await Booking.findOne({ _id: booking_id }),
            });
        }
        if (tokenUsed.has(token)) {
            return responseError(res, 400, undefined, {
                type: "TokenUsed",
                message: `Bạn đã ${bookingUser.status === BOOKING_USER_STATUS.ACCEPT ? "tham gia" : "từ chối"
                    } cuộc hẹn này rồi`,
                booking: bookingUser.booking_id,
            });
        }
        if (
            req.body.status === BOOKING_USER_STATUS.DECLINE ||
            (await isFreeUser(
                bookingUser.user_id._id,
                bookingUser.booking_id.start_time,
                bookingUser.booking_id.end_time
            ))
        ) {
            req.bookingUser = bookingUser;
            tokenUsed.set(token, 1, exp - moment().unix());
            return next();
        }

        return responseError(res, 400, undefined, {
            type: "InvalidTime",
            message: "Bạn không rảnh để tham gia cuộc họp này",
            booking: bookingUser.booking_id,
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            if (error instanceof jwt.TokenExpiredError) {
                return responseError(res, 400, undefined, {
                    type: "ExpireToken",
                    message: "Liên kết đã hết hạn",
                });
            }
            return responseError(res, 400, undefined, {
                type: "InvalidToken",
                message: "Liên kết không hợp lệ",
            });
        }
        return next(error);
    }
}

export async function checkBookingValid(req, res, next) {
    const booking = req.bookingUser.booking_id;
    if (booking.cancel_time) {
        return responseError(res, 400, undefined, {
            type: "InvalidTime",
            message: "Cuộc hẹn đã bị hủy",
            booking: booking,
        });
    }
    if (booking.start_time < moment().unix()) {
        return responseError(res, 400, undefined, {
            type: "InvalidTime",
            message: "Cuộc hẹn đã bắt đầu",
            booking: booking,
        });
    }
    return next();
}
export const bookingSuggestion = {
    query: Joi.object({
        start_time: Joi.number().integer().min(0).required().label("Thời gian bắt đầu"),
        end_time: Joi.number()
            .integer()
            .greater(Joi.ref("start_time"))
            .when("start_time", {
                is: Joi.number().integer().required(),
                then: Joi.custom(function (value, helpers) {
                    const startTime = moment.unix(parseInt(helpers.prefs.context.data.start_time));
                    const endTime = moment.unix(value);
                    if (
                        startTime.date() === endTime.date() &&
                        startTime.month() === endTime.month() &&
                        startTime.year() === endTime.year()
                    ) {
                        return value;
                    }
                    return helpers.message(
                        "{#label} và thời gian bắt đầu phải là thời điểm trong cùng một ngày"
                    );
                }),
            })
            .required()
            .label("Thời gian kết thúc")
            .messages({
                "number.greater": "{#label} phải lớn hơn thời gian bắt đầu",
            }),
        duration: Joi.number().integer().min(0).required(),
    }).unknown(true),
};
