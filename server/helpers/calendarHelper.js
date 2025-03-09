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

    if (!date) {
      const now = new Date();

      const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      this.date = istTime;

      console.log("UTC time:", now.toISOString());
      console.log("IST time:", this.date.toISOString());
      console.log(
        "IST day of week:",
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][this.date.getDay()]
      );
    } else {
      this.date = date;
    }
  }

  async getHTML() {
    try {
      const response = await axios({
        method: "GET",
        url: "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/Academic_Planner_2024_25_EVEN",
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          cookie: `ZCNEWUIPUBLICPORTAL=true; cli_rgn=IN; ${extractCookies(
            this.cookie
          )}`,
          Referer: "https://academia.srmist.edu.in/",
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
        },
      });

      const data = response.data;
      let htmlText;

      if (data.includes("<table bgcolor=")) {
        htmlText = data;
      } else {
        const parts = data.split('zmlvalue="');
        if (parts.length < 2) {
          throw new Error("Invalid HTML format");
        }
        const decodedHTML = convertHexToHTML(
          parts[1].split('" > </div> </div>')[0]
        );
        htmlText = decodeHTMLEntities(decodedHTML);
      }

      return htmlText;
    } catch (error) {
      console.error("Error fetching calendar HTML:", error);
      throw error;
    }
  }

  async getCalendar() {
    try {
      const html = await this.getHTML();
      return this.parseCalendar(html);
    } catch (error) {
      const response = new CalendarResponse();
      response.error = true;
      response.message = error.message;
      response.status = 500;
      return response;
    }
  }

  parseCalendar(html) {
    try {
      const $ = cheerio.load(html);
      const response = new CalendarResponse();

      const monthHeaders = [];
      $("th").each((_, element) => {
        const month = $(element).text().trim();
        if (month.includes("'2")) {
          monthHeaders.push(month);
        }
      });

      const data = monthHeaders.map((header) => {
        const month = new CalendarMonth();
        month.month = header;
        month.days = [];
        return month;
      });

      $("table tr").each((_, row) => {
        const tds = $(row).find("td");

        for (let i = 0; i < monthHeaders.length; i++) {
          const pad = i > 0 ? i * 5 : 0;

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

          if (date && dayOrder) {
            const dayObj = new Day();
            dayObj.date = date;
            dayObj.day = day;
            dayObj.event = event;
            dayObj.dayOrder = dayOrder;
            data[i].days.push(dayObj);
          }
        }
      });

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
        const todayIndex = this.date.getDate() - 1;

        if (todayIndex >= 0 && todayIndex < monthEntry.days.length) {
          today = monthEntry.days[todayIndex];

          const tomorrowIndex = todayIndex + 1;
          if (tomorrowIndex < monthEntry.days.length) {
            tomorrow = monthEntry.days[tomorrowIndex];

            const dayAfterTomorrowIndex = tomorrowIndex + 1;
            if (dayAfterTomorrowIndex < monthEntry.days.length) {
              dayAfterTomorrow = monthEntry.days[dayAfterTomorrowIndex];
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
      response.message = error.message;
      response.status = 500;
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
        return response;
      }

      response.date = calendarResp.today.date;
      response.day = calendarResp.today.day;
      response.dayOrder = calendarResp.today.dayOrder;
      response.event = calendarResp.today.event;

      return response;
    } catch (error) {
      console.error("Error getting day order:", error);
      const response = new DayOrderResponse();
      response.error = true;
      response.message = error.message;
      response.status = 500;
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

    data.sort((a, b) => {
      const month1 = a.month.split("'")[0].substring(0, 3);
      const month2 = b.month.split("'")[0].substring(0, 3);
      return monthIndices[month1] - monthIndices[month2];
    });

    data.forEach((monthData) => {
      monthData.days.sort((a, b) => {
        const date1 = parseInt(a.date, 10);
        const date2 = parseInt(b.date, 10);
        return date1 - date2;
      });
    });

    return data;
  }
}

module.exports = CalendarFetcher;
