const CalendarFetcher = require("../helpers/calendarHelper");

async function getTodayDayOrder(token) {
  try {
    const scraper = new CalendarFetcher(new Date(), token);
    const response = await scraper.getTodayDayOrder();

    if (!response.dayOrder) {
      return {
        ...response,
        event: response.event || "Holiday/Weekend",
        message: "No classes on this day (holiday or weekend)",
      };
    }

    return response;
  } catch (error) {
    console.error("Error getting day order:", error);
    throw error;
  }
}

async function getTomorrowDayOrder(token) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scraper = new CalendarFetcher(tomorrow, token);
    const response = await scraper.getTodayDayOrder();

    if (!response.dayOrder) {
      return {
        ...response,
        event: response.event || "Holiday/Weekend",
        message: "No classes on this day (holiday or weekend)",
      };
    }

    return response;
  } catch (error) {
    console.error("Error getting tomorrow's day order:", error);
    throw error;
  }
}

async function getDayAfterTomorrowDayOrder(token) {
  try {
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const scraper = new CalendarFetcher(dayAfterTomorrow, token);
    const response = await scraper.getTodayDayOrder();

    if (!response.dayOrder) {
      return {
        ...response,
        event: response.event || "Holiday/Weekend",
        message: "No classes on this day (holiday or weekend)",
      };
    }

    return response;
  } catch (error) {
    console.error("Error getting day after tomorrow's day order:", error);
    throw error;
  }
}

module.exports = {
  getTodayDayOrder,
  getTomorrowDayOrder,
  getDayAfterTomorrowDayOrder,
};
