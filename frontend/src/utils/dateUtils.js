export const getLast30Days = () => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }

  return dates;
};

export const formatDateForDisplay = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();

  const isToday = new Date().toDateString() === date.toDateString();
  const isYesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString() === date.toDateString();

  if (isToday) {
    return `Today - ${dayName}, ${monthName} ${dayNum}, ${year}`;
  } else if (isYesterday) {
    return `Yesterday - ${dayName}, ${monthName} ${dayNum}, ${year}`;
  }

  return `${dayName}, ${monthName} ${dayNum}, ${year}`;
};

export const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseAPIDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const getTodayFormatted = () => {
  return formatDateForAPI(new Date());
};
