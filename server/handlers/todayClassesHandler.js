const {
  getTodayDayOrder,
  getTomorrowDayOrder,
  getDayAfterTomorrowDayOrder,
} = require("./dayOrderHandler");
const { getTimetable } = require("./timetableHandler");

async function getClassesForDayOrder(token, dayOrderResponse) {
  try {
    if (dayOrderResponse.error) {
      return {
        error: true,
        message: dayOrderResponse.message || "Failed to get day order",
        status: dayOrderResponse.status || 500,
        classes: [],
      };
    }

    const dayOrder = dayOrderResponse.dayOrder;

    if (!dayOrder) {
      return {
        error: false,
        message: "No classes on this day (holiday or weekend)",
        status: 200,
        date: dayOrderResponse.date,
        day: dayOrderResponse.day,
        event: dayOrderResponse.event || "No event",
        classes: [],
      };
    }

    const timetableResponse = await getTimetable(token);

    let dayOrderPossibilities = [
      dayOrder,
      `Day ${dayOrder}`,
      dayOrder.replace("Day ", ""),
      Number(dayOrder),
      String(dayOrder),
    ];

    let schedule = null;
    for (const possibleFormat of dayOrderPossibilities) {
      const daySchedule = timetableResponse.schedule.find(
        (day) =>
          day.dayOrder == possibleFormat || day.dayOrder === possibleFormat
      );
      if (daySchedule) {
        schedule = daySchedule;
        break;
      }
    }

    if (!schedule) {
      return {
        error: false,
        message: `No classes found for ${dayOrder}`,
        status: 200,
        date: dayOrderResponse.date,
        day: dayOrderResponse.day,
        event: dayOrderResponse.event || "No event",
        classes: [],
      };
    }

    const classes = [...schedule.table].sort((a, b) => {
      const getComparableTime = (timeStr) => {
        const [time, period] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (period === "PM" && hours !== 12) {
          hours += 12;
        }
        if (period === "AM" && hours === 12) {
          hours = 0;
        }

        return hours * 60 + minutes;
      };

      return getComparableTime(a.startTime) - getComparableTime(b.startTime);
    });

    return {
      error: false,
      message: "Classes retrieved successfully",
      status: 200,
      dayOrder,
      date: dayOrderResponse.date,
      day: dayOrderResponse.day,
      event: dayOrderResponse.event || "No event",
      classes,
    };
  } catch (error) {
    console.error(`Error getting classes:`, error);
    return {
      error: true,
      message: error.message || "Failed to get classes",
      status: 500,
      classes: [],
    };
  }
}

async function getTodayClasses(token) {
  try {
    const dayOrderResponse = await getTodayDayOrder(token);
    return await getClassesForDayOrder(token, dayOrderResponse);
  } catch (error) {
    console.error("Error getting today's classes:", error);
    return {
      error: true,
      message: error.message || "Failed to get today's classes",
      status: 500,
      classes: [],
    };
  }
}

async function getTomorrowClasses(token) {
  try {
    const dayOrderResponse = await getTomorrowDayOrder(token);
    return await getClassesForDayOrder(token, dayOrderResponse);
  } catch (error) {
    console.error("Error getting tomorrow's classes:", error);
    return {
      error: true,
      message: error.message || "Failed to get tomorrow's classes",
      status: 500,
      classes: [],
    };
  }
}

async function getDayAfterTomorrowClasses(token) {
  try {
    const dayOrderResponse = await getDayAfterTomorrowDayOrder(token);
    return await getClassesForDayOrder(token, dayOrderResponse);
  } catch (error) {
    console.error("Error getting day after tomorrow's classes:", error);
    return {
      error: true,
      message: error.message || "Failed to get day after tomorrow's classes",
      status: 500,
      classes: [],
    };
  }
}

async function getUpcomingClasses(token) {
  try {
    const [today, tomorrow, dayAfterTomorrow] = await Promise.all([
      getTodayClasses(token),
      getTomorrowClasses(token),
      getDayAfterTomorrowClasses(token),
    ]);

    return {
      error: false,
      message: "Upcoming classes retrieved successfully",
      status: 200,
      today,
      tomorrow,
      dayAfterTomorrow,
    };
  } catch (error) {
    console.error("Error getting upcoming classes:", error);
    return {
      error: true,
      message: error.message || "Failed to get upcoming classes",
      status: 500,
    };
  }
}

module.exports = {
  getTodayClasses,
  getTomorrowClasses,
  getDayAfterTomorrowClasses,
  getUpcomingClasses,
};
