import {Schema, model} from "mongoose";
import {USER_GENDER} from "./Enum";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            required: true,
        },
        phone: {
            type: String,
            default: null,
        },
        birth: {
            type: Number,
            default: null,
        },
        gender: {
            type: Number,
            enum: [...Object.values(USER_GENDER)],
            default: 2,
        },
        avatar: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
    }
);

const User = model("User", userSchema, "users");

export default User;
