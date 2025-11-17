import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/colors';
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';

const AdminProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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
      if (data) {
        setName(data.name || '');
        setPhone(data.phone || '');
        if (!data.assignedStationId) setLoading(false);
      }
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!profile?.assignedStationId) return;
    const ref = firestoreModule().collection('stations').doc(profile.assignedStationId);
    const unsub = ref.onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        setStation({ 
          id: doc.id, 
          name: data.name || '',
          address: data.address || '',
          location: data.location || '',
          operatingHours: data.operatingHours || '08:00-20:00',
          status: data.status || 'Open',
          contact: data.contact || ''
        });
      }
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [profile?.assignedStationId]);

  const saveProfile = async () => {
    if (!profile) return;
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Enter name and phone');
      return;
    }
    setSaving(true);
    try {
      await firestoreModule().collection('users').doc(profile.uid).set({ 
        name: name.trim(), 
        phone: phone.trim() 
      }, { merge: true });
      Alert.alert('Success', 'Profile updated');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

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
      await firestoreModule().collection('stations').doc(profile.assignedStationId).set(stationData, { merge: true });
      Alert.alert('Success', 'Station updated successfully');
    } catch (e) {
      console.error('Save station error:', e);
      Alert.alert('Error', e.message || 'Failed to save station');
    } finally {
      setSaving(false);
    }
  };

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
      await firestoreModule().collection('users').doc(uid).set({ 
        assignedStationId: ref.id,
        status: 'approved'
      }, { merge: true });
      Alert.alert('Success', 'Station created and linked successfully!');
    } catch (e) {
      console.error('Create station error:', e);
      Alert.alert('Error', e.message || 'Failed to create station');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authModule().signOut();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  if (!profile || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="account" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Profile Information</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="email" size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{authModule().currentUser?.email || 'N/A'}</Text>
          </View>
        </View>

        <TextInput 
          style={styles.input} 
          placeholder="Full Name" 
          placeholderTextColor={colors.textSecondary} 
          value={name} 
          onChangeText={setName} 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Phone Number" 
          placeholderTextColor={colors.textSecondary} 
          value={phone} 
          onChangeText={setPhone} 
          keyboardType="phone-pad"
        />
        
        <TouchableOpacity 
          style={[styles.button, saving && styles.buttonDisabled]} 
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <>
              <Icon name="content-save" size={20} color={colors.buttonText} />
              <Text style={styles.buttonText}>Save Profile</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Station Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="gas-station" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>
            {profile.assignedStationId ? 'Station Configuration' : 'Create Your Station'}
          </Text>
        </View>

        <TextInput 
          style={styles.input} 
          placeholder="Station Name *" 
          placeholderTextColor={colors.textSecondary} 
          value={station.name} 
          onChangeText={v => setStation(s => ({ ...s, name: v }))} 
        />
        
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Address" 
          placeholderTextColor={colors.textSecondary} 
          value={station.address} 
          onChangeText={v => setStation(s => ({ ...s, address: v }))} 
          multiline
          numberOfLines={3}
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Location/Area" 
          placeholderTextColor={colors.textSecondary} 
          value={station.location} 
          onChangeText={v => setStation(s => ({ ...s, location: v }))} 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Operating Hours (e.g., 08:00-20:00)" 
          placeholderTextColor={colors.textSecondary} 
          value={station.operatingHours} 
          onChangeText={v => setStation(s => ({ ...s, operatingHours: v }))} 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Status (Open/Closed/Maintenance)" 
          placeholderTextColor={colors.textSecondary} 
          value={station.status} 
          onChangeText={v => setStation(s => ({ ...s, status: v }))} 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Contact Number" 
          placeholderTextColor={colors.textSecondary} 
          value={station.contact} 
          onChangeText={v => setStation(s => ({ ...s, contact: v }))} 
          keyboardType="phone-pad"
        />

        <TouchableOpacity 
          style={[styles.button, saving && styles.buttonDisabled]} 
          onPress={profile.assignedStationId ? saveStation : createAndLinkStation}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <>
              <Icon name={profile.assignedStationId ? "content-save" : "plus-circle"} size={20} color={colors.buttonText} />
              <Text style={styles.buttonText}>
                {profile.assignedStationId ? 'Save Station' : 'Create & Link Station'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Icon name="logout" size={20} color={colors.buttonText} />
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  section: {
    backgroundColor: colors.secondary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 2,
  },
  input: { 
    backgroundColor: colors.background, 
    color: colors.textPrimary, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary, 
    padding: 14, 
    borderRadius: 10, 
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: colors.buttonText, 
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    padding: 14,
    borderRadius: 10,
    margin: 16,
    marginTop: 8,
  },
});

export default AdminProfileScreen;