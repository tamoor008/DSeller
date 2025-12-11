import React, { useState } from 'react';
import {
    Keyboard,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import TextInputComp from '../../components/TextInputComp';
import { getDatabase, ref } from '@react-native-firebase/database';
import { getAuth } from '@react-native-firebase/auth';
import DropDownPicker from 'react-native-dropdown-picker';
//heheh

const AddNewItem = ({ setIsvisible }) => {
    const { theme } = useTheme();
    const auth = getAuth()
    const currentUser = auth.currentUser
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')
    const addProductRef = ref(getDatabase(), `users/${currentUser.uid}/products`);


    const addItem = () => {

        console.log('ADD ITEM');

        addProductRef.push({
            productName: productName,
            productDescription: productDescription,
            quantity: quantity,
            price: price,
            unit:value
        }).then(() => {
            setProductName('')
            setProductDescription('')
            setQuantity('')
            setPrice('')
            setValue(null)

        });
    }

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(null);
    const [items, setItems] = useState([
        { label: 'Kg', value: 'kg' },
        { label: 'Liter', value: 'liter' },
        { label: 'Gram', value: 'gram' },
        { label: 'Mili liter (ml)', value: 'ml' },
        { label: 'Unit', value: 'unit' },


    ]);
    const isFormValid = productName && quantity && price && value;
    const styles = getStyles(theme);

    return (
        <Modal transparent>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={styles.container}>
                    <View style={styles.modalContent}>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary }}>{AppStrings.addnewitem}</TextComp>
                        <View style={{ alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
                            <View style={styles.imageContainer}>
                                <Icon name="image-outline" size={32} color={theme.textSecondary} />
                            </View>
                            <TouchableOpacity activeOpacity={0.9} style={styles.uploadButton}>
                                <Icon name="cloud-upload-outline" size={16} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <TextInputComp cumpolsury={true} size={16} placeHolder={AppStrings.productname} text={productName} setText={setProductName} />
                        <DropDownPicker 
                            placeholder={'Select Measuring Unit'}
                            open={open}
                            value={value}
                            items={items}
                            setOpen={setOpen}
                            setValue={setValue}
                            setItems={setItems}
                        />
                        <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: theme.textSecondary }}>{AppStrings.itsveryimportanttoselecttherightunitbecauseitwillbeliinkedtoyourproductsondarazanditcancauseissueswiththat}</TextComp>

                        <TextInputComp cumpolsury={false} size={16} placeHolder={AppStrings.productDescription} text={productDescription} setText={setProductDescription} />
                        <TextInputComp keyboardType={'numeric'} cumpolsury={true} size={16} placeHolder={AppStrings.quantity} text={quantity} setText={setQuantity} />
                        <TextInputComp keyboardType={'numeric'} cumpolsury={true} size={16} placeHolder={AppStrings.price + ' / ' + value} text={price} setText={setPrice} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 16 }}>
                            <TouchableOpacity onPress={() => setIsvisible(false)} activeOpacity={0.9} style={styles.cancelButton}>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textSecondary, textAlign: 'center' }}>{AppStrings.cancel}</TextComp>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={addItem} disabled={!isFormValid} activeOpacity={0.9} style={[styles.addButton, { backgroundColor: isFormValid ? theme.primaryOrange : theme.border }]}>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.white, textAlign: 'center' }}>{AppStrings.add}</TextComp>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        rowGap: 16,
        justifyContent: 'center'
    },
    modalContent: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 16,
        rowGap: 16
    },
    imageContainer: {
        width: 100,
        height: 100,
        elevation: 5,
        backgroundColor: theme.card,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center'
    },
    uploadButton: {
        width: 30,
        height: 30,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        zIndex: 100,
        elevation: 6,
        right: 0,
        bottom: 0
    },
    cancelButton: {
        flex: 1,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4
    },
    addButton: {
        flex: 1,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4
    },
    textStyle: {
        fontFamily: FontFamilty.regular,
        color: theme.textSecondary,
    }
});

export default AddNewItem;
