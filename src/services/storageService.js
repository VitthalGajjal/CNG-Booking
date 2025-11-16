import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'CNG_USERS';
const BOOKINGS_KEY = 'CNG_BOOKINGS';
const CURRENT_USER_KEY = 'CNG_CURRENT_USER';

export const registerUser = async (userData) => {
  try {
    const users = await AsyncStorage.getItem(USERS_KEY);
    const usersList = users ? JSON.parse(users) : [];
    
    const userExists = usersList.find(u => u.vehicleNumber === userData.vehicleNumber);
    if (userExists) {
      throw new Error('Vehicle number already registered');
    }
    
    usersList.push(userData);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(usersList));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (vehicleNumber, password) => {
  try {
    const users = await AsyncStorage.getItem(USERS_KEY);
    const usersList = users ? JSON.parse(users) : [];
    
    const user = usersList.find(u => u.vehicleNumber === vehicleNumber && u.password === password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const checkUserLogin = async () => {
  try {
    const user = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return !!user;
  } catch {
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
};

export const updateLocation = async (location) => {
  try {
    const user = await getCurrentUser();
    if (user) {
      user.location = location;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error updating location:', error);
  }
};

export const addBooking = async (booking) => {
  try {
    const bookings = await AsyncStorage.getItem(BOOKINGS_KEY);
    const bookingsList = bookings ? JSON.parse(bookings) : [];
    bookingsList.push({ ...booking, id: Date.now().toString(), date: new Date().toISOString() });
    await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookingsList));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBookings = async () => {
  try {
    const bookings = await AsyncStorage.getItem(BOOKINGS_KEY);
    return bookings ? JSON.parse(bookings) : [];
  } catch {
    return [];
  }
};
