import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import TextComp from '../components/TextComp';
import Header from '../components/Header';
import FontFamilty from '../../constants/FontFamilty';

const StoresScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Stores" goBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <TextComp size={18} style={{ fontFamily: FontFamilty.bold, color: theme.textPrimary }}>
            Connected Stores
          </TextComp>
          <TextComp size={14} style={{ fontFamily: FontFamilty.regular, color: theme.textSecondary }}>
            Manage your linked stores here. (Coming soon)
          </TextComp>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bgcolor,
      padding: 16,
    },
    content: {
      paddingVertical: 16,
      rowGap: 12,
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      padding: 16,
      rowGap: 8,
    },
  });

export default StoresScreen;

