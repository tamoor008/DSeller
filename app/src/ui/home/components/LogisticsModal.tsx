import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { AppColors } from '../../../constants/AppColors';
import { getBaseUrl } from '../../../utils/api/baseUrl';

const LogisticsModal = ({ visible, onClose,item }) => {
    const BASE_URL = getBaseUrl(); // instant access, no async


    const [logisticData,setlogisticData]=useState([])
    const [logisticLoader,setLogisticLoader]=useState(false)
    
    const getDarazOrderLogistics = async ({ access_token, order_id, package_id, locale = 'en_PK' }) => {
    
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
          console.log(data);

          const trackingSteps =
  data?.data?.module?.[0]?.packageDetailInfoList?.[0]?.logisticDetailInfoList || [];

setlogisticData(trackingSteps);
          setLogisticLoader(false)
          return data;
        } catch (error) {
          console.error('Error fetching logistics:', error.message);
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
    }, [visible]);
    
      
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Order Tracking</Text>
                    {logisticLoader?
                     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                     <ActivityIndicator size={'large'} color={AppColors.primaryOrange}></ActivityIndicator>
                 </View>
                    :
                    <ScrollView>
                        <FlatList
                            scrollEnabled={false}
                            data={logisticData}
                            keyExtractor={(_, index) => index.toString()}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item }) => (
                                <View style={styles.eventCard}>
                                    <Text style={styles.eventTitle}>{item.title}</Text>
                                    <Text style={styles.eventDescription}>{item.description}</Text>
                                    {item.packageLocationName && (
                                        <Text style={styles.eventLocation}>📍 {item.packageLocationName}</Text>
                                    )}
                                    <Text style={styles.eventTime}>
                                        {new Date(Number(item.eventTime)).toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        />
                    </ScrollView>}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        height: '80%',

    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    eventCard: {
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
        paddingVertical: 10,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    eventDescription: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
    eventLocation: {
        fontSize: 13,
        color: '#007BFF',
        marginTop: 4,
    },
    eventTime: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    closeBtn: {
        marginTop: 15,
        alignSelf: 'center',
        backgroundColor: '#007BFF',
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    closeText: {
        color: 'white',
        fontWeight: 'bold',
    },
});


export default LogisticsModal;
