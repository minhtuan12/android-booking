import {Permission, PermissionRole, Role} from "@/app/models";

const admin = {
    name: 'Quản trị viên',
    description: '',
}

export default async function () {
    try {
        const permissions = await Permission.find()

        const adminRole = await Role.findOneAndUpdate(
            {name: admin.name},
            {$set: {...admin}},
            {upsert: true}
        )

        for (const permission of permissions) {
            await PermissionRole.updateMany(
                {
                    role_id: adminRole._id,
                    permission_id: permission._id
                },
                {
                    $set: {
                        role_id: adminRole._id,
                        permission_id: permission._id
                    }
                },
                {upsert: true}
            )
        }

        console.log("Seed Role successfully")
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}