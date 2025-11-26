

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

//   // const generateDefaultSlots = useCallback(() => {
//   //   const slots = [];
//   //   let startHour = 8;
//   //   let endHour = 20;
    
//   //   if (station && station.operatingHours) {
//   //     try {
//   //       const m = String(station.operatingHours).match(/(\d{2}:\d{2})[^\d]*(\d{2}:\d{2})/);
//   //       if (m) {
//   //         const [sh, sm] = m[1].split(':').map(Number);
//   //         const [eh, em] = m[2].split(':').map(Number);
//   //         startHour = sh;
//   //         endHour = eh;
          
//   //         // Handle 24-hour stations (00:00-23:59)
//   //         if (startHour === 0 && endHour === 23 && em === 59) {
//   //           endHour = 24; // Generate slots until midnight
//   //         }
//   //       }
//   //     } catch (error) {
//   //       console.error('Error parsing operating hours:', error);
//   //     }
//   //   }
    
//   //   // Generate slots
//   //   for (let hour = startHour; hour < endHour; hour++) {
//   //     for (let minute = 0; minute < 60; minute += 10) {
//   //       const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
//   //       let endH = hour;
//   //       let endM = minute + 10;
//   //       if (endM >= 60) {
//   //         endH = hour + 1;
//   //         endM = 0;
//   //       }
        
//   //       const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        
//   //       slots.push({
//   //         time: `${startTime}-${endTime}`,
//   //         booked: false,
//   //         bookedBy: null,
//   //         unavailable: false
//   //       });
//   //     }
//   //   }
    
//   //   console.log(`✅ Generated ${slots.length} slots from ${startHour}:00 to ${endHour}:00`);
//   //   return slots;
//   // }, [station?.operatingHours]);
//   const generateDefaultSlots = useCallback(() => {
//     const slots = [];
//     let startHour = 8;
//     let endHour = 20;
    
//     if (station && station.operatingHours) {
//       try {
//         const m = String(station.operatingHours).match(/(\d{2}:\d{2})[^\d]*(\d{2}:\d{2})/);
//         if (m) {
//           const [sh, sm] = m[1].split(':').map(Number);
//           const [eh, em] = m[2].split(':').map(Number);
//           startHour = sh;
//           endHour = eh;
          
//           // Handle 24-hour stations (00:00-23:59)
//           if (startHour === 0 && endHour === 23 && em === 59) {
//             endHour = 24; // Generate slots until midnight
//           }
//         }
//       } catch (error) {
//         console.error('Error parsing operating hours:', error);
//       }
//     }
    
//     // Generate slots
//     for (let hour = startHour; hour < endHour; hour++) {
//       for (let minute = 0; minute < 60; minute += 10) {
//         const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
//         let endH = hour;
//         let endM = minute + 10;
//         if (endM >= 60) {
//           endH = hour + 1;
//           endM = 0;
//         }
        
//         const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        
//         slots.push({
//           time: `${startTime}-${endTime}`,
//           booked: false,
//           bookedBy: null,
//           unavailable: false
//         });
//       }
//     }
    
//     console.log(`✅ Generated ${slots.length} slots from ${startHour}:00 to ${endHour}:00`);
//     return slots;
//   }, [station]);
  
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
//           console.log(`📥 Fetched ${fetchedSlots.length} slots from Firestore`);
//         } else {
//           fetchedSlots = generateDefaultSlots();
//           await slotsRef.set({ timeSlots: fetchedSlots, date: formattedDate });
//           console.log(`📤 Created new slots document with ${fetchedSlots.length} slots`);
//         }
//       } else {
//         fetchedSlots = generateDefaultSlots();
//         await slotsRef.set({ timeSlots: fetchedSlots, date: formattedDate });
//         console.log(`📤 Created new slots document with ${fetchedSlots.length} slots`);
//       }
//       setAvailableSlots(fetchedSlots);
//     } catch (error) {
//       console.error("❌ Error fetching or generating slots: ", error);
//       Alert.alert("Error", "Failed to load slots. Please try again.");
//       setAvailableSlots(generateDefaultSlots());
//     } finally {
//       setLoadingSlots(false);
//     }
//   }, [station.id, generateDefaultSlots]);

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
//             console.log('🔄 Real-time update: Slots refreshed');
//           } else {
//             setAvailableSlots(generateDefaultSlots());
//           }
//         } else {
//           setAvailableSlots(generateDefaultSlots());
//         }
//         setLoadingSlots(false);
//       },
//       error => {
//         console.error("❌ Error listening to slots: ", error);
//         Alert.alert("Real-time Error", "Failed to get real-time slot updates.");
//         setAvailableSlots(generateDefaultSlots());
//         setLoadingSlots(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [selectedDate, station.id, generateDefaultSlots]);

//   useEffect(() => {
//     fetchSlotsForDate(selectedDate);
//   }, [selectedDate, fetchSlotsForDate]);

//   const handleDateChange = (date) => {
//     setOpenDatePicker(false);
//     setSelectedDate(date);
//   };

//   const confirmBooking = async () => {
//     console.log('=== 🎯 BOOKING ATTEMPT ===');
//     console.log('Selected Slot:', selectedSlot);
//     console.log('User ID:', userId);
//     console.log('Station Status:', station.status);
//     console.log('Station ID:', station.id);
    
//     if (!selectedSlot) {
//       console.log('❌ ERROR: No slot selected');
//       Alert.alert('Selection Required', 'Please select a slot to book.');
//       return;
//     }
    
//     if (!userId) {
//       console.log('❌ ERROR: No user ID');
//       Alert.alert('Authentication Error', 'You must be logged in to book a slot.');
//       return;
//     }

//     if (station.status && String(station.status).toLowerCase() !== 'open') {
//       console.log('❌ ERROR: Station not open');
//       Alert.alert('Station Unavailable', 'Bookings are disabled while the station is not Open.');
//       return;
//     }

//     if (selectedSlot.unavailable) {
//       console.log('❌ ERROR: Slot unavailable');
//       Alert.alert('Unavailable Slot', 'This time slot has been disabled by the station admin.');
//       return;
//     }

//     // Check if slot time has passed
//     const now = new Date();
//     const startTime = selectedSlot.time.split('-')[0];
//     const [slotHour, slotMinute] = startTime.split(':').map(Number);
//     const slotDateTime = new Date(selectedDate);
//     slotDateTime.setHours(slotHour, slotMinute, 0, 0);

//     if (slotDateTime < now) {
//       console.log('❌ ERROR: Slot time has passed');
//       Alert.alert(
//         "Invalid Slot",
//         "You cannot book a time slot that has already passed."
//       );
//       return;
//     }

//     console.log('✅ All validations passed');
    
//     Alert.alert(
//       'Confirm Booking',
//       `Book ${selectedSlot.time} on ${format(selectedDate, 'PPP')} at ${station.name}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Confirm', onPress: processBooking },
//       ]
//     );
//   };

//   const processBooking = async () => {
//     setBookingLoading(true);
//     console.log('⏳ Processing booking...');
    
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
//         console.log('📝 Creating slots document...');
//         await stationSlotsRef.set({ 
//           timeSlots: availableSlots, 
//           date: formattedDate 
//         });
//       } else {
//         const preCheckData = preCheckDoc.data();
//         if (!preCheckData || !Array.isArray(preCheckData.timeSlots) || preCheckData.timeSlots.length === 0) {
//           console.log('📝 Recreating slots document...');
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
//           status: 'pending',
//           timestamp: firestore.FieldValue.serverTimestamp(),
//         });
//       });

//       console.log('✅ Booking successful!');
//       Alert.alert('Success', 'Slot booked successfully!');
//       setSelectedSlot(null);
//       navigation.goBack();
//     } catch (error) {
//       console.error("❌ Error booking slot: ", error);
//       Alert.alert('Booking Failed', error.message || 'Could not book the slot. Please try again.');
//     } finally {
//       setBookingLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         {/* Station Info Card */}
//         <View style={styles.stationCard}>
//           <Icon name="gas-station" size={24} color={colors.primary} />
//           <View style={styles.stationInfo}>
//             <Text style={styles.stationName}>{station.name}</Text>
//             <Text style={styles.stationStatus}>
//               Status: {station.status || 'Open'}
//             </Text>
//           </View>
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
//             selectedDate={selectedDate}
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
//   stationInfo: {
//     marginLeft: 12,
//     flex: 1,
//   },
//   stationName: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//   },
//   stationStatus: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginTop: 4,
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
import Slider from '@react-native-community/slider';
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
  const [cngQuantity, setCngQuantity] = useState(5); // Default 5 kg
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const userId = auth().currentUser?.uid;

  const generateDefaultSlots = useCallback(() => {
    const slots = [];
    let startHour = 8;
    let endHour = 20;
    
    if (station && station.operatingHours) {
      try {
        const m = String(station.operatingHours).match(/(\d{2}:\d{2})[^\d]*(\d{2}:\d{2})/);
        if (m) {
          const [sh, sm] = m[1].split(':').map(Number);
          const [eh, em] = m[2].split(':').map(Number);
          startHour = sh;
          endHour = eh;
          
          // Handle 24-hour stations (00:00-23:59)
          if (startHour === 0 && endHour === 23 && em === 59) {
            endHour = 24; // Generate slots until midnight
          }
        }
      } catch (error) {
        console.error('Error parsing operating hours:', error);
      }
    }
    
    // Generate slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        let endH = hour;
        let endM = minute + 10;
        if (endM >= 60) {
          endH = hour + 1;
          endM = 0;
        }
        
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        
        slots.push({
          time: `${startTime}-${endTime}`,
          booked: false,
          bookedBy: null,
          unavailable: false
        });
      }
    }
    
    console.log(`✅ Generated ${slots.length} slots from ${startHour}:00 to ${endHour}:00`);
    return slots;
  }, [station]);
  
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
          console.log(`🔥 Fetched ${fetchedSlots.length} slots from Firestore`);
        } else {
          fetchedSlots = generateDefaultSlots();
          await slotsRef.set({ timeSlots: fetchedSlots, date: formattedDate });
          console.log(`📤 Created new slots document with ${fetchedSlots.length} slots`);
        }
      } else {
        fetchedSlots = generateDefaultSlots();
        await slotsRef.set({ timeSlots: fetchedSlots, date: formattedDate });
        console.log(`📤 Created new slots document with ${fetchedSlots.length} slots`);
      }
      setAvailableSlots(fetchedSlots);
    } catch (error) {
      console.error("❌ Error fetching or generating slots: ", error);
      Alert.alert("Error", "Failed to load slots. Please try again.");
      setAvailableSlots(generateDefaultSlots());
    } finally {
      setLoadingSlots(false);
    }
  }, [station.id, generateDefaultSlots]);

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
            console.log('🔄 Real-time update: Slots refreshed');
          } else {
            setAvailableSlots(generateDefaultSlots());
          }
        } else {
          setAvailableSlots(generateDefaultSlots());
        }
        setLoadingSlots(false);
      },
      error => {
        console.error("❌ Error listening to slots: ", error);
        Alert.alert("Real-time Error", "Failed to get real-time slot updates.");
        setAvailableSlots(generateDefaultSlots());
        setLoadingSlots(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDate, station.id, generateDefaultSlots]);

  useEffect(() => {
    fetchSlotsForDate(selectedDate);
  }, [selectedDate, fetchSlotsForDate]);

  const handleDateChange = (date) => {
    setOpenDatePicker(false);
    setSelectedDate(date);
  };

  const confirmBooking = async () => {
    console.log('=== 🎯 BOOKING ATTEMPT ===');
    console.log('Selected Slot:', selectedSlot);
    console.log('CNG Quantity:', cngQuantity);
    console.log('User ID:', userId);
    console.log('Station Status:', station.status);
    console.log('Station ID:', station.id);
    
    if (!selectedSlot) {
      console.log('❌ ERROR: No slot selected');
      Alert.alert('Selection Required', 'Please select a slot to book.');
      return;
    }
    
    if (!userId) {
      console.log('❌ ERROR: No user ID');
      Alert.alert('Authentication Error', 'You must be logged in to book a slot.');
      return;
    }

    if (station.status && String(station.status).toLowerCase() !== 'open') {
      console.log('❌ ERROR: Station not open');
      Alert.alert('Station Unavailable', 'Bookings are disabled while the station is not Open.');
      return;
    }

    if (selectedSlot.unavailable) {
      console.log('❌ ERROR: Slot unavailable');
      Alert.alert('Unavailable Slot', 'This time slot has been disabled by the station admin.');
      return;
    }

    // Check if slot time has passed
    const now = new Date();
    const startTime = selectedSlot.time.split('-')[0];
    const [slotHour, slotMinute] = startTime.split(':').map(Number);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(slotHour, slotMinute, 0, 0);

    if (slotDateTime < now) {
      console.log('❌ ERROR: Slot time has passed');
      Alert.alert(
        "Invalid Slot",
        "You cannot book a time slot that has already passed."
      );
      return;
    }

    console.log('✅ All validations passed');
    
    Alert.alert(
      'Confirm Booking',
      `Book ${selectedSlot.time} on ${format(selectedDate, 'PPP')} at ${station.name}?\n\nCNG Quantity: ${cngQuantity} kg`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: processBooking },
      ]
    );
  };

  const processBooking = async () => {
    setBookingLoading(true);
    console.log('⏳ Processing booking...');
    
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
        console.log('📝 Creating slots document...');
        await stationSlotsRef.set({ 
          timeSlots: availableSlots, 
          date: formattedDate 
        });
      } else {
        const preCheckData = preCheckDoc.data();
        if (!preCheckData || !Array.isArray(preCheckData.timeSlots) || preCheckData.timeSlots.length === 0) {
          console.log('📝 Recreating slots document...');
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
          cngQuantity: cngQuantity,
          status: 'pending',
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log('✅ Booking successful!');
      Alert.alert('Success', `Slot booked successfully!\n\nCNG Quantity: ${cngQuantity} kg`);
      setSelectedSlot(null);
      setCngQuantity(5);
      navigation.goBack();
    } catch (error) {
      console.error("❌ Error booking slot: ", error);
      Alert.alert('Booking Failed', error.message || 'Could not book the slot. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Station Info Card */}
        <View style={styles.stationCard}>
          <Icon name="gas-station" size={24} color={colors.primary} />
          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>{station.name}</Text>
            <Text style={styles.stationStatus}>
              Status: {station.status || 'Open'}
            </Text>
          </View>
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

        {/* CNG Quantity Selector */}
        <View style={styles.quantityCard}>
          <View style={styles.quantityHeader}>
            <Icon name="gas-cylinder" size={20} color={colors.primary} />
            <Text style={styles.quantityLabel}>CNG Quantity (kg)</Text>
          </View>
          <View style={styles.quantityDisplay}>
            <Text style={styles.quantityValue}>{cngQuantity}</Text>
            <Text style={styles.quantityUnit}>kg</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={15}
            step={1}
            value={cngQuantity}
            onValueChange={setCngQuantity}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>1 kg</Text>
            <Text style={styles.sliderLabelText}>15 kg</Text>
          </View>
        </View>

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
            selectedDate={selectedDate}
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
  stationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  stationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  stationStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
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
  quantityCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 12,
  },
  quantityValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  quantityUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
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