import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';

const StationCard = ({ station, onPressBook }) => {
  // Safely get station status, default to 'Open' if not set
  const stationStatus = station?.status || 'Open';
  const isOpen = stationStatus.toLowerCase() === 'open';
  
  const statusColor = isOpen ? colors.success : colors.error;
  const statusText = stationStatus.charAt(0).toUpperCase() + stationStatus.slice(1);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name="gas-station" size={28} color={colors.primary} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {station.address && (
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{station.address}</Text>
          </View>
        )}
        
        {station.location && (
          <View style={styles.infoRow}>
            <Icon name="map" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{station.location}</Text>
          </View>
        )}
        
        {station.operatingHours && (
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{station.operatingHours}</Text>
          </View>
        )}
        
        {station.contact && (
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{station.contact}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.bookButton, !isOpen && styles.bookButtonDisabled]}
        onPress={() => isOpen && onPressBook(station)}
        disabled={!isOpen}
      >
        <Icon 
          name={isOpen ? "calendar-check" : "cancel"} 
          size={20} 
          color={isOpen ? colors.buttonText : colors.textSecondary} 
        />
        <Text style={[styles.bookButtonText, !isOpen && styles.bookButtonTextDisabled]}>
          {isOpen ? 'Book Slot' : 'Unavailable'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  stationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  bookButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bookButtonTextDisabled: {
    color: colors.textSecondary,
  },
});

export default StationCard;