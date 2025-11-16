import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

const StationCard = ({ station, onPressBook }) => {
  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.stationName}>{station.name}</Text>
        <Text style={styles.distance}>{station.distance}</Text>
        <Text style={[styles.status, { color: station.status === 'open' ? colors.primary : colors.error }]}>
          {station.status === 'open' ? 'Open' : 'Closed'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.button, station.status !== 'open' && styles.buttonDisabled]}
        onPress={() => onPressBook(station)}
        disabled={station.status !== 'open'}
      >
        <Text style={styles.buttonText}>Book Slot</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  distance: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.7,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StationCard;