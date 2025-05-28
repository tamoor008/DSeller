import React, { useState } from 'react';
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


const AddNewItem = ({ setIsvisible }) => {
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')

    const isFormValid = productName && productDescription && quantity && price;


    return (
        <Modal transparent>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={styles.container}>
                    <View style={{ backgroundColor: AppColors.white, padding: 16, borderRadius: 16, rowGap: 16 }}>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold }}>{AppStrings.addnewitem}</TextComp>
                        <View style={{ alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
                            <View style={{ width: 100, height: 100, elevation: 5, backgroundColor: AppColors.white, borderRadius: 100, alignItems: 'center', justifyContent: 'center' }}>
                                <Image style={{ width: 32, height: 32, }} source={AppImages.addimage} />

                            </View>
                            <TouchableOpacity activeOpacity={0.9} style={{ width: 30, height: 30, borderWidth: 1, borderColor: AppColors.border, backgroundColor: AppColors.white, borderRadius: 100, alignItems: 'center', justifyContent: 'center', position: 'absolute', zIndex: 100, elevation: 6, right: 0, bottom: 0 }}>
                                <Image style={{ width: 16, height: 16, }} source={AppImages.upload} />
                            </TouchableOpacity>
                        </View>
                        <TextInputComp cumpolsury={true} size={16} placeHolder={AppStrings.productname} text={productName} setText={setProductName} />
                        <TextInputComp cumpolsury={false} size={16} placeHolder={AppStrings.productDescription} text={productDescription} setText={setProductDescription} />
                        <TextInputComp cumpolsury={true} size={16} placeHolder={AppStrings.quantity} text={quantity} setText={setQuantity} />
                        <TextInputComp cumpolsury={true} size={16} placeHolder={AppStrings.price} text={price} setText={setPrice} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 16 }}>
                            <TouchableOpacity onPress={()=>setIsvisible(false)} activeOpacity={0.9} style={{ flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black80, textAlign: 'center' }}>{AppStrings.cancel}</TextComp>

                            </TouchableOpacity>

                            <TouchableOpacity disabled={!isFormValid} activeOpacity={0.9} style={{ flex: 1, backgroundColor: isFormValid ? AppColors.primaryOrange : AppColors.black, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'center' }}>{AppStrings.add}</TextComp>
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

export default AddNewItem;
