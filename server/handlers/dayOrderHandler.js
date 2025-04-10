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
    return await scraper.getTodayDayOrder();
  } catch (error) {
    console.error('Error getting tomorrow day order:', error);
    throw error;
  }
}

async function getDayAfterTomorrowDayOrder(token) {
  try {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const scraper = new CalendarFetcher(dayAfter, token);
    return await scraper.getTodayDayOrder();
  } catch (error) {
    console.error('Error getting day after tomorrow day order:', error);
    throw error;
  }
}

module.exports = { 
  getTodayDayOrder,
  getTomorrowDayOrder,
  getDayAfterTomorrowDayOrder
};