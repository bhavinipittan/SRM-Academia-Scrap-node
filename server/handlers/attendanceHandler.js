const AcademicsFetch = require("../helpers/attendanceHelper");

async function getAttendance(token) {
  const scraper = new AcademicsFetch(token);
  return await scraper.getAttendance();
}

module.exports = { getAttendance }
