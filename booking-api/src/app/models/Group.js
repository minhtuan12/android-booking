import {Schema, model} from "mongoose";

const ObjectId = Schema.Types.ObjectId;

const groupSchema = new Schema(
    {
        name: {
            type: String,
            require: true,
        },
        description: {
            type: String,
            default: null,
        },
        thumbnail: {
            type: String,
            default: null,
        },
        creator_id: {
            type: ObjectId,
            ref: "User",
            require: true,
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

const Group = model("Group", groupSchema, "groups");

export default Group;
