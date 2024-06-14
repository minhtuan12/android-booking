import NodeCache from "node-cache";
import moment from "moment";
import jwt from "jsonwebtoken";
import {USER_GENDER, User} from "../models";
import {comparePassword, generatePassword, generateToken} from "@/utils";

export const tokenBlocklist = new NodeCache({
    checkperiod: process.env.TIME_TO_CHECK_PERIOD,
});

export async function checkValidLogin({email, password}) {
    const user = await User.findOne({
        email: email,
        deleted_at: null,
    });

    if (user) {
        const verified = comparePassword(password, user.password_hash);
        if (verified) {
            return user;
        }
    }

    return false;
}

export function authToken(user_id) {
    const expire_in = process.env.JWT_EXPIRES_IN;
    const token = generateToken({user_id}, expire_in);
    return {
        token,
        expire_in,
        auth_type: "Bearer Token",
    };
}

export async function register({name, email, password, phone, avatar}) {
    const user = new User({
        name,
        email,
        password_hash: generatePassword(password),
        phone,
        avatar,
    });
    return await user.save();
}

export function blockToken(token) {
    const decoded = jwt.decode(token);
    const expiresIn = decoded.exp;
    const now = moment().unix();
    tokenBlocklist.set(token, 1, expiresIn - now);
}

export async function profile(user_id) {
    const user = await User.findOne({_id: user_id}, {password_hash: 0});
    if (!user.avatar?.startsWith("https://")) {
        user.avatar = process.env.DOMAIN_SERVER + "/uploads/" + user.avatar;
    }
    return user;
}

export async function update(
    currentUser,
    {name, phone, avatar, birth, gender}
) {
    currentUser.name = name;
    currentUser.phone = phone;
    if (birth === "") {
        currentUser.birth = null;
    } else {
        currentUser.birth = birth;
    }
    currentUser.gender = gender;
    if (avatar) {
        currentUser.avatar = avatar;
    }
    return await currentUser.save();
}

export async function authTokenViaGoogle({email, name, picture}) {
    let user = await User.findOne({email});
    if (!user) {
        user = await User.create({ name, email, gender: USER_GENDER.OTHER, avatar: picture });
    } else if (user.name.startsWith("user#")) {
        user.name = name;
        user.avatar = picture;
        await user.save();
    }
    return authToken(user._id);
}
