import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../utils/colors';
import { auth, firestore } from '../../firebaseConfig';

const PendingApprovalScreen = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const ref = firestore.collection('users').doc(uid);
    const unsub = ref.onSnapshot(doc => setProfile(doc.exists ? doc.data() : null));
    return () => unsub && unsub();
  }, []);

  if (!profile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Loading status…</Text>
      </View>
    );
  }

  const assigned = !!profile.assignedStationId;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Pending</Text>
      <Text style={styles.text}>Status: {profile.status || 'pending'}</Text>
      <Text style={styles.text}>{assigned ? 'Station linked' : 'Waiting for station assignment'}</Text>
      <Text style={styles.text}>An administrator will approve and assign your station.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
  text: { color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
});

export default PendingApprovalScreen;