import {Schema, model} from "mongoose";

const ObjectId = Schema.Types.ObjectId;

const permissionRoleSchema = new Schema(
    {
        permission_id: {
            type: ObjectId,
            ref: "Permission",
            require: true,
        },
        role_id: {
            type: ObjectId,
            ref: "Role",
            require: true,
        },
    },
    {
        timestamps: {createdAt: "created_at", updatedAt: "updated_at"},
    }
);

const PermissionRole = model("PermissionRole", permissionRoleSchema, "permission_role");

export default PermissionRole;
