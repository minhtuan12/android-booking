import {Calendar} from "../models";
import {Period} from "../models";
import {BookingConfig} from "../models";

export async function createAndUpdate(req) {
    const {calendar_mode, booking_limit, calendars} = req.body
    const userId = req.currentUser._id;
    const existingConfig = await BookingConfig.findOne({user_id: userId, deleted_at: null,});

    const updatedConfig = existingConfig || new BookingConfig({
        calendar_mode: calendar_mode,
        booking_limit: booking_limit,
        user_id: userId,
    });

    if (existingConfig) {
        existingConfig.calendar_mode = calendar_mode;
        existingConfig.booking_limit = booking_limit;
        await existingConfig.save();
    } else {
        await updatedConfig.save();
    }

    const createdCalendars = await Promise.all(
        calendars.map(async (calendarData) => {
            const existingCalendar = await Calendar.findOne({
                user_id: userId,
                $or: calendarData.weekday
                    ? [{weekday: calendarData.weekday}]
                    : [{day: calendarData.day}],
            });

            if (existingCalendar) {
                if (calendarData.delete === 1) {
                    await Period.deleteMany({calendar_id: existingCalendar._id});
                    await Calendar.findByIdAndDelete(existingCalendar._id);
                } else {
                    existingCalendar.weekday = calendarData.weekday;
                    existingCalendar.day = calendarData.day;

                    const savedCalendar = await existingCalendar.save();
                    await Period.deleteMany({calendar_id: existingCalendar._id});

                    const savedPeriods = await Promise.all(
                        calendarData.periods.map(async (periodData) => {
                            const newPeriod = new Period({
                                ...periodData,
                                calendar_id: savedCalendar._id,
                            });

                            const savedPeriod = await newPeriod.save();
                            return savedPeriod;
                        })
                    );
                    return {calendar: savedCalendar, periods: savedPeriods};
                }

            } else if (!calendarData.delete ) {
                const newCalendar = new Calendar({
                    weekday: calendarData.weekday,
                    day: calendarData.day,
                    user_id: userId
                });
                const savedCalendar = await newCalendar.save();
                const savedPeriods = await Promise.all(
                    calendarData.periods.map(async (periodData) => {
                        const newPeriod = new Period({
                            ...periodData,
                            calendar_id: savedCalendar._id,
                        });

                        const savedPeriod = await newPeriod.save();
                        return savedPeriod;
                    })
                );

                return {calendar: savedCalendar, periods: savedPeriods};
            }
        })
    );

    return {
        config: updatedConfig,
        calendars: createdCalendars,
    };
}

export async function detailWeek(userId) {
    const calendar = await Calendar.aggregate([
        {
            $match: {
                user_id: userId,
                day: null,
            }
        },
        {
            $lookup: {
                from: 'periods',
                localField: '_id',
                foreignField: 'calendar_id',
                as: 'periods'
            }
        },
        {
            $project: {
                _id: 1,
                user_id: 1,
                weekday: 1,
                periods: 1,
            }
        }
    ])
    return calendar
}

export async function detailDay(userId) {
    const calendar = await Calendar.aggregate([
        {
            $match: {
                user_id: userId,
                weekday: null
            }
        },
        {
            $lookup: {
                from: 'periods',
                localField: '_id',
                foreignField: 'calendar_id',
                as: 'periods'
            }
        },
        {
            $project: {
                _id: 1,
                user_id: 1,
                day: 1,
                periods: "$periods",
            }
        }
    ])
    return calendar
}

export async function detailBookingConfig(userId) {
    const bookingConfig = await BookingConfig.findOne({user_id: userId, deleted_at: null,},
        {_id: 1, user_id: 1, calendar_mode: 1, booking_limit: 1});
    return bookingConfig
}