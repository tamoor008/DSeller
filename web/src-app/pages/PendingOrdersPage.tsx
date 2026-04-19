import { useEffect, useState } from 'react'
import { useNavigate } from '../utils/navigation'
import { useSelector } from 'react-redux'
import Header from '../components/Header'
import SelectStore from '../components/SelectStore'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'
import OrderItem from '../components/OrderItem'
import { getBaseUrl } from '../utils/api/baseUrl'
import { checkResponseForTokenExpiration, refreshStoreTokenWithRefreshToken } from '../utils/api/tokenRefresh'
import { packAndRtsOrders, prepareOrderData } from '../utils/api/packAndRtsOrders'
import { useAlert } from '../context/AlertContext'

const PendingOrdersPage = () => {
  const navigate = useNavigate()
  const selector = useSelector((state: any) => state.AppReducer)
  const store = selector?.selectedStore
  const BASE_URL = getBaseUrl()
  const { showAlert, showConfirm } = useAlert()

  const [darazPendingOrders, setDarazPendingOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [all_access_tokens, setAll_access_tokens] = useState<any[]>(selector?.access_tokens || [])
  const [firebaseSkus, setFirebaseSkus] = useState<any[]>([]) // Should be passed/fetched similar to Mobile

  useEffect(() => {
    if (selector?.access_tokens) {
      setAll_access_tokens(selector.access_tokens)
    }
  }, [selector?.access_tokens])

  const fetchDarazPendingOrdersLocal = async (access_token: string, createdAfterISO: string) => {
    try {
      if (!access_token) return [];

      let requestUrl = `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=pending`;
      let response = await fetch(requestUrl);

      const isExpired = await checkResponseForTokenExpiration(response);
      if (isExpired && store?.seller_id) {
        const newToken = await refreshStoreTokenWithRefreshToken(store);
        if (newToken) {
          requestUrl = requestUrl.replace(`access_token=${access_token}`, `access_token=${newToken}`);
          response = await fetch(requestUrl);
        }
      }

      if (!response.ok) return [];

      const data = await response.json();
      if (data.error || !data.orderItems || !Array.isArray(data.orderItems)) return [];

      return data.orderItems.map((order: any) => ({
        ...order,
        access_token: access_token,
        order_items: (order.order_items || []).map((item: any) => ({
          ...item,
          access_token: access_token
        }))
      }));
    } catch (error) {
      console.error("Error fetching Daraz pending orders:", error);
      return [];
    }
  };

  const fetchOrders = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const requests = all_access_tokens
        .filter(item => item.access_token)
        .map(item => fetchDarazPendingOrdersLocal(item.access_token, createdAfter));

      const results = await Promise.all(requests);
      const allOrders = results.flat();

      // Filter out potential duplicates by order_id
      const uniqueOrders = Array.from(new Map(allOrders.map(order => [order.order_id, order])).values());

      setDarazPendingOrders(uniqueOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (all_access_tokens.length > 0) {
      fetchOrders();
    }
  }, [all_access_tokens]);

  const handleSingleOrderReadyToShip = async (order: any) => {
    const orderItems = order?.order_items || [];
    if (orderItems.length === 0) {
      showAlert('Error', 'Order items are missing for this order.');
      return;
    }

    const confirmed = await showConfirm('Ready to Ship', `Are you sure you want to mark order ${order.order_id} as Ready to Ship?`);
    if (confirmed) {
      try {
        const accessToken = order.access_token || orderItems[0]?.access_token;
        if (!accessToken) {
          showAlert('Error', 'Could not identify store for this order.');
          return;
        }

        const orderData = prepareOrderData(orderItems);
        const result = await packAndRtsOrders(orderData, accessToken);

        if (result.success) {
          showAlert('Success', `Order ${order.order_id} marked as Ready to Ship`);
          setDarazPendingOrders(prev => prev.filter(p => p.order_id !== order.order_id));
        } else {
          showAlert('Error', result.message || 'Failed to process order');
        }
      } catch (error: any) {
        showAlert('Error', error.message || 'Failed to process order');
      }
    }
  };


  const handleBulkReadyToShip = async () => {
    if (darazPendingOrders.length === 0) return;

    const confirmed = await showConfirm('Bulk Process', `Process all ${darazPendingOrders.length} orders?`);
    if (confirmed) {
      setLoading(true);
      try {
        const ordersByAccessToken: { [key: string]: any[] } = {};
        darazPendingOrders.forEach(order => {
          const token = order.access_token;
          if (token) {
            if (!ordersByAccessToken[token]) ordersByAccessToken[token] = [];
            ordersByAccessToken[token].push(...(order.order_items || []));
          }
        });

        for (const [token, items] of Object.entries(ordersByAccessToken)) {
          const orderData = prepareOrderData(items);
          await packAndRtsOrders(orderData, token);
        }

        showAlert('Success', 'Bulk processing finished.');
        fetchOrders();
      } catch (error: any) {
        showAlert('Error', error.message || 'Failed to process orders');
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor,
      padding: '16px',
      paddingBottom: '80px'
    }}>
      <Header title={AppStrings.pendingOrders} goBack={() => navigate(-1)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        <SelectStore />

        <button
          onClick={handleBulkReadyToShip}
          disabled={loading || darazPendingOrders.length === 0}
          style={{
            backgroundColor: AppColors.primaryOrange,
            color: 'white',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            opacity: loading || darazPendingOrders.length === 0 ? 0.6 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {loading ? 'Processing...' : `Ready To Ship (${darazPendingOrders.length})`}
        </button>
      </div>

      <div style={{ marginTop: '24px' }}>
        {loading && darazPendingOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: AppColors.textSecondary }}>
            Loading pending orders...
          </div>
        ) : darazPendingOrders.length === 0 ? (
          <div style={{
            backgroundColor: AppColors.card,
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: AppColors.textSecondary
          }}>
            No pending orders found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {darazPendingOrders.map((order) => (
              <div key={order.order_id} style={{
                backgroundColor: AppColors.card,
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontWeight: 700,
                  marginBottom: '12px',
                  color: AppColors.textPrimary,
                  fontSize: '14px'
                }}>
                  Order ID: {order.order_id}
                </div>
                {order.order_items?.map((item: any) => (
                  <OrderItem
                    key={item.order_item_id}
                    item={item}
                    firebaseSkus={firebaseSkus}
                    selector={selector}
                    pending={true}
                    onMakeReadyToShip={() => handleSingleOrderReadyToShip(order)}
                    onProfitCalculated={() => { }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingOrdersPage;
