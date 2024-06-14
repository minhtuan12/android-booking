import moment from "moment";
import {debugLogger} from "@/configs/Logger";
import {contentLength, responseTime} from "@/utils";

export default function httpRequestHandler(req, res, next) {
    const currentUrl = req.originalUrl || req.url;
    req._startTime = moment();
    const end = res.end;
    res.end = function (chunk, encoding, callback) {
        const processTime = moment().diff(req._startTime, "ms");
        res.end = end;
        res.end(chunk, encoding, callback);
        const status = res.statusCode;
        const level = status < 402 ? "info" : status < 500 ? "warn" : "error";
        const message = `${req.method} ${currentUrl} ${status} - ${contentLength(chunk)} - ${responseTime(
            processTime
        )}`;
        debugLogger.log({level, message});
    };
    next();
}
