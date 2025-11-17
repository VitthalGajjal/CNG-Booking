

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StationCard from '../components/StationCard';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../utils/colors';
// import { dummyStations } from '../data/dummyStations'; // Ensure this path is correct

const HomeScreen = ({ navigation }) => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStations = useCallback(async () => {
    try {
      const stationsSnapshot = await firestore().collection('stations').get();
      const fetchedStations = stationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (fetchedStations.length === 0) {
        console.log('Firestore stations collection is empty. Seeding with dummy data...');
        
        const batch = firestore().batch();
        // dummyStations.forEach(station => {
        //   // Ensure dummy station IDs are used or generate new ones if needed
        //   const stationRef = firestore().collection('stations').doc(station.id || firestore().collection('stations').doc().id);
        //   batch.set(stationRef, station);
        // });
        
        await batch.commit();
        
        const resyncedStationsSnapshot = await firestore().collection('stations').get();
        const resyncedStations = resyncedStationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStations(resyncedStations);
        setFilteredStations(resyncedStations);
      } else {
        setStations(fetchedStations);
        setFilteredStations(fetchedStations);
      }
    } catch (error) {
      console.error("Error fetching stations: ", error);
      
      if (error.code === 'permission-denied') {
        Alert.alert(
          "Permission Error",
          "Unable to write station data. Please check Firestore security rules or your internet connection.",
          [
            {
              text: "Use Dummy Data (Offline Mode)",
              onPress: () => {
                // setStations(dummyStations);
                // setFilteredStations(dummyStations);
                setLoading(false);
                setRefreshing(false);
              }
            },
            {
                text: "Retry",
                onPress: () => {
                    setLoading(true); // Indicate loading again for retry
                    fetchStations();
                },
                style: "cancel"
            }
          ]
        );
      } else {
        // Generic error for network issues or other unexpected errors
        Alert.alert("Error", "Could not load stations. Please check your internet connection and try again later.");
        // Fallback to dummy data if network issue prevents initial load
        // setStations(dummyStations);
        // setFilteredStations(dummyStations);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Depend on nothing for a one-time fetch or rely on onRefresh

  useEffect(() => {
    fetchStations();
    // Potentially add a listener here for real-time updates if desired
    // const subscriber = firestore().collection('stations').onSnapshot(querySnapshot => {
    //   const fetchedStations = querySnapshot.docs.map(doc => ({
    //     id: doc.id,
    //     ...doc.data(),
    //   }));
    //   setStations(fetchedStations);
    //   // Re-apply filter if search query is active
    //   if (searchQuery.trim() !== '') {
    //     const lowerCaseSearchQuery = searchQuery.toLowerCase();
    //     const filtered = fetchedStations.filter(station => {
    //       const nameMatches = station.name && String(station.name).toLowerCase().includes(lowerCaseSearchQuery);
    //       const locationMatches = station.location && String(station.location).toLowerCase().includes(lowerCaseSearchQuery);
    //       return nameMatches || locationMatches;
    //     });
    //     setFilteredStations(filtered);
    //   } else {
    //     setFilteredStations(fetchedStations);
    //   }
    // });
    // return () => subscriber(); // Unsubscribe on unmount
  }, [fetchStations]);


  // Filter stations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStations(stations);
    } else {
      const lowerCaseSearchQuery = searchQuery.toLowerCase(); // Cache this to avoid repeated calls

      const filtered = stations.filter(station => {
        // Add defensive checks for 'name' and 'location' properties
        // Ensure they are strings before calling toLowerCase()
        const nameMatches = station.name && String(station.name).toLowerCase().includes(lowerCaseSearchQuery);
        const locationMatches = station.location && String(station.location).toLowerCase().includes(lowerCaseSearchQuery);
        
        return nameMatches || locationMatches;
      });
      setFilteredStations(filtered);
    }
  }, [searchQuery, stations]); // Re-run when searchQuery or stations change

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery(''); // Clear search on refresh
    fetchStations();
  };

  const handleBookSlot = (station) => {
    navigation.navigate('BookSlot', { station });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Stations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CNG Stations</Text>
        
        {/* CNG Station Image/Icon */}
        {/* <View style={styles.imageContainer}> */}
          {/* Using Image component now as per your code */}
          <Image
            source={require('../utils/images/homescreen.png')} // Ensure this path is correct
            style={styles.image}
            resizeMode="contain" // Changed to contain to prevent cropping issues
          />
        {/* </View> */}
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations by name or location..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Icon 
              name="close-circle" 
              size={24} 
              color={colors.textSecondary} 
              style={styles.clearIcon}
              onPress={() => setSearchQuery('')}
            />
          )}
        </View>
        
        {/* Results Count */}
        {searchQuery.length > 0 && (
          <Text style={styles.resultsText}>
            {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} found
          </Text>
        )}
      </View>

      {/* Stations List */}
      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StationCard station={item} onPressBook={handleBookSlot} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="map-marker-off" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No stations match your search' : 'No CNG stations found'}
            </Text>
            {searchQuery && (
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            )}
            {!searchQuery && !loading && ( // Add a refresh option if no search and no stations
                 <Text style={styles.emptySubtext}>Pull down to refresh or check your connection.</Text>
            )}
          </View>
        }
        contentContainerStyle={filteredStations.length === 0 ? styles.emptyListContent : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.secondary,
    paddingTop: 20,
    paddingBottom: 15,
    // paddingHorizontal: 20,
    // borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    // marginBottom: 15,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom: 15,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300, // Adjusted height slightly for better fit
    // borderRadius: 10, // Added slight border radius to the image
  },
  fuelIcon: { // Kept if you decide to use it later, currently commented out in JSX
    position: 'absolute',
    bottom: 5,
    right: '35%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal:15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0, // Remove default padding to align with icon better
  },
  clearIcon: {
    marginLeft: 10,
  },
  resultsText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyListContent: {
    flexGrow: 1, // Ensures empty list content is centered vertically
    justifyContent: 'center',
  },
});

export default HomeScreen;