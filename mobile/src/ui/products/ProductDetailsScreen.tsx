import React, { useCallback, useMemo, useState } from 'react';
import {
    Image,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import TextComp from '../components/TextComp';
import SkuLinking from '../daraz/components/SkuLinking';
import { auth } from '../../../firebase';
import { getBaseUrl } from '../../utils/api/baseUrl';

const CALC_DEFAULTS = {
    darazCommission: 10,
    paymentHandlingFee: 2.25,
    vat: 16,
    shippingCharges: 130,
    extraCharges: 0,
    packingPrice: 0,
    freeShippingMax: false,
    voucherMax: false,
    incomeTaxWithholding: true,
    salesTaxWithholding: true,
};

const getOrderHandlingFeeForPrice = (price: number): number => {
    if (price <= 0) return 0;
    if (price <= 500) return 10;
    if (price <= 1000) return 15;
    if (price <= 2000) return 20;
    return 60;
};

const calculateSkuBreakdown = (
    sellingPriceInput: number,
    purchasingPriceInput: number,
    commissionPercentageInput: number = CALC_DEFAULTS.darazCommission
) => {
    const sellingPrice = Number(sellingPriceInput) || 0;
    const purchasingPrice = Number(purchasingPriceInput) || 0;
    const commissionPercentage = Number(commissionPercentageInput) || CALC_DEFAULTS.darazCommission;
    const vatRate = CALC_DEFAULTS.vat / 100;
    const orderHandlingPrice = getOrderHandlingFeeForPrice(sellingPrice);

    const commissionAmount = (sellingPrice * commissionPercentage) / 100;
    const paymentHandlingAmount = (sellingPrice * CALC_DEFAULTS.paymentHandlingFee) / 100;
    const darazCharges = commissionAmount + paymentHandlingAmount;
    const shippingVatCharges = CALC_DEFAULTS.shippingCharges * vatRate;
    const commissionVatCharges = darazCharges * vatRate;
    const freeShippingCharge = CALC_DEFAULTS.freeShippingMax ? sellingPrice * 0.06 : 0;
    const voucherCharge = CALC_DEFAULTS.voucherMax ? sellingPrice * 0.02 : 0;
    const freeShippingVatCharges = freeShippingCharge * vatRate;
    const voucherVatCharges = voucherCharge * vatRate;
    const orderHandlingVatCharges = orderHandlingPrice * vatRate;
    const incomeTaxWithholding = CALC_DEFAULTS.incomeTaxWithholding ? Math.round(sellingPrice * 0.02) : 0;
    const salesTaxWithholding = CALC_DEFAULTS.salesTaxWithholding ? Math.round(sellingPrice * 0.02) : 0;

    const totalChargesExPacking =
        shippingVatCharges +
        commissionVatCharges +
        darazCharges +
        orderHandlingPrice +
        CALC_DEFAULTS.extraCharges +
        freeShippingCharge +
        voucherCharge +
        freeShippingVatCharges +
        voucherVatCharges +
        orderHandlingVatCharges +
        incomeTaxWithholding +
        salesTaxWithholding;

    const net = sellingPrice - totalChargesExPacking;
    const profit = net - purchasingPrice - CALC_DEFAULTS.packingPrice;
    const investmentBase = purchasingPrice + CALC_DEFAULTS.packingPrice;
    const roi = investmentBase > 0 ? (profit / investmentBase) * 100 : 0;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const commissionVatShare = darazCharges > 0 ? (commissionAmount / darazCharges) * commissionVatCharges : 0;
    const paymentHandlingVatShare = darazCharges > 0 ? (paymentHandlingAmount / darazCharges) * commissionVatCharges : 0;

    return {
        sellingPrice,
        purchasingPrice,
        commissionPercentage,
        shippingCharge: CALC_DEFAULTS.shippingCharges,
        commissionAmount,
        paymentHandlingAmount,
        darazCharges,
        shippingVatCharges,
        commissionVatCharges,
        commissionVatShare,
        paymentHandlingVatShare,
        orderHandlingPrice,
        orderHandlingVatCharges,
        freeShippingCharge,
        freeShippingVatCharges,
        voucherCharge,
        voucherVatCharges,
        incomeTaxWithholding,
        salesTaxWithholding,
        totalChargesExPacking,
        net,
        profit,
        roi,
        profitMargin,
    };
};

const formatCurrency = (value: number) => `Rs. ${Number(value || 0).toFixed(2)}`;
const formatPercent = (value: number) => `${Number(value || 0).toFixed(2)}%`;
const formatEpoch = (value: any) => {
    const raw = Number(value || 0);
    if (!raw) return 'N/A';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
};
const formatBreakdown = (base: number, vat?: number) => {
    if (vat && vat > 0) {
        return `${formatCurrency(base)} + ${formatCurrency(vat)} = ${formatCurrency(base + vat)}`;
    }
    return formatCurrency(base);
};

const ProductDetailsScreen = ({ navigation, route }: any) => {
    const { theme } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const currentUser = auth.currentUser;
    const BASE_URL = getBaseUrl();
    const [product, setProduct] = useState<any>(route?.params?.product || null);
    const [refreshing, setRefreshing] = useState(false);
    const [isLinkingModalVisible, setIsLinkingModalVisible] = useState(false);
    const [selectedSkuToLink, setSelectedSkuToLink] = useState<any>(null);
    const [isProfitDetailsModalVisible, setIsProfitDetailsModalVisible] = useState(false);
    const [selectedProfitSku, setSelectedProfitSku] = useState<any>(null);
    const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
    const [imageIndex, setImageIndex] = useState(0);
    const [imagePreviewIndex, setImagePreviewIndex] = useState(0);
    const initialProduct = route?.params?.product || null;
    const attributeEntries = useMemo(() => Object.entries(product?.attributes || {}), [product?.attributes]);
    const variationEntries = useMemo(() => Object.entries(product?.variation || {}), [product?.variation]);
    const productImages = useMemo(() => {
        const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
        return images.length > 0 ? images : ['https://via.placeholder.com/500'];
    }, [product?.images]);
    const mainCarouselWidth = Math.max(screenWidth - 32, 1);

    const fetchDetailedProduct = useCallback(async () => {
        if (!currentUser?.uid || !initialProduct?.item_id) return;
        try {
            const params = new URLSearchParams();
            if (initialProduct?.storeName) {
                params.append('storeName', String(initialProduct.storeName));
            }
            const firstSku = initialProduct?.skus?.[0]?.SellerSku;
            if (firstSku) {
                params.append('sellerSku', String(firstSku));
            }
            const queryString = params.toString();
            const response = await fetch(
                `${BASE_URL}/api/daraz-products/${currentUser.uid}/item/${initialProduct.item_id}${queryString ? `?${queryString}` : ''}`
            );

            if (!response.ok) return;
            const result = await response.json();
            if (result?.data) {
                setProduct(result.data);
            }
        } catch (error) {
            console.warn('⚠️ [ProductDetailsScreen] Failed to fetch detailed product:', (error as any)?.message || error);
        } finally {
            setRefreshing(false);
        }
    }, [currentUser?.uid, initialProduct?.item_id, initialProduct?.storeName, initialProduct?.skus, BASE_URL]);

    React.useEffect(() => {
        fetchDetailedProduct();
    }, [fetchDetailedProduct]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDetailedProduct();
    }, [fetchDetailedProduct]);

    const getSkuPurchasingPrice = (sku: any) =>
        Number(sku?.localSkuTotalPrice ?? sku?.totalPrice ?? sku?.costPrice ?? 0) || 0;

    const getSkuCommissionPercentage = (sku: any) =>
        Number(
            sku?.categoryCommissionPercentage ??
            sku?.categoryCommissionRate ??
            sku?.commissionPercentage ??
            sku?.commissionRate ??
            CALC_DEFAULTS.darazCommission
        ) || CALC_DEFAULTS.darazCommission;

    const estimatedProfit = useMemo(() => {
        const mappedSkus = (product?.skus || []).filter((sku: any) => sku.isMapped);
        if (!mappedSkus.length) return null;

        const profits = mappedSkus.map((sku: any) =>
            calculateSkuBreakdown(
                Number(sku.price) || 0,
                getSkuPurchasingPrice(sku),
                getSkuCommissionPercentage(sku)
            ).profit
        );
        const total = profits.reduce((sum: number, val: number) => sum + val, 0);
        const avg = total / profits.length;
        const min = Math.min(...profits);
        const max = Math.max(...profits);

        return { avg, min, max, count: mappedSkus.length };
    }, [product]);

    const handleMappingSuccess = (updatedSkuData: any) => {
        setProduct((prev: any) => {
            if (!prev) return prev;

            const updatedSkus = (prev.skus || []).map((sku: any) => {
                if (sku.SellerSku !== updatedSkuData.sku) return sku;

                const sellingPrice = Number(sku.price) || 0;
                const purchasingPrice = Number(updatedSkuData.totalPrice ?? updatedSkuData.price) || 0;
                const localUnitPrice =
                    Number(updatedSkuData.unitPrice) ||
                    (Number(updatedSkuData.productQuantity) > 0
                        ? (Number(updatedSkuData.price) || 0) / Number(updatedSkuData.productQuantity)
                        : 0);
                const commissionPercentage = getSkuCommissionPercentage(sku);
                const breakdown = calculateSkuBreakdown(sellingPrice, purchasingPrice, commissionPercentage);

                return {
                    ...sku,
                    isMapped: true,
                    productId: updatedSkuData.productId ?? sku.productId,
                    productName: updatedSkuData.productName ?? sku.productName,
                    productQuantity: updatedSkuData.productQuantity ?? sku.productQuantity,
                    packagingPrice: updatedSkuData.packagingPrice ?? sku.packagingPrice,
                    packagingPriceConfigured: updatedSkuData.packagingPriceConfigured ?? sku.packagingPriceConfigured,
                    localSkuPrice: Number(updatedSkuData.price) || 0,
                    localSkuTotalPrice: purchasingPrice,
                    unitPrice: localUnitPrice,
                    costPrice: purchasingPrice,
                    profit: breakdown.profit,
                    margin: breakdown.profitMargin,
                };
            });

            return {
                ...prev,
                skus: updatedSkus,
            };
        });
    };

    const styles = getStyles(theme);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bgcolor }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />

                </TouchableOpacity>
                <TextComp size={18} style={{ color: theme.textPrimary, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    Product Details
                </TextComp>
            </View>

            {product && (
                <ScrollView
                    contentContainerStyle={styles.body}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primaryOrange}
                            colors={[theme.primaryOrange]}
                        />
                    }
                >
                    <View style={styles.imageCarouselWrap}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(event) => {
                                const nextIndex = Math.round(event.nativeEvent.contentOffset.x / mainCarouselWidth);
                                setImageIndex(nextIndex);
                            }}
                        >
                            {productImages.map((imageUri: string, idx: number) => (
                                <TouchableOpacity
                                    key={`${imageUri}-${idx}`}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        setImagePreviewIndex(idx);
                                        setIsImagePreviewVisible(true);
                                    }}
                                >
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={[styles.image, { width: mainCarouselWidth }]}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {productImages.length > 1 && (
                            <View style={styles.imageDotsRow}>
                                {productImages.map((_: string, idx: number) => (
                                    <View
                                        key={`dot-${idx}`}
                                        style={[styles.imageDot, idx === imageIndex && styles.imageDotActive]}
                                    />
                                ))}
                            </View>
                        )}
                    </View>

                    <TextComp size={18} style={{ color: theme.textPrimary, fontWeight: '700', marginTop: 12 }} numberOfLines={2}>
                        {product.attributes?.name_en || 'Unnamed Product'}
                    </TextComp>
                    <View style={styles.storePill}>
                        <Ionicons name="storefront-outline" size={14} color="#0d5f3b" />
                        <TextComp size={13} style={styles.storePillText} numberOfLines={1}>
                            {product.storeName || 'Unknown Store'}
                        </TextComp>
                    </View>

                    <View style={[styles.infoRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
                        <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                            Item ID: {product.item_id || 'N/A'}
                        </TextComp>
                        <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                            Total SKUs: {(product.skus || []).length}
                        </TextComp>
                    </View>

                    <View style={[styles.infoRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
                        <TextComp size={12} style={{ color: theme.textPrimary, fontWeight: '700' }} numberOfLines={1}>
                            Marketplace Details
                        </TextComp>
                        <View style={styles.metaGrid}>
                            <View style={styles.metaCell}>
                                <TextComp size={10} style={styles.metaLabel} numberOfLines={1}>Status</TextComp>
                                <TextComp size={12} style={styles.metaValue} numberOfLines={2}>{product.status || 'N/A'}</TextComp>
                            </View>
                            <View style={styles.metaCell}>
                                <TextComp size={10} style={styles.metaLabel} numberOfLines={1}>Sub Status</TextComp>
                                <TextComp size={12} style={styles.metaValue} numberOfLines={2}>{product.subStatus || 'N/A'}</TextComp>
                            </View>
                            <View style={styles.metaCell}>
                                <TextComp size={10} style={styles.metaLabel} numberOfLines={1}>Category</TextComp>
                                <TextComp size={12} style={styles.metaValue} numberOfLines={1}>{product.primary_category || 'N/A'}</TextComp>
                            </View>
                            <View style={styles.metaCell}>
                                <TextComp size={10} style={styles.metaLabel} numberOfLines={1}>Created</TextComp>
                                <TextComp size={12} style={styles.metaValue} numberOfLines={2}>{formatEpoch(product.created_time)}</TextComp>
                            </View>
                            <View style={styles.metaCell}>
                                <TextComp size={10} style={styles.metaLabel} numberOfLines={1}>Updated</TextComp>
                                <TextComp size={12} style={styles.metaValue} numberOfLines={2}>{formatEpoch(product.updated_time)}</TextComp>
                            </View>
                            <View style={styles.metaCell}>
                                <TextComp size={10} style={styles.metaLabel} numberOfLines={1}>Suspended SKUs</TextComp>
                                <TextComp size={12} style={styles.metaValue} numberOfLines={1}>{(product.suspendedSkus || []).length}</TextComp>
                            </View>
                        </View>
                    </View>

                    {attributeEntries.length > 0 && (
                        <View style={[styles.infoRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
                            <TextComp size={12} style={{ color: theme.textPrimary, fontWeight: '700' }} numberOfLines={1}>
                                Attributes
                            </TextComp>
                            {attributeEntries.map(([key, value]: any) => (
                                <View key={key} style={styles.lineItem}>
                                    <TextComp size={11} style={styles.lineKey} numberOfLines={1}>{String(key)}</TextComp>
                                    <TextComp size={11} style={styles.lineValue} numberOfLines={3}>
                                        {String(value ?? 'N/A')}
                                    </TextComp>
                                </View>
                            ))}
                        </View>
                    )}

                    {variationEntries.length > 0 && (
                        <View style={[styles.infoRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
                            <TextComp size={12} style={{ color: theme.textPrimary, fontWeight: '700' }} numberOfLines={1}>
                                Variations
                            </TextComp>
                            {variationEntries.map(([key, value]: any) => (
                                <View key={key} style={styles.variationCard}>
                                    <TextComp size={11} style={styles.lineKey} numberOfLines={1}>{String(key)}</TextComp>
                                    <TextComp size={11} style={styles.lineValue} numberOfLines={1}>
                                        Name: {String(value?.name || 'N/A')}
                                    </TextComp>
                                    <TextComp size={11} style={styles.lineValue} numberOfLines={1}>
                                        Label: {String(value?.label || 'N/A')}
                                    </TextComp>
                                    <TextComp size={11} style={styles.lineValue} numberOfLines={1}>
                                        Has Image: {String(value?.has_image || 'N/A')}
                                    </TextComp>
                                </View>
                            ))}
                        </View>
                    )}



                    <View style={{ marginTop: 16, rowGap: 10 }}>
                        {(product.skus || []).map((sku: any, index: number) => {
                            const commissionPercentage = getSkuCommissionPercentage(sku);
                            const purchasingPrice = getSkuPurchasingPrice(sku);
                            const breakdown = calculateSkuBreakdown(
                                Number(sku.price) || 0,
                                purchasingPrice,
                                commissionPercentage
                            );

                            return (
                                <View key={`${sku.SellerSku}-${index}`} style={[styles.skuRow, { backgroundColor: theme.card }]}>
                                    <View style={{ flex: 1 }}>
                                        <TextComp size={13} style={{ color: theme.textPrimary, fontWeight: '700' }} numberOfLines={1}>
                                            {sku.SellerSku}
                                        </TextComp>
                                        <TextComp size={12} style={{ color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                            Daraz: Rs. {Number(sku.price || 0).toFixed(2)}
                                        </TextComp>
                                        <TextComp size={12} style={{ color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                            Product Price: Rs. {Number(sku.unitPrice || 0).toFixed(2)}
                                        </TextComp>
                                        <TextComp size={12} style={{ color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                            SKU Cost (Local): {formatCurrency(purchasingPrice)}
                                        </TextComp>
                                        <View style={styles.skuMetaRow}>
                                            <TextComp size={10} style={styles.skuMetaText} numberOfLines={1}>
                                                Qty: {Number(sku.quantity || 0)}
                                            </TextComp>
                                            <TextComp size={10} style={styles.skuMetaText} numberOfLines={1}>
                                                Status: {sku.Status || 'N/A'}
                                            </TextComp>
                                            <TextComp size={10} style={styles.skuMetaText} numberOfLines={1}>
                                                Special: {Number(sku.special_price || 0) > 0 ? `Rs. ${Number(sku.special_price).toFixed(0)}` : 'No'}
                                            </TextComp>
                                        </View>

                                        {sku.isMapped ? (
                                            <>
                                                <View style={styles.profitBadge}>
                                                    <TextComp size={10} style={styles.profitBadgeLabel} numberOfLines={1}>
                                                        EST. PROFIT
                                                    </TextComp>
                                                    <TextComp size={14} style={styles.profitBadgeValue} numberOfLines={1}>
                                                        {formatCurrency(breakdown.profit)}
                                                    </TextComp>
                                                    <TextComp size={11} style={styles.profitBadgeMeta} numberOfLines={1}>
                                                        Margin: {formatPercent(breakdown.profitMargin)}
                                                    </TextComp>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.detailsBtn}
                                                    onPress={() => {
                                                        setSelectedProfitSku(sku);
                                                        setIsProfitDetailsModalVisible(true);
                                                    }}
                                                >
                                                    <TextComp size={12} style={{ color: theme.primaryOrange, fontWeight: '700' }} numberOfLines={1}>
                                                        See profit details
                                                    </TextComp>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <TextComp size={12} style={{ color: '#FFA500', marginTop: 6 }} numberOfLines={1}>
                                                Not mapped
                                            </TextComp>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.mapBtn, { borderColor: theme.primaryOrange }]}
                                        onPress={() => {
                                            const quantityNum = Number(sku.productQuantity || 0) || 0;
                                            const baseSkuPrice = Number(
                                                sku.localSkuPrice ??
                                                sku.price ??
                                                0
                                            ) || 0;
                                            const prefilledUnitPrice =
                                                Number(sku.unitPrice) ||
                                                (quantityNum > 0 ? baseSkuPrice / quantityNum : 0);

                                            setSelectedSkuToLink({
                                                sku: sku.SellerSku,
                                                productId: sku.productId,
                                                productQuantity: sku.productQuantity,
                                                packagingPrice: sku.packagingPrice,
                                                unitPrice: prefilledUnitPrice,
                                            });
                                            setIsLinkingModalVisible(true);
                                        }}
                                    >
                                        <TextComp size={12} style={{ color: theme.primaryOrange, fontWeight: '700' }} numberOfLines={1}>
                                            {sku.isMapped ? 'Edit SKU Price' : 'Map'}
                                        </TextComp>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            {isLinkingModalVisible && (
                <SkuLinking
                    setIsvisible={(visible) => setIsLinkingModalVisible(visible)}
                    onSuccess={handleMappingSuccess}
                    selectedSku={selectedSkuToLink}
                />
            )}

            <Modal
                visible={isProfitDetailsModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsProfitDetailsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <TextComp size={16} style={{ color: theme.textPrimary, fontWeight: '700' }} numberOfLines={1}>
                                Profitability Details
                            </TextComp>
                            <TouchableOpacity onPress={() => setIsProfitDetailsModalVisible(false)}>
                                <Ionicons name="close" size={22} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {selectedProfitSku && (() => {
                            const commissionPercentage = getSkuCommissionPercentage(selectedProfitSku);
                            const purchasingPrice = getSkuPurchasingPrice(selectedProfitSku);
                            const breakdown = calculateSkuBreakdown(
                                Number(selectedProfitSku.price) || 0,
                                purchasingPrice,
                                commissionPercentage
                            );

                            return (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ rowGap: 8, paddingBottom: 8 }}>
                                    <TextComp size={13} style={{ color: theme.textPrimary, fontWeight: '700' }} numberOfLines={1}>
                                        SKU: {selectedProfitSku.SellerSku}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Selling Price: {formatCurrency(breakdown.sellingPrice)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Purchasing Price: {formatCurrency(breakdown.purchasingPrice)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Shipping Charges (Fixed): {formatCurrency(breakdown.shippingCharge)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Commission Percentage (Category): {formatPercent(breakdown.commissionPercentage)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Commission + VAT: {formatBreakdown(breakdown.commissionAmount, breakdown.commissionVatShare)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Payment Handling + VAT: {formatBreakdown(breakdown.paymentHandlingAmount, breakdown.paymentHandlingVatShare)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Shipping VAT: {formatCurrency(breakdown.shippingVatCharges)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Handling Fee + VAT: {formatBreakdown(breakdown.orderHandlingPrice, breakdown.orderHandlingVatCharges)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Income Tax Withholding: {formatCurrency(breakdown.incomeTaxWithholding)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Sales Tax Withholding: {formatCurrency(breakdown.salesTaxWithholding)}
                                    </TextComp>
                                    <TextComp size={12} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                        Net: {formatCurrency(breakdown.net)}
                                    </TextComp>
                                    <View style={[styles.modalSummary, { backgroundColor: theme.greenbg }]}>
                                        <TextComp size={13} style={{ color: theme.green, fontWeight: '700' }} numberOfLines={1}>
                                            Profit: {formatCurrency(breakdown.profit)} ({formatPercent(breakdown.profitMargin)})
                                        </TextComp>
                                        <TextComp size={13} style={{ color: theme.green, fontWeight: '700' }} numberOfLines={1}>
                                            ROI: {formatPercent(breakdown.roi)}
                                        </TextComp>
                                    </View>
                                </ScrollView>
                            );
                        })()}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={isImagePreviewVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsImagePreviewVisible(false)}
            >
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity
                        style={styles.imageModalClose}
                        onPress={() => setIsImagePreviewVisible(false)}
                    >
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        contentOffset={{ x: imagePreviewIndex * screenWidth, y: 0 }}
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => {
                            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                            setImagePreviewIndex(nextIndex);
                        }}
                    >
                        {productImages.map((imageUri: string, idx: number) => (
                            <Image
                                key={`preview-${imageUri}-${idx}`}
                                source={{ uri: imageUri }}
                                style={[styles.fullImage, { width: screenWidth }]}
                                resizeMode="contain"
                            />
                        ))}
                    </ScrollView>
                    {productImages.length > 1 && (
                        <View style={styles.imageModalDotsRow}>
                            {productImages.map((_: string, idx: number) => (
                                <View
                                    key={`preview-dot-${idx}`}
                                    style={[styles.imageModalDot, idx === imagePreviewIndex && styles.imageModalDotActive]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
        paddingBottom: 8,
        columnGap: 8,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 2,
        paddingVertical: 6,
        paddingRight: 6,
    },
    body: {
        padding: 16,
        paddingBottom: 24,
    },
    image: {
        width: '100%',
        height: 220,
        borderRadius: 12,
    },
    imageCarouselWrap: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageDotsRow: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        columnGap: 6,
    },
    imageDot: {
        width: 7,
        height: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    imageDotActive: {
        backgroundColor: '#fff',
    },
    infoRow: {
        marginTop: 12,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        rowGap: 4,
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 8,
        rowGap: 8,
        marginTop: 6,
    },
    metaCell: {
        width: '48%',
        borderRadius: 8,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    metaLabel: {
        color: '#6b7280',
        fontWeight: '700',
    },
    metaValue: {
        color: '#111827',
        fontWeight: '600',
        marginTop: 2,
    },
    lineItem: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
        paddingTop: 6,
        marginTop: 6,
        rowGap: 2,
    },
    lineKey: {
        color: '#374151',
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    lineValue: {
        color: '#6b7280',
    },
    variationCard: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        padding: 8,
        marginTop: 6,
        rowGap: 2,
    },
    skuRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 12,
        columnGap: 10,
    },
    skuMetaRow: {
        marginTop: 4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 8,
        rowGap: 4,
    },
    skuMetaText: {
        color: '#6b7280',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    mapBtn: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    detailsBtn: {
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        maxHeight: '78%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    modalSummary: {
        marginTop: 8,
        borderRadius: 12,
        padding: 10,
        rowGap: 6,
    },
    profitBadge: {
        marginTop: 8,
        alignSelf: 'flex-start',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#e8f7ee',
        borderWidth: 1,
        borderColor: '#a5dfb9',
        rowGap: 2,
        minWidth: 170,
    },
    profitBadgeLabel: {
        color: '#2f6f46',
        fontWeight: '700',
        letterSpacing: 0.6,
    },
    profitBadgeValue: {
        color: '#1f8f47',
        fontWeight: '800',
    },
    profitBadgeMeta: {
        color: '#2f6f46',
        fontWeight: '600',
    },
    storePill: {
        marginTop: 8,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#d7f3e5',
        borderWidth: 1,
        borderColor: '#a9dcc2',
        maxWidth: '100%',
    },
    storePillText: {
        color: '#0d5f3b',
        fontWeight: '700',
    },
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    imageModalClose: {
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
        right: 16,
        zIndex: 2,
        padding: 4,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    imageModalDotsRow: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        columnGap: 8,
    },
    imageModalDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.45)',
    },
    imageModalDotActive: {
        backgroundColor: '#fff',
    },
});

export default ProductDetailsScreen;
