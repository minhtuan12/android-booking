import Joi from "joi";
import {PER_PAGE} from "@/utils";

export const readRoot = {
    query: Joi.object({
        q: Joi.string().trim().allow("").label("Chuỗi tìm kiếm"),
        page: Joi.number().integer().min(1).label("Số trang").default(1),
        per_page: Joi.number().integer().min(1).max(100).label("Số cuộc họp mỗi trang").default(PER_PAGE),
        field: Joi.valid("created_at", "title", "description").default("created_at"),
        sort_order: Joi.valid("asc", "desc").default("desc"),
    }).unknown(true),
};
