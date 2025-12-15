import React, { useEffect, useState, useCallback } from 'react';
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
import { useTheme } from '../../../context/ThemeContext';
import { AppImages } from '../../../constants/AppImages';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import TextInputComp from '../../components/TextInputComp';
import { ref, get, set, push } from 'firebase/database';
import { auth, database } from '../../../../firebase';
import DropDownPicker from 'react-native-dropdown-picker';


const SkuLinking = ({ setIsvisible, selectedSku }: { setIsvisible: (visible: boolean) => void; selectedSku: any }) => {
    const { theme } = useTheme();
    const currentUser = auth.currentUser
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')
    const updateSKUref = ref(database, `users/${currentUser?.uid}/skusList/${selectedSku.sku}`);
    const productRef = ref(database, `users/${currentUser?.uid}/products`);

    const [selectedProduct, setSelectedProduct] = useState<any>({})
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    const [items, setItems] = useState<any[]>([]);

    // Define fetchProduct using useCallback to ensure it's stable
    const fetchProduct = useCallback((id: string) => {
        console.log('[SkuLinking] 🔍 fetchProduct CALLED with id:', id);
        console.log('[SkuLinking] 🔍 Current user:', { uid: currentUser?.uid, hasUser: !!currentUser });

        if (!id || !currentUser) {
            console.warn('[SkuLinking] ❌ Cannot fetch product: missing id or currentUser', { id, hasUser: !!currentUser });
            return;
        }
        
        const firebasePath = `users/${currentUser.uid}/products/${id}`;
        console.log('[SkuLinking] 🔍 Fetching from Firebase path:', firebasePath);
        
        const childRef = ref(database, firebasePath);
        get(childRef)
            .then(snapshot => {
                const data = snapshot.val();
                console.log('[SkuLinking] Product data received from Firebase:', {
                    hasData: !!data,
                    raw: data,
                    priceType: typeof data?.price,
                    priceValue: data?.price,
                    productName: data?.productName,
                    unit: data?.unit
                });
                
                if (!data) {
                    console.warn('[SkuLinking] No product data found for ID:', id);
                    setSelectedProduct({});
                    return;
                }
                
                // Normalize price to number - handle both string and number formats
                const priceValue = data.price;
                let normalizedPrice = 0;
                
                if (typeof priceValue === 'string') {
                    normalizedPrice = parseFloat(priceValue) || 0;
                } else if (typeof priceValue === 'number') {
                    normalizedPrice = priceValue;
                } else {
                    normalizedPrice = parseFloat(String(priceValue || '0')) || 0;
                }
                
                const normalizedProduct = {
                    ...data,
                    price: normalizedPrice
                };
                
                console.log('[SkuLinking] Normalized product:', {
                    productName: normalizedProduct.productName,
                    price: normalizedProduct.price,
                    priceType: typeof normalizedProduct.price,
                    unit: normalizedProduct.unit
                });
                
                setSelectedProduct(normalizedProduct);
            })
            .catch(error => {
                console.error('[SkuLinking] Error fetching product data:', error);
                setSelectedProduct({});
            });
    }, [currentUser]);

    // Initialize quantity and pre-select product if selectedSku has productId
    useEffect(() => {
        console.log('[SkuLinking] selectedSku changed:', selectedSku);
        
        if (selectedSku?.productQuantity) {
            setQuantity(selectedSku.productQuantity.toString());
        }
        
        // If selectedSku already has a productId, pre-select it and fetch the product
        if (selectedSku?.productId && currentUser && selectedSku.productId !== 0) {
            console.log('[SkuLinking] Pre-selecting product with ID:', selectedSku.productId);
            setValue(selectedSku.productId);
            fetchProduct(selectedSku.productId);
        }
    }, [selectedSku, currentUser, fetchProduct]);

    // Fetch product when value changes
    useEffect(() => {
        console.log('[SkuLinking] ⚡ useEffect triggered - value changed:', { 
            value, 
            hasCurrentUser: !!currentUser,
            valueType: typeof value,
            valueLength: value?.length
        });
        
        if (value && currentUser) {
            console.log('[SkuLinking] ✅ Conditions met, calling fetchProduct:', value);
            // Use setTimeout to ensure state is updated
            setTimeout(() => {
                fetchProduct(value);
            }, 0);
        } else {
            console.log('[SkuLinking] ❌ Cannot fetch - missing value or currentUser:', { 
                value, 
                hasCurrentUser: !!currentUser,
                valueTruthy: !!value,
                currentUserTruthy: !!currentUser
            });
        }
    }, [value, currentUser, fetchProduct]);

    useEffect(() => {
        if (!currentUser) return;
        
        get(productRef)
            .then(snapshot => {

                const data = snapshot.val();
                // console.log(data,'firebase data about skus');


                if (data) {
                    const array = Object.entries(data).map(([id, value]: [string, any]) => ({
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

    const updateSku = () => {
        if (!value) {
            console.warn('[SkuLinking] Cannot update SKU: no product selected');
            return;
        }
        
        // Parse quantity and price to numbers
        const quantityNum = parseFloat(quantity || selectedSku.productQuantity || '0') || 0;
        const price = selectedProduct?.price;
        let priceNum = 0;
        if (price !== undefined && price !== null) {
            priceNum = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
        }
        const calculatedPrice = quantityNum * priceNum;
        
        console.log('[SkuLinking] updateSku calculation:', {
            quantity: quantityNum,
            price: priceNum,
            calculatedPrice: calculatedPrice,
            productId: value
        });
      
        const updates = {
          price: calculatedPrice,
          productId: value,
          productQuantity: quantityNum.toString(),
          productName: (selectedProduct as any)?.productName || '',
          sku: selectedSku.sku
        };
        
        console.log('[SkuLinking] Updates to save:', updates);
      
        set(updateSKUref, updates)
          .then(() => {
            console.log('[SkuLinking] SKU updated successfully');
            setValue(null);
            setQuantity('');
            setIsvisible(false)
          })
          .catch(error => {
            console.error('[SkuLinking] Error updating SKU:', error);
          });
      };


    const isFormValid = value && quantity 

    console.log('[SkuLinking] Component render:', {
        selectedSku,
        selectedProduct,
        value,
        quantity,
        hasPrice: !!selectedProduct?.price,
        price: selectedProduct?.price
    });
    


    const styles = getStyles(theme);

    return (
        <Modal transparent>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={styles.container}>
                    <View style={styles.modalContent}>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary }} numberOfLines={1}>{'Update SKU' + ' ' + selectedSku.sku}</TextComp>

                        <DropDownPicker
                            schema={{
                                label: 'productName',
                                value: 'id'
                            }}
                            placeholder={'Select Product'}
                            open={open}
                            value={value}
                            items={items}
                            setOpen={setOpen}
                            setValue={setValue}
                            onChangeValue={(selectedId) => {
                                console.log('[SkuLinking] DropDownPicker onChangeValue called:', selectedId);
                                // Explicitly fetch product when dropdown value changes
                                if (selectedId && currentUser) {
                                    console.log('[SkuLinking] Explicitly fetching product from dropdown change:', selectedId);
                                    fetchProduct(selectedId);
                                }
                            }}
                            setItems={setItems}
                        />


                      
                        {/* <TextInputComp keyboardType={'numeric'} cumpolsury={true} size={16} placeHolder={AppStrings.quantity} text={quantity} setText={setQuantity} /> */}
                        <View style={{ rowGap: 8 }}>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary }} numberOfLines={1}>{AppStrings.quantity}</TextComp>

                            <View style={{ flexDirection: 'row', columnGap: 16, alignItems: 'center' }}>
                                <TextInputComp 
                                    keyboardType={'numeric'} 
                                    style={{ flex: 1 }} 
                                    cumpolsury={false} 
                                    size={16} 
                                    placeHolder={'Quantity'} 
                                    text={quantity || (selectedSku.productQuantity ? selectedSku.productQuantity.toString() : '')} 
                                    setText={setQuantity}
                                    secureTextEntry={false}
                                />
                                <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: theme.textSecondary }} numberOfLines={1}>{((selectedProduct as any)?.unit || '') + ' / sku'}</TextComp>
                            </View>
                        </View>

                        <View style={{ rowGap: 8 }}>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary }} numberOfLines={1}>{AppStrings.price}</TextComp>

                            <View style={{ flexDirection: 'row', columnGap: 16, alignItems: 'center' }}>
                                <TextInputComp 
                                    style={{ flex: 1 }} 
                                    keyboardType={'numeric'} 
                                    cumpolsury={true} 
                                    size={16} 
                                    placeHolder={AppStrings.price} 
                                    text={(() => {
                                        const price = selectedProduct?.price;
                                        if (price !== undefined && price !== null) {
                                            const numPrice = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
                                            return numPrice > 0 ? numPrice.toString() : '';
                                        }
                                        return '';
                                    })()} 
                                    setText={setPrice}
                                    secureTextEntry={false}
                                />
                                <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: theme.textSecondary }} numberOfLines={1}>{' /  ' + ((selectedProduct as any)?.unit || '')}</TextComp>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', columnGap: 8, alignItems: 'center' }}>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: theme.textPrimary }} numberOfLines={1}>{'SKU Price'}</TextComp>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: theme.primaryOrange }} numberOfLines={1}>
                                {(() => {
                                    const qty = parseFloat(quantity || selectedSku.productQuantity || '0') || 0;
                                    const price = selectedProduct?.price;
                                    let prc = 0;
                                    if (price !== undefined && price !== null) {
                                        prc = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
                                    }
                                    const total = qty * prc;
                                    console.log('[SkuLinking] SKU Price calculation:', { qty, prc, total, price, selectedProduct });
                                    return isNaN(total) ? '0.00' : total.toFixed(2);
                                })()}
                            </TextComp>
</View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 16 }}>
                            <TouchableOpacity onPress={() => setIsvisible(false)} activeOpacity={0.9} style={styles.cancelButton}>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textSecondary, textAlign: 'center' }} numberOfLines={1}>{AppStrings.cancel}</TextComp>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={updateSku} disabled={!isFormValid} activeOpacity={0.9} style={[styles.addButton, { backgroundColor: isFormValid ? theme.primaryOrange : theme.border }]}>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.white, textAlign: 'center' }} numberOfLines={1}>{AppStrings.add}</TextComp>
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

export default SkuLinking;
