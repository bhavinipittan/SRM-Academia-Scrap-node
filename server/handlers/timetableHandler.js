const { Timetable } = require("../helpers/timetableHelper");
const { getUser } = require("./userHandler");

async function getTimetable(token) {
  try {
    console.log("Getting timetable with token:", token ? "token-provided" : "no-token");
    
    let user = null;
    let batchNum = null;
    
    // Try to get user info with graceful fallback
    try {
      user = await getUser(token);
      console.log("User info retrieved:", user ? "success" : "failed");
      
      if (user && user.batch) {
        batchNum = user.batch;
        console.log("Using batch from user profile:", batchNum);
      } else {
        console.log("User batch information not available, using default");
        // Use a default batch if user info isn't available
        batchNum = "2023-BCS0003";
      }
    } catch (userError) {
      console.error("Error retrieving user info:", userError.message);
      // Fallback to default batch if user retrieval fails
      batchNum = "2023-BCS0003";
      console.log("Using fallback batch:", batchNum);
    }
    
    // Initialize timetable fetcher
    const timetableFetcher = new Timetable(token);
    
    try {
      // Get timetable with provided or default batch
      const timetable = await timetableFetcher.getTimetable(batchNum);
      return {
        ...timetable,
        batchUsed: batchNum,
        userFetchSuccess: !!user
      };
    } catch (timetableError) {
      console.error("Error fetching timetable:", timetableError.message);
      
      // Return a graceful error response with fallback data
      return {
        error: true,
        message: "Unable to fetch timetable: " + timetableError.message,
        status: 503,
        timetable: [],
        today: [],
        tomorrow: [],
        batchUsed: batchNum,
        userFetchSuccess: !!user
      };
    }
  } catch (error) {
    console.error("Fatal error in getTimetable handler:", error);
    
    // Return a structured error response
    return {
      error: true,
      message: "Failed to process timetable request: " + error.message,
      status: 500,
      timetable: [],
      today: [],
      tomorrow: []
    };
  }
}

module.exports = {
  getTimetable,
};