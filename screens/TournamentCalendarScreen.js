import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import SportsDropdown from '../components/SportsDropdown';
import CalendarView from '../components/CalendarView';
import TournamentCard from '../components/TournamentCard';
import APIService from '../services/api';
import { getISTDateKey, getTodayDateString, getCalendarMonths, isDateInRange } from '../utils/dateHelpers';

const TournamentCalendarScreen = () => {
  const [tournaments, setTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null); // Changed to null initially
  const [currentMonth, setCurrentMonth] = useState(8); // August 2025
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    APIService.clearCache().then(() => loadTournaments());
  }, []);

  const loadTournaments = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      
      const response = await APIService.fetchTournaments();
      if (response.success) {
        setTournaments(response.data);
        setFilteredTournaments(response.data);
        
        // Initial marked dates will be calculated when selectedSport is set
      } else {
        setError(response.error || 'Failed to load tournaments');
      }
    } catch (err) {
      console.error('Error loading tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  // Helper function to filter tournaments by month
  const filterTournamentsByMonth = (tournamentsData, month, year) => {
    console.log(`Filtering tournaments for month: ${month}, year: ${year}`);
    
    return tournamentsData.map(sportData => {
      const filteredTournaments = sportData.tournaments.filter(tournament => {
        const tournamentDate = new Date(tournament.start_date);
        const tournamentMonth = tournamentDate.getMonth() + 1; // getMonth() returns 0-11
        const tournamentYear = tournamentDate.getFullYear();
        
        const belongsToMonth = tournamentMonth === month && tournamentYear === year;
        
        if (belongsToMonth) {
          console.log(`Tournament "${tournament.name}" belongs to month ${month}: ${tournament.start_date}`);
        }
        
        return belongsToMonth;
      });
      
      return {
        ...sportData,
        tournaments: filteredTournaments
      };
    }).filter(sportData => sportData.tournaments.length > 0); // Only return sports that have tournaments in this month
  };
  
  const calculateMarkedDates = (tournamentsData, sportFilter) => {
    console.log('=== Calculating Marked Dates ===');
    console.log('Sport filter:', sportFilter);
    console.log('Tournaments data:', tournamentsData.length, 'sports');

    const marked = {};
    const processedDates = new Set(); // Prevent duplicates
    
    // Determine which tournaments to process based on sport filter
    let tournamentsToProcess = tournamentsData;
    
    if (sportFilter && (sportFilter.id !== 'all' && sportFilter.sport_id !== 'all')) {
      console.log('Filtering marked dates for sport:', sportFilter.sports_name || sportFilter.sport_name);
      tournamentsToProcess = APIService.filterTournamentsBySport(tournamentsData, sportFilter.id || sportFilter.sport_id);
    } else {
      console.log('Showing marked dates for ALL sports');
    }
    
    tournamentsToProcess.forEach(sport => {
      console.log(`Processing sport for marking: ${sport.sport_name}, tournaments: ${sport.tournaments.length}`);
      
      sport.tournaments.forEach(tournament => {
        const startDateKey = getISTDateKey(tournament.start_date);
        
        if (startDateKey && !processedDates.has(startDateKey)) {
          console.log(`✅ Marking date: ${startDateKey} for tournament: ${tournament.name} (${sport.sport_name})`);
          marked[startDateKey] = { marked: true };
          processedDates.add(startDateKey);
        } else if (!startDateKey) {
          console.log(`❌ Invalid date for tournament: ${tournament.name} - ${tournament.start_date}`);
        } else {
          console.log(`⏭️  Date already marked: ${startDateKey} for ${tournament.name}`);
        }
      });
    });
    
    console.log('📅 Final markedDates object:', marked);
    console.log('📊 Total unique dates marked:', Object.keys(marked).length);
    console.log('================================');
    
    return marked;
  };

  // Update marked dates when tournaments or selected sport changes
  useEffect(() => {
    if (tournaments.length > 0) {
      const newMarkedDates = calculateMarkedDates(tournaments, selectedSport);
      setMarkedDates(newMarkedDates);
    }
  }, [tournaments, selectedSport]);

  const applyFilters = () => {
    console.log('Applying filters with:', { selectedSport, selectedDate, currentMonth });
    let filtered = tournaments;

    // Filter by sport first
    if (selectedSport && (selectedSport.id !== 'all' && selectedSport.sport_id !== 'all')) {
      console.log(`Filtering by sport ID: ${selectedSport.id || selectedSport.sport_id}`);
      filtered = APIService.filterTournamentsBySport(tournaments, selectedSport.id || selectedSport.sport_id);
      console.log(`After sport filter: ${filtered.length} sports`);
    }

    // Filter by specific date if selected, otherwise filter by current month
    if (selectedDate) {
      console.log(`Filtering by specific date: ${selectedDate}`);
      filtered = APIService.getTournamentsByDate(filtered, selectedDate);
      console.log(`After date filter: ${filtered.length} sports`);
    } else {
      // Filter by current month when no specific date is selected
      console.log(`Filtering by current month: ${currentMonth}`);
      filtered = filterTournamentsByMonth(filtered, currentMonth, 2025);
      console.log(`After month filter: ${filtered.length} sports`);
    }

    console.log('Applied filters:', { 
      sport: selectedSport?.sports_name || selectedSport?.sport_name || selectedSport?.name, 
      date: selectedDate,
      month: currentMonth,
      resultCount: filtered.length 
    });

    setFilteredTournaments(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedSport, selectedDate, currentMonth, tournaments]);

  const handleSportChange = (sport) => {
    console.log('Sport changed to:', sport);
    setSelectedSport(sport);
  };

  const handleDateSelect = (date) => {
    console.log('Selected date:', date);
    setSelectedDate(date);
  };

  // New function to clear the selected date
  const handleDateClear = () => {
    console.log('Clearing selected date');
    setSelectedDate(null);
  };

  const handleMonthChange = (month) => {
    console.log('Month changed to:', month);
    setCurrentMonth(month);
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    console.log('Pull-to-refresh triggered');
    setRefreshing(true);
    
    try {
      // Clear cache and reload tournaments
      await APIService.clearCache();
      await loadTournaments(true);
      
      console.log('Refresh completed successfully');
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Flatten the tournament data for FlatList and sort by date
  const getFlattenedTournaments = () => {
    const flattened = [];
    filteredTournaments.forEach((sportData, sportIndex) => {
      if (sportData.tournaments && sportData.tournaments.length > 0) {
        sportData.tournaments.forEach((tournament, tournamentIndex) => {
          flattened.push({
            id: `${tournament.id}-${sportIndex}-${tournamentIndex}`,
            tournament,
            sportName: sportData.sport_name || sportData.sports_name,
            sportsId: sportData.sports_id || sportData.sport_id,
          });
        });
      }
    });
    
    // Sort by tournament start date
    flattened.sort((a, b) => {
      const dateA = new Date(a.tournament.start_date);
      const dateB = new Date(b.tournament.start_date);
      return dateA - dateB; // Ascending order (earliest first)
    });
    
    console.log('Flattened and sorted tournaments:', flattened.map(item => ({
      name: item.tournament.name,
      sport: item.sportName,
      date: item.tournament.start_date
    })));
    
    return flattened;
  };

  const renderHeader = () => (
    <CalendarView
      markedDates={markedDates}
      onDateSelect={handleDateSelect}
      selectedDate={selectedDate}
      tournaments={tournaments}
      onMonthChange={handleMonthChange}
      currentMonth={currentMonth}
    />
  );

  const renderTournamentItem = ({ item }) => (
    <TournamentCard
      tournament={item.tournament}
      sportName={item.sportName}
      sportsId={item.sportsId}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>No tournaments found</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footerSpacer} />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Tournament Calendar</Text>
        <SportsDropdown 
          onSportChange={handleSportChange} 
          selectedSport={selectedSport} 
          onDateClear={handleDateClear}
        />
        <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Tournament Calendar</Text>
        <SportsDropdown 
          onSportChange={handleSportChange} 
          selectedSport={selectedSport} 
          onDateClear={handleDateClear}
        />
        <View style={styles.noDataContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const flattenedData = getFlattenedTournaments();

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Tournament Calendar</Text>
      <SportsDropdown 
        onSportChange={handleSportChange} 
        selectedSport={selectedSport} 
        onDateClear={handleDateClear}
      />
      <FlatList
        data={flattenedData}
        renderItem={renderTournamentItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false} // Better for complex layouts
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E17827"
            colors={['#E17827']}
            progressBackgroundColor="#ffffff"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginVertical: 12,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minHeight: 200, // Ensure some height for empty state
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  footerSpacer: {
    height: 20, // Add some space at the bottom
  },
});

export default TournamentCalendarScreen;