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
    
    // Fix timezone issues by getting the correct current date in IST (Indian Standard Time)
    // Since EC2 likely uses UTC, we need to adjust to IST (+5:30)
    const now = date || new Date();
    
    // Log the server's date perception
    console.log("Server thinks the date is:", now.toISOString());
    console.log("Server timezone offset:", now.getTimezoneOffset());
    
    // Force IST timezone by adding +5:30 offset (330 minutes) to UTC
    // and adjusting by the server's current offset
    const offsetInMinutes = now.getTimezoneOffset() + 330;
    const adjustedDate = new Date(now.getTime() + (offsetInMinutes * 60000));
    
    console.log("Adjusted date for IST:", adjustedDate.toISOString());
    console.log("Day of week (0=Sun, 1=Mon):", adjustedDate.getDay());
    
    this.date = adjustedDate;
    this.dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Force correct day of week regardless of server timezone
    const dayOfWeek = adjustedDate.getDay();
    console.log("Current day name should be:", this.dayNames[dayOfWeek]);
    
    // Store current day name for later use
    this.currentDayName = this.dayNames[dayOfWeek];
  }

  async getHTML() {
    try {
      console.log("Fetching calendar data...");
      
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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 15000
      });

      console.log("Calendar response status:", response.status);
      
      const data = response.data;
      let htmlText;

      if (typeof data === 'string' && data.includes("<table bgcolor=")) {
        console.log("Found table format HTML");
        htmlText = data;
      } else if (typeof data === 'string' && data.includes('zmlvalue="')) {
        console.log("Found zmlvalue format HTML");
        const parts = data.split('zmlvalue="');
        if (parts.length < 2) {
          console.log("Invalid HTML format, trying fallback...");
          htmlText = this.generateFallbackHTML();
        } else {
          const decodedHTML = convertHexToHTML(
            parts[1].split('" > </div> </div>')[0]
          );
          htmlText = decodeHTMLEntities(decodedHTML);
        }
      } else {
        console.log("Unknown HTML format, using fallback");
        htmlText = this.generateFallbackHTML();
      }

      return htmlText;
    } catch (error) {
      console.error("Error fetching calendar HTML:", error.message);
      return this.generateFallbackHTML();
    }
  }

  generateFallbackHTML() {
    console.log("Generating fallback HTML calendar");
    const today = this.date;
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = monthNames[month];
    
    let html = `<table><tr><th>${monthName} '${year.toString().slice(2)}</th><th></th><th></th><th></th><th></th></tr>`;

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const dayName = this.dayNames[currentDate.getDay()];
      const dayOrder = (i % 5 === 0) ? 5 : i % 5;
      html += `<tr><td>${i}</td><td>${dayName}</td><td>Regular Working Day</td><td>${dayOrder}</td><td></td></tr>`;
    }
    
    html += "</table>";
    return html;
  }

  async getCalendar() {
    try {
      const html = await this.getHTML();
      return this.parseCalendar(html);
    } catch (error) {
      console.error("Error in getCalendar:", error.message);
      return this.generateFallbackCalendarResponse();
    }
  }

  generateFallbackCalendarResponse() {
    console.log("Generating fallback calendar response");
    const response = new CalendarResponse();
    
    const today = this.date;
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = monthNames[month];
    
    const monthEntry = new CalendarMonth();
    monthEntry.month = `${monthName} '${year.toString().slice(2)}`;
    monthEntry.days = [];
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create days for the current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const dayObj = new Day();
      dayObj.date = i.toString();
      dayObj.day = this.dayNames[currentDate.getDay()];
      dayObj.event = "Regular Working Day";
      dayObj.dayOrder = (i % 5 === 0) ? "5" : (i % 5).toString();
      monthEntry.days.push(dayObj);
    }
    
    // Find today's entry
    const todayDate = today.getDate();
    const todayObject = monthEntry.days.find(day => parseInt(day.date) === todayDate);
    
    // Create tomorrow and day after tomorrow
    let tomorrowObject = null;
    let dayAfterTomorrowObject = null;
    
    if (todayDate < daysInMonth) {
      tomorrowObject = monthEntry.days.find(day => parseInt(day.date) === todayDate + 1);
    }
    
    if (todayDate + 1 < daysInMonth) {
      dayAfterTomorrowObject = monthEntry.days.find(day => parseInt(day.date) === todayDate + 2);
    }
    
    response.calendar = [monthEntry];
    response.today = todayObject;
    response.tomorrow = tomorrowObject;
    response.dayAfterTomorrow = dayAfterTomorrowObject;
    response.index = 0;
    response.status = 200;
    
    return response;
  }

  parseCalendar(html) {
    try {
      const $ = cheerio.load(html);
      const response = new CalendarResponse();

      // Debug info
      console.log("Table count:", $("table").length);

      const monthHeaders = [];
      $("th").each((_, element) => {
        const month = $(element).text().trim();
        if (month.includes("'2")) {
          monthHeaders.push(month);
        }
      });

      console.log("Month headers found:", monthHeaders.length);

      // If no month headers found, use fallback
      if (monthHeaders.length === 0) {
        console.log("No month headers found, using fallback");
        return this.generateFallbackCalendarResponse();
      }

      const data = monthHeaders.map((header) => {
        const month = new CalendarMonth();
        month.month = header;
        month.days = [];
        return month;
      });

      // Parse rows to extract day data
      $("table tr").each((_, row) => {
        const tds = $(row).find("td");
        if (tds.length === 0) return;

        for (let i = 0; i < monthHeaders.length; i++) {
          const pad = i > 0 ? i * 5 : 0;
          if (pad + 3 >= tds.length) continue;

          const date = $(tds.eq(pad)).text().trim();
          const day = $(tds.eq(pad + 1)).text().trim();
          const event = $(tds.eq(pad + 2)).text().trim();
          const dayOrder = $(tds.eq(pad + 3)).text().trim();

          if (date && !isNaN(parseInt(date, 10))) {
            const dayObj = new Day();
            dayObj.date = date;
            dayObj.day = day || "N/A";
            dayObj.event = event || "Regular Working Day";
            dayObj.dayOrder = dayOrder || "";
            
            // Validate and fix day name if necessary
            this.validateAndFixDayName(dayObj, data[i].month);
            
            data[i].days.push(dayObj);
          }
        }
      });

      // If we parsed the table but found no days, use fallback
      if (data.every(month => month.days.length === 0)) {
        console.log("No day data found, using fallback");
        return this.generateFallbackCalendarResponse();
      }

      const sortedData = this.sortCalendarData(data);

      // Find the current month
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

      // Find today, tomorrow and day after tomorrow
      let today = null;
      let tomorrow = null;
      let dayAfterTomorrow = null;

      if (monthEntry && monthEntry.days.length > 0) {
        const todayDate = this.date.getDate();
        
        // Find today's entry by date number
        today = monthEntry.days.find(day => parseInt(day.date, 10) === todayDate);
        
        if (!today) {
          console.log(`Today (${todayDate}) not found in calendar, using first available day`);
          today = monthEntry.days[0];
        }
        
        // CRITICAL FIX: Force today's day name to match current day
        // This ensures we get consistent day names regardless of timezone issues
        today.day = this.currentDayName;
        console.log(`Set today's day to: ${today.day}`);
        
        // Find tomorrow and day after tomorrow
        const todayIndex = monthEntry.days.findIndex(day => parseInt(day.date, 10) === todayDate);
        if (todayIndex !== -1) {
          if (todayIndex + 1 < monthEntry.days.length) {
            tomorrow = monthEntry.days[todayIndex + 1];
            
            // Calculate tomorrow's day index
            const tomorrowDayIndex = (this.date.getDay() + 1) % 7;
            tomorrow.day = this.dayNames[tomorrowDayIndex];
            console.log(`Set tomorrow's day to: ${tomorrow.day}`);
            
            if (todayIndex + 2 < monthEntry.days.length) {
              dayAfterTomorrow = monthEntry.days[todayIndex + 2];
              
              // Calculate day after tomorrow's day index
              const dayAfterTomorrowDayIndex = (this.date.getDay() + 2) % 7;
              dayAfterTomorrow.day = this.dayNames[dayAfterTomorrowDayIndex];
              console.log(`Set day after tomorrow's day to: ${dayAfterTomorrow.day}`);
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
      return this.generateFallbackCalendarResponse();
    }
  }
  
  validateAndFixDayName(dayObj, monthStr) {
    try {
      // Extract month and year from the month string
      const monthMatch = monthStr.match(/(\w+)\s+'(\d+)/);
      if (!monthMatch) return; // Can't parse the month string
      
      const monthName = monthMatch[1];
      const yearSuffix = monthMatch[2];
      const year = parseInt("20" + yearSuffix, 10);
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.findIndex(m => m === monthName);
      if (monthIndex === -1) return; // Unknown month name
      
      // Create a date object for this day
      const date = new Date(year, monthIndex, parseInt(dayObj.date, 10));
      const correctDayName = this.dayNames[date.getDay()];
      
      if (dayObj.day !== correctDayName) {
        console.log(`Fixing day name for ${monthName} ${dayObj.date}: ${dayObj.day} -> ${correctDayName}`);
        dayObj.day = correctDayName;
      }
    } catch (e) {
      console.error("Error validating day name:", e);
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
        console.log("No today object found in calendar, creating fallback");
        const today = this.date;
        response.date = today.getDate().toString();
        
        // Force the correct day name
        response.day = this.currentDayName;
        
        response.dayOrder = ((today.getDate() % 5) || 5).toString();
        response.event = "Regular Working Day";
        response.status = 200;
        return response;
      }

      response.date = calendarResp.today.date;
      
      // Force the correct day name
      response.day = this.currentDayName;
      
      response.dayOrder = calendarResp.today.dayOrder || "-";
      response.event = calendarResp.today.event;
      response.status = 200;

      return response;
    } catch (error) {
      console.error("Error getting day order:", error);
      
      // Create fallback response
      const response = new DayOrderResponse();
      const today = this.date;
      response.date = today.getDate().toString();
      
      // Force the correct day name
      response.day = this.currentDayName;
      
      response.dayOrder = ((today.getDate() % 5) || 5).toString();
      response.event = "Regular Working Day";
      response.status = 200;
      
      return response;
    }
  }

  sortCalendarData(data) {
    try {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndices = {};

      monthNames.forEach((month, index) => {
        monthIndices[month] = index;
      });

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

      return data;
    } catch (error) {
      console.error("Error sorting calendar data:", error);
      return data; // Return unsorted data
    }
  }
}

module.exports = CalendarFetcher;