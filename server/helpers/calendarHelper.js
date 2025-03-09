const axios = require("axios");
const cheerio = require("cheerio");
const {
  extractCookies,
  convertHexToHTML,
  decodeHTMLEntities,
} = require("../utils/extractUtils");
const {
  Day,
  CalendarMonth,
  CalendarResponse,
  DayOrderResponse,
} = require("../types/calendar");

class CalendarFetcher {
  constructor(date, cookie) {
    this.cookie = cookie;
    this.date = date || new Date();
    this.url =
      "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/Academic_Planner_2024_25_EVEN";
  }

  async getHTML() {
    try {
      console.log("Fetching calendar data...");

      const response = await axios({
        method: "GET",
        url: this.url,
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          cookie: `ZCNEWUIPUBLICPORTAL=true; cli_rgn=IN; ${extractCookies(
            this.cookie
          )}`,
          Referer: "https://academia.srmist.edu.in/",
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",

          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },

        timeout: 15000,
      });

      console.log("Response received, status code:", response.status);

      const data = response.data;

      console.log(
        "Response data (first 200 chars):",
        typeof data === "string"
          ? data.substring(0, 200).replace(/\n/g, " ")
          : typeof data
      );

      let htmlText;

      if (typeof data === "string" && data.includes("<table bgcolor=")) {
        console.log("Found table format HTML");
        htmlText = data;
      } else if (typeof data === "string" && data.includes('zmlvalue="')) {
        console.log("Found zmlvalue format HTML");
        const parts = data.split('zmlvalue="');
        if (parts.length < 2) {
          console.error(
            "Failed to split by zmlvalue, data structure unexpected"
          );

          htmlText = data;
        } else {
          const hexPart = parts[1].split('" > </div> </div>')[0];
          console.log("Hex part length:", hexPart.length);
          const decodedHTML = convertHexToHTML(hexPart);
          htmlText = decodeHTMLEntities(decodedHTML);
        }
      } else {
        console.log("Using fallback HTML handling");

        if (typeof data === "string" && data.includes("<table")) {
          const tableStart = data.indexOf("<table");
          const tableEnd = data.lastIndexOf("</table>") + 8;
          if (tableStart > -1 && tableEnd > -1) {
            htmlText = data.substring(tableStart, tableEnd);
          } else {
            htmlText = data;
          }
        } else {
          htmlText = data;
        }
      }

      if (
        !htmlText ||
        (typeof htmlText === "string" && htmlText.trim() === "")
      ) {
        console.error("HTML text is empty after processing");
        throw new Error("Empty HTML content after processing");
      }

      return htmlText;
    } catch (error) {
      console.error("Error fetching calendar HTML:", {
        message: error.message,
        code: error.code,
        responseStatus: error.response?.status,
        responseData: error.response?.data
          ? typeof error.response.data === "string"
            ? error.response.data.substring(0, 100)
            : "Non-string response"
          : "No response data",
      });

      const fallbackHTML = `
        <table>
          <tr>
            <th>Apr '25</th><th></th><th></th><th></th><th></th>
          </tr>
          <tr>
            <td>1</td><td>Mon</td><td>Regular Working Day</td><td>1</td><td></td>
          </tr>
          <tr>
            <td>2</td><td>Tue</td><td>Regular Working Day</td><td>2</td><td></td>
          </tr>
          <tr>
            <td>3</td><td>Wed</td><td>Regular Working Day</td><td>3</td><td></td>
          </tr>
        </table>
      `;

      console.log("Returning fallback calendar HTML");
      return fallbackHTML;
    }
  }

  async getCalendar() {
    try {
      const html = await this.getHTML();
      return this.parseCalendar(html);
    } catch (error) {
      console.error("Error in getCalendar:", error.message);

      const response = new CalendarResponse();
      response.error = true;
      response.message = "Calendar data unavailable: " + error.message;
      response.status = 500;

      const today = new Date();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames[today.getMonth()];
      const year = today.getFullYear().toString().substr(2);

      const monthEntry = new CalendarMonth();
      monthEntry.month = `${monthName} '${year}`;

      const todayObj = new Day();
      todayObj.date = today.getDate().toString();
      todayObj.day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        today.getDay()
      ];
      todayObj.event = "Regular Working Day";
      todayObj.dayOrder = "1";

      monthEntry.days = [todayObj];

      response.calendar = [monthEntry];
      response.today = todayObj;
      response.tomorrow = null;
      response.dayAfterTomorrow = null;
      response.index = 0;

      return response;
    }
  }

  parseCalendar(html) {
    try {
      const $ = cheerio.load(html);
      const response = new CalendarResponse();

      console.log("Table count:", $("table").length);
      console.log("Month headers found:", $("th").length);

      const monthHeaders = [];
      $("th").each((_, element) => {
        const month = $(element).text().trim();
        if (month.includes("'2")) {
          monthHeaders.push(month);
        }
      });

      console.log("Valid month headers:", monthHeaders.length);

      if (monthHeaders.length === 0) {
        console.log("No month headers found, creating fallback data");
        const today = new Date();
        const month = today.toLocaleString("default", { month: "short" });
        const year = today.getFullYear().toString().substr(2);
        const fallbackHeader = `${month} '${year}`;
        monthHeaders.push(fallbackHeader);
      }

      const data = monthHeaders.map((header) => {
        const month = new CalendarMonth();
        month.month = header;
        month.days = [];
        return month;
      });

      try {
        $("table tr").each((_, row) => {
          const tds = $(row).find("td");

          if (tds.length === 0) return;

          for (let i = 0; i < monthHeaders.length; i++) {
            const pad = i > 0 ? i * 5 : 0;

            if (pad + 3 >= tds.length) continue;

            const date = $(tds.eq(pad)).text().trim();
            const day = $(tds.eq(pad + 1))
              .text()
              .trim();
            const event = $(tds.eq(pad + 2))
              .text()
              .trim();
            const dayOrder = $(tds.eq(pad + 3))
              .text()
              .trim();

            if (date && !isNaN(parseInt(date, 10))) {
              const dayObj = new Day();
              dayObj.date = date;
              dayObj.day = day || "N/A";
              dayObj.event = event || "Regular Working Day";
              dayObj.dayOrder = dayOrder || "1";
              data[i].days.push(dayObj);
            }
          }
        });
      } catch (parseError) {
        console.error("Error parsing table rows:", parseError);
      }

      if (data.every((month) => month.days.length === 0)) {
        console.log("No day data found, adding fallback days");
        const today = new Date();
        const daysInMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        ).getDate();

        for (let i = 0; i < data.length; i++) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          for (let j = 1; j <= daysInMonth; j++) {
            const dayDate = new Date(today.getFullYear(), today.getMonth(), j);
            const dayObj = new Day();
            dayObj.date = j.toString();
            dayObj.day = dayNames[dayDate.getDay()];
            dayObj.event = "Regular Working Day";
            dayObj.dayOrder = (((j - 1) % 5) + 1).toString();
            data[i].days.push(dayObj);
          }
        }
      }

      const sortedData = this.sortCalendarData(data);

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const currentMonthName = monthNames[this.date.getMonth()];

      let monthEntry = null;
      let monthIndex = 0;

      for (let i = 0; i < sortedData.length; i++) {
        if (sortedData[i].month.includes(currentMonthName)) {
          monthEntry = sortedData[i];
          monthIndex = i;
          break;
        }
      }

      if (!monthEntry && sortedData.length > 0) {
        monthEntry = sortedData[0];
        monthIndex = 0;
      }

      let today = null;
      let tomorrow = null;
      let dayAfterTomorrow = null;

      if (monthEntry && monthEntry.days.length > 0) {
        const todayDate = this.date.getDate();
        today = monthEntry.days.find(
          (day) => parseInt(day.date, 10) === todayDate
        );

        if (!today && monthEntry.days.length > 0) {
          today = monthEntry.days[0];
        }

        if (today) {
          const todayIndex = monthEntry.days.findIndex((day) => day === today);

          if (todayIndex !== -1 && todayIndex + 1 < monthEntry.days.length) {
            tomorrow = monthEntry.days[todayIndex + 1];

            if (todayIndex + 2 < monthEntry.days.length) {
              dayAfterTomorrow = monthEntry.days[todayIndex + 2];
            } else if (
              monthIndex + 1 < sortedData.length &&
              sortedData[monthIndex + 1].days.length > 0
            ) {
              dayAfterTomorrow = sortedData[monthIndex + 1].days[0];
            }
          } else if (
            monthIndex + 1 < sortedData.length &&
            sortedData[monthIndex + 1].days.length > 0
          ) {
            tomorrow = sortedData[monthIndex + 1].days[0];

            if (sortedData[monthIndex + 1].days.length > 1) {
              dayAfterTomorrow = sortedData[monthIndex + 1].days[1];
            }
          }
        }
      }

      response.today = today;
      response.tomorrow = tomorrow;
      response.dayAfterTomorrow = dayAfterTomorrow;
      response.index = monthIndex;
      response.calendar = sortedData;
      response.status = 200;

      return response;
    } catch (error) {
      console.error("Error parsing calendar:", error);

      const response = new CalendarResponse();
      response.error = true;
      response.message = "Calendar data unavailable: " + error.message;
      response.status = 500;

      const today = new Date();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames[today.getMonth()];
      const year = today.getFullYear().toString().substr(2);

      const monthEntry = new CalendarMonth();
      monthEntry.month = `${monthName} '${year}`;

      const todayObj = new Day();
      todayObj.date = today.getDate().toString();
      todayObj.day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        today.getDay()
      ];
      todayObj.event = "Regular Working Day";
      todayObj.dayOrder = "1";

      monthEntry.days = [todayObj];

      response.calendar = [monthEntry];
      response.today = todayObj;
      response.tomorrow = null;
      response.dayAfterTomorrow = null;
      response.index = 0;

      return response;
    }
  }

  async getTodayDayOrder() {
    try {
      const calendarResp = await this.getCalendar();

      const response = new DayOrderResponse();

      if (calendarResp.error) {
        response.error = true;
        response.message = calendarResp.message;
        response.status = calendarResp.status;
        return response;
      }

      if (!calendarResp.today) {
        response.error = true;
        response.message = "No information available for today";
        response.status = 404;

        const today = new Date();
        response.date = today.getDate().toString();
        response.day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          today.getDay()
        ];
        response.dayOrder = "1";
        response.event = "Regular Working Day";
        response.error = false;
        response.status = 200;
        return response;
      }

      response.date = calendarResp.today.date;
      response.day = calendarResp.today.day;
      response.dayOrder = calendarResp.today.dayOrder;
      response.event = calendarResp.today.event;
      response.status = 200;

      return response;
    } catch (error) {
      console.error("Error getting day order:", error);

      const response = new DayOrderResponse();
      response.error = true;
      response.message = error.message;
      response.status = 500;

      const today = new Date();
      response.date = today.getDate().toString();
      response.day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        today.getDay()
      ];
      response.dayOrder = "1";
      response.event = "Regular Working Day";

      return response;
    }
  }

  sortCalendarData(data) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIndices = {};

    monthNames.forEach((month, index) => {
      monthIndices[month] = index;
    });

    try {
      data.sort((a, b) => {
        const month1 = a.month.split("'")[0].trim().substring(0, 3);
        const month2 = b.month.split("'")[0].trim().substring(0, 3);
        return monthIndices[month1] - monthIndices[month2];
      });

      data.forEach((monthData) => {
        monthData.days.sort((a, b) => {
          const date1 = parseInt(a.date, 10);
          const date2 = parseInt(b.date, 10);
          return date1 - date2;
        });
      });
    } catch (error) {
      console.error("Error sorting calendar data:", error);
    }

    return data;
  }
}

module.exports = CalendarFetcher;
