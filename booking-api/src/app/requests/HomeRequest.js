import Joi from "joi";
import {responseError} from "@/utils";

export const getTotalBookingsPerDay = {
    query: Joi.object({
        start_time: Joi.number()
            .label("Thời gian bắt đầu"),
        end_time: Joi.number()
            .when('start_time', {
                is: Joi.exist(),
                then: Joi.number().greater(Joi.ref('start_time')).message('Thời gian kết thúc phải sau thời gian bắt đầu'),
            })
            .label("Thời gian kết thúc"),
    })
}

export const checkParams = (req, res, next) => {
    const {start_time, end_time} = req.query
    if (start_time && !end_time || !start_time && end_time) {
        return responseError(res, 400, 'Thời gian bắt đầu và thời gian kết thúc đều không được bỏ trống')
    }

    return next()
}