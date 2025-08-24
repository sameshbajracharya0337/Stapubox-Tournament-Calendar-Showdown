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
 * ✅ FIXED: Get YYYY-MM-DD string from date (for calendar marking) - NO timezone conversion
 */
export const getISTDateKey = (dateString) => {
  try {
    if (!dateString) {
      console.warn('getISTDateKey: Empty dateString provided');
      return null;
    }

    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.log(`getISTDateKey: ${dateString} → ${dateString} (already in correct format)`);
      return dateString;
    }

    // For date strings with time components, extract just the date part
    if (dateString.includes('T')) {
      const dateOnly = dateString.split('T')[0];
      console.log(`getISTDateKey: ${dateString} → ${dateOnly} (extracted date part)`);
      return dateOnly;
    }

    // Handle other formats by creating a date object
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('getISTDateKey: Invalid date:', dateString);
      return null;
    }

    // Use UTC methods to avoid timezone interference
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    const dateKey = `${year}-${month}-${day}`;
    console.log(`getISTDateKey: ${dateString} → ${dateKey}`);
    return dateKey;
    
  } catch (error) {
    console.error('Error in getISTDateKey:', error, 'for date:', dateString);
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
export const getCalendarMonths = (tournaments = []) => {
  const months = new Set();
  const currentYear = 2025;

  tournaments.forEach(sport => {
    sport.tournaments.forEach(tournament => {
      const startDate = new Date(tournament.start_date);
      const month = startDate.getMonth() + 1; // 1-12
      months.add(month);
    });
  });

  return Array.from(months)
    .sort((a, b) => a - b)
    .map(month => ({
      month: month,
      year: currentYear,
      dateString: `${currentYear}-${month.toString().padStart(2, '0')}-01`
    }));
};

/**
 * Check if a date is within the tournament period
 */
export const isDateInRange = (dateString, tournaments = []) => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const minMonth = Math.min(...tournaments.flatMap(sport =>
      sport.tournaments.map(t => new Date(t.start_date).getMonth() + 1)
    )) || 1;
    const maxMonth = Math.max(...tournaments.flatMap(sport =>
      sport.tournaments.map(t => new Date(t.start_date).getMonth() + 1)
    )) || 12;

    return year === 2025 && month >= minMonth && month <= maxMonth;
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
 * Get today's date in YYYY-MM-DD format (local date, no timezone conversion)
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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