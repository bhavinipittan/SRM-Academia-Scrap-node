const { CoursePage, getUserFromHTML } = require('../helpers/userHelper');

async function getUser(token) {
  try {
    const coursePage = new CoursePage(token);
    const page = await coursePage.getPage();
    return await getUserFromHTML(page);
  } catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
}

module.exports = { getUser };