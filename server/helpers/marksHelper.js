const axios = require("axios");
const cheerio = require("cheerio");
const { extractCookies, convertHexToHTML } = require("../utils/extractUtils");
const AcademicsFetch = require("./attendanceHelper");

class MarksFetcher extends AcademicsFetch {
  constructor(cookie) {
    super(cookie);
  }

  parseFloat(s) {
    if (!s || s === "Abs") return 0;
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  }

  async getMarks() {
    try {
      const html = await this.getHTML();
      return await this.scrapeMarks(html);
    } catch (error) {
      console.error("Error fetching marks:", error);
      return {
        status: 500,
        error: error.message,
      };
    }
  }

  async scrapeMarks(html) {
    try {
      // First get attendance to map course codes to course titles
      const attendanceData = await this.scrapeAttendance(html);
      if (!attendanceData || !attendanceData.attendance) {
        return {
          regNumber: attendanceData ? attendanceData.regNumber : "",
          marks: [],
          status: 200,
        };
      }

      // Create course map
      const courseMap = {};
      for (const att of attendanceData.attendance) {
        courseMap[att.courseCode] = att.courseTitle;
      }

      // Extract marks table from HTML
      let marksHtml = "";
      const parts = html.split(
        '<table border="1" align="center" cellpadding="1" cellspacing="1">'
      );
      if (parts.length > 1) {
        marksHtml = parts[1].split(
          '<table  width=800px;"border="0"cellspacing="1"cellpadding="1">'
        )[0];
        marksHtml = marksHtml.split("<br />")[0];
        marksHtml =
          '<table border="1" align="center" cellpadding="1" cellspacing="1">' +
          marksHtml;
      } else {
        return {
          regNumber: attendanceData.regNumber,
          marks: [],
          status: 200,
        };
      }

      // Process tables with tests data
      const $ = cheerio.load(marksHtml);
      const marks = [];

      // Find all rows in the marks table
      $("tr").each((index, row) => {
        // Skip header row
        if (index === 0) return;

        const cells = $(row).find("td");
        if (cells.length < 3) return;

        const courseCode = cells.eq(0).text().trim();
        const courseType = cells.eq(1).text().trim();

        if (!courseCode || courseCode === "") return;

        // Process test performance cells
        const testCell = cells.eq(2);
        const testTables = testCell.find("table");

        let testPerformance = [];
        let overallScored = 0;
        let overallTotal = 0;

        testCell.find("table td").each((i, testElement) => {
          const testText = $(testElement).text().trim().split(".00");

          if (testText.length >= 2) {
            const testNameParts = testText[0].split("/");
            const testTitle = testNameParts[0].trim();
            const total = this.parseFloat(testNameParts[1]);

            let scored;
            if (testText[1].trim() === "Abs") {
              scored = "Abs";
            } else {
              scored = this.parseFloat(testText[1]);
            }

            testPerformance.push({
              test: testTitle,
              marks: {
                scored: scored === "Abs" ? "Abs" : scored.toFixed(2),
                total: total.toFixed(2),
              },
            });

            // Add to overall only if not absent
            if (scored !== "Abs") {
              overallScored += scored;
              overallTotal += total;
            } else {
              overallTotal += total; // Still count the total possible marks
            }
          }
        });

        const mark = {
          courseName: courseMap[courseCode] || courseCode,
          courseCode,
          courseType,
          overall: {
            scored: overallScored.toFixed(2),
            total: overallTotal.toFixed(2),
          },
          testPerformance,
        };

        marks.push(mark);
      });

      const sortedMarks = [];

      marks
        .filter((m) => m.courseType === "Theory")
        .forEach((m) => sortedMarks.push(m));

      marks
        .filter((m) => m.courseType === "Practical")
        .forEach((m) => sortedMarks.push(m));

      return {
        regNumber: attendanceData.regNumber,
        marks: sortedMarks,
        status: 200,
      };
    } catch (error) {
      console.error("Error scraping marks:", error);
      throw error;
    }
  }
}

module.exports = MarksFetcher;
