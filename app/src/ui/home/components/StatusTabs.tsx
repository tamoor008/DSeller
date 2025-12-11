import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

const statuses = ['failed', 'returning', 'returned'];

const StatusTabs = ({ selectedStatus, onSelectStatus }) => {
    const { theme } = useTheme();
    const styles = getStyles(theme);

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

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 10,
        justifyContent: 'space-around',
        backgroundColor: theme.surface || theme.bgcolor,
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
        backgroundColor: theme.primaryOrange,
    },
    tabText: {
        color: theme.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    activeTabText: {
        color: theme.white,
        fontWeight: 'bold',
    },
});

export default StatusTabs;
