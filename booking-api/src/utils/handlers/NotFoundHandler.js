import {responseError} from "@/utils";

export default function (req, res) {
    return responseError(
        res,
        404,
        "URL được yêu cầu không được tìm thấy trên máy chủ. Nếu bạn nhập URL theo cách thủ công, vui lòng kiểm tra chính tả và thử lại."
    );
}
