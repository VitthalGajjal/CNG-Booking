

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';
import firestore from '@react-native-firebase/firestore';

const BookingCard = ({ booking }) => {
  
  const handleCancel = async () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const ref = firestore()
                .collection('stations')
                .doc(booking.stationId)
                .collection('slots')
                .doc(booking.date);
              const snap = await ref.get();
              if (snap.exists) {
                const data = snap.data();
                const updated = (data.timeSlots || []).map(s => {
                  if (s && s.time === booking.slot && s.booked && s.bookedBy === booking.userId) {
                    return { ...s, booked: false, bookedBy: null };
                  }
                  return s;
                });
                await ref.update({ timeSlots: updated });
              }
              await firestore()
                .collection('bookings')
                .doc(booking.bookingId)
                .update({ status: 'Cancelled' });
            } catch (e) {
              console.error('Cancel booking error:', e);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const handleGetDirections = async () => {
    try {
      // Fetch station details to get coordinates
      const stationDoc = await firestore()
        .collection('stations')
        .doc(booking.stationId)
        .get();

      if (!stationDoc.exists) {
        Alert.alert('Error', 'Station details not found');
        return;
      }

      const stationData = stationDoc.data();
      const { latitude, longitude, name } = stationData;

      if (!latitude || !longitude) {
        Alert.alert('Error', 'Station location not available');
        return;
      }

      // Create Google Maps URL with navigation
      const label = encodeURIComponent(name || 'CNG Station');
      
      // Platform-specific URLs
      const scheme = Platform.select({
        ios: 'comgooglemaps://', // Google Maps app on iOS
        android: 'google.navigation:' // Google Maps navigation on Android
      });
      
      const latLng = `${latitude},${longitude}`;
      
      // Try Google Maps app first
      const appUrl = Platform.select({
        ios: `${scheme}?daddr=${latLng}&directionsmode=driving`,
        android: `${scheme}q=${latLng}` // Opens directly in navigation mode
      });

      // Fallback to web URL if app not installed
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&travelmode=driving`;

      // Try to open in Google Maps app
      const canOpen = await Linking.canOpenURL(appUrl);
      
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        // Open in browser/default maps
        await Linking.openURL(webUrl);
      }

    } catch (error) {
      console.error('Directions error:', error);
      Alert.alert('Error', 'Failed to open directions. Please try again.');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { color: colors.primary };
      case 'accepted':
        return { color: '#28a745' };
      case 'Completed':
        return { color: '#28a745' };
      case 'rejected':
        return { color: colors.error };
      case 'Cancelled':
        return { color: colors.error };
      default:
        return { color: colors.textSecondary };
    }
  };

  return (
    <View style={styles.card}>
      
      <View style={styles.header}>
        <Text style={styles.stationName}>{booking.stationName}</Text>
        <Text style={[styles.status, getStatusStyle(booking.status)]}>
          {booking.status}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>Date: <Text style={styles.detailValue}>{booking.date}</Text></Text>
        <Text style={styles.detailText}>Slot: <Text style={styles.detailValue}>{booking.slot}</Text></Text>
        <Text style={styles.detailText}>Booking ID: <Text style={styles.detailValue}>{booking.bookingId}</Text></Text>
      </View>

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        
        {/* Get Directions Button - Always visible for active bookings */}
        {(booking.status === 'pending' || booking.status === 'accepted') && (
          <TouchableOpacity 
            style={styles.directionsBtn} 
            onPress={handleGetDirections}
          >
            <Icon name="directions" size={18} color="white" />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>
        )}

        {/* Cancel Button - Only for pending/accepted bookings */}
        {(booking.status === 'pending' || booking.status === 'accepted') && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={handleCancel}
          >
            <Icon name="close-circle" size={18} color="white" />
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}

      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Button Container
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },

  // Directions Button Style
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3', // Blue color
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  directionsBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Cancel Button Style
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  cancelBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  }
});

export default BookingCard;