import {Schema, model} from "mongoose";
import {BOOKING_CONFIG_CALENDAR_MODE} from "./Enum";

const ObjectId = Schema.Types.ObjectId;

const bookingConfigSchema = new Schema(
    {
        user_id: {
            type: ObjectId,
            ref: "User",
            require: true,
        },
        calendar_mode: {
            type: Number,
            require: true,
            enum: Object.values(BOOKING_CONFIG_CALENDAR_MODE),
            default: BOOKING_CONFIG_CALENDAR_MODE.OPTION,
        },
        booking_limit: {
            type: Number,
            default: null,
        },
        deleted_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
    }
);

const BookingConfig = model("BookingConfig", bookingConfigSchema, "booking_configs");

export default BookingConfig;
