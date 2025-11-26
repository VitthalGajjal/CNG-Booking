
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TextInput, TouchableOpacity, Platform, PermissionsAndroid, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
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
    contact: '',
    latitude: null,
    longitude: null
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchingLocation, setFetchingLocation] = useState(false);

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
          contact: data.contact || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null
        });
      }
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [profile?.assignedStationId]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // Request both FINE and COARSE location for better compatibility
        const fineGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to set station coordinates.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (fineGranted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }
        
        // Fallback to coarse location
        const coarseGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
        
        return coarseGranted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const showLocationSettingsAlert = () => {
    Alert.alert(
      '🔴 GPS is Disabled',
      'Location services are turned OFF on your device.\n\nPlease enable GPS to capture station location:\n\n' +
      '1️⃣ Open Settings\n' +
      '2️⃣ Tap "Location" or "Location Services"\n' +
      '3️⃣ Turn ON Location\n' +
      '4️⃣ Set Location Mode to "High Accuracy"\n' +
      '5️⃣ Come back and try again',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            if (Platform.OS === 'android') {
              Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
            } else {
              Linking.openSettings();
            }
          }
        }
      ]
    );
  };

  const getCurrentLocation = async () => {
    // Step 1: Check permissions
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied', 
        'Location permission is required to capture station location.\n\nPlease grant permission in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    setFetchingLocation(true);

    // Step 2: Try with multiple strategies
    let attempts = 0;
    const maxAttempts = 3;

    const tryGetLocation = (useHighAccuracy = true) => {
      attempts++;
      console.log(`📍 Location attempt ${attempts}/${maxAttempts} (High Accuracy: ${useHighAccuracy})`);

      Geolocation.getCurrentPosition(
        (position) => {
          // SUCCESS
          const { latitude, longitude, accuracy } = position.coords;
          console.log('✅ Location captured:', latitude, longitude, 'Accuracy:', accuracy);
          setStation(s => ({ ...s, latitude, longitude }));
          setFetchingLocation(false);
          Alert.alert(
            '✅ Success!', 
            `Location captured successfully!\n\nLatitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}\nAccuracy: ${accuracy ? accuracy.toFixed(0) + 'm' : 'N/A'}`
          );
        },
        (error) => {
          // ERROR HANDLING
          console.error(`❌ Location error (attempt ${attempts}):`, error);
          
          if (error.code === 2) {
            // GPS/Location services disabled
            setFetchingLocation(false);
            showLocationSettingsAlert();
          } else if (error.code === 3) {
            // TIMEOUT
            if (attempts === 1 && useHighAccuracy) {
              // Try with lower accuracy on second attempt
              console.log('⏱️ Timeout with high accuracy, trying with lower accuracy...');
              setTimeout(() => tryGetLocation(false), 500);
            } else if (attempts < maxAttempts) {
              // Try again with same settings
              console.log('⏱️ Timeout, retrying...');
              setTimeout(() => tryGetLocation(useHighAccuracy), 1000);
            } else {
              // All attempts failed
              setFetchingLocation(false);
              Alert.alert(
                '❌ Location Timeout',
                'Unable to get GPS location. This can happen if:\n\n' +
                '• You\'re indoors (try going outside)\n' +
                '• GPS signal is weak\n' +
                '• Location services just turned on (wait 30 sec)\n\n' +
                'Would you like to enter coordinates manually?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Enter Manually', onPress: manualLocationEntry },
                  { text: 'Try Again', onPress: getCurrentLocation }
                ]
              );
            }
          } else if (error.code === 1) {
            // PERMISSION DENIED
            setFetchingLocation(false);
            Alert.alert(
              'Permission Denied',
              'Location permission was denied. Please enable it in Settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() }
              ]
            );
          } else {
            // OTHER ERRORS
            setFetchingLocation(false);
            Alert.alert(
              '❌ Location Failed',
              `Unable to get location.\n\nError: ${error.message || 'Unknown error'}`,
              [
                { text: 'Enter Manually', onPress: manualLocationEntry },
                { text: 'Try Again', onPress: getCurrentLocation }
              ]
            );
          }
        },
        { 
          enableHighAccuracy: useHighAccuracy,
          timeout: useHighAccuracy ? 30000 : 15000, // 30s for high accuracy, 15s for low
          maximumAge: 10000, // Accept cached location up to 10 seconds old
          distanceFilter: 0,
        }
      );
    };

    // Start first attempt with high accuracy
    tryGetLocation(true);
  };

  // Alternative: Manual Location Entry
  const manualLocationEntry = () => {
    Alert.prompt(
      'Enter Location Manually',
      'Enter coordinates in format: latitude,longitude\nExample: 19.8762,75.3433',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text) => {
            const coords = text?.split(',').map(c => parseFloat(c.trim()));
            if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              if (coords[0] >= -90 && coords[0] <= 90 && coords[1] >= -180 && coords[1] <= 180) {
                setStation(s => ({ ...s, latitude: coords[0], longitude: coords[1] }));
                Alert.alert('Success', 'Location set manually');
              } else {
                Alert.alert('Invalid', 'Coordinates out of range');
              }
            } else {
              Alert.alert('Invalid Format', 'Use format: latitude,longitude');
            }
          }
        }
      ],
      'plain-text',
      '',
      'decimal-pad'
    );
  };

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
    if (!station.latitude || !station.longitude) {
      Alert.alert('Error', 'Please capture station location first');
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
        latitude: station.latitude,
        longitude: station.longitude,
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
    if (!station.latitude || !station.longitude) {
      Alert.alert('Error', 'Please capture station location first');
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
        latitude: station.latitude,
        longitude: station.longitude,
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

        {/* Location Instructions */}
        <View style={styles.warningBox}>
          <Icon name="alert-circle" size={20} color="#FF9800" />
          <Text style={styles.warningText}>
            Important: Enable GPS and go outdoors for best results. First-time GPS lock may take 30-60 seconds.
          </Text>
        </View>

        {/* Location Capture Button */}
        <TouchableOpacity 
          style={[styles.locationButton, fetchingLocation && styles.buttonDisabled]} 
          onPress={getCurrentLocation}
          disabled={fetchingLocation}
        >
          {fetchingLocation ? (
            <>
              <ActivityIndicator color={colors.buttonText} size="small" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>Getting GPS Location...</Text>
            </>
          ) : (
            <>
              <Icon name="crosshairs-gps" size={20} color={colors.buttonText} />
              <Text style={styles.buttonText}>
                {station.latitude && station.longitude ? 'Update GPS Location' : 'Capture GPS Location *'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Manual Entry Option */}
        <TouchableOpacity 
          style={styles.manualButton} 
          onPress={manualLocationEntry}
          disabled={fetchingLocation}
        >
          <Icon name="pencil" size={18} color={colors.primary} />
          <Text style={styles.manualButtonText}>Enter Location Manually</Text>
        </TouchableOpacity>

        {/* Show captured location */}
        {station.latitude && station.longitude && (
          <View style={styles.locationDisplay}>
            <Icon name="check-circle" size={18} color={colors.success} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Coordinates Saved:</Text>
              <Text style={styles.locationText}>
                {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

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
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
    fontWeight: '500',
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 12,
  },
  manualButtonText: {
    color: colors.primary,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
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
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.success,
  },
  locationInfo: {
    marginLeft: 10,
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#155724',
    fontWeight: '600',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#155724',
    fontWeight: 'bold',
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