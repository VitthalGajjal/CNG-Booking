

// import React, { useState, useEffect, useCallback } from 'react';
// import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import DatePicker from 'react-native-date-picker';
// import { format, addDays } from 'date-fns';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { colors } from '../utils/colors';
// import SlotGrid from '../components/SlotGrid';

// const BookSlotScreen = ({ route, navigation }) => {
//   const { station } = route.params;
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [openDatePicker, setOpenDatePicker] = useState(false);
//   const [availableSlots, setAvailableSlots] = useState([]);
//   const [selectedSlot, setSelectedSlot] = useState(null);
//   const [loadingSlots, setLoadingSlots] = useState(true);
//   const [bookingLoading, setBookingLoading] = useState(false);

//   const userId = auth().currentUser?.uid;

//   const generateDefaultSlots = () => {
//     const slots = [];
//     // Slots from 8 AM to 8 PM, every 10 minutes (6 slots per hour)
//     for (let hour = 8; hour <= 20; hour++) {
//       for (let minute = 0; minute < 60; minute += 10) {
//         const start = format(new Date().setHours(hour, minute, 0, 0), 'HH:mm');
//         const end = format(new Date().setHours(hour, minute + 10, 0, 0), 'HH:mm');
//         slots.push({ time: `${start}-${end}`, booked: false });
//       }
//     }
//     return slots;
//   };

//   const fetchSlotsForDate = useCallback(async (date) => {
//     setLoadingSlots(true);
//     setSelectedSlot(null);
//     const formattedDate = format(date, 'yyyy-MM-dd');
//     const stationRef = firestore().collection('stations').doc(station.id);
//     const slotsRef = stationRef.collection('slots').doc(formattedDate);

//     try {
//       const doc = await slotsRef.get();
//       let fetchedSlots = [];

//       if (doc.exists) {
//         const data = doc.data();
//         if (data && Array.isArray(data.timeSlots) && data.timeSlots.length > 0) {
//           fetchedSlots = data.timeSlots;
//         } else {
//           fetchedSlots = generateDefaultSlots();
//           await slotsRef.set({ timeSlots: fetchedSlots, date: formattedDate });
//         }
//       } else {
//         fetchedSlots = generateDefaultSlots();
//         await slotsRef.set({ timeSlots: fetchedSlots, date: formattedDate });
//       }
//       setAvailableSlots(fetchedSlots);
//     } catch (error) {
//       console.error("Error fetching or generating slots: ", error);
//       Alert.alert("Error", "Failed to load slots. Please try again.");
//       setAvailableSlots(generateDefaultSlots());
//     } finally {
//       setLoadingSlots(false);
//     }
//   }, [station.id]);

//   useEffect(() => {
//     const formattedDate = format(selectedDate, 'yyyy-MM-dd');
//     const slotsRef = firestore()
//       .collection('stations')
//       .doc(station.id)
//       .collection('slots')
//       .doc(formattedDate);

//     const unsubscribe = slotsRef.onSnapshot(
//       docSnapshot => {
//         if (docSnapshot.exists) {
//           const data = docSnapshot.data();
//           if (data && Array.isArray(data.timeSlots) && data.timeSlots.length > 0) {
//             setAvailableSlots(data.timeSlots);
//           } else {
//             setAvailableSlots(generateDefaultSlots());
//           }
//         } else {
//           setAvailableSlots(generateDefaultSlots());
//         }
//         setLoadingSlots(false);
//       },
//       error => {
//         console.error("Error listening to slots: ", error);
//         Alert.alert("Real-time Error", "Failed to get real-time slot updates.");
//         setAvailableSlots(generateDefaultSlots());
//         setLoadingSlots(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [selectedDate, station.id]);

//   useEffect(() => {
//     fetchSlotsForDate(selectedDate);
//   }, [selectedDate, fetchSlotsForDate]);

//   const handleDateChange = (date) => {
//     setOpenDatePicker(false);
//     setSelectedDate(date);
//   };

//   const confirmBooking = async () => {
//     if (!selectedSlot) {
//       Alert.alert('Selection Required', 'Please select a slot to book.');
//       return;
//     }
//     if (!userId) {
//       Alert.alert('Authentication Error', 'You must be logged in to book a slot.');
//       return;
//     }

//     Alert.alert(
//       'Confirm Booking',
//       `Book ${selectedSlot.time} on ${format(selectedDate, 'PPP')} at ${station.name}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Confirm', onPress: processBooking },
//       ],
//       { cancelable: true }
//     );
//   };

//   const processBooking = async () => {
//     setBookingLoading(true);
//     const formattedDate = format(selectedDate, 'yyyy-MM-dd');
//     const stationSlotsRef = firestore()
//       .collection('stations')
//       .doc(station.id)
//       .collection('slots')
//       .doc(formattedDate);
//     const userBookingsRef = firestore().collection('bookings');

//     try {
//       const preCheckDoc = await stationSlotsRef.get();
      
//       if (!preCheckDoc.exists) {
//         await stationSlotsRef.set({ 
//           timeSlots: availableSlots, 
//           date: formattedDate 
//         });
//       } else {
//         const preCheckData = preCheckDoc.data();
//         if (!preCheckData || !Array.isArray(preCheckData.timeSlots) || preCheckData.timeSlots.length === 0) {
//           await stationSlotsRef.set({ 
//             timeSlots: availableSlots, 
//             date: formattedDate 
//           });
//         }
//       }

//       await firestore().runTransaction(async (transaction) => {
//         const slotsDoc = await transaction.get(stationSlotsRef);

//         if (!slotsDoc.exists) {
//           throw new Error("Slots document disappeared. Please try again.");
//         }

//         const data = slotsDoc.data();
        
//         if (!data || !Array.isArray(data.timeSlots) || data.timeSlots.length === 0) {
//           throw new Error("Slots data is invalid. Please refresh and try again.");
//         }

//         const currentSlots = data.timeSlots;
//         const slotIndex = currentSlots.findIndex(s => s && s.time === selectedSlot.time);

//         if (slotIndex === -1) {
//           throw new Error(`Selected slot "${selectedSlot.time}" not found in available slots.`);
//         }
//         if (currentSlots[slotIndex].booked) {
//           throw new Error("This slot has already been booked by another user.");
//         }

//         const updatedSlots = [...currentSlots];
//         updatedSlots[slotIndex] = { 
//           ...updatedSlots[slotIndex], 
//           booked: true, 
//           bookedBy: userId 
//         };

//         transaction.update(stationSlotsRef, { timeSlots: updatedSlots });

//         const newBookingRef = userBookingsRef.doc();
//         transaction.set(newBookingRef, {
//           userId: userId,
//           stationId: station.id,
//           stationName: station.name,
//           date: formattedDate,
//           slot: selectedSlot.time,
//           status: 'Booked',
//           timestamp: firestore.FieldValue.serverTimestamp(),
//         });
//       });

//       Alert.alert('Success', 'Slot booked successfully!');
//       setSelectedSlot(null);
//       navigation.goBack();
//     } catch (error) {
//       console.error("Error booking slot: ", error);
//       Alert.alert('Booking Failed', error.message || 'Could not book the slot. Please try again.');
//     } finally {
//       setBookingLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         {/* Header with Title */}
//         {/* <View style={styles.header}>
//           <Icon name="calendar-clock" size={32} color={colors.primary} />
//           <Text style={styles.title}>Book Your Slot</Text>
//         </View> */}

//         {/* Station Info Card */}
//         <View style={styles.stationCard}>
//           <Icon name="gas-station" size={24} color={colors.primary} />
//           <Text style={styles.stationName}>{station.name}</Text>
//         </View>

//         {/* Date Picker */}
//         <TouchableOpacity onPress={() => setOpenDatePicker(true)} style={styles.datePickerButton}>
//           <Icon name="calendar" size={20} color={colors.primary} />
//           <Text style={styles.datePickerButtonText}>
//             {format(selectedDate, 'EEEE, MMMM do, yyyy')}
//           </Text>
//           <Icon name="chevron-down" size={20} color={colors.textSecondary} />
//         </TouchableOpacity>
        
//         <DatePicker
//           modal
//           open={openDatePicker}
//           date={selectedDate}
//           onConfirm={handleDateChange}
//           onCancel={() => setOpenDatePicker(false)}
//           mode="date"
//           minimumDate={new Date()}
//           maximumDate={addDays(new Date(), 30)}
//         />

//         {/* Section Title */}
//         <Text style={styles.sectionTitle}>Available Slots</Text>
//         <Text style={styles.sectionSubtitle}>Tap on an hour to see available 10-minute slots</Text>
        
//         {/* Slots Grid */}
//         {loadingSlots ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color={colors.primary} />
//             <Text style={styles.loadingText}>Loading slots...</Text>
//           </View>
//         ) : (
//           <SlotGrid
//             slots={availableSlots}
//             onSelectSlot={setSelectedSlot}
//             selectedSlot={selectedSlot}
//           />
//         )}

//         {/* Selected Slot Info */}
//         {selectedSlot && (
//           <View style={styles.selectedSlotCard}>
//             <Icon name="check-circle" size={24} color={colors.primary} />
//             <View style={styles.selectedSlotInfo}>
//               <Text style={styles.selectedSlotLabel}>Selected Slot:</Text>
//               <Text style={styles.selectedSlotTime}>{selectedSlot.time}</Text>
//             </View>
//           </View>
//         )}

//         {/* Confirm Button */}
//         <TouchableOpacity
//           style={[styles.bookButton, (!selectedSlot || bookingLoading) && styles.bookButtonDisabled]}
//           onPress={confirmBooking}
//           disabled={!selectedSlot || bookingLoading}
//         >
//           {bookingLoading ? (
//             <ActivityIndicator color={colors.buttonText} />
//           ) : (
//             <>
//               <Icon name="check-bold" size={20} color={colors.buttonText} />
//               <Text style={styles.bookButtonText}>Confirm Booking</Text>
//             </>
//           )}
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.secondary,
//   },
//   scrollContent: {
//     paddingBottom: 40,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: colors.cardBackground,
//     paddingVertical: 20,
//     paddingHorizontal: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: 'bold',
//     color: colors.primary,
//     marginLeft: 12,
//   },
//   stationCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.cardBackground,
//     margin: 20,
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: colors.border,
//     elevation: 2,
//   },
//   stationName: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//     marginLeft: 12,
//     flex: 1,
//   },
//   datePickerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: colors.cardBackground,
//     marginHorizontal: 20,
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: colors.border,
//     marginBottom: 20,
//   },
//   datePickerButtonText: {
//     flex: 1,
//     fontSize: 16,
//     color: colors.textPrimary,
//     fontWeight: '500',
//     marginLeft: 12,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//     marginHorizontal: 20,
//     marginBottom: 5,
//   },
//   sectionSubtitle: {
//     fontSize: 13,
//     color: colors.textSecondary,
//     marginHorizontal: 20,
//     marginBottom: 15,
//     fontStyle: 'italic',
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 14,
//     color: colors.textSecondary,
//   },
//   selectedSlotCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.secondary,
//     marginHorizontal: 20,
//     marginTop: 10,
//     marginBottom: 20,
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: colors.primary,
//   },
//   selectedSlotInfo: {
//     marginLeft: 12,
//   },
//   selectedSlotLabel: {
//     fontSize: 12,
//     color: colors.textSecondary,
//     fontWeight: '600',
//   },
//   selectedSlotTime: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: colors.primary,
//     marginTop: 2,
//   },
//   bookButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: colors.primary,
//     marginHorizontal: 20,
//     padding: 18,
//     borderRadius: 12,
//     elevation: 3,
//   },
//   bookButtonDisabled: {
//     backgroundColor: colors.textSecondary,
//     opacity: 0.5,
//   },
//   bookButtonText: {
//     color: colors.buttonText,
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },
// });

// export default BookSlotScreen;




import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import { format, addDays } from 'date-fns';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../utils/colors';
import SlotGrid from '../components/SlotGrid';

const BookSlotScreen = ({ route, navigation }) => {
  const { station } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const userId = auth().currentUser?.uid;

  const generateDefaultSlots = () => {
    const slots = [];
    // Slots from 8 AM to 8 PM, every 10 minutes (6 slots per hour)
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const start = format(new Date().setHours(hour, minute, 0, 0), 'HH:mm');
        const end = format(new Date().setHours(hour, minute + 10, 0, 0), 'HH:mm');
        slots.push({ time: `${start}-${end}`, booked: false });
      }
    }
    return slots;
  };

  const fetchSlotsForDate = useCallback(async (date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const stationRef = firestore().collection('stations').doc(station.id);
    const slotsRef = stationRef.collection('slots').doc(formattedDate);

    try {
      const doc = await slotsRef.get();
      let fetchedSlots = [];

      if (doc.exists) {
        const data = doc.data();
        if (data && Array.isArray(data.timeSlots) && data.timeSlots.length > 0) {
          fetchedSlots = data.timeSlots;
        } else {
          fetchedSlots = generateDefaultSlots();
          await slotsRef.set({ timeSlots: fetchedSlots, date: formattedDate });
        }
      } else {
        fetchedSlots = generateDefaultSlots();
        await slotsRef.set({ timeSlots: fetchedSlots, date: formattedDate });
      }
      setAvailableSlots(fetchedSlots);
    } catch (error) {
      console.error("Error fetching or generating slots: ", error);
      Alert.alert("Error", "Failed to load slots. Please try again.");
      setAvailableSlots(generateDefaultSlots());
    } finally {
      setLoadingSlots(false);
    }
  }, [station.id]);

  useEffect(() => {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const slotsRef = firestore()
      .collection('stations')
      .doc(station.id)
      .collection('slots')
      .doc(formattedDate);

    const unsubscribe = slotsRef.onSnapshot(
      docSnapshot => {
        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          if (data && Array.isArray(data.timeSlots) && data.timeSlots.length > 0) {
            setAvailableSlots(data.timeSlots);
          } else {
            setAvailableSlots(generateDefaultSlots());
          }
        } else {
          setAvailableSlots(generateDefaultSlots());
        }
        setLoadingSlots(false);
      },
      error => {
        console.error("Error listening to slots: ", error);
        Alert.alert("Real-time Error", "Failed to get real-time slot updates.");
        setAvailableSlots(generateDefaultSlots());
        setLoadingSlots(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDate, station.id]);

  useEffect(() => {
    fetchSlotsForDate(selectedDate);
  }, [selectedDate, fetchSlotsForDate]);

  const handleDateChange = (date) => {
    setOpenDatePicker(false);
    setSelectedDate(date);
  };

  const confirmBooking = async () => {
  if (!selectedSlot) {
    Alert.alert('Selection Required', 'Please select a slot to book.');
    return;
  }

  if (!userId) {
    Alert.alert('Authentication Error', 'You must be logged in to book a slot.');
    return;
  }

  // =====================================================
  // 🚫****** PREVENT BOOKING PAST TIME SLOTS ******🚫
  // =====================================================

  const now = new Date(); // current date & time

  // Slot format example: "09:00-09:10"
  const startTime = selectedSlot.time.split('-')[0]; // "09:00"
  const [slotHour, slotMinute] = startTime.split(':').map(Number);

  // Create full datetime of the selected slot
  const slotDateTime = new Date(selectedDate);
  slotDateTime.setHours(slotHour, slotMinute, 0, 0);

  // ❗ If slot time < current time → invalid slot
  if (slotDateTime < now) {
    Alert.alert(
      "Invalid Slot",
      "You cannot book a time slot that has already passed."
    );
    return;
  }

  // =====================================================
  // Show Booking Confirmation Popup
  // =====================================================
  Alert.alert(
    'Confirm Booking',
    `Book ${selectedSlot.time} on ${format(selectedDate, 'PPP')} at ${station.name}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: processBooking },
    ]
  );
};


  const processBooking = async () => {
    setBookingLoading(true);
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const stationSlotsRef = firestore()
      .collection('stations')
      .doc(station.id)
      .collection('slots')
      .doc(formattedDate);
    const userBookingsRef = firestore().collection('bookings');

    try {
      const preCheckDoc = await stationSlotsRef.get();
      
      if (!preCheckDoc.exists) {
        await stationSlotsRef.set({ 
          timeSlots: availableSlots, 
          date: formattedDate 
        });
      } else {
        const preCheckData = preCheckDoc.data();
        if (!preCheckData || !Array.isArray(preCheckData.timeSlots) || preCheckData.timeSlots.length === 0) {
          await stationSlotsRef.set({ 
            timeSlots: availableSlots, 
            date: formattedDate 
          });
        }
      }

      await firestore().runTransaction(async (transaction) => {
        const slotsDoc = await transaction.get(stationSlotsRef);

        if (!slotsDoc.exists) {
          throw new Error("Slots document disappeared. Please try again.");
        }

        const data = slotsDoc.data();
        
        if (!data || !Array.isArray(data.timeSlots) || data.timeSlots.length === 0) {
          throw new Error("Slots data is invalid. Please refresh and try again.");
        }

        const currentSlots = data.timeSlots;
        const slotIndex = currentSlots.findIndex(s => s && s.time === selectedSlot.time);

        if (slotIndex === -1) {
          throw new Error(`Selected slot "${selectedSlot.time}" not found in available slots.`);
        }
        if (currentSlots[slotIndex].booked) {
          throw new Error("This slot has already been booked by another user.");
        }

        const updatedSlots = [...currentSlots];
        updatedSlots[slotIndex] = { 
          ...updatedSlots[slotIndex], 
          booked: true, 
          bookedBy: userId 
        };

        transaction.update(stationSlotsRef, { timeSlots: updatedSlots });

        const newBookingRef = userBookingsRef.doc();
        transaction.set(newBookingRef, {
          userId: userId,
          stationId: station.id,
          stationName: station.name,
          date: formattedDate,
          slot: selectedSlot.time,
          status: 'Booked',
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
      });

      Alert.alert('Success', 'Slot booked successfully!');
      setSelectedSlot(null);
      navigation.goBack();
    } catch (error) {
      console.error("Error booking slot: ", error);
      Alert.alert('Booking Failed', error.message || 'Could not book the slot. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Title */}
        {/* <View style={styles.header}>
          <Icon name="calendar-clock" size={32} color={colors.primary} />
          <Text style={styles.title}>Book Your Slot</Text>
        </View> */}

        {/* Station Info Card */}
        <View style={styles.stationCard}>
          <Icon name="gas-station" size={24} color={colors.primary} />
          <Text style={styles.stationName}>{station.name}</Text>
        </View>

        {/* Date Picker */}
        <TouchableOpacity onPress={() => setOpenDatePicker(true)} style={styles.datePickerButton}>
          <Icon name="calendar" size={20} color={colors.primary} />
          <Text style={styles.datePickerButtonText}>
            {format(selectedDate, 'EEEE, MMMM do, yyyy')}
          </Text>
          <Icon name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <DatePicker
          modal
          open={openDatePicker}
          date={selectedDate}
          onConfirm={handleDateChange}
          onCancel={() => setOpenDatePicker(false)}
          mode="date"
          minimumDate={new Date()}
          maximumDate={addDays(new Date(), 30)}
        />

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Available Slots</Text>
        <Text style={styles.sectionSubtitle}>Tap on an hour to see available 10-minute slots</Text>
        
        {/* Slots Grid */}
        {loadingSlots ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading slots...</Text>
          </View>
        ) : (
          <SlotGrid
            slots={availableSlots}
            onSelectSlot={setSelectedSlot}
            selectedSlot={selectedSlot}
          />
        )}

        {/* Selected Slot Info */}
        {selectedSlot && (
          <View style={styles.selectedSlotCard}>
            <Icon name="check-circle" size={24} color={colors.primary} />
            <View style={styles.selectedSlotInfo}>
              <Text style={styles.selectedSlotLabel}>Selected Slot:</Text>
              <Text style={styles.selectedSlotTime}>{selectedSlot.time}</Text>
            </View>
          </View>
        )}

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.bookButton, (!selectedSlot || bookingLoading) && styles.bookButtonDisabled]}
          onPress={confirmBooking}
          disabled={!selectedSlot || bookingLoading}
        >
          {bookingLoading ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <>
              <Icon name="check-bold" size={20} color={colors.buttonText} />
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 12,
  },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  stationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  datePickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginHorizontal: 20,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 20,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectedSlotInfo: {
    marginLeft: 12,
  },
  selectedSlotLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  selectedSlotTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 12,
    elevation: 3,
  },
  bookButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  bookButtonText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default BookSlotScreen;