import {
    Booking,
    BOOKING_CONFIG_CALENDAR_MODE,
    BOOKING_USER_STATUS,
    Group,
    GROUP_USER_STATUS,
    GroupUser,
    Role,
    User,
    BookingCreator,
    BookingUser,
} from "../models";
import {ObjectId} from 'mongodb'
import {
    LINK_THUMBNAIL_GROUP, generateToken,
    GROUP_USER_JOIN_CONFIRMATION,
    PER_PAGE,
    sendMail,
    VIEW_DIR,
    generateURL
} from "@/utils";
import moment from "moment";
import {
    compareAndMerge,
    convertBookingData,
    convertPeriod,
    mergeOverlappingPeriods,
} from "@/app/services/HandleFreeTimeGroupService";
import ejs from "ejs";
import path from "path";
import {errorLogger} from "@/configs/Logger";

export async function getListGroup({q, page, page_size, user_id, type}) {
    q = q ? {$regex: new RegExp(q, "i")} : null;
    page = page ? Number(page) : 1
    page_size = page_size ? Number(page_size) : 20
    let filter = {}
    let sortOption = {}

    if (type === "joined") {
        filter = {
            "group_user.user_id": new ObjectId(user_id),
            creator_id: {
                $ne: new ObjectId(user_id)
            }
        }
        sortOption = {$sort: {"confirmed_at": -1}}
    } else if (type === "created") {
        filter = {creator_id: new ObjectId(user_id)}
        sortOption = {$sort: {created_at: -1}}
    }

    const groups = (
        await Group.aggregate([
            {
                $lookup: {
                    from: 'group_user',
                    localField: '_id',
                    foreignField: 'group_id',
                    as: 'group_user'
                }
            },
            {
                $match: {
                    deleted_at: null,
                    ...filter,
                    ...(q ? {name: q} : {}),
                    'group_user': {
                        $elemMatch: {
                            user_id: new ObjectId(user_id),
                            status: GROUP_USER_STATUS.ACCEPT
                        }
                    }
                }
            },
            {
                $addFields: {
                    'group_user': {
                        $filter: {
                            input: "$group_user",
                            as: "item",
                            cond: {
                                $eq: ["$$item.status", GROUP_USER_STATUS.ACCEPT]
                            }
                        }
                    },
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'group_user.user_id',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $addFields: {
                    users: {
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
                $facet: {
                    metadata: [{$count: "total"}],
                    data: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                created_at: 1,
                                description: 1,
                                thumbnail: {
                                    $cond: {
                                        if: {
                                            $eq: [
                                                {$substr: ["$thumbnail", 0, 8]},
                                                "https://"
                                            ]
                                        },
                                        then: "$thumbnail",
                                        else: {$concat: [LINK_THUMBNAIL_GROUP, "$thumbnail"]}
                                    }
                                },
                                users: {
                                    $map: {
                                        input: "$users",
                                        as: "user",
                                        in: {
                                            _id: "$$user._id",
                                            name: "$$user.name",
                                            avatar: {
                                                $cond: {
                                                    if: {
                                                        $eq: [
                                                            {$substr: ["$$user.avatar", 0, 8]},
                                                            "https://"
                                                        ]
                                                    },
                                                    then: "$$user.avatar",
                                                    else: {$concat: [LINK_THUMBNAIL_GROUP, "$$user.avatar"]}
                                                }
                                            },
                                            created_at: "$$user.created_at",
                                        },
                                    },
                                },
                                group_user: {
                                    $filter: {
                                        input: "$group_user",
                                        as: "user",
                                        cond: {$eq: ["$$user.user_id", new ObjectId(user_id),]}
                                    }
                                }
                            },
                        },
                        {
                            $unwind: "$group_user"
                        },
                        {
                            $lookup: {
                                from: "permission_role",
                                localField: "group_user.role_id",
                                foreignField: "role_id",
                                as: "permission_role",
                            }
                        },
                        {
                            $unwind: {
                                path: "$permission_role",
                                preserveNullAndEmptyArrays: true,
                            }

                        },
                        {
                            $lookup: {
                                from: "permissions",
                                localField: "permission_role.permission_id",
                                foreignField: "_id",
                                as: "permission_role.permissions",
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                name: {$first: "$name"},
                                created_at: {$first: "$created_at"},
                                confirmed_at: {$first: "$group_user.confirmed_at"},
                                description: {$first: "$description"},
                                thumbnail: {$first: "$thumbnail"},
                                users: {$first: "$users"},
                                permissions: {
                                    $push: {
                                        $arrayElemAt: ["$permission_role.permissions.code", 0]
                                    }
                                },
                            }
                        },
                        {...sortOption},
                        {$skip: (page - 1) * page_size},
                        {$limit: page_size},
                    ],
                },
            },
            {
                $project: {
                    total: {
                        $cond: {
                            if: {$gt: [{$size: "$metadata"}, 0]},
                            then: {$arrayElemAt: ["$metadata.total", 0]},
                            else: 0,
                        },
                    },
                    data: 1,
                },
            },
        ])
    )

    return {
        total: groups[0].total,
        page,
        page_size,
        groups: groups[0].data
    }
}

export const freeTime = async (id, day) => {

    const startDate = new Date(day * 1000)
    const dayOfWeek = startDate.getDay();

    const momentObject = moment.unix(day);
    momentObject.endOf('day');
    const endTime = momentObject.valueOf() / 1000

    const userTime = await Group.aggregate([
        {
            $match: {
                _id: new ObjectId(id),
            },
        },
        {
            $lookup: {
                from: 'group_user',
                let: {group_id: '$_id'},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {$eq: ['$group_id', '$$group_id']},
                                    {$eq: ['$status', GROUP_USER_STATUS.ACCEPT]},
                                ],
                            },
                        },
                    },
                ],
                as: 'group_user',
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'group_user.user_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $lookup: {
                from: 'booking_configs',
                localField: 'user._id',
                foreignField: 'user_id',
                as: 'booking_config',
            }
        },
        {
            $lookup: {
                from: 'calendars',
                localField: 'user._id',
                foreignField: 'user_id',
                as: 'calendar',
            },
        },
        {
            $lookup: {
                from: 'periods',
                localField: 'calendar._id',
                foreignField: 'calendar_id',
                as: 'period',
            },
        },
        {
            $addFields: {
                user: {
                    $map: {
                        input: {
                            $filter: {
                                input: "$user",
                                as: 'ur',
                                cond: {
                                    $or: [
                                        {$eq: ["$$ur.deleted_at", null]},
                                        {$eq: ["$$ur.deleted_at", undefined]},
                                        {$not: ["$$ur.deleted_at"]},
                                    ]
                                }
                            }
                        },
                        as: 'usr',
                        in: {
                            _id: '$$usr._id',
                            name: '$$usr.name',
                            booking_config: {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$booking_config',
                                                    as: 'bcf',
                                                    cond: {$eq: ['$$bcf.user_id', '$$usr._id']},
                                                },
                                            },
                                            as: 'bcf',
                                            in: '$$bcf.calendar_mode',
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                user: {
                    $map: {
                        input: '$user',
                        as: "usr",
                        in: {
                            _id: "$$usr._id",
                            name: "$$usr.name",
                            booking_config: "$$usr.booking_config",
                            calendar: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: "$calendar",
                                            as: "cal",
                                            cond: {
                                                $and: [
                                                    {$eq: ["$$cal.user_id", "$$usr._id"]},
                                                    {
                                                        $cond: {
                                                            if: {$eq: ["$$usr.booking_config", BOOKING_CONFIG_CALENDAR_MODE.OPTION]},
                                                            then: {
                                                                $and: [
                                                                    { $gte: ["$$cal.day", parseInt(day)] },
                                                                    { $lte: ["$$cal.day", endTime] }
                                                                ]
                                                            },
                                                            else: {$eq: ["$$cal.weekday", dayOfWeek]},
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    as: "cal",
                                    in: {
                                        _id: "$$cal._id",
                                        user_id: "$$cal.user_id",
                                        weekday: "$$cal.weekday",
                                        day: "$$cal.day",
                                        period: {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: "$period",
                                                        as: "per",
                                                        cond: {$eq: ["$$per.calendar_id", "$$cal._id"]}
                                                    }
                                                },
                                                as: "pre",
                                                in: {
                                                    _id: "$$pre._id",
                                                    start_time: "$$pre.start_time",
                                                    end_time: "$$pre.end_time",
                                                    calendars_id: "$$pre.calendars_id",
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                user: 1
            }
        }
    ])

    const FreeTimeBooking = await User.aggregate([
        {
            $lookup: {
                from: 'booking_user',
                let: {userId: '$_id'},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {$eq: ['$user_id', '$$userId']},
                                    {$eq: ['$status', BOOKING_USER_STATUS.ACCEPT]},
                                ],
                            },
                        },
                    },
                ],
                as: 'user_bookings',
            },
        },
        {
            $lookup: {
                from: 'bookings',
                localField: 'user_bookings.booking_id',
                foreignField: '_id',
                as: 'bookings',
            },
        },
        {
            $addFields: {
                period: {
                    $map: {
                        input: {
                            $filter: {
                                input: '$bookings',
                                as: 'booking',
                                cond: {
                                    $and: [
                                        {$lte: ['$$booking.start_time', endTime]},
                                        {$gte: ['$$booking.start_time', parseInt(day)]},
                                        {
                                            $or: [
                                                {$eq: ["$$booking.deleted_at", null]},
                                                {$eq: ["$$booking.deleted_at", undefined]},
                                                {$not: ["$$booking.deleted_at"]},
                                            ]
                                        },
                                    ]
                                }
                            }
                        },
                        as: 'booking',
                        in: {
                            start_time: '$$booking.start_time',
                            end_time: '$$booking.end_time',
                        },
                    },
                },
            },
        },
        {
            $unwind: {
                path: "$period",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $sort: {
                "period.start_time": 1
            }
        },
        {
            $group: {
                _id: "$_id",
                name: {$first: "$name"},
                period: {$push: "$period"}
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                period: 1,
            },
        },
    ]);

    const A = convertPeriod(userTime[0])
    const B = FreeTimeBooking.map(booking => convertBookingData(booking));

    const mergedData = compareAndMerge(A, B);

    const data = mergeOverlappingPeriods(mergedData);

    data.sort((a, b) => {
        if (a.period.length === 0 && b.period.length > 0) {
            return -1;
        } else if (a.period.length > 0 && b.period.length === 0) {
            return 1;
        } else {
            return 0;
        }
    });

    return data
}

export const getDetailGroup = async (id, userId) => {
    const result = await Group.aggregate([
        {
            $match: {
                _id: new ObjectId(id),
            },
        },
        {
            $lookup: {
                from: 'bookings',
                localField: '_id',
                foreignField: 'group_id',
                as: 'booking',
            },
        },
        {
            $lookup: {
                from: 'booking_user',
                localField: 'booking._id',
                foreignField: 'booking_id',
                as: 'booking_user',
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'booking_user.user_id',
                foreignField: '_id',
                as: 'user_booking',
            },
        },
        {
            $lookup: {
                from: 'group_user',
                let: {group_id: '$_id'},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {$eq: ['$group_id', '$$group_id']},
                                    {$eq: ['$status', GROUP_USER_STATUS.ACCEPT]},
                                ],
                            },
                        },
                    },
                ],
                as: 'group_user',
            },
        },
        {
            $lookup: {
                from: 'roles',
                localField: 'group_user.role_id',
                foreignField: '_id',
                as: 'role',
            },
        },
        {
            $lookup: {
                from: 'permission_role',
                localField: 'role._id',
                foreignField: 'role_id',
                as: 'permission_role',
            },
        },
        {
            $lookup: {
                from: 'permissions',
                localField: 'permission_role.permission_id',
                foreignField: '_id',
                as: 'permissions',
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'group_user.user_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $lookup: {
                from: 'booking_configs',
                localField: 'user._id',
                foreignField: 'user_id',
                as: 'booking_config',
            },
        },
        {
            $lookup: {
                from: 'calendars',
                localField: 'user._id',
                foreignField: 'user_id',
                as: 'calendar',
            },
        },
        {
            $lookup: {
                from: 'periods',
                localField: 'calendar._id',
                foreignField: 'calendar_id',
                as: 'period',
            },
        },
        {
            $addFields: {
                user: {
                    $map: {
                        input: {
                            $filter: {
                                input: "$user",
                                as: 'ur',
                                cond: {
                                    $or: [
                                        {$eq: ["$$ur.deleted_at", null]},
                                        {$eq: ["$$ur.deleted_at", undefined]},
                                        {$not: ["$$ur.deleted_at"]},
                                    ],
                                },
                            },
                        },
                        as: 'usr',
                        in: {
                            _id: '$$usr._id',
                            email: '$$usr.email',
                            name: '$$usr.name',
                            avatar: {
                                $cond: {
                                    if: {
                                        $and: [
                                            {$gt: ['$$usr.avatar', null]},
                                            {$eq: [{$substr: ['$$usr.avatar', 0, 8]}, 'https://']},
                                        ],
                                    },
                                    then: '$$usr.avatar',
                                    else: {
                                        $concat: [`${process.env.DOMAIN_SERVER}/uploads/`, '$$usr.avatar'],
                                    },
                                },
                            },
                            phone: '$$usr.phone',
                            booking_config: {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$booking_config',
                                                    as: 'bcf',
                                                    cond: {$eq: ['$$bcf.user_id', '$$usr._id']},
                                                },
                                            },
                                            as: 'bcf',
                                            in: '$$bcf.calendar_mode',
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                user_permissions: {
                    $arrayElemAt: [
                        {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$group_user",
                                        as: "gur",
                                        cond: {$eq: ["$$gur.user_id", userId]},
                                    },
                                },
                                as: "gup",
                                in: {
                                    $arrayElemAt: [
                                        {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: "$role",
                                                        as: "role",
                                                        cond: {$eq: ["$$gup.role_id", '$$role._id']},
                                                    },
                                                },
                                                as: "rol",
                                                in: {
                                                    $map: {
                                                        input: {
                                                            $filter: {
                                                                input: "$permission_role",
                                                                as: "perl",
                                                                cond: {$eq: ["$$perl.role_id", '$$rol._id']},
                                                            },
                                                        },
                                                        as: "perl",
                                                        in: {
                                                            $arrayElemAt: [
                                                                {
                                                                    $map: {
                                                                        input: {
                                                                            $filter: {
                                                                                input: "$permissions",
                                                                                as: "per",
                                                                                cond: {$eq: ["$$perl.permission_id", '$$per._id']},
                                                                            },
                                                                        },
                                                                        as: "pem",
                                                                        in: '$$pem.code',
                                                                    },
                                                                },
                                                                0,
                                                            ],
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                        },
                        0,
                    ],
                },
                booking: {
                    $map: {
                        input: '$booking',
                        as: "bok",
                        in: {
                            _id: "$$bok._id",
                            title: "$$bok.title",
                            description: "$$bok.description",
                            start_time: "$$bok.start_time",
                            end_time: "$$bok.end_time",
                            cancel_time: "$$bok.cancel_time",
                            list_user: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: "$booking_user",
                                            as: "buk",
                                            cond: {
                                                $and: [
                                                    {$eq: ["$$buk.user_id", userId]},
                                                    {$eq: ["$$buk.status", BOOKING_USER_STATUS.ACCEPT]},
                                                ],
                                            },
                                        },
                                    },
                                    as: "call",
                                    in: {
                                        $cond: {
                                            if: {$eq: ["$$call.booking_id", "$$bok._id"]},
                                            then: {
                                                $map: {
                                                    input: {
                                                        $filter: {
                                                            input: "$booking_user",
                                                            as: "innerBuk",
                                                            cond: {$eq: ["$$innerBuk.booking_id", "$$call.booking_id"]},
                                                        },
                                                    },
                                                    as: "innerCall",
                                                    in: {
                                                        $arrayElemAt: [
                                                            {
                                                                $map: {
                                                                    input: {
                                                                        $filter: {
                                                                            input: "$user_booking",
                                                                            as: "ubk",
                                                                            cond: {$eq: ["$$ubk._id", "$$innerCall.user_id"]},
                                                                        },
                                                                    },
                                                                    as: "cal",
                                                                    in: {
                                                                        _id: "$$cal._id",
                                                                        name: "$$cal.name",
                                                                        avatar: {
                                                                            $cond: {
                                                                                if: {
                                                                                    $and: [
                                                                                        {$gt: ['$$cal.avatar', null]},
                                                                                        {$eq: [{$substr: ['$$cal.avatar', 0, 8]}, 'https://']},
                                                                                    ],
                                                                                },
                                                                                then: '$$cal.avatar',
                                                                                else: {
                                                                                    $concat: [`${process.env.DOMAIN_SERVER}/uploads/`, '$$cal.avatar'],
                                                                                },
                                                                            },
                                                                        },
                                                                        phone: "$$cal.phone",
                                                                        email: "$$cal.email",
                                                                        status: "$$innerCall.status",
                                                                    },
                                                                },
                                                            },
                                                            0,
                                                        ],
                                                    },
                                                },
                                            },
                                            else: [],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                user: {
                    $map: {
                        input: '$user',
                        as: "usr",
                        in: {
                            _id: "$$usr._id",
                            email: "$$usr.email",
                            name: "$$usr.name",
                            avatar: "$$usr.avatar",
                            phone: "$$usr.phone",
                            booking_config: "$$usr.booking_config",
                            role: {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: "$group_user",
                                                    as: 'gup',
                                                    cond: {$eq: ['$$gup.user_id', '$$usr._id']},
                                                },
                                            },
                                            as: 'gup',
                                            in: {
                                                $arrayElemAt: [
                                                    {
                                                        $map: {
                                                            input: {
                                                                $filter: {
                                                                    input: '$role',
                                                                    as: 'ro',
                                                                    cond: {$eq: ['$$ro._id', '$$gup.role_id']},
                                                                },
                                                            },
                                                            as: 'ro',
                                                            in: {
                                                                _id: '$$ro._id',
                                                                name: '$$ro.name',
                                                                description: '$$ro.description',
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                            calendar: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: "$calendar",
                                            as: "cal",
                                            cond: {
                                                $and: [
                                                    {$eq: ["$$cal.user_id", "$$usr._id"]},
                                                    {
                                                        $cond: {
                                                            if: {$eq: ["$$usr.booking_config", BOOKING_CONFIG_CALENDAR_MODE.OPTION]},
                                                            then: {$gt: ["$$cal.day", null]},
                                                            else: {$gt: ["$$cal.weekday", null]},
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                    as: "cal",
                                    in: {
                                        _id: "$$cal._id",
                                        user_id: "$$cal.user_id",
                                        weekday: "$$cal.weekday",
                                        day: "$$cal.day",
                                        period: {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: "$period",
                                                        as: "per",
                                                        cond: {$eq: ["$$per.calendar_id", "$$cal._id"]},
                                                    },
                                                },
                                                as: "pre",
                                                in: {
                                                    _id: "$$pre._id",
                                                    start_time: "$$pre.start_time",
                                                    end_time: "$$pre.end_time",
                                                    calendars_id: "$$pre.calendars_id",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                booking: {
                    $map: {
                        input: '$booking',
                        as: 'bok',
                        in: {
                            $mergeObjects: [
                                '$$bok',
                                {
                                    list_user: {
                                        $filter: {
                                            input: '$$bok.list_user',
                                            as: 'lu',
                                            cond: {$ne: ['$$lu', []]},
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                booking: {
                    $filter: {
                        input: "$booking",
                        as: "bok",
                        cond: {
                            $ne: ["$$bok.list_user", []],
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                'booking': {
                    $map: {
                        input: '$booking',
                        as: 'bok',
                        in: {
                            $mergeObjects: [
                                '$$bok',
                                {
                                    'list_user': {
                                        $cond: {
                                            if: {$ne: ['$$bok.list_user', []]},
                                            then: {$arrayElemAt: ['$$bok.list_user', 0]},
                                            else: null,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
        {
            $unwind: {
                path: "$booking",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $sort: {
                'booking.start_time': -1,
            },
        },
        {
            $group: {
                _id: '$_id',
                name: {$first: '$name'},
                description: {$first: '$description'},
                thumbnail: {$first: '$thumbnail'},
                creator_id: {$first: '$creator_id'},
                user: {$first: '$user'},
                user_permissions: {$first: '$user_permissions'},
                booking: {$push: '$booking'},
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                thumbnail: 1,
                creator_id: 1,
                user: 1,
                user_permissions: 1,
                booking: 1,
            },
        },
    ]);


    if ((!result[0].thumbnail?.startsWith("https://") || !result[0].thumbnail?.startsWith("http://")) && result[0]?.thumbnail) {
        result[0].thumbnail = LINK_THUMBNAIL_GROUP + result[0].thumbnail;
    }

    return result[0]
}

export async function createNewGroup(
    creator,
    {name, description, thumbnail}
) {
    let newGroup = new Group({
        name,
        description,
        thumbnail,
        creator_id: creator._id,
    });

    let defaultRole = await Role.findOne();

    newGroup = await newGroup.save();
    let newGroupUser = new GroupUser({
        user_id: creator._id,
        group_id: newGroup._id,
        role_id: defaultRole._id,
        status: 1,
        confirmed_at: moment().unix()
    });

    newGroupUser = await newGroupUser.save();
    return {newGroup, newGroupUser};
}

export async function updateGroup(id, {name, description, thumbnail}) {
    const group = await Group.findOne({_id: id, deleted_at: null});
    group.name = name;
    group.description = description;
    if (thumbnail) {
        group.thumbnail = thumbnail;
    }
    await group.save();
    return group;
}

export async function remove(group) {
    group.deleted_at = moment();

    await group.save();

    await GroupUser.updateMany(
        {group_id: group._id, deleted_at: null},
        {$set: {deleted_at: moment()}}
    );

    return;
}

export async function getListAllUsers({id}, {page, per_page, field, sort_order}) {
    field = field ? field : 'name';
    sort_order = sort_order && sort_order === "asc" ? 1 : -1;
    page = page && !isNaN(page) && !isNaN(parseInt(page)) && parseInt(page) > 0 ? parseInt(page) : 1;
    per_page = per_page && !isNaN(per_page) && !isNaN(parseInt(per_page)) ? parseInt(per_page) : PER_PAGE;

    const allUsers = (
        await User.aggregate([
            {
                $lookup: {
                    from: 'group_user',
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'users'
                }
            },
            {
                $addFields: {
                    currentGroupUsers: {
                        $filter: {
                            input: '$users',
                            as: 'user',
                            cond: {
                                $eq: ['$$user.group_id', new ObjectId(id)]
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    usersInGroup: {
                        $filter: {
                            input: '$currentGroupUsers',
                            as: 'currentGroupUser',
                            cond: {
                                $eq: ['$$currentGroupUser.status', GROUP_USER_STATUS.ACCEPT]
                            }
                        }
                    }
                }
            },
            {$match: {'usersInGroup.status': {$ne: GROUP_USER_STATUS.ACCEPT}}},
            {$sort: {[field]: sort_order}},
            {
                $facet: {
                    metadata: [{$count: "total"}],
                    data: [
                        {$skip: (page - 1) * per_page},
                        {$limit: per_page},
                        {
                            $project: {
                                name: 1,
                                avatar: 1,
                                email: 1,
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    total: {
                        $cond: {
                            if: {$gt: [{$size: "$metadata"}, 0]},
                            then: {$arrayElemAt: ["$metadata.total", 0]},
                            else: 0,
                        },
                    },
                    data: 1
                },
            },
        ])
    )?.map((user) => {
        if (user.avatar) {
            user.avatar = process.env.DOMAIN_SERVER + "/uploads/" + user.avatar;
        }
        return user
    })

    const total_record = allUsers[0].total
    const users = allUsers[0].data

    return {total_record, page, per_page, users};
}

export async function addMember(req) {
    const group_id = req.params.groupId
    const user_emails = req.body.user_emails
    let groupUsers = []
    const group = await Group.findOne({_id: group_id, deleted_at: null})

    for (const email of user_emails) {
        const user = await User.findOne({email})
        const groupUser = await GroupUser.findOne({group_id, user_id: user._id, deleted_at: null})

        // check if user joined group or not
        if (!groupUser || groupUser.status !== GROUP_USER_STATUS.ACCEPT) {
            const token = generateToken({
                user_id: user._id,
                group_id: group._id,
            }, process.env.JWT_EXPIRES_IN, process.env.CONFIRM_SECRET_KEY)

            const joinUrl = generateURL(process.env.DOMAIN_JOIN_GROUP_CONFIRMATION, {
                token,
                type: GROUP_USER_JOIN_CONFIRMATION.JOIN,
            });
            const declineUrl = generateURL(process.env.DOMAIN_JOIN_GROUP_CONFIRMATION, {
                token,
                type: GROUP_USER_JOIN_CONFIRMATION.DECLINE,
            });

            // send confirmation email
            sendMail(email, 'Xác nhận lời mời tham gia nhóm', await ejs.renderFile(path.join(VIEW_DIR, 'email-template', 'join-group-confirmation.html'),
                {
                    groupName: group.name,
                    joinUrl,
                    declineUrl,
                    domain: process.env.DOMAIN_SERVER
                }
            )).catch(err => {
                errorLogger.error({
                    message: `${err}`,
                    type: 'Xác nhận tham gia nhóm',
                    date: req._startTime.format("dddd DD-MM-YYYY, HH:mm:ss"),
                    from: process.env.MAIL_USERNAME,
                    to: email,
                })
            })

            // check if user declined before
            if (!groupUser) {
                const newUser = new GroupUser({
                    group_id,
                    user_id: user._id,
                    status: GROUP_USER_STATUS.PENDING,
                    confirmed_at: null
                })
                await newUser.save()
                groupUsers = [...groupUsers, newUser]
            } else if (groupUser && groupUser.status === GROUP_USER_STATUS.REJECT) {
                groupUser.status = GROUP_USER_STATUS.PENDING
                groupUser.confirmed_at = null
                await groupUser.save()
                groupUsers = [...groupUsers, groupUser]
            }
        }
    }

    return groupUsers
}

export async function removeMember({groupId, userId}) {
    await GroupUser.deleteOne({group_id: groupId, user_id: userId})

    return {groupId, userId}
}

export async function confirmJoinGroup({user_id, group_id, type}) {
    let groupUser = await GroupUser.findOne({user_id, group_id, deleted_at: null});

    if (groupUser.status === GROUP_USER_STATUS.PENDING) {
        if (type === GROUP_USER_JOIN_CONFIRMATION.JOIN) {
            groupUser.status = GROUP_USER_STATUS.ACCEPT;
            groupUser.confirmed_at = moment().unix();
        } else if (type === GROUP_USER_JOIN_CONFIRMATION.DECLINE) {
            groupUser.status = GROUP_USER_STATUS.REJECT;
            groupUser.confirmed_at = moment().unix();
        }
    }

    await groupUser.save()

    return group_id
}

function pipelineFilterFreeUsers(start_time, end_time, bookingId) {
    const startTime = moment.unix(start_time);
    const weekday = startTime.weekday();
    const day = startTime.startOf("day").unix();
    start_time -= day;
    end_time -= day;
    return [
        {
            $lookup: {
                from: "booking_configs",
                localField: "_id",
                foreignField: "user_id",
                as: "booking_config",
            },
        },
        {
            $unwind: "$booking_config",
        },
        {
            $lookup: {
                from: "calendars",
                let: {
                    userId: "$_id",
                    calendar_mode: "$booking_config.calendar_mode",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {$eq: ["$user_id", "$$userId"]},
                                    {
                                        $cond: {
                                            if: {
                                                $eq: ["$$calendar_mode", BOOKING_CONFIG_CALENDAR_MODE.OPTION],
                                            },
                                            then: {$gt: ["$day", null]},
                                            else: {$gt: ["$weekday", null]},
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "periods",
                            localField: "_id",
                            foreignField: "calendar_id",
                            as: "periods",
                        },
                    },
                ],
                as: "calendars",
            },
        },
        {
            $lookup: {
                from: "booking_user",
                let: {userId: "$_id"},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: ["$user_id", "$$userId"],
                                    },
                                    {
                                        $eq: ["$status", BOOKING_USER_STATUS.ACCEPT],
                                    },
                                    ...(bookingId ? [{$ne: ["$booking_id", bookingId]}] : []),
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "bookings",
                            localField: "booking_id",
                            foreignField: "_id",
                            as: "booking",
                        },
                    },
                    {
                        $unwind: "$booking",
                    },
                    {
                        $replaceRoot: {newRoot: {$mergeObjects: ["$booking", {status: "$status"}]}},
                    },
                    {
                        $match: {
                            cancel_time: {$lte: null},
                        },
                    },
                ],
                as: "bookings",
            },
        },
        {
            $match: {
                calendars: {
                    $elemMatch: {
                        $and: [
                            {
                                $or: [{day: day}, {weekday: weekday}],
                            },
                            {
                                periods: {
                                    $elemMatch: {
                                        start_time: {$lte: start_time},
                                        end_time: {$gte: end_time},
                                    },
                                },
                            },
                        ],
                    },
                },
                bookings: {
                    $not: {
                        $elemMatch: {
                            start_time: {$lte: day + start_time},
                            end_time: {$gte: day + end_time},
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                avatar: {
                    $cond: {
                        if: {
                            $and: [
                                {$gt: ["$avatar", null]},
                                {$eq: [{$substr: ["$avatar", 0, 8]}, "https://"]},
                            ],
                        },
                        then: "$avatar",
                        else: {$concat: [`${process.env.DOMAIN_SERVER}/uploads/`, "$avatar"]},
                    },
                },
            },
        },
        {
            $sort: {name: 1},
        },
    ];
}

export async function filterFreeUserFromGroup(groupId, {start_time, end_time}, userId, bookingId) {
    const result = await GroupUser.aggregate([
        {
            $match: {
                deleted_at: null,
                status: GROUP_USER_STATUS.ACCEPT,
                group_id: groupId,
                ...(userId ? {user_id: userId} : {}),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",
            },
        },
        {
            $unwind: "$user",
        },
        {
            $group: {
                _id: "$user._id",
                name: {$first: "$user.name"},
                email: {$first: "$user.email"},
                avatar: {$first: "$user.avatar"},
            },
        },
        ...pipelineFilterFreeUsers(start_time, end_time, bookingId),
    ]);
    return result;
}

export async function isFreeUser(userId, start_time, end_time, bookingId) {
    const user = await User.aggregate([
        {
            $match: {_id: userId},
        },
        ...pipelineFilterFreeUsers(start_time, end_time, bookingId),
    ]);
    return user.length > 0;
}

export async function inviteUsers(users, booking, group) {
    const subject = "Tham gia cuộc hẹn";
    const bookingDetail = {
        bookingTitle: booking.title,
        bookingGroup: group.name,
        bookingDescription: booking.description,
        bookingStartTime: moment.unix(booking.start_time).format("HH:mm DD/MM/YYYY"),
        bookingEndTime: moment.unix(booking.end_time).format("HH:mm DD/MM/YYYY"),
        domain: process.env.DOMAIN_SERVER,
    };
    for (let user of users) {
        const confirmToken = generateToken(
            {
                booking_id: booking._id,
                user_id: user._id,
            },
            booking.start_time - moment().unix(),
            process.env.CONFIRM_SECRET_KEY
        );
        const joinUrl = generateURL(process.env.DOMAIN_JOIN_BOOKING, {
            token: confirmToken,
            status: BOOKING_USER_STATUS.ACCEPT,
        });
        const declineUrl = generateURL(process.env.DOMAIN_JOIN_BOOKING, {
            token: confirmToken,
            status: BOOKING_USER_STATUS.DECLINE,
        });

        const htmlContent = await ejs.renderFile(
            path.join(VIEW_DIR, "email-template", "join-meeting-confirmation.html"),
            {...bookingDetail, joinUrl, declineUrl}
        );

        sendMail(user.email, subject, htmlContent).catch(function (error) {
            errorLogger.error({
                message: "Lỗi gửi mail tham gia cuộc hẹn",
                error,
            });
        });
    }
}

export async function createBooking(creator, group, {title, description, start_time, end_time, users}) {
    const booking = new Booking({
        group_id: group._id,
        title: title,
        description: description,
        start_time: start_time,
        end_time: end_time,
    });
    const bookingCreator = new BookingCreator({
        booking_id: booking._id,
        email: creator.email,
        name: creator.name,
        phone: creator.phone,
    });
    const bookingUsers = users.map(function (user) {
        return {
            user_id: user._id,
            booking_id: booking._id,
            status: creator._id.equals(user._id) ? BOOKING_USER_STATUS.ACCEPT : BOOKING_USER_STATUS.PENDING,
        };
    });
    await Promise.all([booking.save(), bookingCreator.save(), BookingUser.insertMany(bookingUsers)]);
    users = users.filter((user) => !creator._id.equals(user._id));
    // TODO: Gửi mail xác nhận tham gia cuộc họp cho các thành viên
    await inviteUsers(users, booking, group);
}

export async function updateBooking(editor, booking, group, {title, description, start_time, end_time, users}) {
    const bookingUsers = await BookingUser.find({booking_id: booking._id}).populate("user_id");
    const kickedUsers = bookingUsers.filter((item) => !users.some((i) => item.user_id._id.equals(i._id)));
    const {newUsers, oldUsers} = users.reduce(
        function (pre, curr) {
            const userInBookingUsers = bookingUsers.some(function (item) {
                return item.user_id._id.equals(curr._id);
            });
            if (userInBookingUsers) {
                pre.oldUsers.push(curr);
            } else {
                pre.newUsers.push(curr);
            }
            return pre;
        },
        {
            newUsers: [],
            oldUsers: [],
        }
    );
    if (kickedUsers.length > 0) {
        await BookingUser.deleteMany({
            booking_id: booking._id,
            user_id: {$in: kickedUsers.map((i) => i.user_id._id)},
        });
        // TODO: Gửi mail chủ cuộc họp mời bạn ra khỏi cuộc họp
        const emails = kickedUsers.filter((i) => !editor._id.equals(i.user_id._id)).map((i) => i.user_id.email);
        const htmlContent = await ejs.renderFile(
            path.join(VIEW_DIR, "email-template", "notifi-of-remover.html"),
            {
                bookingTitle: booking.title,
                bookingStartTime: moment.unix(booking.start_time).format("HH:mm DD/MM/YYYY"),
                bookingEndTime: moment.unix(booking.end_time).format("HH:mm DD/MM/YYYY"),
                domain: process.env.DOMAIN_SERVER,
            }
        );
        sendMail(emails.join(","), "Thông báo thay đổi về cuộc hẹn", htmlContent).catch(function (error) {
            errorLogger.error({
                message: "Lỗi gửi mail Thông báo thay đổi về cuộc hẹn",
                error,
            });
        });
    }
    if (newUsers.length > 0) {
        await BookingUser.insertMany(
            newUsers.map(function (i) {
                return {
                    user_id: i._id,
                    booking_id: booking._id,
                    status: editor._id.equals(i._id)
                        ? BOOKING_USER_STATUS.ACCEPT
                        : BOOKING_USER_STATUS.PENDING,
                };
            })
        );
        // TODO: Gửi mail xác nhận tham gia cuộc họp
        await inviteUsers(
            newUsers.filter((i) => !editor._id.equals(i._id)),
            {
                _id: booking._id,
                title,
                description,
                start_time,
                end_time,
            }
        );
    }
    if ((booking.start_time !== start_time || booking.end_time !== end_time) && oldUsers.length > 0) {
        // TODO: Gửi mail cuộc họp đã rời lịch
        const subject = "Thay đổi thời gian cuộc hẹn";
        const bookingDetail = {
            bookingOldTitle: booking.title,
            bookingGroup: group.name,
            bookingOldStartTime: moment.unix(booking.start_time).format("HH:mm"),
            bookingOldEndTime: moment.unix(booking.end_time).format("HH:mm"),
            bookingOldDate: moment.unix(booking.end_time).format("DD/MM/YYYY"),
            bookingNewStartDay: moment.unix(start_time).format("DD/MM/YYYY"),
            bookingNewStartHour: moment.unix(start_time).format("HH:mm"),

            bookingNewTitle: title,
            bookingNewDescription: description,
            bookingNewStartTime: moment.unix(start_time).format("HH:mm DD/MM/YYYY"),
            bookingNewEndTime: moment.unix(end_time).format("HH:mm DD/MM/YYYY"),
        };
        for (let user of oldUsers) {
            if (editor._id.equals(user._id)) {
                await BookingUser.findOneAndUpdate(
                    {
                        booking_id: booking._id,
                        user_id: user._id,
                    },
                    {
                        $set: {status: BOOKING_USER_STATUS.ACCEPT},
                    }
                );
                continue;
            }
            await BookingUser.findOneAndUpdate(
                {
                    booking_id: booking._id,
                    user_id: user._id,
                },
                {
                    $set: {status: BOOKING_USER_STATUS.PENDING},
                }
            );
            const confirmToken = generateToken(
                {
                    booking_id: booking._id,
                    user_id: user._id,
                },
                start_time - moment().unix(),
                process.env.CONFIRM_SECRET_KEY
            );
            const joinUrl = generateURL(process.env.DOMAIN_JOIN_BOOKING, {
                token: confirmToken,
                status: BOOKING_USER_STATUS.ACCEPT,
            });
            const declineUrl = generateURL(process.env.DOMAIN_JOIN_BOOKING, {
                token: confirmToken,
                status: BOOKING_USER_STATUS.DECLINE,
            });

            const htmlContent = await ejs.renderFile(
                path.join(VIEW_DIR, "email-template", "change-time-meeting-confirmation.html"),
                {...bookingDetail, joinUrl, declineUrl, domain: process.env.DOMAIN_SERVER}
            );

            sendMail(user.email, subject, htmlContent).catch(function (error) {
                errorLogger.error({
                    message: "Lỗi gửi mail Thay đổi thời gian cuộc hẹn",
                    error,
                });
            });
        }
    }

    booking.title = title;
    booking.description = description;
    booking.start_time = start_time;
    booking.end_time = end_time;
    await booking.save();
}

export async function cancelBooking(editor, booking, group) {
    booking.cancel_time = moment().unix();
    await booking.save();
    // TODO: Gửi mail hủy cuộc họp cho các thành viên
    const bookingUsers = await BookingUser.find({
        booking_id: booking._id,
        status: BOOKING_USER_STATUS.ACCEPT,
    }).populate("user_id");
    const emails = bookingUsers.filter((i) => !editor._id.equals(i._id)).map((i) => i.user_id.email);
    if (emails.length > 0) {
        const htmlContent = await ejs.renderFile(
            path.join(VIEW_DIR, "email-template", "notifi-cancel-meeting.html"),
            {
                bookingTitle: booking.title,
                bookingGroup: group.name,
                bookingDate: moment.unix(booking.start_time).format("DD/MM/YYYY"),
                bookingStartTime: moment.unix(booking.start_time).format("HH:mm"),
                bookingEndTime: moment.unix(booking.end_time).format("HH:mm"),
                domain: process.env.DOMAIN_SERVER,
            }
        );
        sendMail(emails.join(","), "Thông báo hủy cuộc hẹn", htmlContent).catch(function (error) {
            errorLogger.error({
                message: "Lỗi gửi mail Thông báo hủy cuộc hẹn",
                error,
            });
        });
    }
}

export async function joinBooking(booking, status) {
    booking.status = status;
    await booking.save();
}

export async function authorize(group_id, user_id, allow) {
    const role = await Role.findOne({});
    const result = await GroupUser.findOneAndUpdate(
        {
            group_id,
            user_id,
            deleted_at: null,
        },
        {
            ...(allow
                ? {
                    $set: {
                        role_id: role._id,
                    },
                }
                : {
                    $unset: {
                        role_id: "",
                    },
                }),
        }
    );
    return {group_id, allow};
}

export const optionFreeTime = async (id, {start_time,end_time}) => {
    const startDate = moment.unix(start_time);
    const endDate = moment.unix(end_time);
    const dayArray = [];
    const selectedDays = [];

    while (startDate.isSameOrBefore(endDate)) {
        dayArray.push(startDate.unix());
        startDate.add(1, 'day');
    }

    for(const day of dayArray) {
        const dayOfWeek = moment.unix(day).day();
        const endTime = moment.unix(day).endOf("day").valueOf() / 1000;

        const freeTimeUser = await Group.aggregate([
            {
                $match: {
                    _id: new ObjectId(id),
                },
            },
            {
                $lookup: {
                    from: 'group_user',
                    let: { group_id: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$group_id', '$$group_id'] },
                                        { $eq: ['$status', GROUP_USER_STATUS.ACCEPT] },
                                    ],
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: 'users',
                                let: { userId: '$user_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$_id', '$$userId'] },
                                                    { $lte: ['$deleted_at', null] }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            name: 1
                                        }
                                    }
                                ],
                                as: 'user',
                            },
                        },
                        {
                            $unwind: "$user"
                        },
                        {
                            $sort: { "user.name": 1 }
                        },
                        {
                            $replaceRoot: { newRoot: "$user" }
                        },
                        {
                            $lookup: {
                                from: 'booking_configs',
                                localField: '_id',
                                foreignField: 'user_id',
                                as: 'booking_config',
                            }
                        },
                        {
                            $unwind: {
                                path: "$booking_config",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'calendars',
                                let: { userId: "$_id", mode: "$booking_config.calendar_mode" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$user_id", "$$userId"] },
                                                    {
                                                        $cond: {
                                                            if: { $eq: ["$$mode", BOOKING_CONFIG_CALENDAR_MODE.OPTION] },
                                                            then: {
                                                                $and: [
                                                                    { $gte: ['$day', parseInt(day)] },
                                                                    { $lte: ['$day', endTime] }
                                                                ]
                                                            },
                                                            else: { $eq: ["$weekday", dayOfWeek] }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: 'periods',
                                            let: { calendarId: '$_id' },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $eq: ['$calendar_id', '$$calendarId']
                                                        }
                                                    }
                                                }
                                            ],
                                            as: 'period',
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            user_id: 1,
                                            weekday: 1,
                                            day: 1,
                                            period: {
                                                $map: {
                                                    input: '$period',
                                                    as: 'per',
                                                    in: {
                                                        _id: '$$per._id',
                                                        start_time: '$$per.start_time',
                                                        end_time: '$$per.end_time',
                                                        calendar_id: '$$per.calendar_id'
                                                    }
                                                }
                                            }
                                        }

                                    }
                                ],
                                as: 'calendar',
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                calendar: 1
                            }
                        }
                    ],
                    as: 'user',
                },

            },
            {
                $project: {
                    _id: 0,
                    user: 1
                }
            }
        ])

        const freeTimeBooking = await User.aggregate([
            {
                $lookup: {
                    from: 'booking_user',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$user_id', '$$userId'] },
                                        { $eq: ['$status', BOOKING_USER_STATUS.ACCEPT] },
                                    ],
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: 'bookings',
                                let: { bookingId: '$booking_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$_id', '$$bookingId'] },
                                                    { $gte: ['$end_time', moment().unix()] },
                                                    { $lte: ['$start_time', parseInt(endTime)] },
                                                    { $gte: ['$start_time', parseInt(day)] },
                                                    { $lte: ['$cancel_time', null] },
                                                    { $lte: ["$deleted_at", null] },
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'bookings'
                            }
                        },
                        {
                            $unwind: '$bookings'
                        },
                        {
                            $sort: { "name": 1 }
                        },
                        {
                            $replaceRoot: { newRoot: '$bookings' }
                        }

                    ],
                    as: 'bookings',
                },

            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    period: {
                        $map: {
                            input: '$bookings',
                            as: 'booking',
                            in: {
                                start_time: '$$booking.start_time',
                                end_time: '$$booking.end_time',
                            }
                        }
                    }
                },
            },
        ]);

        const convertFreeTimeUser = convertPeriod(freeTimeUser[0])
        const convertFreeTimeBooking = freeTimeBooking.map(booking => convertBookingData(booking));
        const mergedData = compareAndMerge(convertFreeTimeUser, convertFreeTimeBooking);
        const data = mergeOverlappingPeriods(mergedData);

        selectedDays.push({time: day,free_time: data})
    }

    return selectedDays
}
export async function bookingSuggestion(groupId, { start_time, end_time, duration },bookingTimes){

    const startTime = moment.unix(start_time);
    const weekday = startTime.weekday();
    const day = startTime.startOf("day").unix();
    start_time -= day;
    end_time -= day;
    bookingTimes = [];

    for (let i = start_time; i + duration <= end_time; i += 3600) {
        bookingTimes.push({
            start_time: i,
            end_time: i + duration
        })

    }
    const result = await GroupUser.aggregate([
        {
            $match: {
                deleted_at: null,
                status: GROUP_USER_STATUS.ACCEPT,
                group_id: groupId,
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",
            },
        },
        {
            $unwind: "$user",
        },
        {
            $group: {
                _id: "$user._id",
                name: { $first: "$user.name" },
                email: { $first: "$user.email" },
                avatar: { $first: "$user.avatar" },
            },
        },
        {
            $lookup: {
                from: "booking_configs",
                localField: "_id",
                foreignField: "user_id",
                as: "booking_config",
            },
        },
        {
            $unwind: "$booking_config",
        },
        {
            $lookup: {
                from: "calendars",
                let: {
                    userId: "$_id",
                    calendar_mode: "$booking_config.calendar_mode",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$user_id", "$$userId"] },
                                    {
                                        $cond: {
                                            if: {
                                                $eq: ["$$calendar_mode", BOOKING_CONFIG_CALENDAR_MODE.OPTION],
                                            },
                                            then: { $gt: ["$day", null] },
                                            else: { $gt: ["$weekday", null] },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "periods",
                            localField: "_id",
                            foreignField: "calendar_id",
                            as: "periods",
                        },
                    },
                ],
                as: "calendars",
            },
        },
        {
            $lookup: {
                from: "booking_user",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: ["$user_id", "$$userId"],
                                    },
                                    {
                                        $eq: ["$status", BOOKING_USER_STATUS.ACCEPT],
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "bookings",
                            localField: "booking_id",
                            foreignField: "_id",
                            as: "booking",
                        },
                    },
                    {
                        $unwind: "$booking",
                    },
                    {
                        $replaceRoot: { newRoot: { $mergeObjects: ["$booking", { status: "$status" }] } },
                    },
                    {
                        $match: {
                            cancel_time: { $lte: null },
                        },
                    },
                ],
                as: "bookings",
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                avatar: 1,
                calendars: {
                    $filter: {
                        input: "$calendars",
                        as: "calendar",
                        cond: {
                            $or: [
                                {
                                    $eq: ["$$calendar.day", day]
                                },
                                {
                                    $eq: ["$$calendar.weekday", weekday]
                                }
                            ]
                        }
                    }
                },
                bookings: 1,
            }
        },
        {
            $match: {
                calendars: {
                    $not: {
                        $size: 0
                    }
                },
            }
        },
        {
            $unwind: "$calendars"
        },
        {
            $facet: {
                users: []
            }
        },
        {
            $addFields: {
                booking_time: bookingTimes
            }
        },
        {
            $unwind: "$booking_time"
        },
        {
            $project: {
                booking_time: 1,
                users: {
                    $filter: {
                        input: "$users",
                        as: "u",
                        cond: {
                            $and: [
                                {
                                    $anyElementTrue: {
                                        $map: {
                                            input: "$$u.calendars.periods",
                                            as: "period",
                                            in: {
                                                $and: [
                                                    {
                                                        $lte: ["$$period.start_time", "$booking_time.start_time"]
                                                    },
                                                    {
                                                        $gte: ["$$period.end_time", "$booking_time.end_time"]
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                },
                                {
                                    $not: {
                                        $anyElementTrue: {
                                            $map: {
                                                input: "$$u.bookings",
                                                as: "booking",
                                                in: {
                                                    $and: [
                                                        {
                                                            $lte: ["$$booking.start_time", { $add: ["$booking_time.start_time", day] }]
                                                        },
                                                        {
                                                            $gte: ["$$booking.end_time", { $add: ["$booking_time.end_time", day] }]
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    }

                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $match: {
                $expr: {
                    $gt: [{ $size: "$users" }, 1]
                }
            }
        },
        {
            $project: {
                booking_time: {
                    start_time: { $add: ["$booking_time.start_time", day] },
                    end_time: { $add: ["$booking_time.end_time", day] }
                },
                users: {
                    $map: {
                        input: "$users",
                        as: "user",
                        in: {
                            _id: "$$user._id",
                            name: "$$user.name",
                            email: "$$user.email",
                            avatar: {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $gt: ["$$user.avatar", null] },
                                            { $eq: [{ $substr: ["$$user.avatar", 0, 8] }, "https://"] },
                                        ],
                                    },
                                    then: "$$user.avatar",
                                    else: { $concat: [LINK_THUMBNAIL_GROUP, "$$user.avatar"] },
                                },
                            }
                        }
                    }

                }
            }
        },
        {
            $addFields: {
                user_count: { $size: "$users" },
            }
        },
        {
            $sort: { user_count: -1, 'booking_time.start_time': 1 }
        }
    ])
    return result;
}