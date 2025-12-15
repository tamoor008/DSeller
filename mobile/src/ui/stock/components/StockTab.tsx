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

import { ref, onValue, off, get } from 'firebase/database';
import { auth, database } from '../../../../firebase';


const StockTab = ({ }) => {
    const { theme } = useTheme();
    const currentUser = auth.currentUser
    const [products, setProducts] = useState([]);
    const productRef = ref(database, `users/${currentUser?.uid}/products`);
    const [totalPrice, setTotalPrice] = useState(0)
    const [loader, setLoader] = useState(false)
    const [isVisible, setIsvisible] = useState(false)
    const [updatestock, setUpdateStock] = useState(false)
    const [editPriceVisible, setEditPriceVisible] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)

    useEffect(() => {
        if (!currentUser) return;
        
        setLoader(true)
        get(productRef)
            .then(snapshot => {
                console.log('User data: ', snapshot.val());

                const data = snapshot.val();

                if (data) {
                    const array = Object.entries(data).map(([id, value]: [string, any]) => ({
                        id,
                        ...value,
                    }));
                    console.log('User data array: ', array);
                    setProducts(array);
                } else {
                    console.log('No product data found.');
                    setProducts([]); // Optional: clear products if nothing is found
                }

                setLoader(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setLoader(false); // ensure loader stops even on error
            });
    }, [isVisible, updatestock, editPriceVisible, currentUser])



    const calculateTotalPrice = (products) => {
        return products?.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);
    };

    useEffect(() => {
        setTotalPrice(calculateTotalPrice(products));
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
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary, textAlign: 'right' }}>  {formatPrice(item.price * item.quantity)}</TextComp>
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
