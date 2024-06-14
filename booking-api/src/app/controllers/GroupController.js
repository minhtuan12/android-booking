import * as groupService from "../services/GroupService";
import { responseSuccess } from "@/utils";
import { FileUpload } from "@/utils/types";

export async function getListGroup(req, res) {
    const {q, page, page_size, type} = req.query
    const user_id = req.currentUser.id
    const result = await groupService.getListGroup({q, page, page_size, user_id, type})

    return responseSuccess(res, result);
}

export async function authorize(req, res) {
    const result = await groupService.authorize(req.params.groupId, req.params.userId, req.body.allow);

    return responseSuccess(res, result, 201);
}

export async function createGroup(req, res) {

    if (req.body.thumbnail) {
        req.body.thumbnail = req.body.thumbnail.save("images");
    }
    await groupService.createNewGroup(req.currentUser, req.body,);
    return responseSuccess(res, null, 200);
}

export async function updateGroup(req, res) {
    if (req.body.thumbnail) {
        req.body.thumbnail = req.body.thumbnail.save("images");
    }
    await groupService.updateGroup(req.params.id, req.body);
    return responseSuccess(res, null, 200)
}

export async function remove(req, res) {
    await groupService.remove(req.group);
    return responseSuccess(res, null, 200, "Xóa thành công");
}

export async function detail(req, res) {
    const groupId = req.params.id;
    const userId = req.currentUser._id
    return responseSuccess(res, await groupService.getDetailGroup(groupId, userId))
}

export async function freeTime(req, res) {
    const day = req.params.day;
    const id = req.params.id

    return responseSuccess(res, await groupService.freeTime(id, day))
}

export async function optionFreeTime(req, res) {
    const id = req.params.id

    return responseSuccess(res, await groupService.optionFreeTime(id, req.query))
}

export async function readRoot(req, res) {
    return responseSuccess(res, await groupService.getListAllUsers(req.params, req.query));
}

export async function createItem(req, res) {
    await groupService.addMember(req);
    return responseSuccess(res, null, 201)
}

export async function removeItem(req, res) {
    const deletedUser = await groupService.removeMember(req.params);
    return responseSuccess(res, deletedUser)
}

export async function emailConfirmation(req, res) {
    const infoGroup = await groupService.confirmJoinGroup(req.query)
    return responseSuccess(res, { type: 'Success', infoGroup})
}

export async function freeUsers(req, res) {
    return responseSuccess(
        res,
        await groupService.filterFreeUserFromGroup(req.group._id, req.query, null, req.query.booking_id)
    );
}
export async function bookingSuggestion(req, res) {
    return responseSuccess(
        res,
        await groupService.bookingSuggestion(req.group._id, req.query,null)
    );
}
export async function createBookingSuggestions(req, res) {
    await groupService.createBookingSuggestions(req.group, req.body);
    return responseSuccess(res, null, 201);
}
export async function createBooking(req, res) {
    await groupService.createBooking(req.currentUser, req.group, req.body);
    return responseSuccess(res, null, 201);
}

export async function updateBooking(req, res) {
    await groupService.updateBooking(req.currentUser, req.booking, req.group, req.body);
    return responseSuccess(res, null, 201);
}

export async function cancelBooking(req, res) {
    await groupService.cancelBooking(req.currentUser, req.booking, req.group);
    return responseSuccess(res);
}

export async function joinBooking(req, res) {
    await groupService.joinBooking(req.bookingUser, req.body.status);
    return responseSuccess(res, req.bookingUser.booking_id);
}
