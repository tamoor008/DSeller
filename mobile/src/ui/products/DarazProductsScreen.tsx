import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import TextComp from '../components/TextComp';
import { getBaseUrl } from '../../utils/api/baseUrl';
import { auth } from '../../../firebase';
import Ionicons from '@expo/vector-icons/Ionicons';
import SelectStore from '../components/SelectStore';

const DarazProductsScreen = ({ navigation }: any) => {
    const { theme } = useTheme();
    const currentUser = auth.currentUser;
    const selector = useSelector((state: any) => state.AppReducer);
    const selectedStore = selector?.selectedStore;

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'unmapped' | 'low_margin'>('all');

    const fetchDarazProducts = useCallback(async (isRefreshing = false) => {
        if (!currentUser) return;
        if (!isRefreshing) setLoading(true);

        try {
            const BASE_URL = getBaseUrl();
            const response = await fetch(`${BASE_URL}/api/daraz-products/${currentUser.uid}`);
            const result = await response.json();
            setProducts(result.data || []);
        } catch (error) {
            console.error('Error fetching Daraz products:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser]);

    const selectedStoreName = useMemo(() => {
        return (
            selectedStore?.user?.seller?.data?.name ||
            selectedStore?.user?.seller?.name ||
            selectedStore?.name ||
            ''
        );
    }, [selectedStore]);

    const selectedStoreId = useMemo(() => {
        return (
            selectedStore?.id ||
            selectedStore?.seller_id ||
            selectedStore?.user?.seller?.data?.short_code ||
            selectedStore?.user?.seller?.data?.seller_id ||
            ''
        );
    }, [selectedStore]);

    useEffect(() => {
        fetchDarazProducts();
    }, [fetchDarazProducts, selectedStoreId]);

    useFocusEffect(
        useCallback(() => {
            fetchDarazProducts(true);
        }, [fetchDarazProducts])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDarazProducts(true);
    };

    const isSkuFullyMapped = useCallback((sku: any) => {
        const hasMapping = !!sku?.isMapped;
        const hasPrice = Number(sku?.price || 0) > 0;
        const hasPackaging = Number(sku?.packagingPrice || 0) > 0;
        return hasMapping && hasPrice && hasPackaging;
    }, []);

    const filteredProducts = useMemo(() => {
        let result = products;

        if (selectedStoreId && selectedStoreName) {
            const targetStoreName = selectedStoreName.toLowerCase().trim();
            result = result.filter((p: any) => (p.storeName || '').toLowerCase().trim() === targetStoreName);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((product: any) => {
                const name = (product.attributes?.name || '').toLowerCase();
                const skuMatch = (product.skus || []).some((sku: any) =>
                    (sku.SellerSku || '').toLowerCase().includes(query)
                );
                return name.includes(query) || skuMatch;
            });
        }

        if (activeFilter === 'unmapped') {
            result = result.filter((product: any) => (product.skus || []).some((sku: any) => !isSkuFullyMapped(sku)));
        } else if (activeFilter === 'low_margin') {
            result = result.filter((product: any) => (product.skus || []).some((sku: any) => isSkuFullyMapped(sku) && Number(sku.margin) < 10));
        }

        return result;
    }, [products, searchQuery, activeFilter, selectedStoreId, selectedStoreName, isSkuFullyMapped]);

    const styles = getStyles(theme);

    const renderProductCard = ({ item }: { item: any }) => {
        const skus = item.skus || [];
        const firstMappedSku = skus.find((s: any) => isSkuFullyMapped(s));
        const hasUnmapped = skus.some((s: any) => !isSkuFullyMapped(s));

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.gridCard}
                onPress={() => navigation.navigate('ProductDetailsScreen', { product: item })}
            >
                <Image
                    source={{ uri: item.images?.[0] || 'https://via.placeholder.com/300' }}
                    style={styles.gridImage}
                    resizeMode="cover"
                />
                <View style={styles.gridBody}>
                    <TextComp size={13} style={{ color: theme.textPrimary, fontWeight: '700' }} numberOfLines={2}>
                        {item.attributes?.name_en || 'Unnamed Product'}
                    </TextComp>
                    <TextComp size={11} style={{ color: theme.textSecondary }} numberOfLines={1}>
                        {item.storeName || 'Unknown Store'}
                    </TextComp>

                    {!!firstMappedSku && (
                        <TextComp size={12} style={{ color: theme.primaryOrange, fontWeight: '700' }} numberOfLines={1}>
                            Rs. {Number(firstMappedSku.price || 0).toFixed(0)}
                        </TextComp>
                    )}
                    <TextComp size={11} style={{ color: hasUnmapped ? '#FFA500' : '#4CAF50' }} numberOfLines={1}>
                        {hasUnmapped ? 'Needs mapping' : 'Mapped'}
                    </TextComp>
                    <TextComp size={11} style={{ color: theme.textSecondary }} numberOfLines={1}>
                        Tap to view full details
                    </TextComp>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bgcolor }]}>
            <View style={styles.headerWrap}>
                <TextComp size={20} style={{ color: theme.textPrimary, fontWeight: '700' }} numberOfLines={1}>
                    Daraz Products
                </TextComp>
                <SelectStore />

                <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.textPrimary }]}
                        placeholder="Search by name or SKU..."
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                    <TouchableOpacity
                        style={[styles.filterChip, activeFilter === 'all' && { backgroundColor: theme.primaryOrange, borderColor: theme.primaryOrange }]}
                        onPress={() => setActiveFilter('all')}
                    >
                        <TextComp size={12} style={{ color: activeFilter === 'all' ? '#fff' : theme.textSecondary }} numberOfLines={1}>All</TextComp>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, activeFilter === 'unmapped' && { backgroundColor: theme.primaryOrange, borderColor: theme.primaryOrange }]}
                        onPress={() => setActiveFilter('unmapped')}
                    >
                        <TextComp size={12} style={{ color: activeFilter === 'unmapped' ? '#fff' : theme.textSecondary }} numberOfLines={1}>Unmapped</TextComp>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, activeFilter === 'low_margin' && { backgroundColor: theme.primaryOrange, borderColor: theme.primaryOrange }]}
                        onPress={() => setActiveFilter('low_margin')}
                    >
                        <TextComp size={12} style={{ color: activeFilter === 'low_margin' ? '#fff' : theme.textSecondary }} numberOfLines={1}>Low Margin</TextComp>
                    </TouchableOpacity>
                </ScrollView>

                <TextComp size={12} style={styles.totalCount} numberOfLines={1}>
                    Total Products: {filteredProducts.length}
                </TextComp>
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={(item, index) => String(item.item_id || `${item.storeName}-${index}`)}
                renderItem={renderProductCard}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.gridContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryOrange} />}
                ListHeaderComponent={
                    loading && !refreshing ? (
                        <View style={styles.listLoaderWrap}>
                            <ActivityIndicator size="small" color={theme.primaryOrange} />
                            <TextComp size={13} style={{ color: theme.textSecondary }} numberOfLines={1}>
                                Fetching products...
                            </TextComp>
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    loading && !refreshing ? null : (
                        <View style={styles.centered}>
                            <Ionicons name="cube-outline" size={72} color={theme.textSecondary} />
                            <TextComp size={16} style={{ color: theme.textPrimary, marginTop: 16, fontWeight: '700' }} numberOfLines={1}>
                                {searchQuery ? 'No Results Found' : 'No Products Found'}
                            </TextComp>
                        </View>
                    )
                }
            />
        </View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    headerWrap: {
        paddingHorizontal: 16,
        paddingTop: 12,
        rowGap: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        padding: 0,
    },
    filtersRow: {
        columnGap: 8,
        paddingRight: 16,
        paddingBottom: 6,
    },
    totalCount: {
        color: theme.textSecondary,
        fontWeight: '600',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    gridContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 8,
    },
    listLoaderWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 8,
        paddingVertical: 8,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    gridCard: {
        width: '48.5%',
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: theme.card,
        elevation: 2,
    },
    gridImage: {
        width: '100%',
        height: 118,
    },
    gridBody: {
        padding: 10,
        rowGap: 4,
    },
});

export default DarazProductsScreen;
