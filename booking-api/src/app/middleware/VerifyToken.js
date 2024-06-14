import jwt, {JsonWebTokenError, NotBeforeError, TokenExpiredError} from "jsonwebtoken";
import {responseError, getToken} from "@/utils";
import {User} from "../models";
import {tokenBlocklist} from "../services/AuthService";

export default async function (req, res, next) {
    try {
        const token = getToken(req);

        if (token) {
            if (!tokenBlocklist.has(token)) {
                const {user_id} = jwt.verify(token, process.env.SECRET_KEY);
                const user = await User.findOne({_id: user_id});
                if (user) {
                    req.currentUser = user;
                    return next();
                }
            }
        }

        return responseError(res, 401, "Từ chối truy cập");
    } catch (error) {
        if (error instanceof JsonWebTokenError) {
            if (error instanceof TokenExpiredError) {
                return responseError(res, 401, "Mã xác thực hết hạn");
            } else if (error instanceof NotBeforeError) {
                return responseError(res, 401, "Mã xác thực không hoạt động");
            } else {
                return responseError(res, 401, "Mã xác thực không hợp lệ");
            }
        }

        return next(error);
    }
}
