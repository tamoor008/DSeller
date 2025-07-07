import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Text,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppColors } from '../../../constants/AppColors';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';

const OPTIONS = [
  { label: 'Today', key: 'today' },
  { label: 'Yesterday', key: 'yesterday' },
  { label: 'Last 7 Days', key: '7days' },
  { label: 'Last 30 Days', key: '30days' },
  { label: 'Custom', key: 'custom' },
];

const OrderDurationHeader = ({ selectedRange, onChange, customDate }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(customDate || new Date());

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);

      if (event?.type === 'set' && selectedDate) {
        setTempDate(selectedDate);
        setTimeout(() => {
          onChange('custom', selectedDate);
        }, 50); // small delay to avoid UI issues
      }
    } else {
      if (selectedDate) setTempDate(selectedDate);
    }
  };

  const confirmDate = () => {
    setShowDatePicker(false);
    onChange('custom', tempDate);
  };

  return (
    <View>
      <View style={styles.container}>
        {OPTIONS.map((option) => {
          const isSelected = selectedRange === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.option, isSelected && styles.selectedOption]}
              onPress={() => {
                if (option.key === 'custom') {
                  setShowDatePicker(true);
                } else {
                  onChange(option.key);
                }
              }}
            >
              <TextComp
                style={[styles.optionText, isSelected && styles.selectedText]}
              >
                {option.label}
              </TextComp>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedRange === 'custom' && customDate && (
        <View style={styles.customDateView}>
          <TextComp style={styles.customDateText}>
            Selected Date: {customDate.toDateString()}
          </TextComp>
        </View>
      )}

      {/* ✅ Date Picker for Android (direct render) */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="calendar"
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* ✅ Date Picker inside Modal for iOS only */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
              <TouchableOpacity style={styles.confirmButton} onPress={confirmDate}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    flexWrap: 'wrap',
    rowGap: 16,
    columnGap: 16,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  option: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  selectedOption: {
    backgroundColor: AppColors.greenbg,
  },
  optionText: {
    fontFamily: FontFamilty.medium,
    color: '#555',
  },
  selectedText: {
    color: AppColors.green,
    fontWeight: 'bold',
  },
  customDateView: {
    alignItems: 'center',
    marginTop: 8,
  },
  customDateText: {
    color: '#444',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000077',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  confirmButton: {
    marginTop: 16,
    backgroundColor: AppColors.green,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#999',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#fff',
  },
});

export default OrderDurationHeader;
