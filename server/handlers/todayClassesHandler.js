const {
  getTodayDayOrder,
  getTomorrowDayOrder,
  getDayAfterTomorrowDayOrder,
} = require("./dayOrderHandler");
const { getTimetable } = require("./timetableHandler");

async function getClassesForDayOrder(dayOrderResponse, token) {
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
      (day) => day.dayOrder == possibleFormat || day.dayOrder === possibleFormat
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
    dayOrder: dayOrder,
    date: dayOrderResponse.date,
    day: dayOrderResponse.day,
    event: dayOrderResponse.event || "No event",
    classes: classes,
  };
}

async function getTodayClasses(token) {
  try {
    const dayOrderResponse = await getTodayDayOrder(token);
    return await getClassesForDayOrder(dayOrderResponse, token);
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
    return await getClassesForDayOrder(dayOrderResponse, token);
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
    return await getClassesForDayOrder(dayOrderResponse, token);
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

module.exports = {
  getTodayClasses,
  getTomorrowClasses,
  getDayAfterTomorrowClasses,
};
