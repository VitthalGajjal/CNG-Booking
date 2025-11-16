import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';

const SlotGrid = ({ slots, onSelectSlot, selectedSlot, selectedDate }) => {
  const [expandedHours, setExpandedHours] = useState([]);

  // Helper function to check if a slot time has passed
  const isSlotPast = (slotTime) => {
    // If no selectedDate provided, don't filter past slots
    if (!selectedDate) {
      return false;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const slotDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // If slot is on a future date, it's not past
    if (slotDate > today) {
      return false;
    }
    
    // If slot is on a past date, it's past
    if (slotDate < today) {
      return true;
    }
    
    // For today, check the time
    const slotStartTime = slotTime.split('-')[0]; // "09:00" from "09:00-09:10"
    const [hours, minutes] = slotStartTime.split(':').map(Number);
    
    const slotDateTime = new Date();
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    return slotDateTime < now;
  };

  // Filter out past slots
  const availableSlots = slots.filter(slot => !isSlotPast(slot.time));

  if (!availableSlots || availableSlots.length === 0) {
    return (
      <View style={styles.container}>
        <Icon name="calendar-remove" size={60} color={colors.textSecondary} />
        <Text style={styles.noSlotsText}>No available slots for this day.</Text>
        <Text style={styles.noSlotsSubtext}>All time slots have passed or are booked.</Text>
      </View>
    );
  }

  // Group slots by hour
  const groupSlotsByHour = () => {
    const hourlyGroups = {};
    
    availableSlots.forEach(slot => {
      const hour = slot.time.split(':')[0]; // Extract hour from "HH:mm-HH:mm"
      if (!hourlyGroups[hour]) {
        hourlyGroups[hour] = [];
      }
      hourlyGroups[hour].push(slot);
    });
    
    return hourlyGroups;
  };

  const hourlySlots = groupSlotsByHour();
  const hours = Object.keys(hourlySlots).sort((a, b) => parseInt(a) - parseInt(b));

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

  const getHourAvailability = (slotsInHour) => {
    const available = slotsInHour.filter(s => !s.booked).length;
    const total = slotsInHour.length;
    return { available, total };
  };

  const renderSlot = (slot, index) => {
    const isBooked = slot.booked;
    const isSelected = selectedSlot && selectedSlot.time === slot.time;
    const slotStyle = [
      styles.slotItem,
      isBooked ? styles.bookedSlot : styles.availableSlot,
      isSelected && styles.selectedSlot,
    ];

    return (
      <TouchableOpacity
        key={`${slot.time}-${index}`}
        style={slotStyle}
        onPress={() => !isBooked && onSelectSlot(slot)}
        disabled={isBooked}
      >
        <Text style={[styles.slotText, isBooked && styles.bookedSlotText]}>
          {slot.time}
        </Text>
        {isBooked && (
          <Icon name="lock" size={12} color={colors.error} style={styles.lockIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {hours.map((hour) => {
        const slotsInHour = hourlySlots[hour];
        const isExpanded = expandedHours.includes(hour);
        const { available, total } = getHourAvailability(slotsInHour);
        const allBooked = available === 0;

        return (
          <View key={hour} style={styles.hourCard}>
            <TouchableOpacity
              style={[styles.hourHeader, allBooked && styles.hourHeaderBooked]}
              onPress={() => toggleHourExpansion(hour)}
            >
              <View style={styles.hourHeaderLeft}>
                <Icon 
                  name="clock-outline" 
                  size={24} 
                  color={allBooked ? colors.error : colors.primary} 
                />
                <Text style={[styles.hourLabel, allBooked && styles.hourLabelBooked]}>
                  {getHourLabel(hour)}
                </Text>
              </View>
              
              <View style={styles.hourHeaderRight}>
                <View style={[styles.availabilityBadge, allBooked && styles.availabilityBadgeBooked]}>
                  <Text style={[styles.availabilityText, allBooked && styles.availabilityTextBooked]}>
                    {available}/{total} available
                  </Text>
                </View>
                <Icon 
                  name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={24} 
                  color={allBooked ? colors.error : colors.textPrimary} 
                />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.slotsContainer}>
                <View style={styles.slotsGrid}>
                  {slotsInHour.map((slot, index) => renderSlot(slot, index))}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: colors.secondary,
  },
  hourCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  hourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.cardBackground,
  },
  hourHeaderBooked: {
    backgroundColor: '#ffe6e6',
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
  hourLabelBooked: {
    color: colors.error,
  },
  hourHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityBadge: {
    backgroundColor: colors.availableSlot,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  availabilityBadgeBooked: {
    backgroundColor: colors.bookedSlot,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  availabilityTextBooked: {
    color: colors.error,
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
  slotItem: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  availableSlot: {
    backgroundColor: colors.availableSlot,
  },
  bookedSlot: {
    backgroundColor: colors.bookedSlot,
    borderColor: colors.error,
  },
  selectedSlot: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  slotText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  bookedSlotText: {
    color: colors.error,
    textDecorationLine: 'line-through',
  },
  lockIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  noSlotsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  noSlotsSubtext: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default SlotGrid;

// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { colors } from '../utils/colors';

// const SlotGrid = ({ slots, onSelectSlot, selectedSlot }) => {
//   const [expandedHours, setExpandedHours] = useState([]);

//   if (!slots || slots.length === 0) {
//     return (
//       <View style={styles.container}>
//         <Icon name="calendar-remove" size={60} color={colors.textSecondary} />
//         <Text style={styles.noSlotsText}>No slots available for this day.</Text>
//       </View>
//     );
//   }

//   // Group slots by hour
//   const groupSlotsByHour = () => {
//     const hourlyGroups = {};
    
//     slots.forEach(slot => {
//       const hour = slot.time.split(':')[0]; // Extract hour from "HH:mm-HH:mm"
//       if (!hourlyGroups[hour]) {
//         hourlyGroups[hour] = [];
//       }
//       hourlyGroups[hour].push(slot);
//     });
    
//     return hourlyGroups;
//   };

//   const hourlySlots = groupSlotsByHour();
//   const hours = Object.keys(hourlySlots).sort((a, b) => parseInt(a) - parseInt(b));

//   const toggleHourExpansion = (hour) => {
//     if (expandedHours.includes(hour)) {
//       setExpandedHours(expandedHours.filter(h => h !== hour));
//     } else {
//       setExpandedHours([...expandedHours, hour]);
//     }
//   };

//   const getHourLabel = (hour) => {
//     const hourNum = parseInt(hour);
//     if (hourNum === 0) return '12:00 AM';
//     if (hourNum < 12) return `${hourNum}:00 AM`;
//     if (hourNum === 12) return '12:00 PM';
//     return `${hourNum - 12}:00 PM`;
//   };

//   const getHourAvailability = (slotsInHour) => {
//     const available = slotsInHour.filter(s => !s.booked).length;
//     const total = slotsInHour.length;
//     return { available, total };
//   };

//   const renderSlot = (slot, index) => {
//     const isBooked = slot.booked;
//     const isSelected = selectedSlot && selectedSlot.time === slot.time;
//     const slotStyle = [
//       styles.slotItem,
//       isBooked ? styles.bookedSlot : styles.availableSlot,
//       isSelected && styles.selectedSlot,
//     ];

//     return (
//       <TouchableOpacity
//         key={`${slot.time}-${index}`}
//         style={slotStyle}
//         onPress={() => !isBooked && onSelectSlot(slot)}
//         disabled={isBooked}
//       >
//         <Text style={[styles.slotText, isBooked && styles.bookedSlotText]}>
//           {slot.time}
//         </Text>
//         {isBooked && (
//           <Icon name="lock" size={12} color={colors.error} style={styles.lockIcon} />
//         )}
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {hours.map((hour) => {
//         const slotsInHour = hourlySlots[hour];
//         const isExpanded = expandedHours.includes(hour);
//         const { available, total } = getHourAvailability(slotsInHour);
//         const allBooked = available === 0;

//         return (
//           <View key={hour} style={styles.hourCard}>
//             <TouchableOpacity
//               style={[styles.hourHeader, allBooked && styles.hourHeaderBooked]}
//               onPress={() => toggleHourExpansion(hour)}
//             >
//               <View style={styles.hourHeaderLeft}>
//                 <Icon 
//                   name="clock-outline" 
//                   size={24} 
//                   color={allBooked ? colors.error : colors.primary} 
//                 />
//                 <Text style={[styles.hourLabel, allBooked && styles.hourLabelBooked]}>
//                   {getHourLabel(hour)}
//                 </Text>
//               </View>
              
//               <View style={styles.hourHeaderRight}>
//                 <View style={[styles.availabilityBadge, allBooked && styles.availabilityBadgeBooked]}>
//                   <Text style={[styles.availabilityText, allBooked && styles.availabilityTextBooked]}>
//                     {available}/{total} available
//                   </Text>
//                 </View>
//                 <Icon 
//                   name={isExpanded ? 'chevron-up' : 'chevron-down'} 
//                   size={24} 
//                   color={allBooked ? colors.error : colors.textPrimary} 
//                 />
//               </View>
//             </TouchableOpacity>

//             {isExpanded && (
//               <View style={styles.slotsContainer}>
//                 <View style={styles.slotsGrid}>
//                   {slotsInHour.map((slot, index) => renderSlot(slot, index))}
//                 </View>
//               </View>
//             )}
//           </View>
//         );
//       })}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 10,
//     backgroundColor: colors.secondary,
//   },
//   hourCard: {
//     backgroundColor: colors.cardBackground,
//     borderRadius: 12,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: colors.border,
//     overflow: 'hidden',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   hourHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: colors.cardBackground,
//   },
//   hourHeaderBooked: {
//     backgroundColor: '#ffe6e6',
//   },
//   hourHeaderLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   hourLabel: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//     marginLeft: 12,
//   },
//   hourLabelBooked: {
//     color: colors.error,
//   },
//   hourHeaderRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   availabilityBadge: {
//     backgroundColor: colors.availableSlot,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     marginRight: 8,
//   },
//   availabilityBadgeBooked: {
//     backgroundColor: colors.bookedSlot,
//   },
//   availabilityText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: colors.primary,
//   },
//   availabilityTextBooked: {
//     color: colors.error,
//   },
//   slotsContainer: {
//     padding: 16,
//     backgroundColor: colors.background,
//     borderTopWidth: 1,
//     borderTopColor: colors.border,
//   },
//   slotsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   slotItem: {
//     width: '48%',
//     paddingVertical: 12,
//     paddingHorizontal: 8,
//     borderRadius: 8,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: colors.border,
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   availableSlot: {
//     backgroundColor: colors.availableSlot,
//   },
//   bookedSlot: {
//     backgroundColor: colors.bookedSlot,
//     borderColor: colors.error,
//   },
//   selectedSlot: {
//     backgroundColor: colors.secondary,
//     borderColor: colors.primary,
//     borderWidth: 2,
//   },
//   slotText: {
//     color: colors.textPrimary,
//     fontWeight: 'bold',
//     fontSize: 13,
//   },
//   bookedSlotText: {
//     color: colors.error,
//     textDecorationLine: 'line-through',
//   },
//   lockIcon: {
//     position: 'absolute',
//     top: 4,
//     right: 4,
//   },
//   noSlotsText: {
//     textAlign: 'center',
//     marginTop: 20,
//     fontSize: 16,
//     color: colors.textSecondary,
//   },
// });

// export default SlotGrid;