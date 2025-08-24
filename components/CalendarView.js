import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { formatCalendarDate, getMonthName, getISTDateKey, getTodayDateString } from '../utils/dateHelpers';

const { width: screenWidth } = Dimensions.get('window');

const CalendarView = ({ markedDates = {}, onDateSelect, selectedDate, onMonthChange, currentMonth: propCurrentMonth }) => {
  const [currentMonth, setCurrentMonth] = useState(propCurrentMonth || 8); // August 2025
  const [currentYear] = useState(2025);

  // Sync with parent component's current month
  useEffect(() => {
    if (propCurrentMonth && propCurrentMonth !== currentMonth) {
      setCurrentMonth(propCurrentMonth);
    }
  }, [propCurrentMonth]);

  // Debug logging to check markedDates
  useEffect(() => {
    console.log('=== CalendarView Debug ===');
    console.log('markedDates:', markedDates);
    console.log('selectedDate:', selectedDate);
    console.log('Number of marked dates:', Object.keys(markedDates).length);
    console.log('Sample marked dates keys:', Object.keys(markedDates).slice(0, 5));
    console.log('========================');
  }, [markedDates, selectedDate]);

  // Helper function to create date string in YYYY-MM-DD format
  const createDateString = (year, month, day) => {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // Check if a date belongs to the current month being displayed
  const isDateInCurrentMonth = (dateString, month, year) => {
    if (!dateString) return false;
    const [dateYear, dateMonth] = dateString.split('-').map(Number);
    return dateYear === year && dateMonth === month;
  };

  // Generate calendar data
  const generateCalendarData = (month, year) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const mondayBasedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const calendarDays = [];

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();

    // Add previous month's last days
    for (let i = mondayBasedStart - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dateString = createDateString(prevYear, prevMonth, day);
      calendarDays.push({
        day,
        dateString,
        isMarked: false,
        isSelected: false,
        isToday: false,
        isPreviousMonth: true,
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = createDateString(year, month, day);
      const todayString = getTodayDateString();
      const isMarked = !!markedDates[dateString];
      
      // Only show as selected if the selected date belongs to the current month
      const isSelected = selectedDate === dateString && isDateInCurrentMonth(selectedDate, month, year);

      console.log(`📅 Checking date ${dateString}: marked=${isMarked}, selected=${isSelected}, today=${dateString === todayString}`);
      console.log(`   selectedDateProp=${selectedDate}, markedDates has this key: ${!!markedDates[dateString]}`);

      calendarDays.push({
        day,
        dateString,
        isMarked,
        isSelected,
        isToday: dateString === todayString,
        isPreviousMonth: false,
        isNextMonth: false,
      });
    }

    // Fill remaining cells with next month's days
    const totalDaysShown = calendarDays.length;
    const remainingCellsInLastRow = totalDaysShown % 7;
    const nextMonthDaysToShow = remainingCellsInLastRow === 0 ? 0 : 7 - remainingCellsInLastRow;

    if (nextMonthDaysToShow > 0) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      for (let day = 1; day <= nextMonthDaysToShow; day++) {
        const dateString = createDateString(nextYear, nextMonth, day);
        calendarDays.push({
          day,
          dateString,
          isMarked: false,
          isSelected: false,
          isToday: false,
          isNextMonth: true,
        });
      }
    }

    return calendarDays;
  };

  const handlePrevMonth = () => {
    if (currentMonth > 8) {
      const newMonth = currentMonth - 1;
      setCurrentMonth(newMonth);
      // Notify parent component about month change
      if (onMonthChange) {
        onMonthChange(newMonth);
      }
      // Clear selection when changing months
      clearSelectionIfNotInMonth(newMonth, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth < 11) { // Allow November
      const newMonth = currentMonth + 1;
      setCurrentMonth(newMonth);
      // Notify parent component about month change
      if (onMonthChange) {
        onMonthChange(newMonth);
      }
      // Clear selection when changing months
      clearSelectionIfNotInMonth(newMonth, currentYear);
    }
  };

  // Clear the selection if the selected date doesn't belong to the new month
  const clearSelectionIfNotInMonth = (newMonth, newYear) => {
    if (selectedDate && !isDateInCurrentMonth(selectedDate, newMonth, newYear)) {
      console.log(`Clearing selection - date ${selectedDate} not in month ${newMonth}`);
      if (onDateSelect) {
        onDateSelect(null); // Clear the selection
      }
    }
  };

  const handleDatePress = (dateItem) => {
    if (dateItem && onDateSelect) {
      console.log('Date pressed:', dateItem.dateString);
      onDateSelect(dateItem.dateString);
    }
  };

  const calendarData = generateCalendarData(currentMonth, currentYear);
  const monthName = getMonthName(currentMonth);

  const renderCalendarDay = (dateItem, index) => {
    if (!dateItem) {
      return <View key={`empty-${index}`} style={styles.emptyDay} />;
    }

    const isDimmed = dateItem.isPreviousMonth || dateItem.isNextMonth;

    const dayStyle = [
      styles.dayContainer,
      dateItem.isSelected && !isDimmed && styles.selectedDay,
    ];

    const textStyle = [
      styles.dayText,
      isDimmed && styles.dimmedDayText,
      dateItem.isMarked && !isDimmed && !dateItem.isSelected && styles.markedDayText,
      dateItem.isSelected && !isDimmed && dateItem.isMarked && styles.selectedMarkedDayText,
      dateItem.isSelected && !isDimmed && !dateItem.isMarked && styles.selectedDayText,
    ];

    return (
      <TouchableOpacity
        key={dateItem.dateString}
        style={dayStyle}
        onPress={() => !isDimmed && handleDatePress(dateItem)}
        activeOpacity={isDimmed ? 1 : 0.7}
        disabled={isDimmed}
      >
        <Text style={textStyle}>
          {dateItem.day.toString().padStart(2, '0')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          style={[
            styles.navigationButton,
            currentMonth <= 8 && styles.disabledButton
          ]}
          disabled={currentMonth <= 8}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.navigationText,
            currentMonth <= 8 && styles.disabledText
          ]}>
            ‹
          </Text>
        </TouchableOpacity>

        <View style={styles.monthYearContainer}>
          <Text style={styles.monthYear}>
            {monthName} {currentYear}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNextMonth}
          style={[
            styles.navigationButton,
            currentMonth >= 11 && styles.disabledButton
          ]}
          disabled={currentMonth >= 11}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.navigationText,
            currentMonth >= 11 && styles.disabledText
          ]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.daysOfWeekContainer}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <View key={index} style={styles.dayOfWeekContainer}>
            <Text style={styles.dayOfWeekText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarData.map((dateItem, index) => renderCalendarDay(dateItem, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 60,
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    minHeight: 44,
  },
  navigationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.3,
  },
  navigationText: {
    fontSize: 45,
    fontWeight: '600',
    color: '#E17827',
    lineHeight: 45,
    textAlignVertical: 'center',
  },
  disabledText: {
    color: '#E17827',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '700',
    color: '#828282',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 24,
    textAlignVertical: 'center',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dayOfWeekContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    marginHorizontal: ((screenWidth - 64) / 7 - 44) / 2,
    position: 'relative',
    borderRadius: 22,
  },
  emptyDay: {
    width: (screenWidth - 64) / 7,
    height: 48,
  },
  dayText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dimmedDayText: {
    color: '#D1D5DB',
    fontWeight: '400',
  },
  markedDayText: {
    fontWeight: '900',
    color: '#0374151',
  },
  selectedDay: {
    backgroundColor: '#E17827',
    borderRadius: 22,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedMarkedDayText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 17,
  },
});

export default CalendarView;