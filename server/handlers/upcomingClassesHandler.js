const { getTodayDayOrder } = require("./dayOrderHandler");
const { getTimetable } = require("./timetableHandler");

async function getUpcomingClasses(token) {
  try {
    const dayOrderResponse = await getTodayDayOrder(token);

    if (dayOrderResponse.error) {
      return {
        error: true,
        message: dayOrderResponse.message || "Failed to get day order",
        status: dayOrderResponse.status || 500,
        upcomingClasses: {},
      };
    }

    const todayDayOrder = dayOrderResponse.dayOrder;

    if (!todayDayOrder) {
      return {
        error: false,
        message: "No classes today (holiday or weekend)",
        status: 200,
        upcomingClasses: {},
      };
    }

    const timetableResponse = await getTimetable(token);

    let dayOrderPossibilities = [
      todayDayOrder,
      `Day ${todayDayOrder}`,
      todayDayOrder.replace("Day ", ""),
      Number(todayDayOrder),
      String(todayDayOrder),
    ];

    let todaySchedule = null;
    for (const possibleFormat of dayOrderPossibilities) {
      const schedule = timetableResponse.schedule.find(
        (day) =>
          day.dayOrder == possibleFormat || day.dayOrder === possibleFormat
      );
      if (schedule) {
        todaySchedule = schedule;
        break;
      }
    }

    // console.log('Today day order:', todayDayOrder);
    // console.log('Available day orders:', timetableResponse.schedule.map(day => day.dayOrder));

    if (!todaySchedule) {
      return {
        error: false,
        message: `No classes found for ${todayDayOrder}`,
        status: 200,
        upcomingClasses: {},
      };
    }

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const timeRanges = {
      within5Min: { min: 0, max: 5 },
      within30Min: { min: 6, max: 30 },
      within1Hour: { min: 31, max: 60 },
      within2Hours: { min: 61, max: 120 },
      within3Hours: { min: 121, max: 180 },
      within4Hours: { min: 181, max: 240 },
      within5Hours: { min: 241, max: 300 },
      within6Hours: { min: 301, max: 360 },
      within7Hours: { min: 361, max: 420 },
      within8Hours: { min: 421, max: 480 },
      within9Hours: { min: 481, max: 540 },
      within10Hours: { min: 541, max: 600 },
    };

    const upcomingClasses = {};
    Object.keys(timeRanges).forEach((key) => {
      upcomingClasses[key] = [];
    });

    todaySchedule.table.forEach((classItem) => {
      const [timeStr, period] = classItem.startTime.split(" ");
      let [hours, minutes] = timeStr.split(":").map(Number);

      if (period === "PM" && hours !== 12) {
        hours += 12;
      }
      if (period === "AM" && hours === 12) {
        hours = 0;
      }

      const totalCurrentMinutes = currentHours * 60 + currentMinutes;
      const totalClassMinutes = hours * 60 + minutes;
      const minutesUntilClass = totalClassMinutes - totalCurrentMinutes;

      if (minutesUntilClass >= 0) {
        for (const [rangeKey, range] of Object.entries(timeRanges)) {
          if (
            minutesUntilClass >= range.min &&
            minutesUntilClass <= range.max
          ) {
            upcomingClasses[rangeKey].push({
              ...classItem,
              minutesUntil: minutesUntilClass,
            });
            break;
          }
        }
      }
    });

    return {
      error: false,
      message: "Upcoming classes retrieved successfully",
      status: 200,
      dayOrder: todayDayOrder,
      date: dayOrderResponse.date,
      day: dayOrderResponse.day,
      event: dayOrderResponse.event || "No event",
      currentTime: `${currentHours}:${currentMinutes
        .toString()
        .padStart(2, "0")}`,
      upcomingClasses,
    };
  } catch (error) {
    console.error("Error getting upcoming classes:", error);
    return {
      error: true,
      message: error.message || "Failed to get upcoming classes",
      status: 500,
      upcomingClasses: {},
    };
  }
}

module.exports = { getUpcomingClasses };
