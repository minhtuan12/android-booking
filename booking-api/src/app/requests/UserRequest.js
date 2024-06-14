import Joi from "joi";
import {MAX_STRING_SIZE, PER_PAGE, VALIDATE_PHONE_REGEX, responseError} from "@/utils";
import {AsyncValidate} from "@/utils/types";
import {User} from "../models";
import {isValidObjectId} from "mongoose";

export const readRoot = {
    query: Joi.object({
        q: Joi.string().trim().allow("").label("Chuỗi tìm kiếm"),
        page: Joi.number().integer().min(1).label("Số trang").default(1),
        per_page: Joi.number().integer().min(1).max(100).label("Số người dùng mỗi trang").default(PER_PAGE),
        field: Joi.valid("created_at", "name", "email").default("created_at"),
        sort_order: Joi.valid("asc", "desc").default("desc"),
    }).unknown(true),
};

export const createItem = {
    body: Joi.object({
        name: Joi.string().trim().max(MAX_STRING_SIZE).required().label("Họ và tên"),
        email: Joi.string()
            .trim()
            .max(MAX_STRING_SIZE)
            .email()
            .required()
            .label("Email")
            .custom(
                (value, helpers) =>
                    new AsyncValidate(value, async function () {
                        const user = await User.findOne({email: value});
                        return !user ? value : helpers.error("any.exists");
                    })
            ),
        phone: Joi.string()
            .trim()
            .pattern(VALIDATE_PHONE_REGEX)
            .allow("")
            .required()
            .label("Số điện thoại")
            .custom(
                (value, helpers) =>
                    new AsyncValidate(value, async function () {
                        const user = await User.findOne({phone: value});
                        return !user ? value : helpers.error("any.exists");
                    })
            ),
        password: Joi.string().min(6).max(MAX_STRING_SIZE).required().label("Mật khẩu"),
    }),
};

export const checkUserId = async function (req, res, next) {
    const _id = req.params.id;

    if (isValidObjectId(_id)) {
        const user = await User.findOne({_id});
        if (user) {
            req.user = user;
            return next();
        }
    }

    return responseError(res, 404, "Người dùng không tồn tại hoặc đã bị xóa");
};

export const updateItem = {
    body: Joi.object({
        name: Joi.string().trim().max(MAX_STRING_SIZE).required().label("Họ và tên"),
        email: Joi.string()
            .trim()
            .max(MAX_STRING_SIZE)
            .email()
            .required()
            .label("Email")
            .custom(
                (value, helpers) =>
                    new AsyncValidate(value, async function (req) {
                        const userId = req.params.id;
                        const user = await User.findOne({email: value, _id: {$ne: userId}});
                        return !user ? value : helpers.error("any.exists");
                    })
            ),
        phone: Joi.string()
            .trim()
            .pattern(VALIDATE_PHONE_REGEX)
            .allow("")
            .required()
            .label("Số điện thoại")
            .custom(
                (value, helpers) =>
                    new AsyncValidate(value, async function (req) {
                        const userId = req.params.id;
                        const user = await User.findOne({phone: value, _id: {$ne: userId}});
                        return !user ? value : helpers.error("any.exists");
                    })
            ),
    }),
};

export const resetPassword = {
    body: Joi.object({
        new_password: Joi.string().min(6).max(MAX_STRING_SIZE).required().label("Mật khẩu"),
    }),
};
