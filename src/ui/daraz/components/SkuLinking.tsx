import React, { useEffect, useState } from 'react';
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
import DropDownPicker from 'react-native-dropdown-picker';


const SkuLinking = ({ setIsvisible,selectedSku }) => {
    const auth = getAuth()
    const currentUser = auth.currentUser
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')
    const updateSKUref = database().ref(`users/${currentUser.uid}/skusList/${selectedSku.sku}`);
    const productRef = database().ref(`users/${currentUser.uid}/products`);

    const [selectedProduct, setSelectedProduct] = useState({})

    useEffect(() => {
        productRef
            .once('value')
            .then(snapshot => {

                const data = snapshot.val();
                // console.log(data,'firebase data about skus');


                if (data) {
                    const array = Object.entries(data).map(([id, value]) => ({
                        id,
                        ...value,
                    }));
                    // console.log(array,'firebase incominng array');

                    setItems(array);
                }

            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }, [])

    const fetchProduct = (id) => {
        console.log(id);

        if (!id) return;
        productRef.child(id)
            .once('value')
            .then(snapshot => {

                const data = snapshot.val();
                console.log(data);
                setSelectedProduct(data)

            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    const updateSku = () => {
     
      
        const updates = {
          price: quantity * selectedProduct.price, // or any field(s) you want to change
          productId:value,
          productQuantity:quantity,
          productName:selectedProduct.productName
        };
      
        updateSKUref
          .update(updates)
          .then(() => {
            console.log('SKU updated');
            setValue(null);
            setQuantity('');
            setIsvisible(false)
          })
          .catch(error => {
            console.error('Error updating SKU:', error);
          });
      };
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(null);
    const [items, setItems] = useState([
    ]);


    const isFormValid = value && quantity 

    console.log(selectedSku,'selectedSku');
    


    return (
        <Modal transparent>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={styles.container}>
                    <View style={{ backgroundColor: AppColors.white, padding: 16, borderRadius: 16, rowGap: 16 }}>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold }}>{AppStrings.updateSku +' '+ selectedSku.sku}</TextComp>

                        <DropDownPicker
                            schema={{
                                label: 'productName',
                                value: 'id'
                            }}
                            onChangeValue={() => fetchProduct(value)
                            }
                            placeholder={'Select Product'}
                            open={open}
                            value={value}
                            items={items}
                            setOpen={setOpen}
                            setValue={setValue}
                            setItems={setItems}
                        />


                      
                        {/* <TextInputComp keyboardType={'numeric'} cumpolsury={true} size={16} placeHolder={AppStrings.quantity} text={quantity} setText={setQuantity} /> */}
                        <View style={{rowGap:8}}>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black }}>{AppStrings.quantity}</TextComp>

                        <View style={{ flexDirection: 'row', columnGap: 16, alignItems: 'center' }}>
                            <TextInputComp keyboardType={'numeric'} style={{ flex: 1 }} cumpolsury={false} size={16} placeHolder={'Quantity'} text={selectedSku.productQuantity?selectedSku.productQuantity:quantity} setText={setQuantity} />
                            <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: AppColors.black80, }}>{selectedProduct.unit + ' / sku'}</TextComp>

                        </View>
                        </View>


                        <View style={{rowGap:8}}>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black }}>{AppStrings.price}</TextComp>

                            <View style={{ flexDirection: 'row', columnGap: 16, alignItems: 'center' }}>
                                <TextInputComp editable={false} style={{ flex: 1 }} keyboardType={'numeric'} cumpolsury={true} size={16} placeHolder={AppStrings.price} text={selectedProduct.price} setText={setPrice} />
                                <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: AppColors.black80, }}>{' /  ' + selectedProduct.unit}</TextComp>

                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', columnGap: 8, alignItems: 'center' }}>

                        <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black, }}>{'SKU Price'}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.primaryOrange, }}>{quantity * selectedProduct.price}</TextComp>

</View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 16 }}>
                            <TouchableOpacity onPress={() => setIsvisible(false)} activeOpacity={0.9} style={{ flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black80, textAlign: 'center' }}>{AppStrings.cancel}</TextComp>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={updateSku} disabled={!isFormValid} activeOpacity={0.9} style={{ flex: 1, backgroundColor: isFormValid ? AppColors.primaryOrange : AppColors.black, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
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

export default SkuLinking;
