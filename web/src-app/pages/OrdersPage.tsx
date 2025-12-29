import { useState, useEffect } from 'react'
import { useNavigate } from '../utils/navigation'
import { useSelector } from 'react-redux'
import Header from '../components/Header'
import SelectStore from '../components/SelectStore'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'
import { getBaseUrl } from '../utils/api/baseUrl'

type OrderStatus = 'pending' | 'ready_to_ship' | 'shipped' | 'delivered' | 'failed' | 'returning' | 'returned'

const OrdersPage = () => {
  const navigate = useNavigate()
  const selector = useSelector((state: any) => state.AppReducer)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const BASE_URL = getBaseUrl()

  const statusTabs: OrderStatus[] = ['pending', 'ready_to_ship', 'shipped', 'delivered', 'failed', 'returning', 'returned']

  useEffect(() => {
    // Fetch orders based on selected status
    const fetchOrders = async () => {
      if (!selector.access_tokens || selector.access_tokens.length === 0) return

      setLoading(true)
      setOrders([])

      try {
        const all_access_tokens = selector.selectedStore?.id
          ? [{
              access_token: selector.selectedStore.user?.token?.access_token,
              storeName: selector.selectedStore?.user?.seller?.data?.name
            }]
          : selector.access_tokens

        const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        
        const requests = all_access_tokens
          .filter((item: any) => item?.access_token)
          .map((item: any) => {
            let url = ''
            if (['delivered', 'failed', 'returning', 'returned'].includes(selectedStatus)) {
              const updateAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
              const updateBefore = new Date().toISOString()
              url = `${BASE_URL}/get-daraz-delivered-order-details?access_token=${item.access_token}&update_after=${encodeURIComponent(updateAfter)}&update_before=${encodeURIComponent(updateBefore)}&status=${selectedStatus === 'failed' ? 'shipped_back' : selectedStatus}`
            } else {
              url = `${BASE_URL}/get-daraz-order-details?access_token=${item.access_token}&created_after=${encodeURIComponent(createdAfter)}&status=${selectedStatus}`
            }
            return fetch(url)
          })

        const responses = await Promise.all(requests)
        const data = await Promise.all(responses.map(r => r.json()))
        
        const allOrders = data.flatMap((result: any) => result.orderItems || [])
        setOrders(allOrders)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [selectedStatus, selector, BASE_URL])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor
    }}>
      <div style={{ padding: '16px' }}>
        <Header title={AppStrings.orders} />
        <div style={{ marginTop: '16px' }}>
          <SelectStore />
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{
        backgroundColor: AppColors.card,
        borderBottom: `1px solid ${AppColors.border}`,
        padding: '12px 16px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto'
      }}>
        {statusTabs.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: selectedStatus === status ? AppColors.primaryOrange : AppColors.surface,
              color: selectedStatus === status ? AppColors.white : AppColors.textSecondary,
              fontSize: '14px',
              fontWeight: selectedStatus === status ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: `3px solid ${AppColors.primaryOrange}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: AppColors.textSecondary
          }}>
            No {selectedStatus} orders found
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '16px',
              color: AppColors.textSecondary,
              fontSize: '16px'
            }}>
              Total Orders: {orders.length}
            </div>
            {orders.map((order: any, index: number) => (
              <div
                key={order.order_id || index}
                style={{
                  backgroundColor: AppColors.card,
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: AppColors.textPrimary,
                  fontSize: '14px'
                }}>
                  Order ID: {order.order_id}
                </div>
                {order.order_items?.map((item: any) => (
                  <div key={item.order_item_id} style={{
                    padding: '8px 0',
                    borderTop: `1px solid ${AppColors.border}`,
                    marginTop: '8px'
                  }}>
                    <div style={{ color: AppColors.textSecondary, fontSize: '14px' }}>
                      SKU: {item.sku} | Qty: {item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage






