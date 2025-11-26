

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, SectionList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BookingCard from '../components/BookingCard';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../utils/colors';
import { parse, isBefore } from 'date-fns';

const HistoryScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = auth().currentUser?.uid;

  // Helper function to check if a booking is in the past
  const isBookingPast = (booking) => {
    try {
      const now = new Date();
      // Parse the date string (format: yyyy-MM-dd)
      const bookingDate = parse(booking.date, 'yyyy-MM-dd', new Date());
      
      // Extract slot start time (format: "HH:mm-HH:mm")
      const slotStartTime = booking.slot.split('-')[0];
      const [hours, minutes] = slotStartTime.split(':').map(Number);
      
      // Set the booking datetime
      bookingDate.setHours(hours, minutes, 0, 0);
      
      // Check if booking time has passed
      return isBefore(bookingDate, now);
    } catch (error) {
      console.error('Error parsing booking date:', error);
      return false;
    }
  };

  // Separate bookings into current and past
  const getCategorizedBookings = () => {
    const current = [];
    const past = [];

    bookings.forEach(booking => {
      const pendingOrAccepted = booking.status === 'pending' || booking.status === 'accepted';
      const pastStatus = booking.status === 'Cancelled' || booking.status === 'Completed' || booking.status === 'rejected';
      if (pendingOrAccepted && !isBookingPast(booking)) {
        current.push(booking);
      } else if (isBookingPast(booking) || pastStatus) {
        past.push(booking);
      }
    });

    return { current, past };
  };

  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const bookingsSnapshot = await firestore()
        .collection('bookings')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(50) // Increased limit to show more history
        .get();

      const fetchedBookings = bookingsSnapshot.docs.map(doc => ({
        bookingId: doc.id,
        ...doc.data(),
      }));
      setBookings(fetchedBookings);
    } catch (error) {
      console.error("Error fetching bookings: ", error);
      if (error.code === 'failed-precondition') {
        Alert.alert(
          "Index Required", 
          "Please create the required database index. Check the console for the link."
        );
      } else {
        Alert.alert("Error", "Could not load your bookings. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection('bookings')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(
        querySnapshot => {
          const fetchedBookings = querySnapshot.docs.map(doc => ({
            bookingId: doc.id,
            ...doc.data(),
          }));
          setBookings(fetchedBookings);
          setLoading(false);
        },
        error => {
          console.error("Error listening to bookings: ", error);
          if (error.code === 'failed-precondition') {
            Alert.alert(
              "Index Required",
              "Please create the required database index. Check the error log for the link.",
              [{ text: "OK", onPress: () => setLoading(false) }]
            );
          } else {
            Alert.alert("Real-time Error", "Failed to get real-time booking updates.");
          }
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Your Bookings...</Text>
      </View>
    );
  }

  const { current, past } = getCategorizedBookings();

  // Prepare sections for SectionList
  const sections = [];
  if (current.length > 0) {
    sections.push({
      title: 'Current Bookings',
      data: current,
      icon: 'calendar-clock',
    });
  }
  if (past.length > 0) {
    sections.push({
      title: 'Past Bookings',
      data: past,
      icon: 'history',
    });
  }

  return (
    <View style={styles.container}>
      {/* Header with Title */}
      <View style={styles.header}>
        <Icon name="history" size={32} color={colors.primary} />
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-remove" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyText}>You haven't made any bookings yet!</Text>
          <Text style={styles.emptySubtext}>Book a CNG slot to see it here</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.bookingId}
          renderItem={({ item }) => <BookingCard booking={item} />}
          renderSectionHeader={({ section: { title, icon } }) => (
            <View style={styles.sectionHeader}>
              <Icon name={icon} size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>{title}</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>
                  {title === 'Current Bookings' ? current.length : past.length}
                </Text>
              </View>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="calendar-remove" size={80} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No bookings found!</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 30,
    alignItems: 'center',
  },
  sectionBadgeText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: 'bold',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default HistoryScreen;