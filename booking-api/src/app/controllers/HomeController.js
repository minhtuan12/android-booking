import {responseSuccess} from "@/utils";
import * as homeService from "@/app/services/HomeService";

export async function getStatistics(req, res) {
    return responseSuccess(res, await homeService.getStatistics())
}

export async function getBookingQuantityPerDay(req, res) {
    const {start_time, end_time} = req.query
    return responseSuccess(res, await homeService.getBookingQuantityPerDay(start_time, end_time))
}