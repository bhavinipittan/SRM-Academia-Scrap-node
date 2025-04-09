const CalendarFetcher = require("../helpers/calendarHelper");

async function getTodayDayOrder(token) {
  try {
    const scraper = new CalendarFetcher(new Date(), token);
    const response = await scraper.getTodayDayOrder();

    if (!response.dayOrder) {
      return {
        ...response,
        error: false,  // Not an error, just no classes
        event: response.event || "Holiday/Weekend",
        message: "No classes on this day (holiday or weekend)",
      };
    }

    return response;
  } catch (error) {
    console.error("Error getting day order:", error);
    // Return a graceful fallback response instead of throwing
    return {
      error: true,
      message: "Failed to retrieve day order information",
      date: new Date().toISOString().split('T')[0],
      day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()],
      event: "Unknown (API Error)",
      dayOrder: null
    };
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
        error: false,  // Not an error, just no classes
        event: response.event || "Holiday/Weekend",
        message: "No classes on this day (holiday or weekend)",
      };
    }

    return response;
  } catch (error) {
    console.error("Error getting tomorrow's day order:", error);
    // Return a graceful fallback response
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      error: true,
      message: "Failed to retrieve tomorrow's day order information",
      date: tomorrow.toISOString().split('T')[0],
      day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][tomorrow.getDay()],
      event: "Unknown (API Error)",
      dayOrder: null
    };
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
        error: false,  // Not an error, just no classes
        event: response.event || "Holiday/Weekend",
        message: "No classes on this day (holiday or weekend)",
      };
    }

    return response;
  } catch (error) {
    console.error("Error getting day after tomorrow's day order:", error);
    // Return a graceful fallback response
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    return {
      error: true,
      message: "Failed to retrieve day after tomorrow's day order information",
      date: dayAfterTomorrow.toISOString().split('T')[0],
      day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayAfterTomorrow.getDay()],
      event: "Unknown (API Error)",
      dayOrder: null
    };
  }
}

module.exports = {
  getTodayDayOrder,
  getTomorrowDayOrder,
  getDayAfterTomorrowDayOrder,
};