const { getTodayDayOrder } = require('./dayOrderHandler');
const { getTimetable } = require('./timetableHandler');

async function getTodayClasses(token) {
  try {
    // Get today's day order
    const dayOrderResponse = await getTodayDayOrder(token);
    
    if (dayOrderResponse.error) {
      return {
        error: true,
        message: dayOrderResponse.message || "Failed to get day order",
        status: dayOrderResponse.status || 500,
        classes: []
      };
    }

    const todayDayOrder = dayOrderResponse.dayOrder;
    
    // If no day order (might be holiday), return early
    if (!todayDayOrder) {
      return {
        error: false,
        message: "No classes today (holiday or weekend)",
        status: 200,
        classes: []
      };
    }

    // Get timetable
    const timetableResponse = await getTimetable(token);
    
    // Handle different day order formats
    let dayOrderPossibilities = [
      todayDayOrder, 
      `Day ${todayDayOrder}`, 
      todayDayOrder.replace('Day ', ''),
      Number(todayDayOrder),
      String(todayDayOrder)
    ];
    
    // Find today's schedule based on any possible day order format
    let todaySchedule = null;
    for (const possibleFormat of dayOrderPossibilities) {
      const schedule = timetableResponse.schedule.find(day => 
        day.dayOrder == possibleFormat || 
        day.dayOrder === possibleFormat
      );
      if (schedule) {
        todaySchedule = schedule;
        break;
      }
    }

    // If no schedule for today, return empty result
    if (!todaySchedule) {
      return {
        error: false,
        message: `No classes found for ${todayDayOrder}`,
        status: 200,
        classes: []
      };
    }

    // Sort classes by start time
    const todayClasses = [...todaySchedule.table].sort((a, b) => {
      // Convert times to comparable format (24-hour)
      const getComparableTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        }
        if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return hours * 60 + minutes;
      };
      
      return getComparableTime(a.startTime) - getComparableTime(b.startTime);
    });

    return {
      error: false,
      message: "Today's classes retrieved successfully",
      status: 200,
      dayOrder: todayDayOrder,
      date: dayOrderResponse.date,
      day: dayOrderResponse.day,
      event: dayOrderResponse.event || "No event",
      classes: todayClasses
    };
    
  } catch (error) {
    console.error('Error getting today\'s classes:', error);
    return {
      error: true,
      message: error.message || "Failed to get today's classes",
      status: 500,
      classes: []
    };
  }
}

module.exports = { getTodayClasses };