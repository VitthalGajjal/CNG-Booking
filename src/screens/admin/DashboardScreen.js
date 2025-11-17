import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/colors';
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';

const DashboardScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [station, setStation] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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
    
    // Fetch station data
    const stationRef = firestoreModule().collection('stations').doc(profile.assignedStationId);
    const unsubStation = stationRef.onSnapshot(doc => {
      if (doc.exists) {
        setStation({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });
    
    // Fetch recent bookings
    const unsubBookings = firestoreModule()
      .collection('bookings')
      .where('stationId', '==', profile.assignedStationId)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .onSnapshot(
        snap => {
          const data = snap && snap.docs ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : [];
          console.log('📊 Recent bookings:', data.length);
          setRecentBookings(data);
        },
        (error) => {
          console.error('❌ Error fetching bookings:', error);
          setRecentBookings([]);
        }
      );
    
    return () => {
      unsubStation && unsubStation();
      unsubBookings && unsubBookings();
    };
  }, [profile?.assignedStationId]);

  const todayCounts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todays = recentBookings.filter(b => b.date === today);
    const upcoming = recentBookings.filter(b => b.status === 'pending' || b.status === 'accepted');
    return { todayTotal: todays.length, upcomingTotal: upcoming.length };
  }, [recentBookings]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Icon name="account-alert" size={60} color={colors.textSecondary} />
        <Text style={styles.text}>Profile not found</Text>
      </View>
    );
  }

  if (!station) {
    return (
      <View style={styles.center}>
        <Icon name="gas-station-off" size={60} color={colors.textSecondary} />
        <Text style={styles.text}>No station assigned</Text>
        <Text style={styles.subtext}>Create a station in Station Management</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
             
              <Text style={styles.headerTitle}>CNG Booking</Text>
              <View style={styles.placeholder} />
      </View>
      {/* Station Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="gas-station" size={32} color={colors.primary} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>{station.name}</Text>
            <Text style={styles.subtitle}>{station.location}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Icon name="calendar-today" size={24} color={colors.primary} />
            <Text style={styles.metricValue}>{todayCounts.todayTotal}</Text>
            <Text style={styles.metricLabel}>Today's Bookings</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Icon name="calendar-clock" size={24} color={colors.primary} />
            <Text style={styles.metricValue}>{todayCounts.upcomingTotal}</Text>
            <Text style={styles.metricLabel}>Upcoming</Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Icon name="information" size={16} color={colors.textSecondary} />
          <Text style={styles.statusText}>Status: {station.status || 'Open'}</Text>
        </View>
      </View>

      {/* Recent Bookings Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
          <View style={styles.viewAllButton}>
            <Text style={styles.link}>View All</Text>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {recentBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="calendar-blank" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No recent bookings</Text>
          <Text style={styles.emptySubtext}>Bookings will appear here once users start booking slots</Text>
        </View>
      ) : (
        <FlatList
          data={recentBookings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.bookingRow}>
              <View style={styles.bookingInfo}>
                <Icon name="calendar" size={20} color={colors.primary} />
                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingText}>{item.date}</Text>
                  <Text style={styles.bookingSlot}>{item.slot}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'pending':
      return { backgroundColor: '#FFF3CD' };
    case 'accepted':
      return { backgroundColor: '#D1ECF1' };
    case 'rejected':
      return { backgroundColor: '#F8D7DA' };
    case 'Completed':
      return { backgroundColor: '#D4EDDA' };
    default:
      return { backgroundColor: colors.border };
  }
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.secondary, 
    // padding: 16 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    paddingTop:20,
    paddingBottom:20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  card: { 
    backgroundColor: colors.cardBackground, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 10,
    marginHorizontal:20,
    marginTop:10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: colors.textPrimary 
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  text: { 
    color: colors.textSecondary, 
    marginTop: 12,
    fontSize: 16,
  },
  subtext: {
    color: colors.textSecondary,
    marginTop: 8,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricCard: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginVertical: 12 ,
    marginHorizontal:16,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.textPrimary 
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: { 
    color: colors.primary, 
    fontWeight: '600',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  bookingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal:10,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  bookingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingDetails: {
    marginLeft: 12,
  },
  bookingText: { 
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  bookingSlot: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default DashboardScreen;