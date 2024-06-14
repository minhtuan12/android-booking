import {Group, User} from "@/app/models";
import {responseError} from "@/utils";

const error_details = {
    user: 'Người dùng không tồn tại hoặc đã bị xóa',
    group: 'Nhóm không tồn tại hoặc đã bị xóa',
    type: 'Loại xác nhận phải là 0 hoặc 1'
}

export default async function validateConfirmedUser(req, res, next) {
    const user_id = req.user_id
    const group_id = req.group_id
    const type = req.type

    const user = await User.findOne({_id: user_id})
    const group = await Group.findOne({_id: group_id, deleted_at: null})

    let errors = {}
    let flag = true

    if (!user) {
        errors.user = error_details.user
        flag = false
    }
    if (!group) {
        errors.group = error_details.group
        flag = false
    }
    if (type !== 1 && type !== 0) {
        errors.type = error_details.type
        flag = false
    }

    if (!flag) {
        return responseError(res, 400, 'Error', errors)
    }

    return next()
}