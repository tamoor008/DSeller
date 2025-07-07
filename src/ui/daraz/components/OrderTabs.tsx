import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import { AppColors } from '../../../constants/AppColors';
import { useSelector } from 'react-redux';
import { BASE_URL } from '../../../utils/api/baseUrl';
import SkuLinking from './SkuLinking';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const OrderTabs = ({ }) => {
    const currentUser = auth().currentUser
    const selector = useSelector(state => state.AppReducer);
    const [allOrder, setAllOrder] = useState([])
    const [shippedOrder, setShippedOrder] = useState([])
    const [finalShippedOrder, setFinalShippedOrder] = useState([])
    const [failedOrder, setFailedOrder] = useState([])
    const [ITRSOrder, setITRSOrder] = useState([])
    const [modalVisible, setmodalVisible] = useState(false)
    const skuRef = database().ref(`users/${currentUser.uid}/skusList`);
    const productRef = database().ref(`users/${currentUser.uid}/products`);
    const [allOrderCount, setOrderCount] = useState(0)
    const [shippedOrderCount, setShippedOrderCount] = useState(0)
    const [failedOrderCount, setFailedOrderCount] = useState(0)
    const [failedDeliveries, setFailedDeliveries] = useState([])
    const [shippedOrdersTotal, setshippedOrdersTotal] = useState(0)
    const [failedOrdersTotal, setfailedOrdersTotal] = useState(0)
    const [all_access_tokens, setAll_access_tokens] = useState([]);
    const [firebaseSkus, setFirebaseSkus] = useState([])
    const [selectedSku, setSelectedSku] = useState({})
    const [loader, setLoader] = useState(true)
    const [tabs, setTabs] = useState([]);
    const [allOrdersTotal, setAllOrdersTotal] = useState(0)
    const [firebaseDataLoaded, setfirebaseDataLoaded] = useState(false)

    useEffect(() => {
        const listener = skuRef.on('value', snapshot => {
            const data = snapshot.val();

            if (data) {
                const array = Object.entries(data).map(([id, value]) => ({
                    id,
                    ...value,
                }));

                setFirebaseSkus(array);
                setfirebaseDataLoaded(true)
                addAdditionalSkus(array, allOrder)
            } else {
                saveSkusAsArrayWithPriceZero(allOrder);
                setFirebaseSkus([]);
            }
        }, error => {
            console.error('Error fetching data:', error);
            setLoader(false);
        });

        // 🔴 IMPORTANT: detach listener on unmount to prevent memory leaks
        return () => skuRef.off('value', listener);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const snapshot = await productRef.once('value');
                const data = snapshot.val();

                if (data) {
                    const array = Object.entries(data).map(([id, value]) => ({
                        id,
                        ...value,
                    }));
                    // console.log(array);
                } else {
                    Alert.alert('There are no products added kindly add products as well');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoader(false);
            }
        };

        fetchData();

        // No need to return cleanup for `.once()`
    }, []);

    useEffect(() => {
        let newTokens = [];

        if (selector.selectedStore?.id) {
            const access_token = selector.selectedStore.user?.token?.access_token;
            const name = selector.selectedStore?.user.seller.data.name;

            newTokens = [{
                access_token: access_token || null,
                storeName: name || null
            }];
        } else {
            newTokens = Array.isArray(selector.access_tokens) ? selector.access_tokens : [];
        }


        // Only update state if value has changed
        const hasChanged = JSON.stringify(newTokens) !== JSON.stringify(all_access_tokens);
        if (hasChanged) {
            setAll_access_tokens(newTokens);
        }

    }, [selector]);

    useEffect(() => {
        setTabs([
            {
                title: AppStrings.all,
                selected: tabs.find(t => t.title === AppStrings.all)?.selected || false,
            },
            {
                title: AppStrings.shipped,
                selected: tabs.find(t => t.title === AppStrings.shipped)?.selected || false,
            },
            {
                title: AppStrings.failed,
                selected: tabs.find(t => t.title === AppStrings.failed)?.selected || false,
            },

        ]);
    }, []);

    useEffect(() => {
        if (!firebaseDataLoaded || !all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) return;

        const fetchOrders = async () => {

            setFailedOrder([]);
            setFailedOrderCount(0);
            setOrderCount(0);
            setShippedOrderCount(0);
            setShippedOrder([])
            setLoader(true);
            setAllOrder([])
            setITRSOrder([])

            const createdAfter = new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

            let requests = [];

            if (Array.isArray(all_access_tokens)) {
                requests = all_access_tokens.flatMap(item => [
                    getDarazOrders(item.access_token, createdAfter, 'shipped'),
                    getDarazOrders(item.access_token, createdAfter, 'failed_delivery'),
                    getDarazOrders(item.access_token, createdAfter, 'shipped_back'),
                ]);
            } else if (all_access_tokens) {

                requests = [
                    getDarazOrders(all_access_tokens[0].access_token, createdAfter, 'shipped'),
                    getDarazOrders(all_access_tokens[0].access_token, createdAfter, 'failed_delivery'),
                    getDarazOrders(all_access_tokens[0].access_token, createdAfter, 'shipped_back'),
                ];
            } else {

            }

            try {
                await Promise.all(requests); // Wait for all async tasks to complete
            } catch (error) {
                console.error('Error while fetching orders:', error);
            } finally {
                setLoader(false);

            }
        };

        fetchOrders();
    }, [all_access_tokens, firebaseDataLoaded]);

    useEffect(() => {
        const merged = mergeSkuCounts(failedOrder, ITRSOrder);
        const enriched = enrichProductsWithPrices(selector.firebaseProducts, merged)

        setfailedOrdersTotal(enriched.reduce((sum, item) => {
            return sum + (item.unitPrice * item.quantity);
        }, 0));

        const total = enriched.reduce((sum, item) => {
            const unitTotal = typeof item.price === 'number' && typeof item.quantity === 'number'
              ? item.price * item.quantity
              : 0;
            return sum + unitTotal;
          }, 0);
          
          setfailedOrdersTotal(total)

        setFailedDeliveries(enriched)


    }, [failedOrder, ITRSOrder])

    useEffect(() => {
        const data = enrichProductsWithPrices(selector.firebaseProducts, shippedOrder)

        const total = data.reduce((sum, item) => {
            const unitTotal = typeof item.price === 'number' && typeof item.quantity === 'number'
              ? item.price * item.quantity
              : 0;
            return sum + unitTotal;
          }, 0);
          
          setshippedOrdersTotal(total)
        setFinalShippedOrder(data)
    }, [shippedOrder])

    useEffect(() => {
        setTabs([
            {
                title: AppStrings.all,
                totalOrders: allOrderCount,
                selected: true
            },
            {
                title: AppStrings.shipped,
                totalOrders: shippedOrderCount,
            },
            {
                title: AppStrings.failed,
                totalOrders: failedOrderCount,
            },

        ]);
    }, [shippedOrderCount, allOrderCount, failedOrdersTotal]);



    useEffect(() => {

        const merged = mergeSkuCounts(shippedOrder, failedDeliveries);


        const enriched = enrichProductsWithPrices(selector.firebaseProducts, merged)


        setAllOrder(enriched)
        console.log(enriched[0],'enriched');
        
   
        const total = enriched.reduce((sum, item) => {
            const unitTotal = typeof item.price === 'number' && typeof item.quantity === 'number'
              ? item.price * item.quantity
              : 0;
            return sum + unitTotal;
          }, 0);
          
          console.log('Total:', total);
          setAllOrdersTotal(total)
    }, [shippedOrder, failedDeliveries, firebaseSkus])

    // This function saves the sku to firebase initially when there is no order
    const saveSkusAsArrayWithPriceZero = async (skuArray) => {
        try {

            if (!currentUser) {
                console.warn('User not authenticated');
                return;
            }


            const cleanedSkus = {};
            skuArray.forEach(item => {
                cleanedSkus[item.sku] = {
                    sku: item.sku,
                    price: 0,
                };
            });

            await database()
                .ref(`/users/${currentUser.uid}/skusList`)
                .set(cleanedSkus);



        } catch (error) {
            console.error('Error saving SKUs:', error);
        }
    };

    //This function gets the price of any sku
    const getPriceBySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        return found ? found.price : 0; // returns null if not found
    }
    //This function gets the price of any sku
    const getQuantitybySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        return found ? found.productQuantity : 0; // returns null if not found
    }

    //This function gets the price of any sku
    const getIdbySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        return found ? found.productId : 0; // returns null if not found
    }

    //This function get the orders from daraz and then merge it in sku's and show us sku and quantity
    function countSkusFromOrders(data) {
        const skuCount = {};

        data.forEach(order => {
            order.order_items.forEach(item => {
                const sku = item.sku;
                skuCount[sku] = (skuCount[sku] || 0) + 1;
            });
        });


        return Object.entries(skuCount).map(([sku, quantity]) => ({
            sku,
            quantity,
            productQuantity: getQuantitybySku(firebaseSkus, sku),
            productId: getIdbySku(firebaseSkus, sku),

        }));
    }

    function mergeSkuCounts(existing, incoming) {
        const combined = {};
        // Add existing items to the map
        existing.forEach(item => {
            combined[item.sku] = (combined[item.sku] || 0) + item.quantity;
        });

        // Merge in the new incoming items
        incoming.forEach(item => {
            combined[item.sku] = (combined[item.sku] || 0) + item.quantity;
        });

        // Convert back to array format
        return Object.entries(combined).map(([sku, quantity]) => ({
            sku,
            quantity,
            productQuantity: getQuantitybySku(firebaseSkus, sku),
            productId: getIdbySku(firebaseSkus, sku),
        }));
    }

    // this function get the orders from daraz api, orders with different statuses
    const getDarazOrders = async (access_token, createdAfterISO, status) => {


        try {
            const response = await fetch(`${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            setOrderCount(prev => prev + data.countTotal);

            if (status == 'shipped') {
                setShippedOrderCount(prev => prev + data.countTotal)
                setShippedOrder(prev => [...prev, ...countSkusFromOrders(data.orderItems)]);
            } else {
                if (status == 'shipped_back') {
                    const newFailedOrders = countSkusFromOrders(data.orderItems);
                    setFailedOrder(prev => [...prev, ...newFailedOrders])
                    setFailedOrderCount(prev => prev + data.countTotal);
                } else {
                    const newFailedOrders = countSkusFromOrders(data.orderItems);
                    setITRSOrder(prev => [...prev, ...newFailedOrders])
                    setFailedOrderCount(prev => prev + data.countTotal);
                }
            }

        } catch (error) {
            console.error("Error fetching Daraz orders:", error.message);
            return null;
        }
    };

    //This function toggle tabs between shipped, failed etc
    const toggleTabs = (index) => {
        setTabs(prevTabs =>
            prevTabs.map((tab, i) => ({
                ...tab,
                selected: i === index
            }))
        );
    };

    //This function checks the skus on firebase and then compare it with all orders coming from daraz apis. Then it adds the missing skus to firebase
    const addAdditionalSkus = (existing, newskus) => {
        // Step 1: Get list of existing SKUs (case-insensitive match)
        const existingSkus = existing.map(item => item?.sku?.trim());

        // Step 2: Filter only those new SKUs that are NOT in existing list
        const missingSkus = newskus.filter(item =>
            !existingSkus.includes(item?.sku?.trim())
        );

        if (missingSkus.length === 0) {
            console.log('no missing skus');
            return;
        }

        // Step 3: Convert to object with custom keys (e.g., using the SKU itself)
        const skusToSave = {};
        missingSkus.forEach(item => {
            skusToSave[item.sku] = {
                sku: item.sku,
                price: 0
            };
        });

        // Step 4: Save them to Firebase under existing list
        const userSkuListRef = database().ref(`/users/${currentUser.uid}/skusList`);
        userSkuListRef.update(skusToSave)
            .then(() => console.log('Missing SKUs saved to Firebase'))
            .catch(err => console.error('Error saving new SKUs:', err));
    };

    const enrichProductsWithPrices = (firebaseProducts, items) => {
        if (!firebaseProducts || !items || !Array.isArray(items)) return [];

        // console.log(firebaseProducts,'firebaseProducts');

        return items.map(item => {
            const product = firebaseProducts[item.productId];
            // console.log(product, 'product');
            // console.log(item.productId, 'productId');

            if (!product) {
                return {
                    ...item,
                    productName: null,
                    unitPrice: null,
                    totalPrice: 0,
                    status: false

                };
            }



            const price = parseFloat(product.price || '0');
            return {
                ...item,
                productName: product.productName || '',
                unitPrice: price,
                price: price * item.productQuantity,
                status: true
            };
        });
    };
    return (

        <View style={{ flex: 1 }}>
            {loader ?
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size={'large'} color={AppColors.primaryOrange}></ActivityIndicator>
                </View>
                :
                <View style={{ rowGap: 16, flex: 1 }}>
                    <View style={styles.container}>
                        {tabs.map((item, index) => (
                            <TouchableOpacity onPress={() => { toggleTabs(index) }} activeOpacity={0.9} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: item.selected ? AppColors.primaryOrange : AppColors.black25, borderRadius: 16, paddingVertical: 4, flexDirection: 'row', columnGap: 4 }} key={index}>
                                <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: item.selected ? AppColors.white : AppColors.black50, textAlign: 'center', }}>{item.title}</TextComp>
                                <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.white, borderRadius: 100, padding: 4 }}>
                                    <TextComp size={8} style={{ fontFamily: FontFamilty.semibold, color: item.selected ? AppColors.primaryOrange : AppColors.black, textAlignVertical: 'center' }}>{item.totalOrders}</TextComp>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {tabs[0]?.selected && (

                        <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
                                {allOrder?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                                    <TouchableOpacity style={{ flex: 2 }} activeOpacity={0.9} onPress={() => {

                                        setmodalVisible(true)
                                        setSelectedSku(item)
                                    }}>
                                        <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: item.status ? AppColors.black : AppColors.primaryOrange, textDecorationLine: item.status ? 'normal' : 'underline' }}>{item.sku}</TextComp>

                                    </TouchableOpacity>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
                                    </View>

                                </View>)}
                            </ScrollView>

                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>  {parseFloat(allOrdersTotal).toFixed(2)}</TextComp>
                                </View>
                            </View>
                        </View>
                    )}

                    {tabs[1]?.selected && (

                        <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
                                {finalShippedOrder?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                                    <TouchableOpacity style={{ flex: 2 }} activeOpacity={0.9} onPress={() => {
                                        console.log(item);

                                        setmodalVisible(true)
                                        setSelectedSku(item)
                                    }}>
                                        <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: item.status ? AppColors.black : AppColors.primaryOrange, textDecorationLine: item.status ? 'normal' : 'underline' }}>{item.sku}</TextComp>

                                    </TouchableOpacity>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
                                    </View>

                                </View>)}
                            </ScrollView>

                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{parseFloat(shippedOrdersTotal).toFixed(2)}</TextComp>
                                </View>
                            </View>
                        </View>
                    )}


                    {tabs[2]?.selected && (

                        <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
                                {failedDeliveries?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                                    <TouchableOpacity style={{ flex: 2 }} activeOpacity={0.9} onPress={() => {
                                        console.log(item);

                                        setmodalVisible(true)
                                        setSelectedSku(item)
                                    }}>
                                        <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: item.status ? AppColors.black : AppColors.primaryOrange, textDecorationLine: item.status ? 'normal' : 'underline' }}>{item.sku}</TextComp>

                                    </TouchableOpacity>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
                                    </View>

                                </View>)}
                            </ScrollView>

                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{parseFloat(failedOrdersTotal).toFixed(2)}</TextComp>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* {tabs[3]?.selected && (

                        <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
                                {orders.returned.orders.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                                    <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: item.status ? AppColors.black : AppColors.primaryOrange, textDecorationLine: item.status ? 'normal' : 'underline', flex: 2, }}>{item.sku}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
                                    </View>

                                </View>)}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{orders.returned.totalPrice}</TextComp>
                                </View>
                            </View>
                        </View>
                    )} */}
                </View>}

            {modalVisible && (
                <SkuLinking setIsvisible={setmodalVisible} selectedSku={selectedSku} />
            )}

        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        columnGap: 8
    },

});

export default OrderTabs;


