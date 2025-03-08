class Slot {
  constructor() {
    this.day = 0;
    this.dayOrder = "";
    this.slots = [];
    this.times = [];
  }
}

class Batch {
  constructor() {
    this.batch = "";
    this.slots = [];
  }
}

class TableSlot {
  constructor() {
    this.code = "";
    this.name = "";
    this.slot = "";
    this.roomNo = "";
    this.courseType = "";
    this.online = false;
    this.isOptional = false;
    this.startTime = "";
    this.endTime = "";
  }
}

class DaySchedule {
  constructor() {
    this.day = 0;
    this.table = [];
  }
}

class TimetableResult {
  constructor() {
    this.regNumber = "";
    this.batch = "";
    this.schedule = [];
  }
}

module.exports = {
  Slot,
  Batch,
  TableSlot,
  DaySchedule,
  TimetableResult,
};
