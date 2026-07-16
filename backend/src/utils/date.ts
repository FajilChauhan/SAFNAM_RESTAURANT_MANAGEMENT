// Provides timezone-safe date helpers using ISO strings and UTC boundaries.
export const nowUtc = () => new Date();

export const toIsoString = (date: Date) => date.toISOString();

export const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

export const startOfUtcDay = (date: Date) => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const endOfUtcDay = (date: Date) => {
  const end = startOfUtcDay(date);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
  return end;
};

export const isExpired = (date: Date, referenceDate = nowUtc()) => {
  return date.getTime() <= referenceDate.getTime();
};
