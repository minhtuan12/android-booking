import * as calendarService from "../services/CalendarService";
import {responseSuccess} from "@/utils";

export async function createAndUpdate(req, res) {
    await calendarService.createAndUpdate(req);
    return responseSuccess(res, null, 201);
}

export async function detailWeek(req, res) {
    await responseSuccess(res, await calendarService.detailWeek(req.currentUser._id));
}

export async function detailDay(req, res) {
    await responseSuccess(res, await calendarService.detailDay(req.currentUser._id));
}

export async function detail(req, res) {
    await responseSuccess(res, await calendarService.detailBookingConfig(req.currentUser._id));
}