import jwt, {JsonWebTokenError, NotBeforeError, TokenExpiredError} from 'jsonwebtoken'
import {responseError, tokenUsed} from "@/utils";
import moment from "moment";

export default async function confirmedUserToken(req, res, next) {
    let token = req.query.token

    jwt.verify(token, process.env.CONFIRM_SECRET_KEY, (error, decoded) => {
        if (error instanceof JsonWebTokenError) {
            if (error instanceof TokenExpiredError) {
                return responseError(res, 400, undefined, {
                    type: "ExpireToken",
                    message: "Liên kết đã hết hạn",
                });
            } else if (error instanceof NotBeforeError) {
                return responseError(res, 401, undefined, {
                    type: 'InvalidToken',
                    message: "Liên kết không hoạt động"
                });
            } else {
                return responseError(res, 400, undefined, {
                    type: "InvalidToken",
                    message: "Liên kết không hợp lệ",
                });
            }
        }

        if (tokenUsed.has(token)) {
            return responseError(res, 400, undefined, {
                type: 'TokenUsed',
                message: 'Bạn đã xác nhận lời mời này trước đó'
            })
        }
        tokenUsed.set(token, 1, decoded.exp - moment().unix())
        req.query.user_id = decoded.user_id
        req.query.group_id = decoded.group_id

        next()
    })
}