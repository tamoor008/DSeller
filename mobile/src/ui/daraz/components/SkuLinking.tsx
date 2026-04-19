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
import { auth } from '../../../../firebase';
import DropDownPicker from 'react-native-dropdown-picker';
import { getBaseUrl } from '../../../utils/api/baseUrl';


const SkuLinking = ({
    setIsvisible,
    selectedSku,
    onSuccess
}: {
    setIsvisible: (visible: boolean) => void;
    selectedSku: any;
    onSuccess?: (data: any) => void;
}) => {
    const { theme } = useTheme();
    const currentUser = auth.currentUser
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')
    const [packagingPrice, setPackagingPrice] = useState('')
    const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
    const BASE_URL = getBaseUrl();

    const [selectedProduct, setSelectedProduct] = useState<any>({})
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const resolvedUnitPrice = Number(price || selectedProduct?.price || 0);

    // Define fetchProduct using useCallback to fetch from backend API
    const fetchProduct = useCallback(async (id: string) => {

        if (!id || !currentUser) {
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/products/${currentUser.uid}/${id}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setSelectedProduct({});
                return;
            }

            const result = await response.json();

            if (result.error) {
                setSelectedProduct({});
                return;
            }

            const product = result.data;

            setSelectedProduct(product);
            const fetchedPrice = Number(product?.price || 0);

            // ALWAYS use the fetched product unit price. 
            // selectedSku.unitPrice incorrectly holds the SKU's total price 
            // from the backend, instead of the per-gram unit price.
            setPrice(fetchedPrice > 0 ? fetchedPrice.toString() : '');

            // Recalculate price when product changes
            if (quantity) {
                calculateSkuPrice(fetchedPrice, quantity, packagingPrice);
            }
        } catch (error: any) {
            setSelectedProduct({});
        }
    }, [currentUser, BASE_URL, selectedSku]);

    // Initialize quantity and pre-select product if selectedSku has productId
    useEffect(() => {

        if (selectedSku?.productQuantity) {
            setQuantity(selectedSku.productQuantity.toString());
        }

        if (selectedSku?.packagingPrice !== undefined && selectedSku?.packagingPrice !== null) {
            setPackagingPrice(selectedSku.packagingPrice.toString());
        }

        // Removed setPrice(selectedSku.unitPrice) here because it holds the TOTAL price 
        // instead of the product's unit price. We will rely on fetchProduct to populate the unit price.

        // If selectedSku already has a productId, pre-select it and fetch the product
        if (selectedSku?.productId && currentUser && selectedSku.productId !== 0) {
            setValue(selectedSku.productId);
            fetchProduct(selectedSku.productId);
        }
    }, [selectedSku, currentUser, fetchProduct]);

    // Fetch product when value changes
    useEffect(() => {

        if (value && currentUser) {
            fetchProduct(value);
        } else {
        }
    }, [value, currentUser, fetchProduct]);

    // Calculate SKU price using backend API
    const calculateSkuPrice = useCallback(async (unitPrice: number, qty: string, packaging: string = '') => {
        if (!unitPrice || !qty) {
            setCalculatedPrice(0);
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/skus/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quantity: qty,
                    unitPrice: unitPrice,
                    packagingPrice: packaging || '0',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return;
            }

            const result = await response.json();

            if (result.error) {
                return;
            }

            setCalculatedPrice(result.data.totalPrice);
        } catch (error: any) {
        }
    }, [BASE_URL]);

    // Recalculate price when quantity, product price, or packaging price changes
    useEffect(() => {
        if (resolvedUnitPrice && quantity) {
            calculateSkuPrice(resolvedUnitPrice, quantity, packagingPrice);
        } else {
            setCalculatedPrice(0);
        }
    }, [quantity, resolvedUnitPrice, packagingPrice, calculateSkuPrice]);

    // Fetch products list from backend API
    useEffect(() => {
        if (!currentUser) return;

        const fetchProducts = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/products/${currentUser.uid}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    return;
                }

                const result = await response.json();

                if (result.error) {
                    return;
                }

                if (result.data && Array.isArray(result.data)) {
                    setItems(result.data);
                }
            } catch (error: any) {
            }
        };

        fetchProducts();
    }, [currentUser, BASE_URL]);

    const updateSku = async () => {
        if (!value || !currentUser) {
            return;
        }

        const quantityNum = quantity || selectedSku.productQuantity || '0';

        try {
            // Use backend API to calculate and update SKU (handles all calculations server-side)
            const response = await fetch(`${BASE_URL}/api/skus/${currentUser.uid}/${selectedSku.sku}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: value,
                    quantity: quantityNum,
                    productName: (selectedProduct as any)?.productName || '',
                    packagingPrice: packagingPrice || '0',
                    unitPrice: price || selectedProduct?.price || '0',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return;
            }

            const result = await response.json();

            if (result.error) {
                console.error('[SkuLinking] API returned error:', result.error);
                return;
            }

            if (onSuccess) {
                onSuccess(result.data);
            }

            setValue(null);
            setQuantity('');
            setPrice('');
            setPackagingPrice('');
            setCalculatedPrice(0);
            setIsvisible(false);
        } catch (error: any) {
        }
    };


    const isFormValid = value && quantity && resolvedUnitPrice > 0




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
                                // Explicitly fetch product when dropdown value changes
                                if (selectedId && currentUser) {
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
                                    setText={(text: string) => {
                                        setQuantity(text);
                                        if (resolvedUnitPrice) {
                                            calculateSkuPrice(resolvedUnitPrice, text, packagingPrice);
                                        }
                                    }}
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
                                    text={price}
                                    setText={(text: string) => {
                                        setPrice(text);
                                        if (quantity) {
                                            const unit = Number(text || 0);
                                            if (unit > 0) {
                                                calculateSkuPrice(unit, quantity, packagingPrice);
                                            } else {
                                                setCalculatedPrice(0);
                                            }
                                        }
                                    }}
                                    secureTextEntry={false}
                                />
                                <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: theme.textSecondary }} numberOfLines={1}>{' /  ' + ((selectedProduct as any)?.unit || '')}</TextComp>
                            </View>
                        </View>

                        <View style={{ rowGap: 8 }}>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary }} numberOfLines={1}>Packaging Price (Rs.)</TextComp>

                            <View style={{ flexDirection: 'row', columnGap: 16, alignItems: 'center' }}>
                                <TextInputComp
                                    style={{ flex: 1 }}
                                    keyboardType={'numeric'}
                                    cumpolsury={false}
                                    size={16}
                                    placeHolder={'Packaging Price'}
                                    text={packagingPrice}
                                    setText={(text: string) => {
                                        setPackagingPrice(text);
                                        if (resolvedUnitPrice && quantity) {
                                            calculateSkuPrice(resolvedUnitPrice, quantity, text);
                                        }
                                    }}
                                    secureTextEntry={false}
                                />
                                <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: theme.textSecondary }} numberOfLines={1}>per SKU</TextComp>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', columnGap: 8, alignItems: 'center' }}>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: theme.textPrimary }} numberOfLines={1}>{'SKU Price'}</TextComp>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: theme.primaryOrange }} numberOfLines={1}>
                                {calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '0.00'}
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
