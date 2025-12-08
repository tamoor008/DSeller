import React, { useState, useEffect } from 'react';
import {
    Image,
    Keyboard,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { AppColors } from '../../../constants/AppColors';
import { AppImages } from '../../../constants/AppImages';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import TextInputComp from '../../components/TextInputComp';
import database from '@react-native-firebase/database';
import { getAuth } from '@react-native-firebase/auth';

const EditPrice = ({ setIsvisible, product }) => {
    const auth = getAuth()
    const currentUser = auth.currentUser
    const [price, setPrice] = useState('')

    useEffect(() => {
        if (product) {
            setPrice(product.price?.toString() || '')
        }
    }, [product])

    const updatePrice = () => {
        if (!product || !product.id || !currentUser) return;

        const productRef = database().ref(`users/${currentUser.uid}/products/${product.id}`);
        
        productRef
            .update({
                price: parseFloat(price) || 0
            })
            .then(() => {
                console.log('Price updated successfully');
                setIsvisible(false);
            })
            .catch(error => {
                console.error('Error updating price:', error);
            });
    }

    const isFormValid = price && !isNaN(parseFloat(price)) && parseFloat(price) >= 0;

    if (!product) return null;

    return (
        <Modal transparent>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={styles.container}>
                    <View style={{ backgroundColor: AppColors.white, padding: 16, borderRadius: 16, rowGap: 16 }}>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold }}>{AppStrings.editprice}</TextComp>
                        <TextComp size={14} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80 }}>{product.productName}</TextComp>
                        <TextInputComp 
                            keyboardType={'numeric'} 
                            cumpolsury={true} 
                            size={16} 
                            placeHolder={`${AppStrings.price} / ${product.unit || 'unit'}`} 
                            text={price} 
                            setText={setPrice} 
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 16 }}>
                            <TouchableOpacity onPress={() => setIsvisible(false)} activeOpacity={0.9} style={{ flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black80, textAlign: 'center' }}>{AppStrings.cancel}</TextComp>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={updatePrice} 
                                disabled={!isFormValid} 
                                activeOpacity={0.9} 
                                style={{ flex: 1, backgroundColor: isFormValid ? AppColors.primaryOrange : AppColors.black, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                            >
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'center' }}>{AppStrings.save}</TextComp>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: AppColors.black25,
        rowGap: 16,
        justifyContent: 'center'
    },
    textStyle: {
        fontFamily: FontFamilty.regular,
        color: AppColors.black80,
    }
});

export default EditPrice;

