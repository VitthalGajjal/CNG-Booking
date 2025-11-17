import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestoreModule from '@react-native-firebase/firestore';
import { colors } from '../utils/colors';
import { format } from 'date-fns';

const generateDefaultSlots = () => {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 10) {
      const startH = String(h).padStart(2, '0');
      const startM = String(m).padStart(2, '0');
      let endHNum = h;
      let endMNum = m + 10;
      if (endMNum >= 60) {
        endHNum = h + 1;
        endMNum = 0;
      }
      const endH = String(endHNum).padStart(2, '0');
      const endM = String(endMNum).padStart(2, '0');
      slots.push({ 
        time: `${startH}:${startM}-${endH}:${endM}`, 
        booked: false,
        unavailable: false 
      });
    }
  }
  return slots;
};

const SlotAvailabilityManager = ({ stationId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedHours, setExpandedHours] = useState([]);

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    if (!stationId) return;
    setLoading(true);
    const ref = firestoreModule().collection('stations').doc(stationId).collection('slots').doc(formattedDate);
    ref.get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        setSlots(Array.isArray(data.timeSlots) ? data.timeSlots : generateDefaultSlots());
      } else {
        setSlots(generateDefaultSlots());
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Error loading slots:', error);
      setLoading(false);
    });
  }, [stationId, formattedDate]);

  const toggleAvailability = async (slotIndex) => {
    try {
      const ref = firestoreModule().collection('stations').doc(stationId).collection('slots').doc(formattedDate);
      const doc = await ref.get();
      let current = [];
      if (doc.exists && Array.isArray(doc.data().timeSlots)) {
        current = doc.data().timeSlots;
      } else {
        current = slots.length ? slots : generateDefaultSlots();
      }

      const updated = [...current];
      const prev = updated[slotIndex] || current[slotIndex];
      const isUnavailable = !!prev.unavailable;
      
      if (isUnavailable) {
        updated[slotIndex] = { ...prev, unavailable: false, unavailableReason: '' };
      } else {
        updated[slotIndex] = { ...prev, unavailable: true, unavailableReason: 'Admin blocked' };
      }
      
      await ref.set({ timeSlots: updated, date: formattedDate }, { merge: true });
      setSlots(updated);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Group slots by hour
  const groupSlotsByHour = () => {
    const hourlyGroups = {};
    slots.forEach(slot => {
      const hour = slot.time.split(':')[0];
      if (!hourlyGroups[hour]) {
        hourlyGroups[hour] = [];
      }
      hourlyGroups[hour].push(slot);
    });
    return hourlyGroups;
  };

  const toggleHourExpansion = (hour) => {
    if (expandedHours.includes(hour)) {
      setExpandedHours(expandedHours.filter(h => h !== hour));
    } else {
      setExpandedHours([...expandedHours, hour]);
    }
  };

  const getHourLabel = (hour) => {
    const hourNum = parseInt(hour);
    if (hourNum === 0) return '12:00 AM';
    if (hourNum < 12) return `${hourNum}:00 AM`;
    if (hourNum === 12) return '12:00 PM';
    return `${hourNum - 12}:00 PM`;
  };

  const getHourStats = (slotsInHour) => {
    const booked = slotsInHour.filter(s => s.booked).length;
    const unavailable = slotsInHour.filter(s => s.unavailable).length;
    const available = slotsInHour.length - booked - unavailable;
    return { available, booked, unavailable, total: slotsInHour.length };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Loading slots…</Text>
      </View>
    );
  }

  const hourlySlots = groupSlotsByHour();
  const hours = Object.keys(hourlySlots).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <ScrollView style={styles.container}>
      {/* Date Picker */}
      <TouchableOpacity onPress={() => setOpenDatePicker(true)} style={styles.datePickerButton}>
        <Icon name="calendar" size={20} color={colors.primary} />
        <Text style={styles.datePickerButtonText}>{format(selectedDate, 'EEEE, MMMM do, yyyy')}</Text>
        <Icon name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <DatePicker 
        modal 
        open={openDatePicker} 
        date={selectedDate} 
        onConfirm={(d) => { setSelectedDate(d); setOpenDatePicker(false); }} 
        onCancel={() => setOpenDatePicker(false)} 
        mode="date" 
      />

      {/* Instructions */}
      <View style={styles.instructions}>
        <Icon name="information" size={20} color={colors.primary} />
        <Text style={styles.instructionsText}>
          Tap slots to toggle availability. Gray = unavailable, Green = available
        </Text>
      </View>

      {/* Hourly Slots */}
      {hours.map((hour) => {
        const slotsInHour = hourlySlots[hour];
        const isExpanded = expandedHours.includes(hour);
        const stats = getHourStats(slotsInHour);

        return (
          <View key={hour} style={styles.hourCard}>
            <TouchableOpacity
              style={styles.hourHeader}
              onPress={() => toggleHourExpansion(hour)}
            >
              <View style={styles.hourHeaderLeft}>
                <Icon name="clock-outline" size={24} color={colors.primary} />
                <Text style={styles.hourLabel}>{getHourLabel(hour)}</Text>
              </View>
              
              <View style={styles.hourHeaderRight}>
                <View style={styles.statsBadge}>
                  <Text style={styles.statsText}>
                    {stats.available} available • {stats.unavailable} blocked
                  </Text>
                </View>
                <Icon 
                  name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={24} 
                  color={colors.textPrimary} 
                />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.slotsContainer}>
                <View style={styles.slotsGrid}>
                  {slotsInHour.map((slot, idx) => {
                    const globalIndex = slots.findIndex(s => s.time === slot.time);
                    return (
                      <TouchableOpacity
                        key={slot.time}
                        style={[
                          styles.slot,
                          slot.booked ? styles.bookedSlot : 
                          slot.unavailable ? styles.unavailableSlot : 
                          styles.availableSlot
                        ]}
                        onPress={() => !slot.booked && toggleAvailability(globalIndex)}
                        disabled={slot.booked}
                      >
                        <Text style={[
                          styles.slotText,
                          slot.booked && styles.bookedText,
                          slot.unavailable && styles.unavailableText
                        ]}>
                          {slot.time}
                        </Text>
                        {slot.booked && <Icon name="lock" size={12} color={colors.error} style={styles.lockIcon} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:7,
    backgroundColor: colors.secondary,
  },
  center: { 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 20,
  },
  text: { 
    color: colors.textSecondary, 
    marginTop: 8 
  },
  datePickerButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: colors.cardBackground, 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: colors.border, 
    marginBottom: 16,
  },
  datePickerButtonText: { 
    color: colors.textPrimary, 
    fontWeight: '500', 
    marginLeft: 12, 
    flex: 1 
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderColor:colors.primary,
    borderWidth:1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsText: {
    marginLeft: 12,
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  hourCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  hourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  hourHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 12,
  },
  hourHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  statsText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  slotsContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slot: { 
    width: '48%', 
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  availableSlot: { 
    backgroundColor: colors.availableSlot 
  },
  unavailableSlot: { 
    backgroundColor: colors.bookedSlot 
  },
  bookedSlot: { 
    borderColor: colors.error,
    backgroundColor: '#FFE6E6',
  },
  slotText: { 
    color: colors.textPrimary, 
    fontWeight: '600',
    fontSize: 13,
  },
  bookedText: { 
    color: colors.error,
    textDecorationLine: 'line-through',
  },
  unavailableText: {
    color: colors.textSecondary,
  },
  lockIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default SlotAvailabilityManager;