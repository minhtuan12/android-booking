import Joi from "joi";
import {Calendar} from "../models";
import {isValidObjectId} from "mongoose";
import {BOOKING_CONFIG_CALENDAR_MODE, CALENDAR_WEEKDAY} from "@/app/models";

export const createAndUpdate = {
    body: Joi.object({
        calendar_mode: Joi.number().valid(...Object.values(BOOKING_CONFIG_CALENDAR_MODE)).required().label("Chế độ lịch"),
        booking_limit: Joi.number().min(0).max(23).allow(null).label("Số lần đặt lịch tối đa"),
        calendars: Joi.array().items(Joi.object({
            weekday: Joi.number().valid(...Object.values(CALENDAR_WEEKDAY)).allow(null).label("Ngày trong tuần"),
            day: Joi.number().allow(null).label("Ngày trong tháng"),
            delete: Joi.number().allow(0).label("Trường xoá ngày"),
            periods: Joi.array().items(Joi.object({
                start_time: Joi.number()
                    .required()
                    .label("Thời gian bắt đầu"),
                end_time: Joi.number()
                    .required().when('start_time', {
                        is: Joi.exist(),
                        then: Joi.number().greater(Joi.ref('start_time')).message('Thời gian kết thúc phải sau thời gian bắt đầu'),
                    })
                    .label("Thời gian kết thúc"),
            })).label("Danh sách khoảng thời gian"),
        })).label("Danh sách lịch"),
    })
};
export const checkCalendarId = async function (req, res, next) {
    const _id = req.params.calendarId;

    if (isValidObjectId(_id)) {
        const calendar = await Calendar.findOne({_id});
        if (calendar) {
            req.calendar = calendar;
            return next();
        }
    }
    return responseError(res, 404, "Ngày không tồn tại hoặc đã bị xóa");
};

