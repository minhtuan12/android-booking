import moment from "moment/moment";

export const compareAndMerge = (A, B) => {
    const resultA = JSON.parse(JSON.stringify(A));
    const resultB = JSON.parse(JSON.stringify(B));

    resultA.forEach(aItem => {
        const bItem = resultB.find(bItem => bItem._id === aItem._id);

        if (bItem) {
            let mergedPeriods = [];

            aItem.period.forEach(aPeriod => {
                let currentAPeriod = aPeriod;
                let overlappingPeriods = [];

                bItem.period.forEach(bPeriod => {
                    if ((aPeriod.day && bPeriod.day) ?
                        (aPeriod.day === bPeriod.day) &&
                        aPeriod.start_time < bPeriod.end_time &&
                        aPeriod.end_time > bPeriod.start_time
                        :
                        aPeriod.weekday === bPeriod.weekday &&
                        aPeriod.start_time < bPeriod.end_time &&
                        aPeriod.end_time > bPeriod.start_time) {
                        const intersectionStart = Math.max(aPeriod.start_time, bPeriod.start_time);
                        const intersectionEnd = Math.min(aPeriod.end_time, bPeriod.end_time);

                        overlappingPeriods.push({
                            start_time: intersectionStart,
                            end_time: intersectionEnd,
                            weekday: aPeriod.weekday,
                            day: aPeriod.day,
                        });
                    }
                });

                overlappingPeriods.forEach(overlappingPeriod => {
                    if (currentAPeriod.start_time < overlappingPeriod.start_time) {
                        mergedPeriods.push({
                            start_time: currentAPeriod.start_time,
                            end_time: overlappingPeriod.start_time,
                            weekday: currentAPeriod.weekday,
                            day: currentAPeriod.day,
                        });
                    }

                    if (currentAPeriod.end_time > overlappingPeriod.end_time) {
                        currentAPeriod.start_time = overlappingPeriod.end_time;
                    } else {
                        currentAPeriod = {
                            start_time: currentAPeriod.end_time,
                            end_time: overlappingPeriod.end_time,
                            weekday: currentAPeriod.weekday,
                            day: currentAPeriod.day,
                        };
                    }
                });

                if (currentAPeriod.start_time < currentAPeriod.end_time) {
                    mergedPeriods.push(currentAPeriod);
                }
            });

            aItem.period = mergedPeriods;
        }
    });

    return resultA;
}



export const convertBookingData = (booking) => {

    return {
        _id: booking._id,
        name: booking.name,
        period: booking.period.map(period => {
            const startDate = moment.unix(period.start_time).startOf('day');
            return {
                _id: period._id,
                start_time: parseInt(moment.unix(period.start_time).format('HH:mm')),
                end_time: parseInt(moment.unix(period.end_time).format('HH:mm')),
                weekday: startDate.day(),
                day: startDate.unix()
            };
        }),
    };
}

export const convertPeriod = (data) => {
    return data.user.map(user => {
        const convertedCalendar = user.calendar.map(entry => (
            entry.period.map(period => ({
                start_time: period.start_time / 3600,
                end_time: period.end_time / 3600,
                weekday: entry.weekday,
                day: entry.day,
            }))
        ));
        return {
            _id: user._id,
            name: user.name,
            period: convertedCalendar.flat(),
        };
    })
}

export const mergeOverlappingPeriods = (data) => {
    const result = [];

    for (const obj of data) {
        const mergedPeriods = mergeOverlapping(obj.period);
        result.push({...obj, period: mergedPeriods});
    }

    return result;
}

const mergeOverlapping = (periods) => {
    const result = [];

    const sortedPeriods = periods.sort((a, b) => a.start_time - b.start_time);

    for (const period of sortedPeriods) {
        const lastMergedPeriod = result[result.length - 1];

        if (lastMergedPeriod && lastMergedPeriod.end_time >= period.start_time) {
            lastMergedPeriod.end_time = Math.max(lastMergedPeriod.end_time, period.end_time);
        } else {
            result.push({...period});
        }
    }

    return result;
}





