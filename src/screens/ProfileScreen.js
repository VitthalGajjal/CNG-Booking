
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  ScrollView,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../utils/colors';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const userId = auth().currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await firestore().collection('users').doc(userId).get();
        
        if (userDoc.exists) {
          const data = userDoc.data();
          console.log('Fetched user data:', data);
          
          if (data) {
            setUserData(data);
            setName(data.name || '');
            setVehicleNo(data.vehicleNo || '');
            setPhone(data.phone || '');
          }
        } else {
          console.log('User document does not exist, creating new one');
          const currentUser = auth().currentUser;
          const newUserData = {
            email: currentUser.email,
            name: '',
            vehicleNo: '',
            phone: '',
            createdAt: firestore.FieldValue.serverTimestamp(),
          };
          await firestore().collection('users').doc(userId).set(newUserData);
          setUserData(newUserData);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
        Alert.alert('Error', 'Failed to fetch profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const openEditModal = () => {
    // Pre-fill modal with current data
    setName(userData?.name || '');
    setVehicleNo(userData?.vehicleNo || '');
    setPhone(userData?.phone || '');
    setModalVisible(true);
  };

  const closeEditModal = () => {
    setModalVisible(false);
  };

  const handleUpdateProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    if (!name.trim() || !vehicleNo.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setSaving(true);
    try {
      const updatedData = {
        name: name.trim(),
        vehicleNo: vehicleNo.trim().toUpperCase(),
        phone: phone.trim(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('users').doc(userId).update(updatedData);
      
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Update local state
      setUserData({ ...userData, ...updatedData });
      closeEditModal();
    } catch (error) {
      console.error("Error updating profile: ", error);
      
      if (error.code === 'not-found') {
        try {
          const newData = {
            email: auth().currentUser.email,
            name: name.trim(),
            vehicleNo: vehicleNo.trim().toUpperCase(),
            phone: phone.trim(),
            createdAt: firestore.FieldValue.serverTimestamp(),
          };
          await firestore().collection('users').doc(userId).set(newData);
          setUserData(newData);
          Alert.alert('Success', 'Profile created successfully!');
          closeEditModal();
        } catch (setError) {
          console.error("Error creating profile: ", setError);
          Alert.alert('Error', 'Failed to save profile.');
        }
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
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
              await auth().signOut();
            } catch (error) {
              Alert.alert('Logout Error', error.message);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>My Profile</Text>

        {/* Profile Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{auth().currentUser?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="account" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{userData?.name || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="car" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vehicle Number</Text>
              <Text style={styles.infoValue}>{userData?.vehicleNo || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userData?.phone || 'Not set'}</Text>
            </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
            <Icon name="pencil" size={20} color={colors.buttonText} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer to push logout button to bottom */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Logout Button at Bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color={colors.buttonText} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <Icon name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Vehicle Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., MH12AB1234"
                placeholderTextColor={colors.textSecondary}
                value={vehicleNo}
                onChangeText={setVehicleNo}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.buttonText} />
                ) : (
                  <>
                    <Icon name="content-save" size={20} color={colors.buttonText} />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeEditModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  editButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: colors.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.cardBackground,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    padding: 15,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;