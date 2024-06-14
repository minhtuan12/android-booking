import roleSeeder from "./RoleSeeder";
import permissionSeeder from "./PermissionSeeder";
import {db} from "../configs";

async function seed() {
    try {
        await db.connect();
        await permissionSeeder();
        await roleSeeder();
        console.log("Seed done.");
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

seed();
