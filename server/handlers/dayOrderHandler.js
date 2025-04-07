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

async function getTomorrowDayOrder(token) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scraper = new CalendarFetcher(tomorrow, token);
    return await scraper.getTodayDayOrder(); // Uses the same method but with tomorrow's date
  } catch (error) {
    console.error('Error getting tomorrow\'s day order:', error);
    throw error;
  }
}

async function getDayAfterTomorrowDayOrder(token) {
  try {
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const scraper = new CalendarFetcher(dayAfterTomorrow, token);
    return await scraper.getTodayDayOrder(); // Uses the same method but with day after tomorrow's date
  } catch (error) {
    console.error('Error getting day after tomorrow\'s day order:', error);
    throw error;
  }
}

module.exports = { 
  getTodayDayOrder,
  getTomorrowDayOrder,
  getDayAfterTomorrowDayOrder
};