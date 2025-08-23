// src/components/SportsDropdown.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import APIService from '../services/api';

const SportsDropdown = ({ onSportChange, selectedSport }) => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadSports();
  }, []);

  // Update search query when selectedSport changes
  useEffect(() => {
    if (selectedSport) {
      if (selectedSport.id === 'all') {
        setSearchQuery('');
      } else {
        const displayName = selectedSport.sports_name || selectedSport.name || '';
        // Capitalize the first letter of each word for consistency
        const capitalizedName = displayName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        setSearchQuery(capitalizedName);
      }
    } else {
      setSearchQuery('');
    }
  }, [selectedSport]);

  // Handle hardware back button press
  useEffect(() => {
    const backAction = () => {
      if (isInputFocused && !isDropdownOpen) {
        // If input is focused but dropdown is not open, blur the input
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
        return true; // Prevent default back action
      }
      if (isDropdownOpen) {
        // If dropdown is open, close it
        setIsDropdownOpen(false);
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isInputFocused, isDropdownOpen]);

  // Handle keyboard dismiss
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // When keyboard is dismissed, blur the TextInput if it's focused
      if (isInputFocused && searchInputRef.current) {
        searchInputRef.current.blur();
      }
    });

    return () => keyboardDidHideListener.remove();
  }, [isInputFocused]);

  const loadSports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await APIService.fetchSportsList();
      
      if (response.success) {
        setSports(response.data);
        // Set default to "ALL" if no sport is selected
        if (!selectedSport && response.data.length > 0) {
          const allOption = response.data.find(sport => sport.id === 'all');
          if (allOption) {
            onSportChange(allOption);
            // Keep search query empty for "ALL" option
            setSearchQuery('');
          }
        }
      } else {
        setError(response.error || 'Failed to load sports');
      }
    } catch (err) {
      setError('Failed to load sports');
      console.error('Sports loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSports = () => {
    if (!searchQuery.trim()) {
      return sports;
    }

    const query = searchQuery.toLowerCase().trim();
    return sports.filter(sport => {
      const sportName = sport.sports_name || sport.name || '';
      return sportName.toLowerCase().startsWith(query);
    });
  };

  const handleSportSelect = (sport) => {
    onSportChange(sport);
    // Only set search query for specific sports, not for "ALL"
    if (sport.id === 'all') {
      setSearchQuery('');
    } else {
      const displayName = sport.sports_name || sport.name || '';
      // Capitalize the first letter of each word for consistency
      const capitalizedName = displayName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      setSearchQuery(capitalizedName);
    }
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    
    // If the user clears the search input, revert to "ALL" selection
    if (text.trim() === '') {
      const allOption = sports.find(sport => sport.id === 'all');
      if (allOption && selectedSport?.id !== 'all') {
        onSportChange(allOption);
      }
    }
  };

  const handleDropdownToggle = () => {
    if (sports.length > 0) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
    // Remove focus from the search input when dropdown closes
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  // Handle input blur
  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  // New function to handle keyboard submit
  const handleSearchSubmit = () => {
    if (sports.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const renderSportItem = ({ item }) => {
    const isSelected = selectedSport?.id === item.id;
    const displayName = item.sports_name || item.name;
    
    return (
      <TouchableOpacity
        style={[
          styles.dropdownItem,
          isSelected && styles.selectedItem,
        ]}
        onPress={() => handleSportSelect(item)}
      >
        <Text style={[
          styles.dropdownItemText,
          isSelected && styles.selectedItemText
        ]}>
          {displayName}
        </Text>
        {item.id === 'all' && (
          <Text style={styles.allOptionSubtext}>Show all sports</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading sports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <TouchableOpacity style={styles.errorContainer} onPress={loadSports}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Text style={styles.retryText}>Tap to retry</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search your sport"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearchSubmit}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.dropdownArrowContainer}
          onPress={handleDropdownToggle}
        >
          <Icon 
            name="keyboard-arrow-down" 
            size={24} 
            color="#9CA3AF" 
            style={[styles.dropdownArrow, isDropdownOpen && styles.dropdownArrowOpen]}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDropdownClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleDropdownClose}
        >
          <View style={styles.modalContent}>
            <View style={styles.dropdownList}>
              {getFilteredSports().length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No sports found</Text>
                  <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                </View>
              ) : (
                <FlatList
                  data={getFilteredSports()}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderSportItem}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#8C8C8C',
    borderRadius: 12,
    paddingRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dropdownArrowContainer: {
    paddingLeft: 8,
  },
  dropdownArrow: {
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    backgroundColor: 'transparent',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  allOptionSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  selectedItem: {
    backgroundColor: '#FFF4F1',
  },
  selectedItemText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  noResultsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  noResultsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SportsDropdown;