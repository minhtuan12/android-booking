import {Schema, model} from "mongoose";

const ObjectId = Schema.Types.ObjectId;

const periodSchema = new Schema(
    {
        start_time: {
            type: Number,
            require: true,
        },
        end_time: {
            type: Number,
            require: true,
        },
        calendar_id: {
            type: ObjectId,
            ref: "Calendar",
            require: true,
        },
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
    }
);

const Period = model("Period", periodSchema, "periods");

export default Period;