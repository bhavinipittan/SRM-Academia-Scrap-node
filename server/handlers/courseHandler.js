const CourseFetcher = require('../helpers/courseHelper');

async function getCourses(token) {
  try {
    const fetcher = new CourseFetcher(token);
    return await fetcher.getCourses();
  } catch (error) {
    console.error('Error in course handler:', error);
    throw error;
  }
}

module.exports = { getCourses };