const MarksFetcher = require('../helpers/marksHelper');

async function getMarks(token) {
  const marksFetcher = new MarksFetcher(token);
  try {
    return await marksFetcher.getMarks();
  } catch (error) {
    console.error('Error in marks handler:', error);
    throw error;
  }
}

module.exports = { getMarks };