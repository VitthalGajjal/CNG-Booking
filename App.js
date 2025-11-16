// import 'react-native-gesture-handler';
// import React, { useState, useEffect } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { ActivityIndicator, View, StyleSheet } from 'react-native';
// import { auth, firestore } from './src/firebaseConfig';
// import AuthStack from './src/navigation/AuthStack';
// import AppTabs from './src/navigation/AppTabs';
// import BookSlotScreen from './src/screens/BookSlotScreen';
// import { colors } from './src/utils/colors';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const Stack = createNativeStackNavigator();

// const App = () => {
//   const [initializing, setInitializing] = useState(true);
//   const [user, setUser] = useState(null);

//   // Handle user state changes
//   function onAuthStateChanged(user) {
//     setUser(user);
//     if (initializing) setInitializing(false);
//   }

//   useEffect(() => {
//     const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
//     return subscriber; // unsubscribe on unmount
//   }, []);

//   if (initializing) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={colors.primary} />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         screenOptions={{
//           headerStyle: {
//             backgroundColor: colors.primary,
//           },
//           headerTintColor: colors.buttonText,
//           headerTitleStyle: {
//             fontWeight: 'bold',
//           },
//         }}
//       >
//         {user ? (
//           <>
//             <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
//             <Stack.Screen name="BookSlot" component={BookSlotScreen} options={{ title: 'Book Your Slot' }} />
//           </>
//         ) : (
//           <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: colors.background,
//   },
// });

// export default App;

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet, Text, Animated, Image } from 'react-native';
import { auth } from './src/firebaseConfig';
import AuthStack from './src/navigation/AuthStack';
import AppTabs from './src/navigation/AppTabs';
import BookSlotScreen from './src/screens/BookSlotScreen';
import { colors } from './src/utils/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createNativeStackNavigator();

const SplashScreen = () => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    // Animate splash screen elements
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Animated.View
        style={[
          styles.splashContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Replace Icon with Image */}
        <Image
          source={require('./src/utils/images/splashscreen.png')} // Your image path
          style={styles.splashLogo}
          resizeMode="cover"
        />
        <Text style={styles.splashTitle}>CNG Queue</Text>
        <Text style={styles.splashSubtitle}>Smart Slot Booking</Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.splashLoader}
        />
      </Animated.View>
    </View>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    // Hide splash screen after 3 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, []);

  // Show splash screen for 3 seconds
  if (showSplash) {
    return <SplashScreen />;
  }

  // Show loading indicator while checking auth state
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
        {user ? (
          <>
            <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
            <Stack.Screen name="BookSlot" component={BookSlotScreen} options={{ title: 'Book Your Slot' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  splashContent: {
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  splashLogo: {
    width: '100%',
    height: '100%',
  },
  splashTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 20,
    letterSpacing: 1,
  },
  splashSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  splashLoader: {
    marginTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default App;