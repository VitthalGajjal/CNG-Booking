import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';
import { colors } from '../utils/colors';

const ManagerSignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      const cred = await authModule().createUserWithEmailAndPassword(email.trim(), password);
      const user = cred.user;
      await firestoreModule().collection('users').doc(user.uid).set({
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: 'admin',
        assignedStationId: null,
        createdAt: firestoreModule.FieldValue.serverTimestamp(),
      });
      Alert.alert('Success', 'Manager account created. Await approval and station assignment.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Signup Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Manager Account</Text>
      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Phone (10 digits)" placeholderTextColor={colors.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.buttonText} /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  input: { backgroundColor: colors.cardBackground, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 12 },
  button: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: colors.buttonText, fontWeight: 'bold' },
});

export default ManagerSignupScreen;