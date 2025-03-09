const { Timetable } = require("../helpers/timetableHelper");
const { getUser } = require("./userHandler");

async function getTimetable(token) {
  try {
    const user = await getUser(token);
    if (!user) {
      throw new Error("Failed to retrieve user information");
    }

    const timetableFetcher = new Timetable(token);

    const batchNum = user.batch;
    if (!batchNum) {
      throw new Error("User batch information not available");
    }

    const timetable = await timetableFetcher.getTimetable(batchNum);
    return timetable;
  } catch (error) {
    console.error("Error in getTimetable handler:", error);
    throw error;
  }
}

module.exports = {
  getTimetable,
};
