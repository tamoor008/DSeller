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
import { useAlert } from '../context/AlertContext'

const ReadyToShipOrdersPage = () => {
  const navigate = useNavigate()
  const selector = useSelector((state: any) => state.AppReducer)
  const store = selector?.selectedStore
  const BASE_URL = getBaseUrl()
  const { showAlert } = useAlert()

  const [darazOrders, setDarazOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [all_access_tokens, setAll_access_tokens] = useState<any[]>(selector?.access_tokens || [])
  const [firebaseSkus, setFirebaseSkus] = useState<any[]>([])

  useEffect(() => {
    if (selector?.access_tokens) {
      setAll_access_tokens(selector.access_tokens)
    }
  }, [selector?.access_tokens])

  const fetchOrdersForToken = async (access_token: string, createdAfterISO: string) => {
    try {
      if (!access_token) return [];

      let requestUrl = `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=ready_to_ship`;
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
      console.error("Error fetching ready to ship orders:", error);
      return [];
    }
  };

  const fetchAllOrders = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const requests = all_access_tokens
        .filter(item => item.access_token)
        .map(item => fetchOrdersForToken(item.access_token, createdAfter));

      const results = await Promise.all(requests);
      const allOrders = results.flat();
      const uniqueOrders = Array.from(new Map(allOrders.map(order => [order.order_id, order])).values());

      setDarazOrders(uniqueOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (all_access_tokens.length > 0) {
      fetchAllOrders();
    }
  }, [all_access_tokens]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor,
      padding: '16px',
      paddingBottom: '80px'
    }}>
      <Header title={AppStrings.readyToShipOrders} goBack={() => navigate(-1)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        <SelectStore />
      </div>

      <div style={{ marginTop: '24px' }}>
        {loading && darazOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: AppColors.textSecondary }}>
            Loading ready to ship orders...
          </div>
        ) : darazOrders.length === 0 ? (
          <div style={{
            backgroundColor: AppColors.card,
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: AppColors.textSecondary
          }}>
            No ready to ship orders found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {darazOrders.map((order) => (
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
                    readyToShip={true}
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

export default ReadyToShipOrdersPage;
