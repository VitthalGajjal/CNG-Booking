export const validateOwnerName = (name) => {
  return name.trim().length >= 2 ? null : 'Owner name must be at least 2 characters';
};

export const validateVehicleNumber = (number) => {
  const pattern = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
  return pattern.test(number.toUpperCase()) ? null : 'Invalid vehicle number format';
};

export const validateMobileNumber = (number) => {
  const pattern = /^[0-9]{10}$/;
  return pattern.test(number) ? null : 'Mobile number must be 10 digits';
};

export const validatePassword = (password) => {
  return password.length >= 6 ? null : 'Password must be at least 6 characters';
};
