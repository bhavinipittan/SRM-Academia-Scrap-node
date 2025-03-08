const CalendarFetcher = require('../helpers/calendarHelper');

async function getTodayDayOrder(token) {
  try {
    const scraper = new CalendarFetcher(new Date(), token);
    return await scraper.getTodayDayOrder();
  } catch (error) {
    console.error('Error getting day order:', error);
    throw error;
  }
}

module.exports = { getTodayDayOrder };