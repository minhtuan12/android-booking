import {Schema, model} from "mongoose";
import {CALENDAR_WEEKDAY} from "./Enum";

const ObjectId = Schema.Types.ObjectId;

const calendarSchema = new Schema(
    {
        user_id: {
            type: ObjectId,
            ref: "User",
            require: true,
        },
        day: {
            type: Number,
            default: null,
        },
        weekday: {
            type: Number,
            enum: Object.values(CALENDAR_WEEKDAY),
            default: null,
        },
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
    }
);

const Calendar = model("Calendar", calendarSchema, "calendars");

export default Calendar;
