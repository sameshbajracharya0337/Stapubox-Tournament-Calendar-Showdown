import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL_DEMO = 'https://mockly.me/custom';
const BASE_URL_PROD = 'https://stapubox';

const API_ENDPOINTS = {
  SPORTS_LIST: '/sportslist',
  TOURNAMENTS: '/tournament/demo'
};

const CACHE_KEYS = {
  SPORTS_LIST: 'cached_sports_list',
  TOURNAMENTS: 'cached_tournaments'
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 1 day

class APIService {
  constructor(useDemoAPI = true) {
    this.baseURL = useDemoAPI ? BASE_URL_DEMO : BASE_URL_PROD;
    this.isDemoMode = useDemoAPI;
  }

  async isOnline() {
    const state = await NetInfo.fetch();
    return state.isConnected;
  }

  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  async setCachedData(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`🔗 Making request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📡 Response from ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async fetchSportsList() {
    const cacheKey = CACHE_KEYS.SPORTS_LIST;
    let cachedData = await this.getCachedData(cacheKey);

    if (cachedData) {
      console.log('Using cached sports list');
      return { success: true, data: cachedData };
    }

    try {
      if (!(await this.isOnline())) {
        throw new Error('Offline');
      }
      const response = await this.makeRequest(API_ENDPOINTS.SPORTS_LIST);
      
      let sportsData = [];
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        sportsData = response.data.map(sport => ({
          id: sport.sport_id,
          sport_id: sport.sport_id,
          name: sport.sport_name,
          sports_name: sport.sport_name,
        }));
      } else if (Array.isArray(response.data)) {
        sportsData = response.data;
      } else if (Array.isArray(response)) {
        sportsData = response;
      }

      const sportsWithAll = [
        { id: 'all', sport_id: 'all', name: 'ALL', sports_name: 'ALL' },
        ...sportsData
      ];
      
      await this.setCachedData(cacheKey, sportsWithAll);
      return { success: true, data: sportsWithAll };
    } catch (error) {
      if (cachedData) {
        return { success: true, data: cachedData, fromCache: true };
      }
      return { success: false, error: error.message || 'Failed to fetch sports' };
    }
  }

  async fetchTournaments() {
    const cacheKey = CACHE_KEYS.TOURNAMENTS;
    let cachedData = await this.getCachedData(cacheKey);

    if (cachedData) {
      console.log('Using cached tournaments:', cachedData);
      return { success: true, data: cachedData };
    }

    try {
      if (!(await this.isOnline())) {
        throw new Error('Offline');
      }
      const response = await this.makeRequest(API_ENDPOINTS.TOURNAMENTS);
      
      console.log('Raw API response (tournaments):', JSON.stringify(response, null, 2));
      
      let tournamentsData = [];
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        tournamentsData = response.data
          .filter(sport => {
            if (!sport || !sport.sports_id || !Array.isArray(sport.tournaments)) {
              console.warn('Invalid sport data filtered out:', sport);
              return false;
            }
            return true;
          })
          .map(sport => ({
            ...sport,
            tournaments: sport.tournaments
              .filter(tournament => {
                if (
                  !tournament ||
                  !tournament.id ||
                  !tournament.name ||
                  !tournament.start_date ||
                  typeof tournament !== 'object'
                ) {
                  console.warn('Invalid tournament data filtered out:', tournament);
                  return false;
                }
                return true;
              })
              .map(tournament => ({
                ...tournament,
                matches: Array.isArray(tournament.matches) ? tournament.matches : []
              }))
          }))
          .filter(sport => sport.tournaments.length > 0);
      } else {
        console.warn('Unexpected tournaments response format:', response);
        tournamentsData = [];
      }
      
      if (tournamentsData.length === 0) {
        console.warn('No valid tournaments found in response');
      }
      
      await this.setCachedData(cacheKey, tournamentsData);
      console.log('Processed tournaments:', JSON.stringify(tournamentsData, null, 2));
      return { success: true, data: tournamentsData };
    } catch (error) {
      if (cachedData) {
        console.log('Falling back to cached tournaments due to error:', error.message);
        return { success: true, data: cachedData, fromCache: true };
      }
      console.error('Failed to fetch tournaments:', error);
      return { success: false, error: error.message || 'Failed to fetch tournaments', data: [] };
    }
  }

filterTournamentsBySport(tournaments, sportId) {
  console.log(`Filtering tournaments by sport ID: ${sportId}`);
  
  if (!sportId || sportId === 'all') {
    console.log('Returning all tournaments (no sport filter)');
    return tournaments;
  }
  
  const targetSportId = Number(sportId);
  const filtered = tournaments.filter(sport => {
    if (!sport || !sport.sports_id) {
      console.warn('Invalid sport object in filter:', sport);
      return false;
    }
    return sport.sports_id === targetSportId;
  });
  
  console.log(`Filtered ${filtered.length} sport groups for sport ID ${targetSportId}`);
  return filtered;
}

getTournamentsByDate(tournaments, targetDate) {
  console.log(`Filtering tournaments by date: ${targetDate}`);
  
  if (!targetDate) {
    console.log('No date filter applied');
    return tournaments;
  }
  
  const results = [];
  const targetDateObj = new Date(targetDate);
  
  tournaments.forEach(sport => {
    if (!sport || !Array.isArray(sport.tournaments)) {
      console.warn('Invalid sport data in date filter:', sport);
      return;
    }
    
    const filteredTournaments = sport.tournaments.filter(tournament => {
      if (!tournament || !tournament.start_date) {
        console.warn('Invalid tournament in date filter:', tournament);
        return false;
      }
      try {
        const tournamentDate = new Date(tournament.start_date);
        const tournamentDateString = tournamentDate.toISOString().split('T')[0];
        const targetDateString = targetDateObj.toISOString().split('T')[0];
        return tournamentDateString === targetDateString;
      } catch (error) {
        console.error('Error parsing tournament date:', tournament.start_date, error);
        return false;
      }
    });
    
    if (filteredTournaments.length > 0) {
      results.push({
        ...sport,
        tournaments: filteredTournaments
      });
    }
  });
  
  console.log(`Found ${results.length} sport groups with tournaments on ${targetDate}`);
  return results;
}
  // Filter tournaments by sport
  filterTournamentsBySport(tournaments, sportId) {
    console.log(`🔍 Filtering tournaments by sport: ${sportId}`);
    
    if (!sportId || sportId === 'all') {
      return tournaments;
    }
    
    // Convert sportId to number for comparison since API uses numeric IDs
    const targetSportId = Number(sportId);
    
    const filtered = tournaments.filter(sport => {
      // Compare numeric sport IDs
      return sport.sports_id === targetSportId;
    });
    
    console.log(`📊 Filtered result: ${filtered.length} sport groups found for sport ID ${targetSportId}`);
    return filtered;
  }

  // Get tournaments starting on a specific date
  getTournamentsByDate(tournaments, targetDate) {
    console.log(`📅 Getting tournaments for date: ${targetDate}`);
    
    const results = [];
    const targetDateObj = new Date(targetDate);
    
    tournaments.forEach(sport => {
      const filteredTournaments = sport.tournaments?.filter(tournament => {
        try {
          // Parse the tournament start date
          const tournamentDate = new Date(tournament.start_date);
          
          // Compare dates (ignoring time)
          const tournamentDateString = tournamentDate.toISOString().split('T')[0];
          const targetDateString = targetDateObj.toISOString().split('T')[0];
          
          return tournamentDateString === targetDateString;
        } catch (error) {
          console.error('Error parsing tournament date:', tournament.start_date, error);
          return false;
        }
      });
      
      if (filteredTournaments && filteredTournaments.length > 0) {
        results.push({
          ...sport,
          tournaments: filteredTournaments
        });
      }
    });
    
    console.log(`🏆 Found ${results.length} sport groups with tournaments on ${targetDate}`);
    return results;
  }

  // Get all tournament start dates for calendar highlighting
  getTournamentStartDates(tournaments) {
    console.log('📅 Extracting tournament start dates for calendar...');
    const dates = {};

    tournaments.forEach(sport => {
      if (!sport || !Array.isArray(sport.tournaments)) {
        console.warn('Invalid sport data in getTournamentStartDates:', sport);
        return;
      }

      sport.tournaments.forEach(tournament => {
        if (!tournament || !tournament.start_date) {
          console.warn('Invalid tournament in getTournamentStartDates:', tournament);
          return;
        }
        try {
          const date = new Date(tournament.start_date);
          if (isNaN(date.getTime())) {
            console.warn('Invalid date format for tournament:', tournament.start_date);
            return;
          }
          const dateString = date.toISOString().split('T')[0]; // e.g., "2025-08-20"
          dates[dateString] = {
            marked: true,
            dotColor: '#E17827',
            selected: true,
            selectedColor: '#FFE4E1',
          };
        } catch (error) {
          console.error('Error parsing date in getTournamentStartDates:', tournament.start_date, error);
        }
      });
    });

    console.log('📊 Extracted', Object.keys(dates).length, 'tournament dates:', Object.keys(dates));
    return dates;
  }

  // Convert tournament datetime to IST display format
  formatToIST(dateTimeString) {
    try {
      const date = new Date(dateTimeString);
      
      // Convert to IST (UTC+5:30)
      const istOptions = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      
      return date.toLocaleString('en-IN', istOptions);
    } catch (error) {
      console.error('Error formatting date to IST:', dateTimeString, error);
      return dateTimeString; // Return original if parsing fails
    }
  }

  // Get date range string for tournaments
  getDateRange(startDate, endDate = null) {
    try {
      const start = new Date(startDate);
      const startIST = this.formatToIST(startDate);
      
      if (!endDate) {
        return startIST;
      }
      
      const end = new Date(endDate);
      const endIST = this.formatToIST(endDate);
      
      // If same date, show only start time
      if (start.toDateString() === end.toDateString()) {
        return startIST;
      }
      
      return `${startIST} - ${endIST}`;
    } catch (error) {
      console.error('Error creating date range:', startDate, endDate, error);
      return startDate;
    }
  }
}

export default new APIService(true);