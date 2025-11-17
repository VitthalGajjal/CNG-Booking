import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors } from '../utils/colors';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const AdminLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async u => {
      if (!u) return;
      try {
        const doc = await firestore().collection('users').doc(u.uid).get();
        const role = doc.exists ? doc.data().role : null;
        if (role === 'admin') {
          navigation.replace('AdminTabs');
        } else {
          Alert.alert('Access denied', 'Admin only');
          await auth().signOut();
        }
      } catch (e) {
        console.error('Auth check error:', e);
      }
    });
    return () => unsub && unsub();
  }, [navigation]);

  const login = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      const cred = await auth().signInWithEmailAndPassword(email.trim(), password);
      const uid = cred.user.uid;
      const doc = await firestore().collection('users').doc(uid).get();
      const role = doc.exists ? doc.data().role : null;
      if (role !== 'admin') {
        Alert.alert('Access denied', 'Admin only');
        await auth().signOut();
        return;
      }
    } catch (e) {
      console.error('Login error:', e);
      Alert.alert('Login Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Admin Portal</Text>
      <Text style={styles.subtitle}>Sign in to manage stations</Text>

      <Input 
        value={email} 
        onChangeText={setEmail} 
        placeholder="Admin Email" 
        keyboardType="email-address" 
        autoCapitalize="none" 
      />
      <Input 
        value={password} 
        onChangeText={setPassword} 
        placeholder="Password" 
        secureTextEntry 
        style={{ marginTop: 12 }} 
      />
      <Button 
        title={loading ? 'Logging in…' : 'Login'} 
        onPress={login} 
        style={{ marginTop: 16 }} 
        disabled={loading}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 24, 
    backgroundColor: colors.secondary 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingOverlay: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default AdminLoginScreen;