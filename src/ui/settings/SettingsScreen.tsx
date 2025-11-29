import React, { useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { AppColors } from '../../constants/AppColors';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import TextComp from '../components/TextComp';
const SettingsScreen = () => {

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: AppColors.bgcolor }]}>
      <View style={styles.container}>
        <TextComp
          size={20}
          style={{ fontFamily: FontFamilty.bold, color: AppColors.black }}
        >
          {AppStrings.settings}
        </TextComp>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    rowGap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16,
  },
});

export default SettingsScreen;

