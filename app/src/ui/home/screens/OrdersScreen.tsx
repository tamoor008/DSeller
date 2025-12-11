import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import Header from '../../components/Header';
import SelectStore from '../../components/SelectStore';
import OrderStatusTabs, { OrderStatus } from '../components/OrderStatusTabs';
import CustomDateRangePicker from '../components/CustomDateRangePicker';

interface OrdersScreenProps {
    navigation: any;
}

type DateRange = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

const OrdersScreen: React.FC<OrdersScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    // Status and date range state
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
    const [selectedRange, setSelectedRange] = useState<DateRange>('today');
    const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
    const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

    const handleCustomDateRangeChange = (startDate: Date, endDate: Date) => {
        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
    };

    const styles = getStyles(theme);
    return (
        <View style={styles.container}>
            <View style={styles.headerSection}>
                <Header title="Orders" />
                <SelectStore />
            </View>

            <OrderStatusTabs
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
            />

            {/* Date Filter Options */}
            <View style={styles.dateFilterContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.dateFilterScroll}
                >
                    {(['today', 'yesterday', '7days', '30days', 'custom'] as DateRange[]).map((range) => {
                        const isSelected = selectedRange === range;
                        return (
                            <TouchableOpacity
                                key={range}
                                style={[
                                    styles.dateFilterOption, 
                                    isSelected && styles.selectedDateFilterOption
                                ]}
                                onPress={() => {
                                    setSelectedRange(range);
                                    if (range !== 'custom') {
                                        setCustomStartDate(null);
                                        setCustomEndDate(null);
                                    }
                                }}
                            >
                                <TextComp
                                    size={14}
                                    style={[
                                        styles.dateFilterText, 
                                        isSelected && styles.selectedDateFilterText
                                    ]}
                                >
                                    {range === '7days' 
                                        ? '7 Days' 
                                        : range === '30days' 
                                        ? '30 Days' 
                                        : range.charAt(0).toUpperCase() + range.slice(1)}
                                </TextComp>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Custom Date Range Picker */}
            {selectedRange === 'custom' && (
                <CustomDateRangePicker
                    startDate={customStartDate}
                    endDate={customEndDate}
                    onDateRangeChange={handleCustomDateRangeChange}
                />
            )}

            {/* Empty State */}
            <View style={styles.emptyContainer}>
                <TextComp size={16} style={styles.emptyText}>
                    No {selectedStatus} orders found.
                </TextComp>
                <TextComp size={14} style={styles.emptySubText}>
                    Orders will appear here when data is available.
                </TextComp>
            </View>
        </View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.bgcolor,
    },
    headerSection: {
        rowGap: 16,
        margin: 16,
    },
    dateFilterContainer: {
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        paddingVertical: 12,
    },
    dateFilterScroll: {
        paddingHorizontal: 12,
        columnGap: 8,
    },
    dateFilterOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: theme.surface,
        marginRight: 8,
    },
    selectedDateFilterOption: {
        backgroundColor: theme.primaryOrange,
    },
    dateFilterText: {
        color: theme.textSecondary,
        fontFamily: FontFamilty.medium,
    },
    selectedDateFilterText: {
        color: theme.white,
        fontFamily: FontFamilty.bold,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.textPrimary,
        fontFamily: FontFamilty.medium,
        marginBottom: 8,
    },
    emptySubText: {
        textAlign: 'center',
        color: theme.textSecondary,
        fontFamily: FontFamilty.regular,
    },
});

export default OrdersScreen;
