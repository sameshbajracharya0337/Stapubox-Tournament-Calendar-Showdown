// src/screens/TournamentCalendarScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import SportsDropdown from '../components/SportsDropdown';
import CalendarView from '../components/CalendarView';
import TournamentCard from '../components/TournamentCard';
import APIService from '../services/api';

const TournamentCalendarScreen = () => {
  // State Management
  const [tournaments, setTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadTournaments();
  }, []);

  // Filter tournaments when sport or date selection changes
  useEffect(() => {
    applyFilters();
  }, [selectedSport, selectedDate, tournaments]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await APIService.fetchTournaments();
      
      if (response.success) {
        setTournaments(response.data);
        console.log('📱 Loaded tournaments:', response.data);
      } else {
        setError(response.error || 'Failed to load tournaments');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Tournament loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tournaments;

    // First filter by sport if not "ALL"
    if (selectedSport && selectedSport.id !== 'all') {
      filtered = APIService.filterTournamentsBySport(tournaments, selectedSport.id);
    }

    // Then filter by date if selected
    if (selectedDate) {
      filtered = APIService.getTournamentsByDate(filtered, selectedDate);
    }

    console.log('🔄 Applied filters:', { 
      sport: selectedSport?.sports_name || selectedSport?.name, 
      date: selectedDate,
      resultCount: filtered.length 
    });

    setFilteredTournaments(filtered);
  };

  const handleSportChange = (sport) => {
    console.log('🏃 Sport changed:', sport);
    setSelectedSport(sport);
    // Don't reset date selection when sport changes - let user keep date filter
  };

  const handleDateSelect = (dateString) => {
    const newDate = selectedDate === dateString ? null : dateString;
    console.log('📅 Date selected:', newDate);
    setSelectedDate(newDate);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

  // Get current sport display name
  const getCurrentSportName = () => {
    if (!selectedSport || selectedSport.id === 'all') return 'All Sports';
    return selectedSport.sports_name || selectedSport.name;
  };

  // Get sport icon based on sport name or ID
  const getSportIcon = (sportName, sportId) => {
    const sport = sportName?.toLowerCase() || getSportNameById(sportId)?.toLowerCase();
    
    const sportIcons = {
      'football': '⚽',
      'american football': '🏈',
      'archery': '🏹',
      'badminton': '🏸',
      'chess': '♟️',
      'cricket': '🏏',
      'hockey': '🏒',
      'kabaddi': '🤼‍♂️',
      'pickleball': '🏓',
    };

    return sportIcons[sport] || '🏃';
  };

  // Helper function to get sport name by ID
  const getSportNameById = (sportId) => {
    const sportMap = {
      7011305: 'american football',
      7011803: 'archery',
      7020104: 'badminton',
      7030819: 'chess',
      7031809: 'cricket',
      7061509: 'football',
      7081503: 'hockey',
      7110101: 'kabaddi',
      7161103: 'pickleball',
    };
    
    return sportMap[sportId];
  };

  // Memoized calendar marked dates
  const markedDates = useMemo(() => {
    const tournamentsToMark = selectedSport?.id === 'all' || !selectedSport
      ? tournaments
      : APIService.filterTournamentsBySport(tournaments, selectedSport.id);
    
    const dates = APIService.getTournamentStartDates(tournamentsToMark);
    console.log('📅 Marked dates for calendar:', Object.keys(dates).length, 'dates');
    return dates;
  }, [tournaments, selectedSport]);

  // Render tournament cards
  const renderTournamentCards = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading tournaments...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Text style={styles.retryText}>Pull down to refresh</Text>
        </View>
      );
    }

    if (!filteredTournaments || filteredTournaments.length === 0) {
      const isDateFiltered = !!selectedDate;
      const isSportFiltered = selectedSport && selectedSport.id !== 'all';
      
      let noDataMessage = 'No tournaments found';
      let noDataSubtext = 'Pull down to refresh';
      
      if (isDateFiltered && isSportFiltered) {
        noDataMessage = `No ${getCurrentSportName().toLowerCase()} tournaments on selected date`;
        noDataSubtext = 'Try selecting a different date or sport';
      } else if (isDateFiltered) {
        noDataMessage = 'No tournaments found for selected date';
        noDataSubtext = 'Try selecting a different date';
      } else if (isSportFiltered) {
        noDataMessage = `No ${getCurrentSportName().toLowerCase()} tournaments found`;
        noDataSubtext = 'Try selecting a different sport';
      }
      
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>{noDataMessage}</Text>
          <Text style={styles.noDataSubtext}>{noDataSubtext}</Text>
        </View>
      );
    }

    return filteredTournaments.map((sportData, index) => (
      <View key={`${sportData.sports_id}-${index}`}>
        {sportData.tournaments?.map((tournament, tournamentIndex) => (
          <TournamentCard
            key={`${tournament.id}-${tournamentIndex}`}
            tournament={tournament}
            sportName={sportData.sport_name}
          />
        ))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tournament Calendar</Text>
        <Text style={styles.headerSubtitle}>Aug - Oct 2025</Text>
      </View>

      {/* Sports Filter */}
      <SportsDropdown
        selectedSport={selectedSport}
        onSportChange={handleSportChange}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      >
        {/* Calendar */}
        <CalendarView
          markedDates={markedDates}
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
        />

        {/* Active Filters Indicator */}
        {(selectedDate || (selectedSport && selectedSport.id !== 'all')) && (
          <View style={styles.filtersContainer}>
            {selectedDate && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  📅 {new Date(selectedDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            )}
            {selectedSport && selectedSport.id !== 'all' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {getSportIcon(selectedSport.sports_name || selectedSport.name, selectedSport.sport_id)} {getCurrentSportName()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tournament Cards */}
        <View style={styles.tournamentsList}>
          {renderTournamentCards()}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 35,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E17827',
  },
  filterChipText: {
    fontSize: 12,
    color: '#E17827',
    fontWeight: '500',
  },
  tournamentsList: {
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  retryText: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default TournamentCalendarScreen;