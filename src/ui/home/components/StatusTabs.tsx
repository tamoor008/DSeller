import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AppColors } from '../../../constants/AppColors';

const statuses = ['failed', 'returning', 'returned'];

const StatusTabs = ({ selectedStatus, onSelectStatus }) => {
    return (
        <View style={styles.container}>
            {statuses.map((status) => (
                <TouchableOpacity
                    key={status}
                    style={[
                        styles.tab,
                        selectedStatus === status && styles.activeTab,
                    ]}
                    onPress={() => onSelectStatus(status)}
                >
                    <Text
                        style={[
                            styles.tabText,
                            selectedStatus === status && styles.activeTabText,
                        ]}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 10,
        justifyContent: 'space-around',
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: AppColors.primaryOrange, // your highlight color
    },
    tabText: {
        color: '#555',
        fontSize: 14,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default StatusTabs;
