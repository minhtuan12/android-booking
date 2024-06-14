import {Booking, Group, User} from "@/app/models";
import moment from "moment";

export async function getStatistics() {
    const currentTime = moment().unix()

    const bookings = await Booking.aggregate([
        {
            $facet: {
                total: [{$count: 'total'}],
                total_success: [
                    {
                        $match: {
                            $and: [
                                {
                                    end_time: {$lt: currentTime}
                                },
                                {
                                    cancel_time: null
                                }
                            ]
                        }
                    },
                    {$count: 'total_success'}
                ]
            }
        },
        {
            $project: {
                total: {
                    $cond: {
                        if: {$gt: [{$size: "$total"}, 0]},
                        then: {$arrayElemAt: ["$total.total", 0]},
                        else: 0,
                    },
                },
                total_success: {
                    $cond: {
                        if: {$gt: [{$size: "$total_success"}, 0]},
                        then: {$arrayElemAt: ["$total_success.total_success", 0]},
                        else: 0,
                    },
                },
            }
        },
    ])
    const groups = await Group.countDocuments({deleted_at: null})
    const users = await User.countDocuments()

    return {
        total_bookings: bookings[0],
        total_groups: groups,
        total_users: users,
    }
}

const countBookings = (arr) => {
    return arr?.reduce((count, item) => {
        count[item.date] = (count[item.date] || 0) + 1
        return count
    }, {})
}

export async function getBookingQuantityPerDay(start_time, end_time) {
    start_time = start_time ? moment.unix(start_time).startOf('day').unix() : moment().subtract(6, 'days').startOf('day').unix()
    end_time = end_time ? moment.unix(end_time).endOf('day').unix() : moment().endOf('day').unix()

    const bookingsInPeriod = await Booking.aggregate([
        {
            $match: {
                $and: [
                    {start_time: {$gte: start_time}},
                    {end_time: {$lte: end_time}}
                ]
            }
        },
        {$sort: {start_time: 1}},
        {
            $project: {
                start_time: 1,
                end_time: 1,
                date: {$subtract: [{$subtract: ['$start_time', {$mod: ['$start_time', 60 * 60 * 24]}]}, 60 * 60 * 7]},
            }
        }
    ])

    const bookingPerDay = countBookings(bookingsInPeriod)

    const result = bookingPerDay ? Object.keys(bookingPerDay)?.map(date => {
        return {
            date: parseInt(date),
            quantity: bookingPerDay[date]
        }
    }) : []

    return {
        total_bookings_per_day: result
    }
}
