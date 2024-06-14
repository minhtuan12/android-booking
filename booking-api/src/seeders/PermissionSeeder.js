import {Permission} from "@/app/models";

const permissions = {
    update_group: {
        name: 'Cập nhật thông tin nhóm',
        code: 'update-group',
        description: 'Cập nhật thông tin nhóm'
    },
    invite_member: {
        name: 'Thêm thành viên',
        code: 'invite-member',
        description: 'Thêm thành viên vào nhóm'
    },
    delete_member: {
        name: 'Xóa thành viên',
        code: 'delete-member',
        description: 'Xóa thành viên khỏi nhóm'
    },
    create_meeting: {
        name: 'Tạo lịch hẹn',
        code: 'create-meeting',
        description: 'Tạo lịch hẹn nhóm'
    },
    update_meeting: {
        name: 'Cập nhật lịch hẹn',
        code: 'update-meeting',
        description: 'Cập nhật thông tin lịch hẹn nhóm'
    },
    cancel_meeting: {
        name: 'Hủy lịch hẹn',
        code: 'cancel-meeting',
        description: 'Hủy lịch hẹn nhóm'
    }
}

export default async function () {
    try {
        for (let key in permissions) {
            await Permission.findOneAndUpdate(
                {code: permissions[key].code},
                {$set: {...permissions[key]}},
                {upsert: true}
            )
        }

        console.log("Seed Permission successfully")
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}