import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL_PROD = 'https://stapubox.com';
const BASE_URL_DEMO = 'https://mockly.me/custom';

const API_ENDPOINTS = {
  SPORTS_LIST: '/sportslist',
  TOURNAMENTS: '/tournament/demo',
};

const CACHE_KEYS = {
  SPORTS_LIST: 'sports_list',
  TOURNAMENTS: 'tournaments',
};

class APIService {
  constructor(useDemoAPI = false) {
    this.baseURL = useDemoAPI ? BASE_URL_DEMO : BASE_URL_PROD;
    this.isDemoMode = useDemoAPI;
  }

  async clearCache() {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.SPORTS_LIST);
      await AsyncStorage.removeItem(CACHE_KEYS.TOURNAMENTS);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async isOnline() {
    try {
      return true;
    } catch (error) {
      return false;
    }
  }

  async makeRequest(endpoint) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`);
      return response.data;
    } catch (error) {
      throw new Error(`API request failed for ${endpoint}: ${error.message}`);
    }
  }

  async getCachedData(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error retrieving cache for ${key}:`, error);
      return null;
    }
  }

  async setCachedData(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error);
    }
  }

  formatToIST(dateTimeString) {
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', dateTimeString);
        return dateTimeString;
      }
      
      const istOptions = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      
      return date.toLocaleString('en-IN', istOptions);
    } catch (error) {
      console.error('Error formatting date to IST:', dateTimeString, error);
      return dateTimeString;
    }
  }

  getDateRange(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid date range:', startDate, endDate);
        return startDate;
      }
      const options = { month: 'short', day: 'numeric' };
      return `${start.toLocaleDateString('en-IN', options)} - ${end.toLocaleDateString('en-IN', options)}`;
    } catch (error) {
      console.error('Error formatting date range:', startDate, endDate, error);
      return startDate;
    }
  }

  async fetchSportsList() {
    const cacheKey = CACHE_KEYS.SPORTS_LIST;
    let cachedData = await this.getCachedData(cacheKey);

    if (cachedData) {
      return { success: true, data: cachedData };
    }

    try {
      if (!(await this.isOnline())) {
        throw new Error('Offline');
      }
      
      const response = await this.makeRequest(API_ENDPOINTS.SPORTS_LIST);
      
      let sportsData = [];
      if (response.status === 'success' && Array.isArray(response.data)) {
        // Add "ALL" option at the beginning
        sportsData = [
          {
            id: 'all',
            sport_id: 'all',
            sports_name: 'ALL',
            sport_name: 'ALL',
            name: 'ALL'
          }
        ];

        // Process the sports from API
        const processedSports = response.data.filter(sport => {
          if (!sport || !sport.sport_id || !sport.sport_name) {
            console.warn('Invalid sport data filtered out:', sport);
            return false;
          }
          return true;
        }).map(sport => ({
          id: sport.sport_id,
          sport_id: sport.sport_id,
          sports_name: sport.sport_name,
          sport_name: sport.sport_name,
          name: sport.sport_name,
          sport_code: sport.sport_code
        }));

        sportsData = [...sportsData, ...processedSports];
      } else {
        console.warn('Unexpected sports list response format:', response);
        // Return just the "ALL" option if API fails
        sportsData = [{
          id: 'all',
          sport_id: 'all',
          sports_name: 'ALL',
          sport_name: 'ALL',
          name: 'ALL'
        }];
      }
      
      await this.setCachedData(cacheKey, sportsData);
      return { success: true, data: sportsData };
    } catch (error) {
      if (cachedData) {
        return { success: true, data: cachedData, fromCache: true };
      }
      
      // Return "ALL" option as fallback
      const fallbackData = [{
        id: 'all',
        sport_id: 'all',
        sports_name: 'ALL',
        sport_name: 'ALL',
        name: 'ALL'
      }];
      
      return { 
        success: false, 
        error: error.message || 'Failed to fetch sports list', 
        data: fallbackData 
      };
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
        console.log(`Processing ${response.data.length} sports from API response`);
        tournamentsData = response.data
          .filter(sport => {
            if (!sport || !sport.sport_id || !Array.isArray(sport.tournaments)) {
              console.warn('Invalid sport data filtered out:', sport);
              return false;
            }
            console.log(`Sport ${sport.sport_name} has ${sport.tournaments.length} tournaments`);
            return true;
          })
          .map(sport => {
            const mappedSport = {
              sports_id: sport.sport_id,
              sport_id: sport.sport_id,
              sport_name: sport.sport_name,
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
                .map(tournament => {
                  // Debug tournament image URLs
                  console.log(`🏆 Tournament: ${tournament.name}`);
                  console.log(`🖼️ Image URL: ${tournament.tournament_img_url}`);
                  
                  return {
                    ...tournament,
                    matches: Array.isArray(tournament.matches) ? tournament.matches.map(match => ({
                      ...match,
                      start_time: match.start_date || match.start_time,
                      team_a: match.team_a || 'Team A',
                      team_b: match.team_b || 'Team B'
                    })) : []
                  };
                })
            };
            console.log(`Mapped sport ${sport.sport_name} with ${mappedSport.tournaments.length} tournaments`);
            return mappedSport;
          })
          .filter(sport => {
            const keep = sport.tournaments.length > 0;
            if (!keep) {
              console.warn(`Sport ${sport.sport_name} filtered out: no valid tournaments`);
            }
            return keep;
          });
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
    console.log(`🔍 Filtering tournaments by sport: ${sportId}`);
    
    if (!sportId || sportId === 'all') {
      return tournaments;
    }
    
    const targetSportId = String(sportId);
    
    const filtered = tournaments.filter(sport => {
      return String(sport.sports_id) === targetSportId || String(sport.sport_id) === targetSportId;
    });
    
    console.log(`📊 Filtered result: ${filtered.length} sport groups found for sport ID ${targetSportId}`);
    return filtered;
  }

  getTournamentsByDate(tournaments, selectedDate) {
    console.log(`🔍 Filtering tournaments by date: ${selectedDate}`);
    
    const parsedSelectedDate = new Date(selectedDate);
    
    if (isNaN(parsedSelectedDate.getTime())) {
      console.warn('Invalid selected date:', selectedDate);
      return tournaments;
    }
    
    const selectedYear = parsedSelectedDate.getFullYear();
    const selectedMonth = parsedSelectedDate.getMonth();
    const selectedDay = parsedSelectedDate.getDate();
    
    const filtered = tournaments.map(sport => ({
      ...sport,
      tournaments: sport.tournaments.filter(tournament => {
        try {
          const startDate = new Date(tournament.start_date);
          const endDate = new Date(tournament.end_date || tournament.start_date);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('Invalid tournament dates:', tournament.start_date, tournament.end_date);
            return false;
          }
          
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth();
          const startDay = startDate.getDate();
          const endYear = endDate.getFullYear();
          const endMonth = endDate.getMonth();
          const endDay = endDate.getDate();
          
          const isWithinRange =
            (startYear < selectedYear || (startYear === selectedYear && startMonth < selectedMonth) || (startYear === selectedYear && startMonth === selectedMonth && startDay <= selectedDay)) &&
            (endYear > selectedYear || (endYear === selectedYear && endMonth > selectedMonth) || (endYear === selectedYear && endMonth === selectedMonth && endDay >= selectedDay));
          
          return isWithinRange;
        } catch (error) {
          console.warn('Error processing tournament dates:', tournament, error);
          return false;
        }
      })
    })).filter(sport => sport.tournaments.length > 0);
    
    console.log(`📊 Filtered result: ${filtered.length} sport groups found for date ${selectedDate}`);
    return filtered;
  }
}

export default new APIService(false);