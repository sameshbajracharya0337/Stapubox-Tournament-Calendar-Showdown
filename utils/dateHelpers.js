// src/utils/dateHelpers.js

/**
 * Convert UTC date to IST and format for display
 */
export const formatDateToIST = (dateString, format = 'date') => {
  try {
    const date = new Date(dateString);

    // Convert to IST (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istDate = new Date(date.getTime() + istOffset);

    switch (format) {
      case 'date':
        return istDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

      case 'time':
        return istDate.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

      case 'datetime':
        return {
          date: istDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          time: istDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        };

      case 'full':
        return istDate.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

      default:
        return istDate.toLocaleDateString('en-IN');
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

/**
 * ✅ Get YYYY-MM-DD string in IST (for calendar marking)
 */
export const getISTDateKey = (dateString) => {
  try {
    const date = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    return istDate.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch (error) {
    console.error('Error converting to IST date key:', error);
    return null;
  }
};

/**
 * Format date range for tournament cards
 */
export const formatDateRange = (startDate, endDate) => {
  try {
    const start = formatDateToIST(startDate, 'date');
    const end = formatDateToIST(endDate, 'date');

    if (start === end) {
      return start;
    }

    return `${start} - ${end}`;
  } catch (error) {
    return 'Date TBD';
  }
};

/**
 * Get calendar month data for react-native-calendars
 */
export const getCalendarMonths = () => {
  const months = [];
  const currentYear = 2025; // Fixed for Aug-Oct 2025

  // August, September, October 2025
  for (let month = 8; month <= 10; month++) {
    months.push({
      month: month,
      year: currentYear,
      dateString: `${currentYear}-${month.toString().padStart(2, '0')}-01`
    });
  }

  return months;
};

/**
 * Check if a date is within the tournament period (Aug-Oct 2025)
 */
export const isDateInRange = (dateString) => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-11

    return year === 2025 && month >= 8 && month <= 10;
  } catch (error) {
    return false;
  }
};

/**
 * Get month name from month number
 */
export const getMonthName = (monthNumber) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[monthNumber - 1] || 'Unknown';
};

/**
 * Format calendar date string for display
 */
export const formatCalendarDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const month = getMonthName(date.getMonth() + 1);
    const year = date.getFullYear();

    return `${month} ${year}`;
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Get today's date in YYYY-MM-DD format (IST)
 */
export const getTodayDateString = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
};

/**
 * Check if date is today (IST)
 */
export const isToday = (dateString) => {
  return dateString === getTodayDateString();
};

/**
 * Parse match status and return appropriate styling
 */
export const getMatchStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'upcoming':
      return {
        color: '#FF6B35',
        backgroundColor: '#FFF4F1',
        text: 'Upcoming'
      };
    case 'live':
      return {
        color: '#22C55E',
        backgroundColor: '#F0FDF4',
        text: 'Live'
      };
    case 'completed':
      return {
        color: '#6B7280',
        backgroundColor: '#F9FAFB',
        text: 'Completed'
      };
    default:
      return {
        color: '#6B7280',
        backgroundColor: '#F9FAFB',
        text: status || 'TBD'
      };
  }
};
