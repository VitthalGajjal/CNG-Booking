// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
// import { auth, firestore } from '../firebaseConfig';
// import { colors } from '../utils/colors';

// const SignupScreen = ({ navigation }) => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [vehicleNo, setVehicleNo] = useState('');
//   const [phone, setPhone] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSignup = async () => {
//     if (!name || !email || !password || !vehicleNo || !phone) {
//       Alert.alert('Error', 'Please fill in all fields.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const userCredential = await auth.createUserWithEmailAndPassword(email, password);
//       const user = userCredential.user;

//       await firestore.collection('users').doc(user.uid).set({
//         uid: user.uid,
//         name,
//         email,
//         vehicleNo,
//         phone,
//         createdAt: firestore.FieldValue.serverTimestamp(),
//       });

//       Alert.alert('Success', 'Account created successfully! You are now logged in.');
//       // App.js will handle navigation to AppTabs
//     } catch (error) {
//       Alert.alert('Signup Error', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.title}>Create Your Account</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Full Name"
//         placeholderTextColor={colors.textSecondary}
//         value={name}
//         onChangeText={setName}
//         autoCapitalize="words"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         placeholderTextColor={colors.textSecondary}
//         value={email}
//         onChangeText={setEmail}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         placeholderTextColor={colors.textSecondary}
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Vehicle Number (e.g., MH12AB1234)"
//         placeholderTextColor={colors.textSecondary}
//         value={vehicleNo}
//         onChangeText={setVehicleNo}
//         autoCapitalize="characters"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Phone Number"
//         placeholderTextColor={colors.textSecondary}
//         value={phone}
//         onChangeText={setPhone}
//         keyboardType="phone-pad"
//       />

//       <TouchableOpacity
//         style={styles.button}
//         onPress={handleSignup}
//         disabled={loading}
//       >
//         {loading ? (
//           <ActivityIndicator color={colors.buttonText} />
//         ) : (
//           <Text style={styles.buttonText}>Sign Up</Text>
//         )}
//       </TouchableOpacity>

//       <TouchableOpacity
//         onPress={() => navigation.goBack()}
//         style={styles.loginPrompt}
//       >
//         <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLink}>Log In</Text></Text>
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: colors.secondary,
//     padding: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: colors.primary,
//     marginBottom: 40,
//   },
//   input: {
//     width: '100%',
//     backgroundColor: colors.cardBackground,
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 15,
//     fontSize: 16,
//     color: colors.textPrimary,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   button: {
//     width: '100%',
//     backgroundColor: colors.primary,
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 10,
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: colors.buttonText,
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   loginPrompt: {
//     marginTop: 20,
//   },
//   loginText: {
//     color: colors.textPrimary,
//     fontSize: 16,
//   },
//   loginLink: {
//     color: colors.primary,
//     fontWeight: 'bold',
//   },
// });

// export default SignupScreen;

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../utils/colors';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password || !vehicleNo.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Basic phone number validation (10 digits)
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await auth().createUserWithEmailAndPassword(email.trim(), password);
      const user = userCredential.user;

      // Store user data in Firestore
      await firestore().collection('users').doc(user.uid).set({
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        vehicleNo: vehicleNo.trim().toUpperCase(),
        phone: phone.trim(),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Account created successfully! You are now logged in.');
      // App.js will handle navigation to AppTabs
    } catch (error) {
      console.error('Signup Error:', error);
      
      // Handle specific error codes
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email is already registered.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password should be at least 6 characters.');
      } else {
        Alert.alert('Signup Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Vehicle Number (e.g., MH12AB1234)"
        placeholderTextColor={colors.textSecondary}
        value={vehicleNo}
        onChangeText={setVehicleNo}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number (10 digits)"
        placeholderTextColor={colors.textSecondary}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.loginPrompt}
      >
        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLink}>Log In</Text></Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginPrompt: {
    marginTop: 20,
  },
  loginText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default SignupScreen;