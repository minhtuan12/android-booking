import {responseError, responseSuccess, getToken} from "@/utils";
import {FileUpload} from "@/utils/types";
import * as authService from "../services/AuthService";

export async function login(req, res) {
    const validLogin = await authService.checkValidLogin(req.body);

    if (validLogin) {
        return responseSuccess(res, authService.authToken(validLogin._id));
    } else {
        return responseError(res, 400, "Email hoặc mật khẩu không đúng");
    }
}

export async function register(req, res) {
    if (req.body.avatar) {
        req.body.avatar = req.body.avatar.save();
    }

    const newUser = await authService.register(req.body);
    return responseSuccess(res, authService.authToken(newUser._id), 201, "Đăng ký thành công");
}

export async function logout(req, res) {
    const token = getToken(req);
    authService.blockToken(token);
    return responseSuccess(res);
}

export async function me(req, res) {
    return responseSuccess(res, await authService.profile(req.currentUser._id));
}

export async function updateMe(req, res) {
    if (req.body.avatar) {
        if (req.currentUser.avatar) {
            FileUpload.remove(req.currentUser.avatar);
        }
        req.body.avatar = req.body.avatar.save("images");
    }

    await authService.update(req.currentUser, req.body);
    return responseSuccess(res);
}

export async function loginWithGoogle(req, res) {
    if (!req.body.email_verified) {
        return responseError(res, "Tài khoản Google chưa được xác thực");
    }
    const token = await authService.authTokenViaGoogle(req.body);
    return responseSuccess(res, token);
}
