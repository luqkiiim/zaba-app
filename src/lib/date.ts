export function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toLocalDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`);
}

export function toSessionTimestamp(dateString: string, timeString: string) {
  return new Date(`${dateString}T${timeString || '00:00'}`).getTime();
}

export function formatDateLabel(dateString: string, options: Intl.DateTimeFormatOptions) {
  return toLocalDate(dateString).toLocaleDateString(undefined, options);
}

export function isInSameMonth(dateString: string, compareDate = new Date()) {
  const date = toLocalDate(dateString);

  return (
    date.getFullYear() === compareDate.getFullYear() &&
    date.getMonth() === compareDate.getMonth()
  );
}
