import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppColors } from '../../../constants/AppColors';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';

export type OrderStatus = 'pending' | 'ready_to_ship' | 'shipped' | 'delivered' | 'failed' | 'returning' | 'returned';

interface StatusOption {
    key: OrderStatus;
    label: string;
}

const STATUS_OPTIONS: StatusOption[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'ready_to_ship', label: 'Ready to Ship' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'failed', label: 'Failed' },
    { key: 'returning', label: 'Returning' },
    { key: 'returned', label: 'Returned' },
];

interface OrderStatusTabsProps {
    selectedStatus: OrderStatus;
    onSelectStatus: (status: OrderStatus) => void;
}

const OrderStatusTabs: React.FC<OrderStatusTabsProps> = ({ selectedStatus, onSelectStatus }) => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {STATUS_OPTIONS.map((option) => {
                    const isSelected = selectedStatus === option.key;
                    return (
                        <TouchableOpacity
                            key={option.key}
                            style={[styles.tab, isSelected && styles.activeTab]}
                            onPress={() => onSelectStatus(option.key)}
                        >
                            <TextComp
                                size={14}
                                style={[styles.tabText, isSelected && styles.activeTabText]}
                            >
                                {option.label}
                            </TextComp>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: AppColors.card,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border,
    },
    scrollContent: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        columnGap: 8,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: AppColors.surface,
        marginRight: 8,
    },
    activeTab: {
        backgroundColor: AppColors.primaryOrange,
    },
    tabText: {
        color: AppColors.textSecondary,
        fontFamily: FontFamilty.medium,
    },
    activeTabText: {
        color: AppColors.white,
        fontFamily: FontFamilty.bold,
    },
});

export default OrderStatusTabs;

