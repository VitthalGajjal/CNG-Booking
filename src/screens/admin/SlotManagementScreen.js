import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { colors } from '../../utils/colors';
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';
import SlotAvailabilityManager from '../../components/SlotAvailabilityManager';

const SlotManagementScreen = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const uid = authModule().currentUser?.uid;
    if (!uid) return;
    const unsub = firestoreModule().collection('users').doc(uid).onSnapshot(doc => setProfile(doc.exists ? doc.data() : null));
    return () => unsub && unsub();
  }, []);

  if (!profile?.assignedStationId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Link a station to manage slots</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
       
        <Text style={styles.headerTitle}>Slot Management</Text>
        <View style={styles.placeholder} />
      </View>
      <SlotAvailabilityManager stationId={profile.assignedStationId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { color: colors.textSecondary, marginTop: 8 }
});

export default SlotManagementScreen;