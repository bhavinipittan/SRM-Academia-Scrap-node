
class Day {
  constructor() {
    this.date = '';   
    this.day = '';      
    this.event = '';    
    this.dayOrder = ''; 
  }
}


class CalendarMonth {
  constructor() {
    this.month = '';
    this.days = [];  
  }
}

class CalendarResponse {
  constructor() {
    this.error = false;         
    this.message = '';        
    this.status = 200;          
    this.today = null;           
    this.tomorrow = null;       
    this.dayAfterTomorrow = null; 
    this.index = 0;              
    this.calendar = [];         
  }
}


class DayOrderResponse {
  constructor() {
    this.error = false;  
    this.message = '';     
    this.status = 200;     
    this.date = '';       
    this.day = '';        
    this.dayOrder = '';    
    this.event = '';     
  }
}

module.exports = {
  Day,
  CalendarMonth,
  CalendarResponse,
  DayOrderResponse
};