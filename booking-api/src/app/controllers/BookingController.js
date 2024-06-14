import * as BookingService from "../services/BookingService"
import {responseSuccess} from "@/utils";

export async function readRoot(req, res) {
    return responseSuccess(res, await BookingService.filter(req));
}