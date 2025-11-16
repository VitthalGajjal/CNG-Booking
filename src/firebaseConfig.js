import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyB2AyUEPsJ5Wk25y4Q6XgXF3V2jPXcsmS8",
  authDomain: "cngslotbooking.firebaseapp.com",
  projectId: "cngslotbooking",
  storageBucket: "cngslotbooking.firebasestorage.app",
  messagingSenderId: "35927392880",
  appId: "1:35927392880:web:948f323795f8dd4fd82ab5",
  measurementId: "G-EL0TXBXE33"
};

// Initialize Firebase only if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();

export default firebase;

