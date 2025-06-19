import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppImages } from '../../../constants/AppImages';
import { AppColors } from '../../../constants/AppColors';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import { SampleImages } from '../../../constants/SampleImages';
import AddNewItem from './AddNewItem';
import UpdateStock from './UpdateStock';

import database from '@react-native-firebase/database';


const StockTab = ({ }) => {
    const [products, setProducts] = useState([]);
    const productRef = database().ref('/products');
    const [totalPrice, setTotalPrice] = useState(0)
    const [loader, setLoader] = useState(false)
    const [isVisible, setIsvisible] = useState(false)
    const [updatestock, setUpdateStock] = useState(false)

    useEffect(() => {
        setLoader(true)
        productRef
            .once('value')
            .then(snapshot => {
                console.log('User data: ', snapshot.val());
                const array = Object.entries(snapshot.val()).map(([id, value]) => ({
                    id, // this is the Firebase-generated key
                    ...value,
                }));
                console.log('User data array: ', array);

                setProducts(array)
                setLoader(false)
            });
    }, [isVisible, updatestock])






    const [options, setOptions] = useState(false)
    const onInfoPress = () => {
        setIsvisible(true)
    }

    const [orders, setOrders] = useState({
        totalPrice: 0,
        totalQuantity: 0,
        stock: [
            { id: 0, img: SampleImages.cx08, product: 'Chia Seeds', quantity: 2, price: 1600 },
            { id: 0, img: SampleImages.cx08, product: 'Memo CX07', quantity: 2, price: 1600 },
            { id: 0, img: SampleImages.cx08, product: 'Memo CX08', quantity: 2, price: 1600 },
        ],

    });


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

        <View style={{ rowGap: 16, flex: 1 }}>

            <View style={styles.container}>


            </View>



            {loader ?
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator></ActivityIndicator>
                </View>
                :
                <View style={{ flex: 1 }}>
                    <View style={{ backgroundColor: AppColors.white, elevation: 0, borderRadius: 4, zIndex: 0, borderLeftWidth: 1, borderRightWidth: 1, borderColor: AppColors.black25, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                            <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.name}</TextComp>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.up}</TextComp>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
                            {products?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: index === products.length - 1 ? 0 : 1, borderColor: AppColors.black25, paddingVertical: 16 }} key={index}>
                                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', borderRadius: 100 }}>

                                    {/* <Image
                                style={{ width: 32, height: 32, borderRadius: 100 }}
                                source={
                                    item.image_url
                                        ? { uri: item.image_url }
                                        : AppImages.addproduct // Update the path based on your file location
                                }
                            /> */}

                                    <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: AppColors.black }}>{item.productName}</TextComp>
                                </View>
                                <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{'Rs ' + formatPrice(item.price)}</TextComp>
                                <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs'}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>  {formatPrice(item.price * item.quantity)}</TextComp>
                                </View>

                            </View>)}
                        </ScrollView>

                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                            <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{formatPrice(totalPrice)}</TextComp>
                            </View>
                        </View>
                    </View>
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
                            backgroundColor: AppColors.bgcolor,

                            shadowColor: 'transparent'


                        }}
                    >
                        <TouchableOpacity onPress={() => setUpdateStock(true)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, marginEnd: 16 }}>
                            <TextComp numberOfLines={1} size={14} style={{ fontFamily: FontFamilty.semibold }}>{AppStrings.updatestock}</TextComp>
                            <View style={{ backgroundColor: AppColors.orange20, borderRadius: 100, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', }}>
                                <Image style={{ width: 24, height: 24 }} source={AppImages.updatestock} />
                            </View>
                        </TouchableOpacity>


                        <TouchableOpacity onPress={() => setIsvisible(true)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, marginEnd: 16 }}>
                            <TextComp numberOfLines={1} size={14} style={{ fontFamily: FontFamilty.semibold }}>{AppStrings.addnewproduct}</TextComp>
                            <View style={{ backgroundColor: AppColors.orange20, borderRadius: 100, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', }}>
                                <Image style={{ width: 24, height: 24 }} source={AppImages.addproduct} />
                            </View>
                        </TouchableOpacity>

                    </Animated.View>
                )}


                <TouchableOpacity activeOpacity={0.9} onPress={toggleOptions} style={{ backgroundColor: AppColors.primaryOrange, borderRadius: 100, width: 75, height: 75, alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.Image
                        source={AppImages.plus}
                        style={{
                            width: 25,
                            height: 25,
                            transform: [{ rotate: rotateInterpolate }],
                        }}
                    />
                </TouchableOpacity>

            </View>

            {isVisible && (
                <AddNewItem setIsvisible={setIsvisible} />
            )}

            {updatestock && (
                <UpdateStock setIsvisible={setUpdateStock} />
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
