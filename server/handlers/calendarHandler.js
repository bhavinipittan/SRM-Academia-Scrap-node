const CalendarFetcher = require("../helpers/calendarHelper");

async function getCalendar(token) {
  try {
    const scraper = new CalendarFetcher(new Date(), token);
    return await scraper.getCalendar();
  } catch (error) {
    console.error("Error getting calendar:", error);
    throw error;
  }
}

module.exports = { getCalendar };
