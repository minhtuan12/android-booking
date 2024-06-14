import path from "path";
import short from "short-uuid";
import { config as loadEnv } from "dotenv";

loadEnv()

export const SOURCE_DIR = path.dirname(__dirname);
export const PUBLIC_DIR = path.join(path.dirname(SOURCE_DIR), "public");
export const VIEW_DIR = path.join(SOURCE_DIR, "views");
export const STORAGE_DIR = path.join(SOURCE_DIR, "storage");
export const LOG_DIR = path.join(STORAGE_DIR, "logs");
export const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
export const SALT_ROUNDS = 10;
export const MAX_STRING_SIZE = 255;
export const PER_PAGE = 24;

export const UUID_TRANSLATOR = short();

export const JOI_DEFAULT_MESSAGE = {
    // string
    "string.base": "Kiểu dữ liệu của {#label} không đúng",
    "string.empty": "{#label} không được bỏ trống",
    "string.min": "{#label} không được ít hơn {#limit} ký tự",
    "string.max": "{#label} không được vượt quá {#limit} ký tự",
    "string.pattern.base": "{#label} không đúng định dạng",
    "string.email": "{#label} không đúng định dạng",

    // number
    "number.base": "Kiểu dữ liệu của {#label} không đúng",
    "number.integer": "{#label} phải là một số nguyên",
    "number.min": "{#label} không được nhỏ hơn {#limit}",
    "number.max": "{#label} không được lớn hơn {#limit}",

    // array
    "array.base": "Kiểu dữ liệu của {#label} không đúng",
    "array.unique": "Các {#label} không được giống nhau",
    "array.min": "{#label} không được ít hơn {#limit} phần tử",
    "array.max": "{#label} không được vượt quá {#limit} phần tử",
    "array.length": "{#label} phải đủ {#limit} phần tử",
    "array.includesRequiredUnknowns": "{#label} không hợp lệ",
    "array.includesRequiredKnowns": "{#label} không hợp lệ",

    // object
    "object.base": "Kiểu dữ liệu của {#label} không đúng",
    "object.unknown": "Trường {#label} không được xác định",

    // any
    "any.only": "{#label} phải là một trong {#valids}",
    "any.required": "{#label} không được bỏ trống",
    "any.unknown": "Trường {#label} không được xác định",
    "any.invalid": "{#label} không hợp lệ",
    "any.exists": "{#label} đã tồn tại",
};

export const JOI_DEFAULT_OPTIONS = {
    abortEarly: false,
    errors: {
        wrap: { label: false },
        language: { "any.exists": "any.exists" },
    },
    externals: false,
};

export const VALIDATE_PHONE_REGEX = /^(0[235789])[0-9]{8}$/;

export const VALIDATE_EMAIL_REGEX =
    /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const LINK_THUMBNAIL_GROUP = `${process.env.DOMAIN_SERVER}/uploads/`

export const MEMBER_PERMISSIONS = {
    UPDATE_GROUP: 'update-group',
    INVITE_MEMBER: 'invite-member',
    DELETE_MEMBER: 'delete-member',
    CREATE_MEETING: 'create-meeting',
    UPDATE_MEETING: 'update-meeting',
    CANCEL_MEETING: 'cancel-meeting'
}

export const GROUP_USER_JOIN_CONFIRMATION = {
    DECLINE: 0,
    JOIN: 1
}