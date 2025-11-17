import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/colors';
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';

const BookingsAdminScreen = ({ navigation }) => {  // ← ADD navigation prop
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [reasonModal, setReasonModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const uid = authModule().currentUser?.uid;
    if (!uid) return;
    const unsub = firestoreModule().collection('users').doc(uid).onSnapshot(doc => {
      setProfile(doc.exists ? doc.data() : null);
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!profile?.assignedStationId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const unsub = firestoreModule()
      .collection('bookings')
      .where('stationId', '==', profile.assignedStationId)
      .orderBy('timestamp', 'desc')
      .onSnapshot(
        snap => {
          if (snap && snap.docs) {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setBookings(data);
          } else {
            setBookings([]);
          }
          setLoading(false);
        },
        error => {
          console.error('Error fetching bookings:', error);
          Alert.alert(
            'Index Required',
            'Please create the required database index. Check the console for the link.',
            [{ text: 'OK' }]
          );
          setBookings([]);
          setLoading(false);
        }
      );
    return () => unsub && unsub();
  }, [profile?.assignedStationId]);

  useEffect(() => {
    const ids = Array.from(new Set(bookings.map(b => b.userId).filter(Boolean)));
    if (ids.length === 0) {
      setUserMap({});
      return;
    }
    Promise.all(ids.map(id => firestoreModule().collection('users').doc(id).get()))
      .then(docs => {
        const m = {};
        docs.forEach(doc => {
          if (doc.exists) {
            const d = doc.data();
            m[d.uid] = d.name || d.email || d.uid;
          }
        });
        setUserMap(m);
      })
      .catch(() => {});
  }, [bookings]);

  const acceptBooking = async (booking) => {
    try {
      await firestoreModule().collection('bookings').doc(booking.id).update({ status: 'accepted' });
      Alert.alert('Success', 'Booking accepted');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const rejectBooking = async (booking) => {
    try {
      const ref = firestoreModule().collection('stations').doc(booking.stationId).collection('slots').doc(booking.date);
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
      await firestoreModule().collection('bookings').doc(booking.id).update({ status: 'rejected' });
      Alert.alert('Success', 'Booking rejected and slot freed');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return bookings;
    return bookings.filter(b => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const markCompleted = async (booking) => {
    try {
      await firestoreModule().collection('bookings').doc(booking.id).update({ status: 'Completed' });
      Alert.alert('Success', 'Booking marked as completed');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const openCancel = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setReasonModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      await firestoreModule().collection('bookings').doc(selectedBooking.id).update({ 
        status: 'Cancelled', 
        cancelReason: cancelReason || '' 
      });
      setReasonModal(false);
      Alert.alert('Success', 'Booking cancelled');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Loading bookings…</Text>
      </View>
    );
  }

  if (!profile?.assignedStationId) {
    return (
      <View style={styles.center}>
        <Icon name="gas-station-off" size={60} color={colors.textSecondary} />
        <Text style={styles.text}>No station assigned</Text>
        <Text style={styles.subtext}>Create a station first in Profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      {/* <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Bookings</Text>
        <View style={styles.placeholder} />
      </View> */}

      {/* Filters */}
      <View style={styles.filters}>
        {['All', 'pending', 'accepted', 'rejected', 'Completed', 'Cancelled'].map(status => (
          <TouchableOpacity 
            key={status}
            style={[styles.filterBtn, statusFilter === status && styles.filterActive]} 
            onPress={() => setStatusFilter(status)}
          >
            <Text style={styles.filterText}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Icon name="calendar" size={20} color={colors.primary} />
              <Text style={styles.title}>{item.date} • {item.slot}</Text>
            </View>
            
            <View style={styles.bookingInfo}>
              <View style={styles.infoRow}>
                <Icon name="account" size={16} color={colors.textSecondary} />
                <Text style={styles.text}>User: {userMap[item.userId] || item.userId}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Icon name="information" size={16} color={colors.textSecondary} />
                <View style={[styles.statusPill, getStatusColor(item.status)]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              {(item.status === 'pending' || item.status === 'accepted') && (
                <>
                  <TouchableOpacity style={styles.actionPrimary} onPress={() => acceptBooking(item)}>
                    <Icon name="check" size={16} color={colors.buttonText} />
                    <Text style={styles.actionText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionDanger} onPress={() => rejectBooking(item)}>
                    <Icon name="close" size={16} color={colors.buttonText} />
                    <Text style={styles.actionText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionSuccess} onPress={() => markCompleted(item)}>
                    <Icon name="check-circle" size={16} color={colors.buttonText} />
                    <Text style={styles.actionText}>Complete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="calendar-blank" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              {statusFilter === 'All' 
                ? 'Bookings will appear here once users book slots' 
                : `No ${statusFilter} bookings`}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Cancel Modal */}
      <Modal visible={reasonModal} transparent animationType="slide" onRequestClose={() => setReasonModal(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel Reason</Text>
            <TextInput 
              style={styles.input} 
              value={cancelReason} 
              onChangeText={setCancelReason} 
              placeholder="Enter reason for cancellation" 
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.actionSecondary} onPress={() => setReasonModal(false)}>
                <Text style={styles.actionText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionDanger} onPress={confirmCancel}>
                <Text style={styles.actionText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return { backgroundColor: '#FFF3CD' };
    case 'accepted':
      return { backgroundColor: '#D1ECF1' };
    case 'rejected':
      return { backgroundColor: '#F8D7DA' };
    case 'Completed':
      return { backgroundColor: '#D4EDDA' };
    case 'Cancelled':
      return { backgroundColor: '#F5F5F5' };
    default:
      return { backgroundColor: colors.border };
  }
};

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: colors.background, 
    padding: 20 
  },
  container: { 
    flex: 1, 
    backgroundColor: colors.secondary 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  text: { 
    color: colors.textSecondary, 
    fontSize: 14,
    marginLeft: 8,
  },
  subtext: { 
    color: colors.textSecondary, 
    fontSize: 12, 
    marginTop: 8,
    textAlign: 'center',
  },
  filters: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 8,
    paddingBottom: 8,
  },
  filterBtn: { 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: colors.border, 
    marginRight: 6, 
    marginBottom: 8, 
    backgroundColor: colors.cardBackground 
  },
  filterActive: { 
    borderColor: colors.primary, 
    backgroundColor: colors.primary,
  },
  filterText: { 
    color: colors.textPrimary, 
    fontWeight: '600', 
    fontSize: 12 
  },
  bookingCard: { 
    backgroundColor: colors.cardBackground, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: colors.border, 
    padding: 16, 
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: colors.textPrimary,
    marginLeft: 8,
  },
  bookingInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actions: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionPrimary: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    marginRight: 8, 
    marginBottom: 8 
  },
  actionSecondary: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    marginRight: 8, 
    marginBottom: 8 
  },
  actionDanger: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    marginRight: 8, 
    marginBottom: 8 
  },
  actionSuccess: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    marginRight: 8, 
    marginBottom: 8 
  },
  actionText: { 
    color: colors.buttonText, 
    fontWeight: 'bold', 
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalWrap: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  modalCard: { 
    width: '90%', 
    backgroundColor: colors.cardBackground, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: colors.border, 
    padding: 20 
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  input: { 
    backgroundColor: colors.background, 
    color: colors.textPrimary, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 8, 
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 16,
    gap: 8,
  },
});

export default BookingsAdminScreen;