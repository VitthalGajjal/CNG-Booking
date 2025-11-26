import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { colors } from '../../utils/colors';
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';
import SlotAvailabilityManager from '../../components/SlotAvailabilityManager';

const StationManagementScreen = () => {
  const [profile, setProfile] = useState(null);
  // const [station, setStation] = useState({ name: '', address: '', location: '', operatingHours: '', status: 'Open', contact: '' });
  const [station, setStation] = useState({ 
  name: '', 
  address: '', 
  location: '', 
  operatingHours: '08:00-20:00', 
  status: 'Open', 
  contact: '' 
});
const [saving, setSaving] = useState(false);
const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = authModule().currentUser?.uid;
    if (!uid) return;
    const unsub = firestoreModule().collection('users').doc(uid).onSnapshot(doc => {
      const data = doc.exists ? doc.data() : null;
      setProfile(data);
      if (data && !data.assignedStationId) setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!profile?.assignedStationId) return;
    const ref = firestoreModule().collection('stations').doc(profile.assignedStationId);
    const unsub = ref.onSnapshot(doc => {
      if (doc.exists) setStation({ id: doc.id, ...doc.data() });
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [profile?.assignedStationId]);

  // const saveStation = async () => {
  //   if (!profile?.assignedStationId) return;
  //   try {
  //     await firestoreModule().collection('stations').doc(profile.assignedStationId).set(
  //       {
  //         name: station.name,
  //         address: station.address,
  //         location: station.location,
  //         operatingHours: station.operatingHours,
  //         status: station.status,
  //         contact: station.contact,
  //       },
  //       { merge: true }
  //     );
  //     Alert.alert('Saved', 'Station updated.');
  //   } catch (e) {
  //     Alert.alert('Error', e.message);
  //   }
  // };
  const saveStation = async () => {
    if (!profile?.assignedStationId) return;
    
    if (!station.name.trim()) {
      Alert.alert('Error', 'Station name is required');
      return;
    }

    setSaving(true);
    try {
      const stationData = {
        name: station.name.trim(),
        address: station.address.trim(),
        location: station.location.trim(),
        operatingHours: station.operatingHours.trim() || '08:00-20:00',
        status: station.status || 'Open',
        contact: station.contact.trim(),
        updatedAt: firestoreModule.FieldValue.serverTimestamp(),
      };

      await firestoreModule().collection('stations').doc(profile.assignedStationId).set(
        stationData,
        { merge: true }
      );
      
      Alert.alert('Success', 'Station updated successfully.');
    } catch (e) {
      console.error('Save station error:', e);
      Alert.alert('Error', e.message || 'Failed to save station');
    } finally {
      setSaving(false);
    }
  };

  // const createAndLinkStation = async () => {
  //   const uid = authModule().currentUser?.uid;
  //   if (!uid) return;
  //   if (!station.name.trim()) {
  //     Alert.alert('Error', 'Enter station name');
  //     return;
  //   }
  //   try {
  //     const ref = await firestoreModule().collection('stations').add({
  //       name: station.name,
  //       address: station.address,
  //       location: station.location,
  //       operatingHours: station.operatingHours,
  //       status: station.status,
  //       contact: station.contact,
  //     });
  //     await firestoreModule().collection('users').doc(uid).set({ assignedStationId: ref.id }, { merge: true });
  //     Alert.alert('Linked', 'Station created and linked');
  //   } catch (e) {
  //     Alert.alert('Error', e.message);
  //   }
  // };

  const createAndLinkStation = async () => {
    const uid = authModule().currentUser?.uid;
    if (!uid) return;
    
    if (!station.name.trim()) {
      Alert.alert('Error', 'Station name is required');
      return;
    }

    setSaving(true);
    try {
      const stationData = {
        name: station.name.trim(),
        address: station.address.trim(),
        location: station.location.trim(),
        operatingHours: station.operatingHours.trim() || '08:00-20:00',
        status: station.status || 'Open',
        contact: station.contact.trim(),
        createdAt: firestoreModule.FieldValue.serverTimestamp(),
        managerId: uid,
      };

      const ref = await firestoreModule().collection('stations').add(stationData);
      
      await firestoreModule().collection('users').doc(uid).set(
        { 
          assignedStationId: ref.id,
          status: 'approved'
        }, 
        { merge: true }
      );
      
      Alert.alert('Success', 'Station created and linked successfully!');
    } catch (e) {
      console.error('Create station error:', e);
      Alert.alert('Error', e.message || 'Failed to create station');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Loading station…</Text>
      </View>
    );
  }

  if (!profile.assignedStationId) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.title}>Create and Link Station</Text>
        <TextInput style={styles.input} placeholder="Station Name" placeholderTextColor={colors.textSecondary} value={station.name} onChangeText={v => setStation(s => ({ ...s, name: v }))} />
        <TextInput style={styles.input} placeholder="Address" placeholderTextColor={colors.textSecondary} value={station.address} onChangeText={v => setStation(s => ({ ...s, address: v }))} />
        <TextInput style={styles.input} placeholder="Location" placeholderTextColor={colors.textSecondary} value={station.location} onChangeText={v => setStation(s => ({ ...s, location: v }))} />
        <TextInput style={styles.input} placeholder="Operating Hours" placeholderTextColor={colors.textSecondary} value={station.operatingHours} onChangeText={v => setStation(s => ({ ...s, operatingHours: v }))} />
        <TextInput style={styles.input} placeholder="Contact" placeholderTextColor={colors.textSecondary} value={station.contact} onChangeText={v => setStation(s => ({ ...s, contact: v }))} />
        <TextInput style={styles.input} placeholder="Status (Open/Closed/Maintenance)" placeholderTextColor={colors.textSecondary} value={station.status} onChangeText={v => setStation(s => ({ ...s, status: v }))} />
        {/* <TouchableOpacity style={styles.button} onPress={createAndLinkStation}><Text style={styles.buttonText}>Create & Link</Text></TouchableOpacity> */}
        <TouchableOpacity 
          style={[styles.button, saving && styles.buttonDisabled]} 
          onPress={createAndLinkStation}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={styles.buttonText}>Create & Link Station</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Station Configuration</Text>
      <TextInput style={styles.input} placeholder="Station Name" placeholderTextColor={colors.textSecondary} value={station.name} onChangeText={v => setStation(s => ({ ...s, name: v }))} />
      <TextInput style={styles.input} placeholder="Address" placeholderTextColor={colors.textSecondary} value={station.address} onChangeText={v => setStation(s => ({ ...s, address: v }))} />
      <TextInput style={styles.input} placeholder="Location" placeholderTextColor={colors.textSecondary} value={station.location} onChangeText={v => setStation(s => ({ ...s, location: v }))} />
      <TextInput style={styles.input} placeholder="Operating Hours" placeholderTextColor={colors.textSecondary} value={station.operatingHours} onChangeText={v => setStation(s => ({ ...s, operatingHours: v }))} />
      <TextInput style={styles.input} placeholder="Status (Open/Closed/Maintenance)" placeholderTextColor={colors.textSecondary} value={station.status} onChangeText={v => setStation(s => ({ ...s, status: v }))} />
      <TextInput style={styles.input} placeholder="Contact" placeholderTextColor={colors.textSecondary} value={station.contact} onChangeText={v => setStation(s => ({ ...s, contact: v }))} />
      <TouchableOpacity 
        style={[styles.button, saving && styles.buttonDisabled]} 
        onPress={saveStation}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.title}>Slot Availability</Text>
      <SlotAvailabilityManager stationId={profile.assignedStationId} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12, marginTop: 8 },
  text: { color: colors.textSecondary },
  input: { backgroundColor: colors.cardBackground, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 12 },
  button: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: colors.buttonText, fontWeight: 'bold' },
  buttonDisabled: {  opacity: 0.6,},
});

export default StationManagementScreen;