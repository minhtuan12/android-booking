import {Schema, model} from "mongoose";

const ObjectId = Schema.Types.ObjectId;

const bookingCreatorSchema = new Schema(
    {
        booking_id: {
            type: ObjectId,
            ref: "Booking",
            default: null,
        },
        email: {
            type: String,
            require: true,
        },
        name: {
            type: String,
            require: true,
        },
        phone: {
            type: String,
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

const BookingCreator = model("BookingCreator", bookingCreatorSchema, "booking_creators");

export default BookingCreator;
