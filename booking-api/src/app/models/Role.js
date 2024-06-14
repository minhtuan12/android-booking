import {Schema, model} from "mongoose";

const roleSchema = new Schema(
    {
        name: {
            type: String,
            require: true,
            unique: true,
        },
        description: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
    }
);

const Role = model("Role", roleSchema, "roles");

export default Role;
