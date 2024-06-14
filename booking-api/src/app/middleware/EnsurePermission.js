import {Group, GroupUser, PermissionRole} from "@/app/models";
import {responseError} from "@/utils";
import {ObjectId} from "bson";

const EnsurePermission = (...permissions) => async (req, res, next) => {
    const user_id = req.currentUser._id
    const group_id = req.params.groupId

    const creator = await Group.findOne({_id: new ObjectId(group_id), deleted_at: null})
    if (creator.creator_id.equals(new ObjectId(user_id))) {
        return next()
    } else {
        const currentUserRole = await GroupUser.findOne({user_id, group_id, deleted_at: null})
        if (!currentUserRole?.role_id) {
            return responseError(res, 403, 'Bạn không có quyền truy cập chức năng này')
        }

        let currentUserPermissions = await PermissionRole.aggregate([
            {
                $match: {
                    role_id: currentUserRole?.role_id
                }
            },
            {
                $lookup: {
                    from: 'permissions',
                    localField: 'permission_id',
                    foreignField: '_id',
                    as: 'permissions'
                }
            },
            {
                $project: {
                    create_at: 0,
                    updated_at: 0,
                    'permissions.created_at': 0,
                    'permission.updated_at': 0,
                    'permission.description': 0
                }
            }
        ])
        currentUserPermissions = currentUserPermissions?.map(item => item.permissions[0].code)

        permissions.forEach(per => {
            if (!currentUserPermissions?.includes(per)) {
                return responseError(res, 403, 'Bạn không có quyền truy cập chức năng này')
            }
        })
        return next()
    }
}

export default EnsurePermission