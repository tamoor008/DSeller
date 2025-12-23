import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import { SampleImages } from '../../../constants/SampleImages';
import AddNewItem from './AddNewItem';
import UpdateStock from './UpdateStock';
import EditPrice from './EditPrice';

import { auth } from '../../../../firebase';
import { getBaseUrl } from '../../../utils/api/baseUrl';


const StockTab = ({ }) => {
    const { theme } = useTheme();
    const currentUser = auth.currentUser
    const BASE_URL = getBaseUrl();
    const [products, setProducts] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0)
    const [loader, setLoader] = useState(false)
    const [isVisible, setIsvisible] = useState(false)
    const [updatestock, setUpdateStock] = useState(false)
    const [editPriceVisible, setEditPriceVisible] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)

    useEffect(() => {
        if (!currentUser) return;
        
        const fetchProducts = async () => {
            try {
                setLoader(true);
                const response = await fetch(`${BASE_URL}/api/products/${currentUser.uid}`);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Error fetching products:', errorData.error || 'Unknown error');
                    setProducts([]);
                    setLoader(false);
                    return;
                }

                const result = await response.json();
                if (result.error) {
                    console.error('API returned error:', result.error);
                    setProducts([]);
                    setLoader(false);
                    return;
                }

                console.log('Products fetched:', result.data);
                setProducts(result.data || []);
                setLoader(false);
            } catch (error: any) {
                console.error('Error fetching products:', error.message);
                setProducts([]);
                setLoader(false);
            }
        };

        fetchProducts();
    }, [isVisible, updatestock, editPriceVisible, currentUser, BASE_URL])



    // Calculate stock total using backend API
    const calculateTotalPrice = async (productsList: any[]) => {
        if (!productsList || productsList.length === 0) {
            setTotalPrice(0);
            return;
        }

        try {
            const BASE_URL = getBaseUrl();
            
            const response = await fetch(`${BASE_URL}/api/stock/calculate-total`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products: productsList.map(item => ({
                        price: item.price,
                        quantity: item.quantity,
                        ...item,
                    })),
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (!result.error && result.data?.summary) {
                    setTotalPrice(result.data.summary.totalStockValue);
                    return;
                }
            }
        } catch (error: any) {
            console.error('[StockTab] Error calculating stock total:', error.message);
        }

        // If API fails, set to 0 (no client-side fallback)
        setTotalPrice(0);
    };

    useEffect(() => {
        calculateTotalPrice(products);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products]);

    const rotation = useRef(new Animated.Value(0)).current;
    const optionAnim = useRef(new Animated.Value(0)).current;
    const [expanded, setExpanded] = useState(false);

    const rotateInterpolate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const optionTranslateY = optionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
    });

    const optionOpacity = optionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const toggleOptions = () => {
        setExpanded(true)
        Animated.parallel([
            Animated.timing(rotation, {
                toValue: expanded ? 0 : 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(optionAnim, {
                toValue: expanded ? 0 : 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (expanded) {
                setExpanded(false)
            }
        });
    };

    const formatPrice = (value) => {
        if (value == null) return '';

        const num = typeof value === 'string' ? Number(value) : value;

        if (isNaN(num)) return '';

        return Math.round(num * 100) % 100 === 0
            ? Math.round(num).toString()
            : num.toFixed(2);
    };





    return (

        <View style={{ rowGap: 16, flex: 1, backgroundColor: theme.bgcolor }}>

            <View style={styles.container}>


            </View>



            {loader ?
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bgcolor }}>
                    <ActivityIndicator color={theme.primaryOrange} size={'large'}></ActivityIndicator>
                </View>
                :
                <View style={{ flex: 1, backgroundColor: theme.bgcolor }}>
                    {products.length > 0 ?
                        <View style={{ backgroundColor: theme.card, elevation: 0, borderRadius: 4, zIndex: 0, borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: theme.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 2, }}>{AppStrings.name}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.up}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
                                {products?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: index === products.length - 1 ? 0 : 1, borderColor: theme.border, paddingVertical: 16 }} key={index}>
                                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', borderRadius: 100 }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: theme.textPrimary }}>{item.productName}</TextComp>
                                    </View>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setSelectedProduct(item);
                                            setEditPriceVisible(true);
                                        }}
                                        activeOpacity={0.7}
                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 4 }}
                                    >
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textPrimary, textAlign: 'center' }}>{'Rs ' + formatPrice(item.price)+'/'+item.unit}</TextComp>
                                        <Icon name="create-outline" size={14} color={theme.primaryOrange} />
                                    </TouchableOpacity>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textPrimary, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textSecondary, textAlign: 'right' }}>{'Rs'}</TextComp>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary, textAlign: 'right' }}>  {formatPrice(item.totalValue || 0)}</TextComp>
                                    </View>

                                </View>)}
                            </ScrollView>

                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: theme.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 2, }}>{AppStrings.total}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.white, textAlign: 'right' }}>{formatPrice(totalPrice)}</TextComp>
                                </View>
                            </View>
                        </View> :
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bgcolor }}>
                            <TextComp size={16} numberOfLines={1} style={{ fontFamily: FontFamilty.semibold, textAlign:'center', color: theme.textPrimary }}>{AppStrings.therearenoproductsaddnewproductstoseethemhere}</TextComp>

                        </View>}
                </View>
            }

            <View style={{ justifyContent: 'flex-end', alignItems: 'flex-end', rowGap: 16, elevation: 11, shadowColor: 'transparent' }}>
                {expanded && (
                    <Animated.View
                        style={{
                            opacity: optionOpacity,
                            transform: [{ translateY: optionTranslateY }],
                            marginBottom: 16,
                            columnGap: 8,
                            alignItems: 'flex-end',
                            justifyContent: 'flex-end',
                            rowGap: 16,
                            backgroundColor: theme.bgcolor,

                            shadowColor: 'transparent'


                        }}
                    >
                        <TouchableOpacity onPress={() => setUpdateStock(true)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, marginEnd: 16 }}>
                            <TextComp numberOfLines={1} size={14} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary }}>{AppStrings.updatestock}</TextComp>
                            <View style={{ backgroundColor: theme.orange20, borderRadius: 100, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', }}>
                                <Icon name="create-outline" size={24} color={theme.primaryOrange} />
                            </View>
                        </TouchableOpacity>


                        <TouchableOpacity onPress={() => setIsvisible(true)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, marginEnd: 16 }}>
                            <TextComp numberOfLines={1} size={14} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary }}>{AppStrings.addnewproduct}</TextComp>
                            <View style={{ backgroundColor: theme.orange20, borderRadius: 100, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', }}>
                                <Icon name="add-circle-outline" size={24} color={theme.primaryOrange} />
                            </View>
                        </TouchableOpacity>

                    </Animated.View>
                )}


                <TouchableOpacity activeOpacity={0.9} onPress={toggleOptions} style={{ backgroundColor: theme.primaryOrange, borderRadius: 100, width: 75, height: 75, alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View
                        style={{
                            transform: [{ rotate: rotateInterpolate }],
                        }}
                    >
                        <Icon name="add" size={25} color={theme.white} />
                    </Animated.View>
                </TouchableOpacity>

            </View>

            {isVisible && (
                <AddNewItem setIsvisible={setIsvisible} />
            )}

            {updatestock && (
                <UpdateStock setIsvisible={setUpdateStock} />
            )}

            {editPriceVisible && selectedProduct && (
                <EditPrice setIsvisible={(value) => {
                    setEditPriceVisible(value);
                    if (!value) {
                        setSelectedProduct(null);
                    }
                }} product={selectedProduct} />
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

export default StockTab;
