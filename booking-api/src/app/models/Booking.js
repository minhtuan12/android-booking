import {Schema, model} from "mongoose";

const ObjectId = Schema.Types.ObjectId;

const bookingSchema = new Schema(
    {
        group_id: {
            type: ObjectId,
            ref: "Group",
            default: null,
        },
        title: {
            type: String,
            require: true,
        },
        description: {
            type: String,
            default: null,
        },
        start_time: {
            type: Number,
            require: true,
        },
        end_time: {
            type: Number,
            require: true,
        },
        cancel_time: {
            type: Number,
            require: null,
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

const Booking = model("Booking", bookingSchema, "bookings");

export default Booking;
