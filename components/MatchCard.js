// src/components/MatchCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { formatDateToIST, getMatchStatusStyle } from '../utils/dateHelpers';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MatchCard = ({ match, sportName, sportsId }) => {
  const statusStyle = getMatchStatusStyle(match.status);
  const matchDateTime = formatDateToIST(match.start_time, 'datetime');

  // Function to get sport icon based on sport name or ID
  const getSportIcon = (sportName, sportId) => {
    // If sport name is provided, use it; otherwise try to match by ID
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
      'pickleball': '🏓', // Using table tennis emoji as closest match
    };

    return sportIcons[sport] || '⚽'; // Default to football if sport not found
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

  const renderTeamLogo = (teamName, logoUrl, defaultImage) => {
    // Always use the provided default images
    return (
      <View style={styles.teamLogoContainer}>
        <Image
          source={defaultImage}
          style={styles.teamLogoImage}
          resizeMode="contain"
        />
      </View>
    );
  };

  const renderTeamLogos = () => {
    return (
      <View style={styles.teamsContainer}>
        {/* Team A */}
        <View style={styles.teamSide}>
          {renderTeamLogo(match.team_a, match.team_a_logo, require('../assets/tournamentlogo1.png'))}
        </View>

        {/* VS Separator */}
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Team B */}
        <View style={styles.teamSide}>
          {renderTeamLogo(match.team_b, match.team_b_logo, require('../assets/tournamentlogo2.png'))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Match Header with Teams and Sport Icon */}
      <View style={styles.matchHeader}>
        <View style={styles.matchTitleContainer}>
          <View style={styles.sportIconContainer}>
            <Text style={styles.sportIcon}>
              {getSportIcon(sportName, sportsId)} {/* Use props here */}
            </Text>
          </View>
          <View style={styles.matchTitleTextContainer}>
            <Text style={styles.matchTitle}>
              {match.team_a || 'Team A'} vs {match.team_b || 'Team B'}
            </Text>
            <Text style={styles.teamCategory}>
              Team Men
            </Text>
          </View>
        </View>
        
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {match.stage || 'Quarter Final'}
          </Text>
        </View>
      </View>

      {/* Team Logos Section */}
      {renderTeamLogos()}

      {/* Match Details Bar */}
      <View style={styles.detailsContainer}>
        {/* Top Row - Date and Time */}
        
        <View style={styles.detailRow}>
          {/* Left-aligned Date */}
          <View style={styles.detailItem}>
            <Icon name="event" size={16} color="#000000" style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {matchDateTime.date}
            </Text>
          </View>

          {/* Right-aligned Time */}
          <View style={[styles.detailItem, { justifyContent: 'flex-end', flex: 0 }]}>
            <Icon name="access-time" size={16} color="#000000" style={[styles.detailIcon, { marginRight: 4 }]} />
            <Text style={styles.detailText}>
              {matchDateTime.time}
            </Text>
          </View>
        </View>


        {/* Bottom Row - Location */}
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="location-on" size={16} color="#000000" style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>
              {match.venue || 'Saket Sports Club'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            {/* Empty view to maintain flex layout */}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  matchTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 5, // Increased margin to push status badge further right
  },
  sportIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sportIcon: {
    fontSize: 16,
  },
  matchTitleTextContainer: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    lineHeight: 12,
  },
  teamCategory: {
    fontSize: 9,
    color: '#E17827',
    fontWeight: '400',
  },
  statusBadge: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF8C42',
    minWidth: 90,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FF6B35',
    textTransform: 'capitalize',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF', // Changed to white background to match reference
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  teamLogoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  vsContainer: {
    backgroundColor: 'transparent', // Removed background
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    // Removed shadow and border styles
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000', // Changed to black color as requested
    letterSpacing: 0.5,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -10,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MatchCard;