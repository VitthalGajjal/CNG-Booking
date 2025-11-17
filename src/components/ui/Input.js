import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

const Input = ({ style, ...props }) => {
  return <TextInput style={[styles.input, style]} placeholderTextColor={colors.textSecondary} {...props} />;
};

const styles = StyleSheet.create({
  input: { backgroundColor: colors.background, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 }
});

export default Input;