import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../context/ThemeContext';

const WeekRangePST = ({ onWeekSelected }) => {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const styles = getStyles(theme);

  const formatDate = (d) =>
    `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

      const calculateWeekRangePKT = (date) => {
      
        // Step 1: Convert selected date to "fake PKT" date by adding 5 hours
        const pktDate = new Date(date.getTime());
      
        // Step 2: Calculate Monday of that week (in PKT)
        const day = pktDate.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
      
        const mondayPKT = new Date(pktDate);
        mondayPKT.setDate(pktDate.getDate() + mondayOffset);
        mondayPKT.setHours(0, 0, 0, 0); // start of day in PKT
      
        // Step 3: Sunday = Monday + 6 days, end of day
        const sundayPKT = new Date(mondayPKT);
        sundayPKT.setDate(mondayPKT.getDate() + 6);
        sundayPKT.setHours(23, 59, 59, 999); // end of day in PKT
      
        // Step 4: Convert "fake PKT time" back to real UTC time
        const startUTC = new Date(mondayPKT.getTime() );
        const endUTC = new Date(sundayPKT.getTime());
      
        // Generate array of 7 days for UI
        const days = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(mondayPKT);
          day.setDate(mondayPKT.getDate() + i);
          days.push({
            dateObj: day,
            label: day.getDate().toString(),
            fullDate: formatDate(day),
          });
        }
      
        setWeekDates(days);
      
        // Emit result in UTC ISO format
        if (onWeekSelected) {
          onWeekSelected({
            start: startUTC.toISOString(),
            end: endUTC.toISOString(),
          });
        }
      };
      
      

  useEffect(() => {
    calculateWeekRangePKT(selectedDate);
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Select a Week (via Date)</Text>
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.icon}>
          <Text style={{ color: theme.primaryOrange, fontWeight: '600' }}>Calendar</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, date) => {
            if (Platform.OS !== 'ios') setShowPicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bubbleContainer}
      >
        {/* {weekDates.map((day) => (
          <View key={day.fullDate} style={styles.selectedBubble}>
            <Text style={styles.selectedBubbleText}>{day.label}</Text>
          </View>
        ))} */}
      </ScrollView>

      <Text style={styles.selectedDateText}>
        Week: {weekDates[0]?.fullDate} → {weekDates[6]?.fullDate}
      </Text>
    </View>
  );
};

export default WeekRangePST;

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    backgroundColor: theme.bgcolor,
    paddingTop: 0,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    padding: 8,
  },
  bubbleContainer: {
    marginTop: 0,
    flexDirection: 'row',
  },
  selectedBubble: {
    backgroundColor: theme.primaryOrange,
    borderRadius: 4,
    marginRight: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBubbleText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '500',
  },
  selectedDateText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    color: theme.primaryOrange,
    fontWeight: '600',
  },
});
