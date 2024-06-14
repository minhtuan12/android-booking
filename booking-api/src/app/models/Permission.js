import {Schema, model} from "mongoose";

const permissionSchema = new Schema(
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
        code: {
            type: String,
            required: true,
            unique: true,
        },
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
    }
);

const Permissions = model("Permissions", permissionSchema, "permissions");

export default Permissions;
