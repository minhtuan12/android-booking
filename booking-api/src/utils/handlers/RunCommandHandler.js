import moment from "moment";
import {errorLogger} from "@/configs/Logger";
import {SOURCE_DIR} from "@/utils";
import {escapeRegExp} from "@/utils";

export default function runCommandHandler(fn) {
    return async function (...args) {
        try {
            await fn(...args);
        } catch (error) {
            const re = new RegExp(escapeRegExp(SOURCE_DIR) + "(.*?)" + "\\)", "g");
            const stack = error.stack.match(re);
            errorLogger.error({
                date: moment().format("dddd DD-MM-YYYY, HH:mm:ss"),
                type: error.name || "Error",
                message: error.message || `${err}`,
                stack: stack ? stack.map((item) => item.slice(0, -1)) : stack,
            });
        }
    };
}
