import React, { useEffect, useState } from 'react';
import {
    View,
    Modal,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { getBaseUrl } from '../../../utils/api/baseUrl';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';

interface LogisticsModalProps {
    visible: boolean;
    onClose: () => void;
    item?: {
        access_token?: string;
        order_id?: string;
        package_id?: string;
    };
}

interface LogisticDataItem {
    title: string;
    description: string;
    packageLocationName?: string;
    eventTime: string | number;
}

const LogisticsModal = ({ visible, onClose, item }: LogisticsModalProps) => {
    const { theme } = useTheme();
    const BASE_URL = getBaseUrl(); // instant access, no async

    const [logisticData, setlogisticData] = useState<LogisticDataItem[]>([])
    const [logisticLoader, setLogisticLoader] = useState(false)

    const getDarazOrderLogistics = async ({ access_token, order_id, package_id, locale = 'en_PK' }: { access_token: string; order_id: string; package_id: string; locale?: string }) => {

        setLogisticLoader(true)

        try {
            const baseUrl = `${BASE_URL}/get-daraz-order-logistics`; // 🔁 Replace with your real backend URL

            const params = new URLSearchParams({
                access_token,
                order_id,
                package_id_list: JSON.stringify([package_id]), // Daraz expects this to be a stringified array
                locale,
            });

            const response = await fetch(`${baseUrl}?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            // console.log(data);

            const trackingSteps =
                data?.data?.module?.[0]?.packageDetailInfoList?.[0]?.logisticDetailInfoList || [];

            setlogisticData(trackingSteps);
            setLogisticLoader(false)
            return data;
        } catch (error) {
            // console.error('Error fetching logistics:', error instanceof Error ? error.message : 'Unknown error');
            setLogisticLoader(false)
            return null;
        }
    };

    useEffect(() => {
        if (visible && item?.access_token && item?.order_id && item?.package_id) {
            getDarazOrderLogistics({
                access_token: item.access_token,
                order_id: item.order_id,
                package_id: item.package_id
            });
        }
    }, [visible, item]);

    const styles = getStyles(theme);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <TextComp size={20} style={styles.modalTitle} numberOfLines={1}>Order Tracking</TextComp>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <TextComp size={18} style={styles.closeButtonText} numberOfLines={1}>×</TextComp>
                        </TouchableOpacity>
                    </View>

                    {logisticLoader ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size={'large'} color={theme.primaryOrange} />
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                            <FlatList
                                scrollEnabled={false}
                                data={logisticData}
                                keyExtractor={(_, index) => index.toString()}
                                contentContainerStyle={styles.listContent}
                                renderItem={({ item }) => (
                                    <View style={styles.eventCard}>
                                        <TextComp size={16} style={styles.eventTitle} numberOfLines={2}>{item.title}</TextComp>
                                        <TextComp size={14} style={styles.eventDescription} numberOfLines={3}>{item.description}</TextComp>
                                        {item.packageLocationName && (
                                            <TextComp size={13} style={styles.eventLocation} numberOfLines={2}>📍 {item.packageLocationName}</TextComp>
                                        )}
                                        <TextComp size={12} style={styles.eventTime} numberOfLines={1}>
                                            {new Date(Number(item.eventTime)).toLocaleString()}
                                        </TextComp>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <TextComp size={16} style={styles.emptyText} numberOfLines={1}>
                                            No tracking information available
                                        </TextComp>
                                    </View>
                                }
                            />
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: FontFamilty.bold,
        color: theme.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.bgcolor,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: theme.textSecondary,
        fontFamily: FontFamilty.bold,
    },
    scrollView: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        minHeight: 200,
    },
    listContent: {
        paddingBottom: 20,
    },
    eventCard: {
        borderBottomColor: theme.border,
        borderBottomWidth: 1,
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
    eventTitle: {
        fontFamily: FontFamilty.bold,
        color: theme.textPrimary,
        marginBottom: 8,
    },
    eventDescription: {
        fontFamily: FontFamilty.regular,
        color: theme.textSecondary,
        marginTop: 4,
        marginBottom: 8,
    },
    eventLocation: {
        fontFamily: FontFamilty.medium,
        color: theme.primaryOrange,
        marginTop: 4,
        marginBottom: 4,
    },
    eventTime: {
        fontFamily: FontFamilty.regular,
        color: theme.textSecondary,
        marginTop: 4,
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: FontFamilty.medium,
        color: theme.textSecondary,
    },
});


export default LogisticsModal;
