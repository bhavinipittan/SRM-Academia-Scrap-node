const axios = require("axios");
const cheerio = require("cheerio");
const { extractCookies, convertHexToHTML } = require("../utils/extractUtils");

let Course, CourseResponse;
try {
  const courseTypes = require("../types/course");
  Course = courseTypes.Course;
  CourseResponse = courseTypes.CourseResponse;
} catch (err) {
  Course = class Course {
    constructor() {
      this.code = "";
      this.title = "";
      this.credit = "";
      this.category = "";
      this.courseCategory = "";
      this.type = "";
      this.slotType = "";
      this.faculty = "";
      this.slot = "";
      this.room = "";
      this.academicYear = "";
    }
  };

  CourseResponse = class CourseResponse {
    constructor(regNumber = "", courses = [], status = 200, error = "") {
      this.regNumber = regNumber;
      this.courses = courses;
      this.status = status;
      this.error = error;
    }
  };
}

class CourseFetcher {
  constructor(cookie) {
    this.cookie = cookie;
  }

  getUrl() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11
    const currentYear = currentDate.getFullYear();

    let academicYearStart, academicYearEnd;

    if (currentMonth >= 7 && currentMonth <= 11) {
      academicYearStart = currentYear - 1;
      academicYearEnd = currentYear;
    } else {
      academicYearStart = currentYear - 2;
      academicYearEnd = currentYear - 1;
    }

    // Format like 2023_24 (last two digits of end year)
    return `https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_${academicYearStart}_${
      academicYearEnd % 100
    }`;
  }

  async getHTML() {
    try {
      const response = await axios({
        method: "GET",
        url: this.getUrl(),
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          cookie: extractCookies(this.cookie),
          Referer: "https://academia.srmist.edu.in/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Cache-Control": "private, max-age=120, must-revalidate",
        },
      });

      const data = response.data;
      const parts = data.split(".sanitize('");

      if (parts.length < 2) {
        throw new Error("courses - invalid response format");
      }

      const htmlHex = parts[1].split("')")[0];
      return convertHexToHTML(htmlHex);
    } catch (error) {
      console.error("Error fetching courses HTML:", error);
      throw error;
    }
  }

  async getPage() {
    return this.getHTML();
  }

  async getCourses() {
    try {
      const html = await this.getHTML();
      return this.scrapeCourses(html);
    } catch (error) {
      const response = new CourseResponse();
      response.status = 500;
      response.error = error.message;
      return response;
    }
  }

  scrapeCourses(html) {
    try {
      // Extract registration number
      const regNumberMatch = html.match(/RA2\d{12}/);
      const regNumber = regNumberMatch ? regNumberMatch[0] : "";

      // Find the course table in the HTML
      let courseTableHtml = "";
      const tableParts = html.split(
        '<table cellspacing="1" cellpadding="1" border="1" align="center" style="width:900px!important;" class="course_tbl">'
      );
      if (tableParts.length > 1) {
        courseTableHtml = tableParts[1].split("</table>")[0];
        courseTableHtml = "<table>" + courseTableHtml + "</table>";
      } else {
        return new CourseResponse(regNumber, [], 200);
      }

      const $ = cheerio.load(courseTableHtml);
      const courses = [];

      $("tr").each((index, row) => {
        if (index === 0) return;

        const cells = $(row).find("td");
        if (cells.length < 11) return;

        const getText = (idx) => $(cells.eq(idx)).text().trim();

        const code = getText(1);
        const title = getText(2);
        const credit = getText(3) || "N/A";
        const category = getText(4);
        const courseCategory = getText(5);
        const courseType = getText(6) || "N/A";
        const faculty = getText(7) || "N/A";
        let slot = getText(8);
        let room = getText(9) || "N/A";
        const academicYear = getText(10);

        slot = slot.replace(/-$/, "");

        if (room !== "N/A") {
          room = room.charAt(0).toUpperCase() + room.slice(1);
        }

        // Determine slot type
        const slotType = slot.includes("P") ? "Practical" : "Theory";

        const course = new Course();
        course.code = code;
        course.title = title.split(" \\u2013")[0];
        course.credit = credit;
        course.category = category;
        course.courseCategory = courseCategory;
        course.type = courseType;
        course.slotType = slotType;
        course.faculty = faculty;
        course.slot = slot;
        course.room = room;
        course.academicYear = academicYear;

        courses.push(course);
      });

      const response = new CourseResponse();
      response.regNumber = regNumber;
      response.courses = courses;
      return response;
    } catch (error) {
      console.error("Error scraping courses:", error);
      const response = new CourseResponse();
      response.status = 500;
      response.error = error.message;
      return response;
    }
  }

  getSlotType(slot) {
    return slot.includes("P") ? "Practical" : "Theory";
  }
}

module.exports = CourseFetcher;
module.exports.CoursePage = CourseFetcher;
