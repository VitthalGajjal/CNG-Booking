import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ManagerSignupScreen from '../screens/ManagerSignupScreen';
import { colors } from '../utils/colors';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.buttonText,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
      <Stack.Screen name="ManagerSignup" component={ManagerSignupScreen} options={{ title: 'Manager Signup' }} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ title: 'Admin Login' }} />
    </Stack.Navigator>
  );
};

export default AuthStack;