import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { auth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { getBaseUrl } from '../utils/api/baseUrl';
import { checkResponseForTokenExpiration, refreshStoreTokenWithRefreshToken } from '../utils/api/tokenRefresh';
import { useAlert } from '../context/AlertContext';
import Header from '../components/Header';
import SelectStore from '../components/SelectStore';
import { AppColors } from '../constants/colors';
import { useNavigate } from '../utils/navigation';

const ReviewsPage = () => {
    const { theme } = useTheme();
    const currentUser = auth.currentUser;
    const navigate = useNavigate();
    const selector = useSelector((state: any) => state.AppReducer);
    const { showAlert, showConfirm } = useAlert();
    const selectedStore = selector?.selectedStore;
    const BASE_URL = getBaseUrl();

    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

    // Reply Modals/State
    const [replyModal, setReplyModal] = useState<{ visible: boolean; target: any; text: string }>({
        visible: false,
        target: null,
        text: ''
    });

    const selectedStoreName = useMemo(() => {
        return selectedStore?.user?.seller?.data?.name || selectedStore?.name || '';
    }, [selectedStore]);

    const reviewKey = (review: any) => `${String(review?.id || '')}::${String(review?.sellerId || '')}`;

    const fetchReviews = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/api/daraz-reviews/${currentUser.uid}`);
            const result = await response.json();
            setReviews(result.data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            showAlert('Error', 'Failed to fetch reviews.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [currentUser, BASE_URL]);

    const filteredReviews = useMemo(() => {
        if (selectedStoreName) {
            const target = selectedStoreName.toLowerCase().trim();
            return reviews.filter((r: any) => (r.storeName || '').toLowerCase().trim() === target);
        }
        return reviews;
    }, [reviews, selectedStoreName]);

    const isReplyable = (review: any) => {
        const canReply = review?.can_reply === true || review?.can_reply === 'true';
        const hasReply = !!(review?.seller_reply && String(review.seller_reply).trim().length > 0);
        return canReply && !hasReply;
    };

    const submitReply = async () => {
        if (!currentUser?.uid || !replyModal.target) return;
        const content = replyModal.text.trim();
        if (!content) {
            showAlert('Info', 'Please enter reply text.');
            return;
        }

        const confirmed = await showConfirm('Submit Reply', 'Are you sure you want to submit this reply?');
        if (!confirmed) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/api/daraz-reviews/${currentUser.uid}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: replyModal.target.id,
                    sellerId: replyModal.target.sellerId,
                    content,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit reply');
            }

            showAlert('Success', 'Reply submitted successfully.');
            setReplyModal({ visible: false, target: null, text: '' });
            fetchReviews();
        } catch (error: any) {
            showAlert('Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: theme.bgcolor,
            padding: '16px',
            paddingBottom: '80px'
        }}>
            <Header title="Reviews" goBack={() => navigate(-1)} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <SelectStore />
                <div style={{ color: theme.textSecondary, fontSize: '14px', fontWeight: 600 }}>
                    Total Reviews: {filteredReviews.length}
                </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>Loading reviews...</div>
                ) : filteredReviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary, backgroundColor: theme.card, borderRadius: '12px' }}>
                        No reviews found
                    </div>
                ) : (
                    filteredReviews.map((review, idx) => (
                        <div key={idx} style={{
                            backgroundColor: theme.card,
                            borderRadius: '16px',
                            padding: '16px',
                            border: `1px solid ${theme.border}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: theme.primaryOrange, fontWeight: 700, fontSize: '12px' }}>{review.storeName}</span>
                                <span style={{ color: theme.textSecondary, fontSize: '12px' }}>{new Date(Number(review.submit_time || review.create_time)).toLocaleDateString()}</span>
                            </div>

                            <div style={{ color: theme.textPrimary, fontSize: '14px', lineHeight: '1.5' }}>
                                {review.review_content || 'No review text'}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '12px', color: theme.textSecondary }}>Product: {review.ratings?.product_rating}/5</span>
                                <span style={{ fontSize: '12px', color: theme.textSecondary }}>Seller: {review.ratings?.seller_rating}/5</span>
                            </div>

                            {review.seller_reply && (
                                <div style={{
                                    backgroundColor: theme.bgcolor,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: `1px solid ${theme.border}`,
                                    marginTop: '4px'
                                }}>
                                    <div style={{ color: theme.primaryOrange, fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Seller Reply:</div>
                                    <div style={{ color: theme.textSecondary, fontSize: '13px' }}>{review.seller_reply}</div>
                                </div>
                            )}

                            {isReplyable(review) && (
                                <button
                                    onClick={() => setReplyModal({ visible: true, target: review, text: '' })}
                                    style={{
                                        backgroundColor: theme.primaryOrange,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        alignSelf: 'flex-start',
                                        marginTop: '8px'
                                    }}
                                >
                                    Reply
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Reply Modal */}
            {replyModal.visible && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: theme.card,
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '500px',
                        padding: '20px',
                        display: 'flex', flexDirection: 'column', gap: '16px'
                    }}>
                        <h3 style={{ margin: 0, color: theme.textPrimary }}>Reply to Review</h3>
                        <textarea
                            value={replyModal.text}
                            onChange={(e) => setReplyModal({ ...replyModal, text: e.target.value })}
                            placeholder="Write your reply..."
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.border}`,
                                padding: '12px',
                                fontSize: '14px',
                                backgroundColor: theme.bgcolor,
                                color: theme.textPrimary,
                                outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setReplyModal({ visible: false, target: null, text: '' })}
                                style={{ background: 'none', border: 'none', color: theme.textSecondary, fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReply}
                                disabled={submitting}
                                style={{
                                    backgroundColor: theme.primaryOrange,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 20px',
                                    fontWeight: 600,
                                    cursor: submitting ? 'default' : 'pointer',
                                    opacity: submitting ? 0.6 : 1
                                }}
                            >
                                {submitting ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsPage;
