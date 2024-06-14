import {getToken, responseError} from "@/utils";
import {OAuth2Client} from "google-auth-library";

const oAuth2Client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

export default async function verifyGoogleToken(req, res, next) {
    const token = getToken(req);

    if (token) {
        try {
            const ticket = await oAuth2Client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            req.body = ticket.payload;
            return next();
        } catch (error) {
            return responseError(res, 401, "Mã xác thực đã hết hạn hoặc không hợp lệ");
        }
    }

    return responseError(res, 401, "Từ chối truy cập");
}
