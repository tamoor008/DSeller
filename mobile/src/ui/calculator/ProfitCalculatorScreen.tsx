import React, { useRef } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { CalculatorModule } from '../../modules/calculator';
import TextComp from '../components/TextComp';

const ProfitCalculatorScreen = () => {
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TextComp size={12} style={styles.eyebrow} numberOfLines={1}>
            DARAZ SELLER TOOLKIT
          </TextComp>
          <TextComp size={20} style={styles.title} numberOfLines={1}>
            Daraz Profit Calculator
          </TextComp>
        
        </View>
        <CalculatorModule scrollViewRef={scrollViewRef as React.RefObject<ScrollView>} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bgcolor,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    color: theme.textSecondary,
  },
});

export default ProfitCalculatorScreen;

