export function responseSuccess(res, data, status = 200, message = "Success") {
    return res.status(status).json({
        status,
        error: false,
        message,
        ...((data !== null) & (data !== undefined) ? {data} : {}),
    });
}

export function responseError(res, status = 400, message = "Error", details) {
    return res.status(status).json({
        status,
        error: true,
        message,
        ...(details !== null && details !== undefined ? {details} : {}),
    });
}
