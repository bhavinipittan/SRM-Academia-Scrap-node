const { getCourses } = require('./courseHandler');
const { getCalendar } = require('./calendarHandler');
const { getTodayDayOrder } = require('./dayOrderHandler');
const { getMarks } = require('./marksHandler');
const { getAttendance } = require('./attendanceHandler');
const { getTimetable } = require('./timetableHandler');
const { getProfile } = require('./profileHandler');
const { getUser } = require('./userHandler');
const { getUpcomingClasses } = require('./upcomingClassesHandler');
const { getTodayClasses } = require('./todayClassesHandler');

const getAllData = async (csrfToken) => {
  try {
    // Execute all requests in parallel
    const [
      courses,
      calendar,
      dayOrder,
      marks,
      attendance,
      timetable,
      profile,
      user,
      upcomingClasses,
      todayClasses
    ] = await Promise.all([
      getCourses(csrfToken).catch(err => ({ error: 'Failed to fetch courses', details: err.message })),
      getCalendar(csrfToken).catch(err => ({ error: 'Failed to fetch calendar', details: err.message })),
      getTodayDayOrder(csrfToken).catch(err => ({ error: 'Failed to fetch day order', details: err.message })),
      getMarks(csrfToken).catch(err => ({ error: 'Failed to fetch marks', details: err.message })),
      getAttendance(csrfToken).catch(err => ({ error: 'Failed to fetch attendance', details: err.message })),
      getTimetable(csrfToken).catch(err => ({ error: 'Failed to fetch timetable', details: err.message })),
      getProfile(csrfToken).catch(err => ({ error: 'Failed to fetch profile', details: err.message })),
      getUser(csrfToken).catch(err => ({ error: 'Failed to fetch user', details: err.message })),
      getUpcomingClasses(csrfToken).catch(err => ({ error: 'Failed to fetch upcoming classes', details: err.message })),
      getTodayClasses(csrfToken).catch(err => ({ error: 'Failed to fetch today classes', details: err.message }))
    ]);

    // Combine all results into a single object
    return {
      academic: {
        courses,
        calendar,
        dayOrder,
        marks,
        attendance,
        timetable
      },
      user: {
        profile,
        user
      },
      classes: {
        upcomingClasses,
        todayClasses
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch combined data: ${error.message}`);
  }
};

module.exports = { getAllData };