const axios = require("axios");
const cheerio = require("cheerio");
const { extractCookies, convertHexToHTML } = require("../utils/extractUtils");

class AcademicsFetch {
  constructor(cookie) {
    this.cookie = cookie;
  }

  async getHTML() {
    try {
      const response = await axios({
        method: "GET",
        url: "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance",
        headers: {
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://academia.srmist.edu.in/",
          cookie: extractCookies(this.cookie),
        },
      });

      const data = response.data;
      const parts = data.split(".sanitize('");

      if (parts.length < 2) {
        throw new Error("attendance - invalid response format");
      }

      const htmlHex = parts[1].split("')")[0];
      return convertHexToHTML(htmlHex);
    } catch (error) {
      console.error("Error fetching attendance HTML:", error);
      throw error;
    }
  }

  async getAttendance() {
    try {
      const html = await this.getHTML();
      return this.scrapeAttendance(html);
    } catch (error) {
      return {
        status: 500,
        error: error.message,
      };
    }
  }

  parseFloat(s) {
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  }

  scrapeAttendance(html) {
    try {
      const regNumberMatch = html.match(/RA2\d{12}/);
      const regNumber = regNumberMatch ? regNumberMatch[0] : "";

      let processedHtml = html.replace(
        /<td  bgcolor='#E6E6FA' style='text-align:center'> - <\/td>/g,
        ""
      );
      const parts = processedHtml.split(
        `<table style="font-size :16px;" border="1" align="center" cellpadding="1" cellspacing="1" bgcolor="#FAFAD2">`
      );

      if (parts.length < 2) {
        return { regNumber, attendance: [], status: 200 };
      }

      const tablePart = parts[1].split("</table>")[0];
      const tableHtml = `<table style="font-size :16px;" border="1" align="center" cellpadding="1" cellspacing="1" bgcolor="#FAFAD2">${tablePart}</table>`;

      const $ = cheerio.load(tableHtml);
      const attendance = [];

      $('td[bgcolor="#E6E6FA"]').each((index, element) => {
        const courseCode = $(element).text();

        if (
          (courseCode.length > 10 && /^\d/.test(courseCode)) ||
          courseCode.toLowerCase().includes("regular")
        ) {
          const row = $(element).parent();

          const cells = $(row).find("td");
          const courseTitle = $(cells.eq(1)).text().split(" \\u2013")[0];
          const category = $(cells.eq(2)).text();
          const facultyName = $(cells.eq(3)).text();
          const slot = $(cells.eq(4)).text();
          const hoursConducted = $(cells.eq(5)).text();
          const hoursAbsent = $(cells.eq(6)).text();

          const conductedNum = this.parseFloat(hoursConducted);
          const absentNum = this.parseFloat(hoursAbsent);
          let percentage = 0;

          if (conductedNum !== 0) {
            percentage = ((conductedNum - absentNum) / conductedNum) * 100;
          }

          const attendanceItem = {
            courseCode: courseCode.replace("Regular", ""),
            courseTitle,
            category,
            facultyName,
            slot,
            hoursConducted,
            hoursAbsent,
            attendancePercentage: percentage.toFixed(2),
          };

          if (courseTitle.toLowerCase() !== "null") {
            attendance.push(attendanceItem);
          }
        }
      });

      return {
        regNumber,
        attendance,
        status: 200,
      };
    } catch (error) {
      console.error("Error scraping attendance:", error);
      throw error;
    }
  }
}

module.exports = AcademicsFetch;
