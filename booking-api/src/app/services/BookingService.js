import {Booking, BOOKING_USER_STATUS} from "@/app/models";

export async function filter(req) {
    const user = req.currentUser;

    let bookings = await Booking.aggregate([
        {
            $lookup: {
                from: 'booking_user',
                localField: '_id',
                foreignField: 'booking_id',
                as: 'booking_user'
            }
        },
        {
            $match: {
                'booking_user': {
                    $elemMatch: {
                        user_id: user._id,
                        status: BOOKING_USER_STATUS.ACCEPT
                    }
                }
            }
        },
        {
            $addFields: {
                'booking_user': '$booking_user'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'booking_user.user_id',
                foreignField: '_id',
                as: 'users'
            }
        },
        {
            $addFields: {
                'users': {
                    $filter: {
                        input: "$users",
                        as: "item",
                        cond: {
                            $or: [
                                {$eq: ["$$item.deleted_at", null]},
                                {$eq: ["$$item.deleted_at", undefined]},
                                {$not: ["$$item.deleted_at"]},
                            ]
                        }
                    }
                },
            }
        },
        {
            $addFields: {
                'users': {
                    $map: {
                        input: "$users",
                        as: "user",
                        in: {
                            _id: "$$user._id",
                            name: "$$user.name",
                            email: "$$user.email",
                            avatar: "$$user.avatar",
                            'status_user': {
                                $filter: {
                                    input: "$booking_user",
                                    as: "booking_user",
                                    cond: {
                                        $eq: ["$$booking_user.user_id", "$$user._id"]
                                    }
                                }
                            },
                        },
                    },
                }
            }
        },
        {
            $addFields: {
                'users': {
                    $map: {
                        input: "$users",
                        as: "user",
                        in: {
                            _id: "$$user._id",
                            name: "$$user.name",
                            email: "$$user.email",
                            avatar: "$$user.avatar",
                            'status_user': {
                                $cond: {
                                    if: {$gt: [{$size: "$$user.status_user"}, 0]},
                                    then: {$arrayElemAt: ["$$user.status_user", 0]},
                                    else: 0,
                                },
                            },
                        },
                    },
                }
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                start_time: 1,
                end_time: 1,
                cancel_time: 1,
                users: {
                    $map: {
                        input: "$users",
                        as: "user",
                        in: {
                            _id: "$$user._id",
                            name: "$$user.name",
                            email: "$$user.email",
                            avatar: "$$user.avatar",
                            'status_user': "$$user.status_user.status",
                        }
                    }
                }
            },
        }
    ]);

    return {bookings};
}