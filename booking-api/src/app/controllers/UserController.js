import * as userService from "../services/UserService";
import { responseError, responseSuccess } from "@/utils";

export async function readRoot(req, res) {
    return responseSuccess(res, await userService.filter(req.query));
}

export async function readItem(req, res) {
    await responseSuccess(res, await userService.details(req.params.id));
}

export async function createItem(req, res) {
    await userService.create(req.body);
    return responseSuccess(res, null, 201);
}

export async function updateItem(req, res) {
    await userService.update(req.user, req.body);
    return responseSuccess(res, null, 201);
}

export async function removeItem(req, res) {
    if (req.currentUser._id.equals(req.params.id)) {
        return responseError(res, 400, "Không thể xóa chính mình");
    }

    await userService.remove(req.user);
    return responseSuccess(res);
}

export async function resetPassword(req, res) {
    await userService.resetPassword(req.user, req.body.new_password);
    return responseSuccess(res, null, 201);
}
