import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
    Text,
    Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppColors } from '../../../constants/AppColors';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';

interface CustomDateRangePickerProps {
    startDate: Date | null;
    endDate: Date | null;
    onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
    startDate,
    endDate,
    onDateRangeChange,
}) => {
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [tempStartDate, setTempStartDate] = useState(startDate || new Date());
    const [tempEndDate, setTempEndDate] = useState(endDate || new Date());

    const maxDate = new Date();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30); // 30 days ago

    const handleStartDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowStartPicker(false);
            if (event?.type === 'set' && selectedDate) {
                const newStartDate = selectedDate;
                setTempStartDate(newStartDate);
                
                // Ensure end date is not before start date
                if (endDate && newStartDate > endDate) {
                    const newEndDate = new Date(newStartDate);
                    newEndDate.setDate(newEndDate.getDate() + 1);
                    if (newEndDate > maxDate) {
                        setTempEndDate(maxDate);
                        onDateRangeChange(newStartDate, maxDate);
                    } else {
                        setTempEndDate(newEndDate);
                        onDateRangeChange(newStartDate, newEndDate);
                    }
                } else {
                    onDateRangeChange(newStartDate, endDate || newStartDate);
                }
            }
        } else {
            if (selectedDate) {
                setTempStartDate(selectedDate);
            }
        }
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowEndPicker(false);
            if (event?.type === 'set' && selectedDate) {
                const newEndDate = selectedDate;
                
                // Ensure end date is not before start date
                if (startDate && newEndDate < startDate) {
                    Alert.alert('Invalid Date', 'End date cannot be before start date');
                    return;
                }
                
                // Ensure range is within 30 days
                if (startDate) {
                    const daysDiff = Math.ceil((newEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysDiff > 30) {
                        Alert.alert('Invalid Range', 'Date range cannot exceed 30 days');
                        const maxEndDate = new Date(startDate);
                        maxEndDate.setDate(maxEndDate.getDate() + 30);
                        setTempEndDate(maxEndDate);
                        onDateRangeChange(startDate, maxEndDate);
                        return;
                    }
                }
                
                setTempEndDate(newEndDate);
                onDateRangeChange(startDate || newEndDate, newEndDate);
            }
        } else {
            if (selectedDate) {
                setTempEndDate(selectedDate);
            }
        }
    };

    const confirmStartDate = () => {
        setShowStartPicker(false);
        const newStartDate = tempStartDate;
        
        // Ensure end date is not before start date
        if (endDate && newStartDate > endDate) {
            const newEndDate = new Date(newStartDate);
            newEndDate.setDate(newEndDate.getDate() + 1);
            if (newEndDate > maxDate) {
                setTempEndDate(maxDate);
                onDateRangeChange(newStartDate, maxDate);
            } else {
                setTempEndDate(newEndDate);
                onDateRangeChange(newStartDate, newEndDate);
            }
        } else {
            onDateRangeChange(newStartDate, endDate || newStartDate);
        }
    };

    const confirmEndDate = () => {
        setShowEndPicker(false);
        const newEndDate = tempEndDate;
        
        // Ensure end date is not before start date
        if (startDate && newEndDate < startDate) {
            Alert.alert('Invalid Date', 'End date cannot be before start date');
            return;
        }
        
        // Ensure range is within 30 days
        if (startDate) {
            const daysDiff = Math.ceil((newEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff > 30) {
                Alert.alert('Invalid Range', 'Date range cannot exceed 30 days');
                const maxEndDate = new Date(startDate);
                maxEndDate.setDate(maxEndDate.getDate() + 30);
                setTempEndDate(maxEndDate);
                onDateRangeChange(startDate, maxEndDate);
                return;
            }
        }
        
        onDateRangeChange(startDate || newEndDate, newEndDate);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Select Date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <View style={styles.container}>
            <View style={styles.dateRow}>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartPicker(true)}
                >
                    <TextComp size={14} style={styles.dateLabel}>
                        Start Date
                    </TextComp>
                    <TextComp size={14} style={styles.dateValue}>
                        {formatDate(startDate)}
                    </TextComp>
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                >
                    <TextComp size={14} style={styles.dateLabel}>
                        End Date
                    </TextComp>
                    <TextComp size={14} style={styles.dateValue}>
                        {formatDate(endDate)}
                    </TextComp>
                </TouchableOpacity>
            </View>

            {/* Android Date Pickers */}
            {Platform.OS === 'android' && showStartPicker && (
                <DateTimePicker
                    value={tempStartDate}
                    mode="date"
                    display="calendar"
                    minimumDate={minDate}
                    maximumDate={maxDate}
                    onChange={handleStartDateChange}
                />
            )}

            {Platform.OS === 'android' && showEndPicker && (
                <DateTimePicker
                    value={tempEndDate}
                    mode="date"
                    display="calendar"
                    minimumDate={startDate || minDate}
                    maximumDate={maxDate}
                    onChange={handleEndDateChange}
                />
            )}

            {/* iOS Date Pickers */}
            {Platform.OS === 'ios' && (
                <>
                    <Modal
                        visible={showStartPicker}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setShowStartPicker(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <TextComp size={18} style={styles.modalTitle}>
                                    Select Start Date
                                </TextComp>
                                <DateTimePicker
                                    value={tempStartDate}
                                    mode="date"
                                    display="inline"
                                    minimumDate={minDate}
                                    maximumDate={maxDate}
                                    onChange={handleStartDateChange}
                                />
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setShowStartPicker(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.confirmButton]}
                                        onPress={confirmStartDate}
                                    >
                                        <Text style={styles.confirmButtonText}>Confirm</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    <Modal
                        visible={showEndPicker}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setShowEndPicker(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <TextComp size={18} style={styles.modalTitle}>
                                    Select End Date
                                </TextComp>
                                <DateTimePicker
                                    value={tempEndDate}
                                    mode="date"
                                    display="inline"
                                    minimumDate={startDate || minDate}
                                    maximumDate={maxDate}
                                    onChange={handleEndDateChange}
                                />
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setShowEndPicker(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.confirmButton]}
                                        onPress={confirmEndDate}
                                    >
                                        <Text style={styles.confirmButtonText}>Confirm</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: AppColors.card,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: AppColors.surface,
        borderRadius: 8,
    },
    dateLabel: {
        color: AppColors.textSecondary,
        marginBottom: 4,
        fontFamily: FontFamilty.medium,
    },
    dateValue: {
        color: AppColors.textPrimary,
        fontFamily: FontFamilty.medium,
    },
    separator: {
        width: 12,
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
    modalTitle: {
        marginBottom: 16,
        fontFamily: FontFamilty.bold,
        color: AppColors.textPrimary,
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 16,
        columnGap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: AppColors.primaryOrange,
    },
    cancelButton: {
        backgroundColor: AppColors.textSecondary,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontFamily: FontFamilty.medium,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontFamily: FontFamilty.medium,
    },
});

export default CustomDateRangePicker;

