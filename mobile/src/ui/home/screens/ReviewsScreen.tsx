import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { auth } from '../../../../firebase';
import { useTheme } from '../../../context/ThemeContext';
import { getBaseUrl } from '../../../utils/api/baseUrl';
import Header from '../../components/Header';
import SelectStore from '../../components/SelectStore';
import TextComp from '../../components/TextComp';

const DEBUG_PREFIX = '[REVIEWS_SCREEN]';
const debugLog = (...args: any[]) => {
  if (__DEV__) {
    console.log(DEBUG_PREFIX, ...args);
  }
};

const isReplyable = (review: any) => {
  const canReply = review?.can_reply === true || review?.can_reply === 'true';
  const hasReply = !!(review?.seller_reply && String(review.seller_reply).trim().length > 0);
  return canReply && !hasReply;
};

const ReviewsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const currentUser = auth.currentUser;
  const selector = useSelector((state: any) => state.AppReducer);
  const selectedStore = selector?.selectedStore;

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const [singleReplyModal, setSingleReplyModal] = useState(false);
  const [singleReplyText, setSingleReplyText] = useState('');
  const [singleTarget, setSingleTarget] = useState<any>(null);

  const [bulkReplyModal, setBulkReplyModal] = useState(false);
  const [bulkReplyText, setBulkReplyText] = useState('');

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

  const reviewKey = (review: any) => `${String(review?.id || '')}::${String(review?.sellerId || '')}`;

  const fetchReviews = async (isRefreshing = false) => {
    if (!currentUser) return;

    if (!isRefreshing) setLoading(true);

    try {
      const BASE_URL = getBaseUrl();
      debugLog('fetchReviews:start', {
        userId: currentUser?.uid,
        isRefreshing,
        selectedStoreId,
        selectedStoreName,
      });
      const response = await fetch(`${BASE_URL}/api/daraz-reviews/${currentUser.uid}`);
      const result = await response.json();
      debugLog('fetchReviews:response', {
        status: response.status,
        ok: response.ok,
        count: Array.isArray(result?.data) ? result.data.length : 0,
        stores: Array.isArray(result?.stores) ? result.stores.length : 0,
        errors: Array.isArray(result?.errors) ? result.errors.length : 0,
      });
      setReviews(result.data || []);
      setSelectedKeys([]);
    } catch (error) {
      debugLog('fetchReviews:error', error);
      setReviews([]);
      setSelectedKeys([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedStoreId]);

  const filteredReviews = useMemo(() => {
    if (selectedStoreId && selectedStoreName) {
      const target = selectedStoreName.toLowerCase().trim();
      const filtered = reviews.filter((r: any) => (r.storeName || '').toLowerCase().trim() === target);
      debugLog('filteredReviews:byStore', {
        targetStoreName: selectedStoreName,
        before: reviews.length,
        after: filtered.length,
      });
      return filtered;
    }
    debugLog('filteredReviews:allStores', { count: reviews.length });
    return reviews;
  }, [reviews, selectedStoreId, selectedStoreName]);

  const selectedReplyableReviews = useMemo(() => {
    const keySet = new Set(selectedKeys);
    return filteredReviews.filter((r: any) => keySet.has(reviewKey(r)) && isReplyable(r));
  }, [filteredReviews, selectedKeys]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews(true);
  };

  const toggleSelection = (item: any) => {
    const key = reviewKey(item);
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const submitSingleReply = async () => {
    if (!currentUser?.uid || !singleTarget) return;

    const content = singleReplyText.trim();
    if (!content) {
      Alert.alert('Missing Content', 'Please enter reply text.');
      return;
    }

    if (content.length > 500) {
      Alert.alert('Too Long', 'Reply content must be 500 characters or less.');
      return;
    }

    try {
      setSubmitting(true);
      const BASE_URL = getBaseUrl();
      debugLog('submitSingleReply:start', {
        reviewId: singleTarget?.id,
        sellerId: singleTarget?.sellerId,
        contentLength: content.length,
      });
      const response = await fetch(`${BASE_URL}/api/daraz-reviews/${currentUser.uid}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: singleTarget.id,
          sellerId: singleTarget.sellerId,
          content,
        }),
      });

      const result = await response.json();
      debugLog('submitSingleReply:response', {
        status: response.status,
        ok: response.ok,
        success: result?.success,
        message: result?.message,
      });
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || result?.error || 'Failed to submit reply');
      }

      setSingleReplyModal(false);
      setSingleReplyText('');
      setSingleTarget(null);
      await fetchReviews(true);
      Alert.alert('Success', 'Reply submitted successfully.');
    } catch (error: any) {
      debugLog('submitSingleReply:error', error);
      Alert.alert('Reply Failed', error?.message || 'Could not submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBulkReply = async () => {
    if (!currentUser?.uid || selectedReplyableReviews.length === 0) return;

    const content = bulkReplyText.trim();
    if (!content) {
      Alert.alert('Missing Content', 'Please enter reply text for bulk reply.');
      return;
    }

    if (content.length > 500) {
      Alert.alert('Too Long', 'Reply content must be 500 characters or less.');
      return;
    }

    try {
      setSubmitting(true);
      const BASE_URL = getBaseUrl();
      const items = selectedReplyableReviews.map((review: any) => ({
        id: review.id,
        sellerId: review.sellerId,
      }));
      debugLog('submitBulkReply:start', {
        items: items.length,
        contentLength: content.length,
      });

      const response = await fetch(`${BASE_URL}/api/daraz-reviews/${currentUser.uid}/reply/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, content }),
      });

      const result = await response.json();
      debugLog('submitBulkReply:response', {
        status: response.status,
        ok: response.ok,
        total: result?.total,
        successCount: result?.successCount,
        failedCount: result?.failedCount,
      });
      if (!response.ok) {
        throw new Error(result?.message || result?.error || 'Bulk reply failed');
      }

      setBulkReplyModal(false);
      setBulkReplyText('');
      setSelectedKeys([]);
      await fetchReviews(true);
      Alert.alert('Bulk Reply', result?.message || 'Bulk reply completed.');
    } catch (error: any) {
      debugLog('submitBulkReply:error', error);
      Alert.alert('Bulk Reply Failed', error?.message || 'Could not submit bulk reply');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = getStyles(theme);

  const renderReview = ({ item }: { item: any }) => {
    const ratings = item.ratings || {};
    const submitTs = Number(item.submit_time || item.create_time || 0);
    const createdAt = submitTs ? new Date(submitTs).toLocaleString() : 'Unknown date';
    const canReply = isReplyable(item);
    const isSelected = selectedKeys.includes(reviewKey(item));

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <TextComp size={14} style={styles.storeName} numberOfLines={1}>
            {item.storeName || 'Unknown Store'}
          </TextComp>
          <TextComp size={12} style={styles.typeText} numberOfLines={1}>
            {item.review_type || 'REVIEW'}
          </TextComp>
        </View>

        <TextComp size={13} style={styles.dateText} numberOfLines={1}>
          {createdAt}
        </TextComp>

        <TextComp size={14} style={styles.reviewText} numberOfLines={4}>
          {item.review_content || 'No review text'}
        </TextComp>

        <View style={styles.ratingsWrap}>
          <TextComp size={12} style={styles.ratingText} numberOfLines={1}>Overall: {ratings.overall_rating || '-'}</TextComp>
          <TextComp size={12} style={styles.ratingText} numberOfLines={1}>Product: {ratings.product_rating || '-'}</TextComp>
          <TextComp size={12} style={styles.ratingText} numberOfLines={1}>Seller: {ratings.seller_rating || '-'}</TextComp>
          <TextComp size={12} style={styles.ratingText} numberOfLines={1}>Logistics: {ratings.logistics_rating || '-'}</TextComp>
        </View>

        {!!item.seller_reply && (
          <View style={styles.replyBox}>
            <TextComp size={12} style={styles.replyLabel} numberOfLines={1}>Seller Reply</TextComp>
            <TextComp size={13} style={styles.replyText} numberOfLines={3}>{item.seller_reply}</TextComp>
          </View>
        )}

        <View style={styles.actionsRow}>
          {canReply ? (
            <>
              <TouchableOpacity
                style={[styles.selectBtn, isSelected && { backgroundColor: theme.primaryOrange }]}
                onPress={() => toggleSelection(item)}
                disabled={submitting}
              >
                <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={isSelected ? '#fff' : theme.primaryOrange} />
                <TextComp size={12} style={{ color: isSelected ? '#fff' : theme.primaryOrange, fontWeight: '700' }} numberOfLines={1}>
                  {isSelected ? 'Selected' : 'Select'}
                </TextComp>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.replyBtn, submitting && { opacity: 0.6 }]}
                onPress={() => {
                  setSingleTarget(item);
                  setSingleReplyText('');
                  setSingleReplyModal(true);
                }}
                disabled={submitting}
              >
                <TextComp size={12} style={{ color: '#fff', fontWeight: '700' }} numberOfLines={1}>Reply</TextComp>
              </TouchableOpacity>
            </>
          ) : (
            <TextComp size={12} style={styles.notReplyableText} numberOfLines={1}>
              Reply unavailable
            </TextComp>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bgcolor }]}> 
      <View style={styles.headerWrap}>
        <Header title="Reviews" goBack={() => navigation.goBack()} info={true} />
        <SelectStore />
        <View style={styles.rowBetween}>
          <TextComp size={12} style={styles.totalText} numberOfLines={1}>
            Total Reviews: {filteredReviews.length}
          </TextComp>
          <TouchableOpacity
            style={[styles.bulkBtn, { opacity: selectedReplyableReviews.length > 0 && !submitting ? 1 : 0.5 }]}
            disabled={selectedReplyableReviews.length === 0 || submitting}
            onPress={() => {
              setBulkReplyText('');
              setBulkReplyModal(true);
            }}
          >
            <TextComp size={12} style={{ color: '#fff', fontWeight: '700' }} numberOfLines={1}>
              Bulk Reply ({selectedReplyableReviews.length})
            </TextComp>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredReviews}
        keyExtractor={(item, index) => `${item.id || index}-${item.order_id || 'order'}-${item.sellerId || 'seller'}`}
        renderItem={renderReview}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryOrange} />}
        ListHeaderComponent={
          loading && !refreshing ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="small" color={theme.primaryOrange} />
              <TextComp size={13} style={{ color: theme.textSecondary }} numberOfLines={1}>Fetching reviews...</TextComp>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading && !refreshing ? null : (
            <View style={styles.emptyWrap}>
              <TextComp size={15} style={{ color: theme.textSecondary }} numberOfLines={1}>
                No reviews found
              </TextComp>
            </View>
          )
        }
      />

      <Modal visible={singleReplyModal} transparent animationType="fade" onRequestClose={() => setSingleReplyModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}> 
            <TextComp size={15} style={styles.modalTitle} numberOfLines={1}>Reply to Review</TextComp>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Write your reply..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={500}
              value={singleReplyText}
              onChangeText={setSingleReplyText}
            />
            <TextComp size={11} style={styles.counterText} numberOfLines={1}>{singleReplyText.length}/500</TextComp>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSingleReplyModal(false)} disabled={submitting}>
                <TextComp size={12} style={{ color: theme.textSecondary, fontWeight: '700' }} numberOfLines={1}>Cancel</TextComp>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sendBtn, submitting && { opacity: 0.6 }]} onPress={submitSingleReply} disabled={submitting}>
                <TextComp size={12} style={{ color: '#fff', fontWeight: '700' }} numberOfLines={1}>{submitting ? 'Sending...' : 'Send Reply'}</TextComp>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={bulkReplyModal} transparent animationType="fade" onRequestClose={() => setBulkReplyModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}> 
            <TextComp size={15} style={styles.modalTitle} numberOfLines={1}>Bulk Reply</TextComp>
            <TextComp size={12} style={styles.bulkHint} numberOfLines={2}>
              This reply will be sent to {selectedReplyableReviews.length} selected review(s).
            </TextComp>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Write reply for all selected reviews..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={500}
              value={bulkReplyText}
              onChangeText={setBulkReplyText}
            />
            <TextComp size={11} style={styles.counterText} numberOfLines={1}>{bulkReplyText.length}/500</TextComp>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setBulkReplyModal(false)} disabled={submitting}>
                <TextComp size={12} style={{ color: theme.textSecondary, fontWeight: '700' }} numberOfLines={1}>Cancel</TextComp>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sendBtn, submitting && { opacity: 0.6 }]} onPress={submitBulkReply} disabled={submitting}>
                <TextComp size={12} style={{ color: '#fff', fontWeight: '700' }} numberOfLines={1}>{submitting ? 'Sending...' : 'Send Bulk Reply'}</TextComp>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
      rowGap: 12,
    },
    totalText: {
      color: theme.textSecondary,
      fontWeight: '600',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 20,
      rowGap: 10,
    },
    loaderWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 8,
      paddingVertical: 8,
    },
    emptyWrap: {
      alignItems: 'center',
      marginTop: 40,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 12,
      rowGap: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      columnGap: 8,
    },
    storeName: {
      color: theme.textPrimary,
      fontWeight: '700',
      flex: 1,
    },
    typeText: {
      color: theme.primaryOrange,
      fontWeight: '700',
    },
    dateText: {
      color: theme.textSecondary,
    },
    reviewText: {
      color: theme.textPrimary,
      fontWeight: '500',
    },
    ratingsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: 6,
      columnGap: 10,
    },
    ratingText: {
      color: theme.textSecondary,
    },
    replyBox: {
      marginTop: 4,
      borderRadius: 10,
      padding: 10,
      backgroundColor: theme.bgcolor,
      borderWidth: 1,
      borderColor: theme.border,
      rowGap: 4,
    },
    replyLabel: {
      color: theme.primaryOrange,
      fontWeight: '700',
    },
    replyText: {
      color: theme.textPrimary,
    },
    actionsRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 8,
    },
    selectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
      borderWidth: 1,
      borderColor: theme.primaryOrange,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    replyBtn: {
      backgroundColor: theme.primaryOrange,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    notReplyableText: {
      color: theme.textSecondary,
      fontStyle: 'italic',
    },
    bulkBtn: {
      backgroundColor: theme.primaryOrange,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      borderRadius: 12,
      padding: 14,
      rowGap: 8,
    },
    modalTitle: {
      color: theme.textPrimary,
      fontWeight: '700',
    },
    bulkHint: {
      color: theme.textSecondary,
    },
    input: {
      minHeight: 100,
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      textAlignVertical: 'top',
    },
    counterText: {
      color: theme.textSecondary,
      textAlign: 'right',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      columnGap: 10,
      marginTop: 4,
    },
    cancelBtn: {
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    sendBtn: {
      backgroundColor: theme.primaryOrange,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  });

export default ReviewsScreen;
