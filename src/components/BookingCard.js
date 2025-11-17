// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { colors } from '../utils/colors';

// const BookingCard = ({ booking }) => {
//   const getStatusStyle = (status) => {
//     switch (status) {
//       case 'Booked':
//         return { color: colors.primary };
//       case 'Completed':
//         return { color: '#28a745' }; // Bootstrap success green
//       case 'Cancelled':
//         return { color: colors.error };
//       case 'Pending':
//       default:
//         return { color: colors.textSecondary };
//     }
//   };

//   return (
//     <View style={styles.card}>
//       <View style={styles.header}>
//         <Text style={styles.stationName}>{booking.stationName}</Text>
//         <Text style={[styles.status, getStatusStyle(booking.status)]}>{booking.status}</Text>
//       </View>
//       <View style={styles.details}>
//         <Text style={styles.detailText}>Date: <Text style={styles.detailValue}>{booking.date}</Text></Text>
//         <Text style={styles.detailText}>Slot: <Text style={styles.detailValue}>{booking.slot}</Text></Text>
//         {booking.bookingId && (
//           <Text style={styles.detailText}>Booking ID: <Text style={styles.detailValue}>{booking.bookingId}</Text></Text>
//         )}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: colors.cardBackground,
//     borderRadius: 10,
//     padding: 15,
//     marginVertical: 8,
//     marginHorizontal: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   stationName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//     flexShrink: 1, // Allow text to wrap if long
//   },
//   status: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginLeft: 10,
//   },
//   details: {},
//   detailText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginBottom: 4,
//   },
//   detailValue: {
//     color: colors.textPrimary,
//     fontWeight: '500',
//   }
// });

// export default BookingCard;


import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
            } catch (e) {}
          }
        }
      ]
    );
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

      {/* 🚀 Show Cancel Button Only For Current Booking */}
      {(booking.status === 'pending' || booking.status === 'accepted') && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}

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
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
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

  // 🚀 Cancel Button Style
  cancelBtn: {
    marginTop: 12,
    backgroundColor: colors.error,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default BookingCard;
