import { createLogger, format, transports } from "winston";
import { join } from "path";
import { LOG_DIR } from "@/utils/Constants";

const logger = createLogger({
    transports: [
        new transports.File({
            format: format.combine(
                format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                format.printf((info) => `[${info.timestamp}] | ${info.message}`)
            ),
            filename: join(LOG_DIR, "app.log"),
        }),
        new transports.Console({
            format: format.combine(
                format.colorize({ message: true }),
                format.printf((info) => info.message)
            ),
        }),
    ],
});

export const debugLogger = createLogger({
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.colorize(),
        format.printf((info) => `[${info.timestamp}] [${info.level}] | ${info.message}`)
    ),
    transports: [new transports.Console()],
});

export const errorLogger = createLogger({
    level: "error",
    format: format.json({ space: 4 }),
    transports: [new transports.File({ filename: join(LOG_DIR, "exceptions.log") })],
});

export default logger;
