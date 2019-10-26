const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const WEEKDAY_REGEX = [
  'söndag|sunday',
  'måndag|monday',
  'tisdag|tuesday',
  'onsdag|wednesday',
  'torsdag|thursday',
  'fredag|friday',
  'lördag|saturday',
]

const TARGET_TIMEZONE = 'Europe/Stockholm'

function isWeekDay(input) {
  return typeof input === 'number' && input >= 0 && input < 7
}

/** Returns 0-7 for valid weekdays, -1 otherwise */
function toWeekDay(input) {
  if (input === 'today') {
    return weekDay()
  }
  const dayIndex = WEEKDAY_REGEX.findIndex(re => new RegExp(re).test(input))
  return (dayIndex >= 0) ? dayIndex : null
}

function weekDay(date = new Date()) {
  return new Date(date.toLocaleString('en-US', {
    hour12: false,
    timeZone: TARGET_TIMEZONE,
  })).getDay()
}

module.exports = {
  WEEKDAYS,
  WEEKDAY_REGEX,
  TARGET_TIMEZONE,
  toWeekDay,
  isWeekDay,
  weekDay,
}
