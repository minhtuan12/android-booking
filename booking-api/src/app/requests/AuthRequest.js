import Joi from "joi";
import {
    MAX_STRING_SIZE,
    VALIDATE_PHONE_REGEX,
} from "@/utils";
import {AsyncValidate} from "@/utils/types";

import {User} from "../models";

export const login = {
    body: Joi.object({
        email: Joi.string()
            .trim()
            .max(MAX_STRING_SIZE)
            .lowercase()
            .email()
            .required()
            .label("Email"),
        password: Joi.string().max(MAX_STRING_SIZE).required().label("Mật khẩu"),
    }),
};

export const register = {
    body: Joi.object({
        name: Joi.string()
            .trim()
            .max(MAX_STRING_SIZE)
            .required()
            .label("Họ và tên"),
        email: Joi.string()
            .trim()
            .max(MAX_STRING_SIZE)
            .lowercase()
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
        password: Joi.string()
            .min(6)
            .max(MAX_STRING_SIZE)
            .required()
            .label("Mật khẩu"),
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
        avatar: Joi.object({
            originalname: Joi.string().trim().required().label("Tên ảnh"),
            mimetype: Joi.valid(
                "image/jpeg",
                "image/png",
                "image/svg+xml",
                "image/webp"
            )
                .required()
                .label("Định dạng ảnh"),
            buffer: Joi.any()
                .required()
                .custom((value, helpers) =>
                    Buffer.isBuffer(value) ? value : helpers.error("any.invalid")
                )
                .label("Dữ liệu của ảnh"),
        }).label("Ảnh đại diện"),
    }),
};

export const updateMe = {
    body: Joi.object({
        name: Joi.string()
            .trim()
            .max(MAX_STRING_SIZE)
            .required()
            .label("Họ và tên"),
        phone: Joi.string()
            .trim()
            .pattern(VALIDATE_PHONE_REGEX)
            .allow("")
            .label("Số điện thoại")
            .custom(
                (value, helpers) =>
                    new AsyncValidate(value, async function (req) {
                        const user = await User.findOne({
                            phone: value,
                            _id: {$ne: req.currentUser._id},
                        });
                        return !user ? value : helpers.error("any.exists");
                    })
            ),
        birth: Joi.number().allow("").label("Ngày sinh"),
        gender: Joi.number().label("Giới tính"),
        avatar: Joi.object({
            originalname: Joi.string().trim().required().label("Tên ảnh"),
            mimetype: Joi.valid(
                "image/jpeg",
                "image/png",
                "image/svg+xml",
                "image/webp",
                "image/gif"
            )
                .required()
                .label("Định dạng ảnh"),
            buffer: Joi.any()
                .required()
                .custom((value, helpers) =>
                    Buffer.isBuffer(value) ? value : helpers.error("any.invalid")
                )
                .label("Dữ liệu của ảnh"),
        }).label("Ảnh đại diện"),
    }),
};
