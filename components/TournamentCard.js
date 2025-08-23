// src/components/TournamentCard.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatDateRange } from '../utils/dateHelpers';
import MatchCard from './MatchCard';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TournamentCard = ({ tournament, sportName, sportsId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rotateAnimation] = useState(new Animated.Value(0));
  const [logoError, setLogoError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const hasMatches = tournament.matches && tournament.matches.length > 0;

  const toggleExpansion = () => {
    if (!hasMatches) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);

    Animated.timing(rotateAnimation, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const renderTournamentLogo = () => {
    const googleDriveUrl =
      'https://drive.google.com/uc?export=view&id=1Dn2LpQowS_qKCtrvYDeOXnpI2ne6wSdo';

    let logoSource;

    if (!logoError) {
      logoSource = { uri: googleDriveUrl };
    } else {
      logoSource = require('../assets/tournament_logo.png');
    }

    return (
      <Image
        source={logoSource}
        style={styles.tournamentLogo}
        resizeMode="contain"
        defaultSource={require('../assets/tournament_logo.png')}
        onError={() => {
          console.warn('Google Drive logo failed, using fallback.');
          setLogoError(true);
        }}
      />
    );
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'international':
        return '#FF6B35';
      case 'national':
        return '#10B981';
      case 'domestic':
        return '#00B0F0';
      default:
        return '#00B0F0';
    }
  };

  const levelColor = getLevelColor(tournament.level);
  const sportColor = '#E17827';
  const dateRange = formatDateRange(tournament.start_date, tournament.end_date);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tournamentCard}
        onPress={toggleExpansion}
        disabled={!hasMatches}
      >
        {/* Header */}
        <View style={styles.tournamentHeader}>
          <View style={styles.logoSection}>{renderTournamentLogo()}</View>

          <View style={styles.tournamentInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.tournamentName} numberOfLines={1}>
                {tournament.name}
              </Text>
              <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
                <Icon 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={20} 
                  color={isFavorite ? "#E17827" : "#D1D5DB"} 
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sportName, { color: sportColor }]}>{sportName}</Text>

            <View style={styles.bottomRow}>
              <Text style={styles.dateRange}>{dateRange}</Text>
              <Text style={[styles.levelText, { color: levelColor }]}>
                {tournament.level || 'Domestic'}
              </Text>
            </View>
          </View>
        </View>

        {/* Expand/Collapse Icon */}
        {hasMatches && (
          <View style={styles.expandContainer}>
            <Animated.View
              style={[styles.expandIcon, { transform: [{ rotate: rotateInterpolate }] }]}
            >
              <Icon name="chevron-down" size={18} color="#E17827" />
            </Animated.View>
          </View>
        )}
      </TouchableOpacity>

      {/* Expandable Matches */}
      {isExpanded && hasMatches && (
        <View style={styles.matchesContainer}>
          {tournament.matches.map((match, index) => (
            <MatchCard 
              key={match.id || index} 
              match={match} 
              sportName={sportName} 
              sportsId={sportsId}
            />
          ))}
        </View>
      )}

      {/* No Matches */}
      {isExpanded && !hasMatches && (
        <View style={styles.noMatchesContainer}>
          <Text style={styles.noMatchesText}>No matches scheduled yet</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB', // Same as screen background
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Light gray separator line
  },
  tournamentCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB', // Same as screen background
  },
  tournamentHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start' 
  },
  logoSection: { 
    marginRight: 12, 
    width: 50, 
    height: 70, // Back to 70 as requested
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  tournamentLogo: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 6 
  },
  tournamentInfo: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 4 
  },
  tournamentName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111827', 
    lineHeight: 20, 
    flex: 1 
  },
  favoriteButton: { 
    padding: 4, 
    marginLeft: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sportName: { 
    fontSize: 13, 
    marginBottom: 4, 
    textTransform: 'capitalize', 
    fontWeight: '500' 
  },
  bottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'baseline' 
  },
  dateRange: { 
    fontSize: 12, 
    color: '#9CA3AF', 
    fontWeight: '400' 
  },
  levelText: { 
    fontSize: 12, 
    fontWeight: '600', 
    textTransform: 'capitalize' 
  },
  expandContainer: { 
    alignItems: 'center', 
    marginTop: 8 
  },
  expandIcon: { 
    padding: 2 
  },
  matchesContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noMatchesContainer: { 
    backgroundColor: '#F9FAFB', 
    padding: 20, 
    alignItems: 'center' 
  },
  noMatchesText: { 
    fontSize: 14, 
    color: '#6B7280', 
    fontStyle: 'italic' 
  },
});

export default TournamentCard;