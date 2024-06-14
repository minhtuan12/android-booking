import {Schema, model} from "mongoose";
import {BOOKING_USER_STATUS} from "./Enum";

const ObjectId = Schema.Types.ObjectId;

const bookingUserSchema = new Schema(
    {
        user_id: {
            type: ObjectId,
            ref: "User",
            require: true,
        },
        booking_id: {
            type: ObjectId,
            ref: "Booking",
            require: true,
        },
        status: {
            type: Number,
            enum: Object.values(BOOKING_USER_STATUS),
            default: BOOKING_USER_STATUS.PENDING,
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

const BookingUser = model("BookingUser", bookingUserSchema, "booking_user");

export default BookingUser;
