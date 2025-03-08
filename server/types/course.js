class Course {
  constructor() {
    this.code = '';
    this.title = '';
    this.credit = '';
    this.category = '';
    this.courseCategory = '';
    this.type = '';
    this.slotType = '';
    this.faculty = '';
    this.slot = '';
    this.room = '';
    this.academicYear = '';
  }
}

class CourseResponse {
  constructor(regNumber = '', courses = [], status = 200, error = '') {
    this.regNumber = regNumber;
    this.courses = courses;
    this.status = status;
    this.error = error;
  }
}

module.exports = {
  Course,
  CourseResponse
};