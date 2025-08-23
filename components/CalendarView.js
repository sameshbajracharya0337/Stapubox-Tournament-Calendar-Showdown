// src/components/CalendarView.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { formatCalendarDate, getMonthName, getISTDateKey, getTodayDateString } from '../utils/dateHelpers';

const { width: screenWidth } = Dimensions.get('window');

const CalendarView = ({ markedDates = {}, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(8); // August 2025
  const [currentYear] = useState(2025);

  // Generate calendar data
  const generateCalendarData = (month, year) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Convert Sunday (0) to Monday (0) based system
    const mondayBasedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const calendarDays = [];

    // Get previous month's last days
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();

    // Add previous month's days
    for (let i = mondayBasedStart - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dateString = getISTDateKey(`${prevYear}-${prevMonth}-${day}T00:00:00Z`);
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
      const dateString = getISTDateKey(`${year}-${month}-${day}T00:00:00Z`);
      calendarDays.push({
        day,
        dateString,
        isMarked: !!markedDates[dateString],
        isSelected: selectedDate === dateString,
        isToday: dateString === getTodayDateString(),
        isPreviousMonth: false,
        isNextMonth: false,
      });
    }

    // Fill remaining cells with next month's days (only if needed to complete the last row)
    const totalDaysShown = calendarDays.length;
    const remainingCellsInLastRow = totalDaysShown % 7;
    const nextMonthDaysToShow = remainingCellsInLastRow === 0 ? 0 : 7 - remainingCellsInLastRow;

    if (nextMonthDaysToShow > 0) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      for (let day = 1; day <= nextMonthDaysToShow; day++) {
        const dateString = getISTDateKey(`${nextYear}-${nextMonth}-${day}T00:00:00Z`);
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
    if (currentMonth > 8) { // Don't go before August
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth < 10) { // Don't go after October
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDatePress = (dateItem) => {
    if (dateItem && onDateSelect) {
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
      {/* Calendar Header */}
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
            currentMonth >= 10 && styles.disabledButton
          ]}
          disabled={currentMonth >= 10}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.navigationText,
            currentMonth >= 10 && styles.disabledText
          ]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={styles.daysOfWeekContainer}>
        {['m', 't', 'w', 't', 'f', 's', 's'].map((day, index) => (
          <View key={index} style={styles.dayOfWeekContainer}>
            <Text style={styles.dayOfWeekText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
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
    fontWeight: '700',
    color: '#000000',
  },
  selectedDay: {
    backgroundColor: '#E17827',
    borderRadius: 22,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedMarkedDayText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 17,
  },
});

export default CalendarView;
