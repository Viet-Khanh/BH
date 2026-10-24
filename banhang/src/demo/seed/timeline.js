const OPEN_HOUR = 8;
const CLOSE_HOUR = 20;

const atHour = (day, hour) => {
  const date = new Date(day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

// Business days from oldest to today. Today's window ends at `now` so nothing is in the future.
export const listSeedDays = (now, days) =>
  Array.from({ length: days }, (_, index) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (days - 1 - index));
    const isToday = index === days - 1;
    let start = atHour(day, OPEN_HOUR);
    const close = atHour(day, CLOSE_HOUR);
    const end = isToday && now < close ? now : close;
    if (end <= start) start = atHour(day, 0);
    return { offset: days - 1 - index, start, end };
  });

// n ascending timestamps inside a day window, keeping generation order = time order.
export const spreadTimes = ({ start, end }, count, random) =>
  Array.from(
    { length: count },
    () =>
      new Date(
        start.getTime() + random.next() * (end.getTime() - start.getTime())
      )
  ).sort((left, right) => left - right);
