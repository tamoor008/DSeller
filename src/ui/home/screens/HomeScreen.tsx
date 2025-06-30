import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppColors } from '../../../constants/AppColors';
import HomeHeader from '../components/HomeHeader';
import SelectStore from '../../components/SelectStore';
import TotalBusinessComp from '../../components/TotalBusinessComp';
import IndividualValueComp from '../../components/IndividualValueComp';
import { AppStrings } from '../../../constants/AppStrings';
import { AppScreens } from '../../../constants/AppScreens';
import { getAuth } from '@react-native-firebase/auth';
import { useSelector } from 'react-redux';
import { BASE_URL } from '../../../utils/api/baseUrl';
import database from '@react-native-firebase/database';


const HomeScreen = ({ navigation }) => {
    const navigateDaraz = () => {
        navigation.navigate(AppScreens.DarazScreen)
    }
    const navigateCash = () => {
        navigation.navigate(AppScreens.CashScreen)
    }
    const navigateStock = () => {
        navigation.navigate(AppScreens.StockScreen)
    }
    const navigatePackaging = () => {
        navigation.navigate(AppScreens.PackagingScreen)
    }

    const [reloadScreen,setReloadScreen]=useState(false)


    const auth = getAuth()
    const currentUser = auth.currentUser
    const selector = useSelector(state => state.AppReducer);
    const [shippedOrder, setShippedOrder] = useState([])
    const [failedOrder, setFailedOrder] = useState([])
    const [ITRSOrder, setITRSOrder] = useState([])
    const skuRef = database().ref(`users/${currentUser.uid}/skusList`);
    const productRef = database().ref(`users/${currentUser.uid}/products`);

    const [failedDeliveries, setFailedDeliveries] = useState([])
    const [all_access_tokens, setAll_access_tokens] = useState([]);
    const [firebaseSkus, setFirebaseSkus] = useState([])
    const [darazLoader, setDarazLoader] = useState(false)
    const [allOrdersTotal, setAllOrdersTotal] = useState(0)
    const [firebaseDataLoaded, setfirebaseDataLoaded] = useState(false)
    const [screenloader, setScreenloader] = useState(false)


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
            } else {
                setFirebaseSkus([]);
            }
        }, error => {
            console.error('Error fetching data:', error);
            setDarazLoader(false);
            setScreenloader(false)

        });

        // 🔴 IMPORTANT: detach listener on unmount to prevent memory leaks
        return () => skuRef.off('value', listener);
    }, [reloadScreen]);

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
                    console.log(array);
                } else {
                    Alert.alert('There are no products added kindly add products as well');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setDarazLoader(false);

            }
        };

        fetchData();

        // No need to return cleanup for `.once()`
    }, [reloadScreen]);

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
        if (!firebaseDataLoaded || !all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) return;

        const fetchOrders = async () => {

            setFailedOrder([]);
            setShippedOrder([])
            setITRSOrder([])
            setDarazLoader(true)

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
                setDarazLoader(false)
                setScreenloader(false)
            }
        };

        fetchOrders();
    }, [all_access_tokens, firebaseDataLoaded,reloadScreen]);

    useEffect(() => {
        const merged = mergeSkuCounts(failedOrder, ITRSOrder);
        const enriched = merged.map(item => {
            const price = getPriceBySku(firebaseSkus, item.sku)
            return {
                ...item,
                price: price,
                status: price > 0 ? true : false
            };
        });



        setFailedDeliveries(enriched)


    }, [failedOrder, ITRSOrder])


    useEffect(() => {
        const merged = mergeSkuCounts(shippedOrder, failedDeliveries);

        const enriched = merged.map(item => {
            const price = getPriceBySku(firebaseSkus, item.sku)
            return {
                ...item,
                price: price,
                status: price > 0 ? true : false
            };
        });
        setAllOrdersTotal(enriched.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0));
    }, [shippedOrder, failedDeliveries, firebaseSkus])

    //This function gets the price of any sku
    const getPriceBySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        return found ? found.price : 0; // returns null if not found
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
            price: getPriceBySku(firebaseSkus, sku)
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


            if (status == 'shipped') {
                setShippedOrder(prev => [...prev, ...countSkusFromOrders(data.orderItems)]);
            } else {
                if (status == 'shipped_back') {
                    const newFailedOrders = countSkusFromOrders(data.orderItems);
                    setFailedOrder(prev => [...prev, ...newFailedOrders])
                } else {
                    const newFailedOrders = countSkusFromOrders(data.orderItems);
                    setITRSOrder(prev => [...prev, ...newFailedOrders])
                }
            }

        } catch (error) {
            console.error("Error fetching Daraz orders:", error.message);
            return null;
        }
    };

   
    ////INCOME PART
    const [total, setTotal] = useState(0)

    const [income, setIncome] = useState([

    ]);


    const getDarazIncome = async (access_token, storeName, createdAfterISO) => {

        try {
            const response = await fetch(`${BASE_URL}/get-daraz-income-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&storeName=${storeName}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            // console.log(data);
            setIncome(prev => [...prev, ...data.financeRespone])




        } catch (error) {
            console.error("Error fetching Daraz orders:", error.message);
            return null;
        }
    };

    useEffect(() => {
        console.log(all_access_tokens);


        if (!all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) return;

        const fetchOrders = async () => {
            setIncome([])


            const createdAfter = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

            let requests = [];

            if (Array.isArray(all_access_tokens)) {
                requests = all_access_tokens.flatMap(item => [
                    console.log(item),

                    getDarazIncome(item.access_token, item.name, createdAfter),

                ]);
            } else if (all_access_tokens) {
                requests = [
                    getDarazIncome(all_access_tokens[0].access_token, all_access_tokens[0].name, createdAfter),
                ];
            }

            try {
                await Promise.all(requests); // Wait for all async tasks to complete
            } catch (error) {
                console.error('Error while fetching income:', error);
            } finally {

            }
        };

        fetchOrders();
    }, [all_access_tokens,reloadScreen]);

    useEffect(() => {
        // console.log(income);
        const totalIncome = income.reduce((sum, item) => {
            return sum + parseFloat(item.payout.replace(' PKR', '') || 0);
        }, 0);
        setTotal(totalIncome)

    }, [income]);

    useEffect(() => {
        if(income&&allOrdersTotal!=0){
       
        }

    }, [total,allOrdersTotal]);






    /////////STOCK PART/////////
    const [totalPrice, setTotalPrice] = useState(0)
    const [products, setProducts] = useState([]);
    const [stockLoader, setStockLoader] = useState(false)


    useEffect(() => {
        setStockLoader(true)
        productRef
            .once('value')
            .then(snapshot => {
                console.log('User data: ', snapshot.val());

                const data = snapshot.val();

                if (data) {
                    const array = Object.entries(data).map(([id, value]) => ({
                        id,
                        ...value,
                    }));
                    console.log('User data array: ', array);
                    setProducts(array);
                } else {
                    console.log('No product data found.');
                    setProducts([]); // Optional: clear products if nothing is found
                }

                setStockLoader(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setStockLoader(false); // ensure darazLoader stops even on error
            });
    }, [reloadScreen])



    const calculateTotalPrice = (products) => {
        return products?.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);
    };

    useEffect(() => {
        setTotalPrice(calculateTotalPrice(products));
    }, [products,reloadScreen]);



    useEffect(()=>{

    },[reloadScreen])

    return (
        <ScrollView    refreshControl={
            <RefreshControl refreshing={screenloader} onRefresh={()=>{
                setScreenloader(true)
                setReloadScreen(!reloadScreen)}} />
          } 
          contentContainerStyle={styles.container}>

            <HomeHeader  />
            <SelectStore />
            <TotalBusinessComp businessValue={'500,000'} />
            <View style={{ rowGap: 16 }}>
                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualValueComp loader={darazLoader} onPress={navigateDaraz} amount={allOrdersTotal+total} label={AppStrings.daraz} info={AppStrings.darazInfo} />
                    <IndividualValueComp loader={stockLoader}  onPress={navigateStock} amount={totalPrice} label={AppStrings.stock} info={AppStrings.stockInfo} />
                </View>
                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualValueComp loader={false}  onPress={navigateCash} amount={25000} label={AppStrings.cash} info={AppStrings.cashInfo} />
                    <IndividualValueComp loader={false}  onPress={navigatePackaging} amount={25000} label={AppStrings.packaging} info={AppStrings.packagingInfo} />
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: AppColors.bgcolor,
        rowGap: 16,

    },

});

export default HomeScreen;
