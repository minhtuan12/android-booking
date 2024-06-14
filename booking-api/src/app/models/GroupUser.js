import { Schema, model } from "mongoose";
import { GROUP_USER_STATUS } from "@/app/models/Enum";

const ObjectId = Schema.Types.ObjectId;

const groupUserSchema = new Schema(
    {
        user_id: {
            type: ObjectId,
            ref: "User",
            require: true,
        },
        group_id: {
            type: ObjectId,
            ref: "Group",
            require: true,
        },
        role_id: {
            type: ObjectId,
            ref: "Role",
            default: null
        },
        status: {
            type: Number,
            enum: [...Object.values(GROUP_USER_STATUS), null],
            default: null,
        },
        deleted_at: {
            type: Date,
            default: null,
        },
        confirmed_at: {
            type: Number,
            default: null,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

const GroupUser = model("GroupUser", groupUserSchema, "group_user");

export default GroupUser;
