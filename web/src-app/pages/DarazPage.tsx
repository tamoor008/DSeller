'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from '../utils/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { auth, database } from '../config/firebase'
import { ref, onValue, off } from 'firebase/database'
import Header from '../components/Header'
import SelectStore from '../components/SelectStore'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'
import { useTheme } from '../context/ThemeContext'
import { getBaseUrl } from '../utils/api/baseUrl'

const DarazPage = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const BASE_URL = getBaseUrl()
  const dispatch = useDispatch()
  const currentUser = auth.currentUser
  const selector = useSelector((state: any) => state.AppReducer)

  const [loader, setLoader] = useState(true)
  const [selectedTab, setSelectedTab] = useState(0)

  const [firebaseSkus, setFirebaseSkus] = useState<any[]>([])
  const [firebaseProducts, setFirebaseProducts] = useState<any>({})
  const [all_access_tokens, setAll_access_tokens] = useState<any[]>([])
  const [firebaseDataLoaded, setFirebaseDataLoaded] = useState(false)

  const [shippedOrders, setShippedOrders] = useState<any[]>([])
  const [failedOrders, setFailedOrders] = useState<any[]>([])
  const [itrsOrders, setItrsOrders] = useState<any[]>([])

  const [finalShippedOrders, setFinalShippedOrders] = useState<any[]>([])
  const [finalFailedOrders, setFinalFailedOrders] = useState<any[]>([])
  const [allOrders, setAllOrders] = useState<any[]>([])

  const [allOrdersTotal, setAllOrdersTotal] = useState(0)
  const [shippedOrdersTotal, setShippedOrdersTotal] = useState(0)
  const [failedOrdersTotal, setFailedOrdersTotal] = useState(0)

  const [shippedCount, setShippedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [allCount, setAllCount] = useState(0)

  const [modalVisible, setModalVisible] = useState(false)
  const [selectedSku, setSelectedSku] = useState<any>(null)

  const normalizeSku = (sku: any) => (sku ?? '').toString().trim().toLowerCase()

  const formatAmount = (value: any) => {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return '0'
    return numericValue.toLocaleString('en-PK', { maximumFractionDigits: 0 })
  }

  const toSafeNumber = (value: any) => {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : 0
  }

  const getItemQuantity = (item: any) => toSafeNumber(item?.quantity ?? item?.productQuantity ?? 0)

  const getNetItemTotal = (item: any) => {
    const quantity = getItemQuantity(item)
    if (item?.totalPrice !== undefined && item?.totalPrice !== null) {
      return toSafeNumber(item.totalPrice)
    }
    return toSafeNumber(item?.price ?? item?.unitPrice ?? 0) * quantity
  }

  const getNetGrandTotal = (items: any[] = []) =>
    items.reduce((sum, item) => sum + getNetItemTotal(item), 0)

  const firebaseSkusByNormalizedSku = useMemo(() => {
    const map: { [key: string]: any } = {}
    firebaseSkus.forEach((item: any) => {
      const normalized = normalizeSku(item?.sku)
      if (normalized) {
        map[normalized] = item
      }
    })
    return map
  }, [firebaseSkus])

  // Fetch Firebase SKUs (Mappings)
  useEffect(() => {
    if (!currentUser) return

    const skuRef = ref(database, `users/${currentUser.uid}/skusList`)
    const unsubscribe = onValue(skuRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const array = Object.entries(data).map(([id, value]) => ({
          id,
          ...value as any,
        }))
        setFirebaseSkus(array)
        setFirebaseDataLoaded(true)
      } else {
        setFirebaseSkus([])
        setFirebaseDataLoaded(true)
      }
    })

    return () => off(skuRef, 'value', unsubscribe)
  }, [currentUser])

  // Fetch Firebase Products
  useEffect(() => {
    if (!currentUser) return

    const productRef = ref(database, `users/${currentUser.uid}/products`)
    const unsubscribe = onValue(productRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setFirebaseProducts(data)
      } else {
        setFirebaseProducts({})
      }
    })

    return () => off(productRef, 'value', unsubscribe)
  }, [currentUser])

  // Update Access Tokens
  useEffect(() => {
    let newTokens: any[] = []
    if (selector.selectedStore?.id) {
      const access_token = selector.selectedStore.user?.token?.access_token
      const name = selector.selectedStore?.user?.seller?.data?.name
      if (access_token) {
        newTokens = [{
          access_token,
          storeName: name || null
        }]
      }
    } else {
      newTokens = Array.isArray(selector.access_tokens) ? selector.access_tokens : []
    }

    const hasChanged = JSON.stringify(newTokens) !== JSON.stringify(all_access_tokens)
    if (hasChanged) {
      setAll_access_tokens(newTokens)
    }
  }, [selector, all_access_tokens])

  const getDarazOrders = async (access_token: string, createdAfterISO: string, status: string) => {
    try {
      const response = await fetch(`${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`)
      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const data = await response.json()

      return {
        status,
        countTotal: data.countTotal || 0,
        orderItems: data.orderItems || [],
        skus: countSkusFromOrders(data.orderItems || [])
      }
    } catch (error) {
      console.error(`Error fetching Daraz orders (${status}):`, error)
      return null
    }
  }

  const countSkusFromOrders = (orders: any[]) => {
    const skuCount: { [key: string]: number } = {}
    orders.forEach(order => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const sku = normalizeSku(item.sku)
          if (!sku) return
          skuCount[sku] = (skuCount[sku] || 0) + 1
        })
      }
    })

    return Object.entries(skuCount).map(([sku, quantity]) => {
      const found = firebaseSkusByNormalizedSku[sku]
      return {
        sku,
        quantity,
        productQuantity: found ? found.productQuantity : 0,
        productId: found ? found.productId : 0,
        unitPrice: found ? found.unitPrice : null,
        price: found ? found.price : null,
        packagingPrice: found ? found.packagingPrice : 0,
      }
    })
  }

  const mergeSkuCounts = (existing: any[], incoming: any[]) => {
    const combined: { [key: string]: any } = {}

    const addToCombined = (items: any[]) => {
      items.forEach(item => {
        const sku = normalizeSku(item.sku)
        if (!sku) return
        if (combined[sku]) {
          combined[sku].quantity += item.quantity
        } else {
          combined[sku] = { ...item }
        }
      })
    }

    addToCombined(existing)
    addToCombined(incoming)

    return Object.values(combined)
  }

  const enrichProductsWithPrices = (items: any[]) => {
    if (!firebaseProducts || !items || !Array.isArray(items)) return []

    const productByIdMap: any = {}
    Object.entries(firebaseProducts).forEach(([key, product]: [string, any]) => {
      productByIdMap[key] = product
    })

    return items.map(item => {
      const normalizedSku = normalizeSku(item.sku)
      const skuItem = firebaseSkusByNormalizedSku[normalizedSku]
      let product = null

      if (item.productId && item.productId !== 0) {
        product = productByIdMap[item.productId]
      }

      let price = 0
      if (skuItem && skuItem.price !== undefined && skuItem.price !== null && String(skuItem.price).trim() !== '') {
        price = parseFloat(skuItem.price)
      }
      if (!price && product && product.price !== undefined && product.price !== null) {
        price = parseFloat(product.price)
      }

      const hasSkuMapping = !!skuItem
      const hasBasePrice = price > 0
      const hasPackagingPrice = toSafeNumber(skuItem?.packagingPrice) > 0
      const isSkuComplete = hasSkuMapping && hasBasePrice && hasPackagingPrice

      return {
        ...item,
        productName: product?.productName || skuItem?.productName || '',
        unitPrice: price,
        price: price,
        packagingPrice: toSafeNumber(skuItem?.packagingPrice),
        status: isSkuComplete
      }
    })
  }

  const calculateTotals = async (items: any[]) => {
    if (items.length === 0) return { items: [], total: 0 }
    try {
      const response = await fetch(`${BASE_URL}/api/orders/calculate-totals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            price: item.unitPrice || item.price,
            quantity: item.quantity,
            ...item,
          }))
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (!result.error && result.data) {
          const enrichedWithTotals = items.map((item, idx) => {
            const backendItem = result.data.items?.[idx]
            return backendItem ? {
              ...item,
              totalPrice: backendItem.totalPrice,
            } : item
          })
          return {
            items: enrichedWithTotals,
            total: getNetGrandTotal(enrichedWithTotals)
          }
        }
      }
    } catch (error) {
      console.error('Error calculating totals:', error)
    }
    return { items, total: getNetGrandTotal(items) }
  }

  const fetchOrders = async () => {
    if (!firebaseDataLoaded || all_access_tokens.length === 0) {
      setLoader(false)
      return
    }

    setLoader(true)
    const createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    const requests = all_access_tokens.flatMap(item => [
      getDarazOrders(item.access_token, createdAfter, 'shipped'),
      getDarazOrders(item.access_token, createdAfter, 'failed_delivery'),
      getDarazOrders(item.access_token, createdAfter, 'shipped_back'),
    ])

    try {
      const results = await Promise.all(requests)

      let totalOrderCount = 0
      let totalShippedCount = 0
      let totalFailedCount = 0
      const allShippedSkus: any[] = []
      const allFailedSkus: any[] = []
      const allItrsSkus: any[] = []

      results.forEach((result) => {
        if (!result) return
        totalOrderCount += result.countTotal

        if (result.status === 'shipped') {
          totalShippedCount += result.countTotal
          allShippedSkus.push(...result.skus)
        } else if (result.status === 'shipped_back') {
          totalFailedCount += result.countTotal
          allFailedSkus.push(...result.skus)
        } else if (result.status === 'failed_delivery') {
          totalFailedCount += result.countTotal
          allItrsSkus.push(...result.skus)
        }
      })

      setShippedCount(totalShippedCount)
      setFailedCount(totalFailedCount)
      setAllCount(totalShippedCount + totalFailedCount)

      // Merge SKU lists across stores/requests before enriching
      const mergedShippedSkus = mergeSkuCounts(allShippedSkus, [])
      const mergedFailedSkus = mergeSkuCounts(allFailedSkus, allItrsSkus)
      const mergedAllSkus = mergeSkuCounts(mergedShippedSkus, mergedFailedSkus)

      // Enrich and calculate totals
      const enrichedShipped = enrichProductsWithPrices(mergedShippedSkus)
      const shippedResult = await calculateTotals(enrichedShipped)
      setFinalShippedOrders(shippedResult.items)
      setShippedOrdersTotal(shippedResult.total)

      const enrichedFailed = enrichProductsWithPrices(mergedFailedSkus)
      const failedResult = await calculateTotals(enrichedFailed)
      setFinalFailedOrders(failedResult.items)
      setFailedOrdersTotal(failedResult.total)

      const enrichedAll = enrichProductsWithPrices(mergedAllSkus)
      const allResult = await calculateTotals(enrichedAll)
      setAllOrders(allResult.items)
      setAllOrdersTotal(allResult.total)

    } catch (error) {
      console.error('Error in fetchOrders:', error)
    } finally {
      setLoader(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [all_access_tokens, firebaseDataLoaded])

  const handleSkuClick = (item: any) => {
    setSelectedSku(item)
    setModalVisible(true)
  }

  const handleSkuUpdateSuccess = () => {
    fetchOrders()
    setModalVisible(false)
  }

  const tabs = [
    { title: AppStrings.all, count: allCount },
    { title: AppStrings.shipped, count: shippedCount },
    { title: AppStrings.failed, count: failedCount },
  ]

  const getCurrentOrders = () => {
    if (selectedTab === 0) return allOrders
    if (selectedTab === 1) return finalShippedOrders
    if (selectedTab === 2) return finalFailedOrders
    return []
  }

  const getCurrentTotal = () => {
    if (selectedTab === 0) return allOrdersTotal
    if (selectedTab === 1) return shippedOrdersTotal
    if (selectedTab === 2) return failedOrdersTotal
    return 0
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bgcolor,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <Header title={AppStrings.daraz} goBack={() => navigate(-1)} info={AppStrings.darazInfo} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SelectStore />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: `1px solid ${theme.border}`,
        paddingBottom: '2px'
      }}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setSelectedTab(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              border: 'none',
              borderBottom: selectedTab === index ? `2px solid ${AppColors.primaryOrange}` : '2px solid transparent',
              backgroundColor: selectedTab === index ? `${AppColors.primaryOrange}10` : 'transparent',
              color: selectedTab === index ? AppColors.primaryOrange : theme.textSecondary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.title}
            <span style={{
              backgroundColor: selectedTab === index ? AppColors.primaryOrange : theme.border,
              color: selectedTab === index ? theme.white : theme.textSecondary,
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loader ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', color: theme.textSecondary }}>
            <div className="loader">Loading SKU details...</div>
          </div>
        ) : (
          <div style={{
            backgroundColor: theme.card,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            border: `1px solid ${theme.border}`
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
              padding: '16px 24px',
              backgroundColor: AppColors.primaryOrange,
              color: theme.white,
              fontWeight: 600,
              fontSize: '14px'
            }}>
              <div>{AppStrings.sku}</div>
              <div style={{ textAlign: 'center' }}>{AppStrings.price}</div>
              <div style={{ textAlign: 'center' }}>{AppStrings.quantity}</div>
              <div style={{ textAlign: 'right' }}>{AppStrings.total}</div>
            </div>

            {/* Table Body */}
            <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
              {getCurrentOrders().length > 0 ? (
                getCurrentOrders().map((item, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
                    padding: '16px 24px',
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: '14px',
                    color: theme.textPrimary,
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                    onClick={() => handleSkuClick(item)}
                  >
                    <div style={{
                      wordBreak: 'break-all',
                      color: item.status ? theme.textPrimary : AppColors.primaryOrange,
                      fontWeight: item.status ? 400 : 500,
                      textDecoration: item.status ? 'none' : 'underline'
                    }}>
                      {item.sku}
                    </div>
                    <div style={{ textAlign: 'center' }}>{formatAmount(item.price)}</div>
                    <div style={{ textAlign: 'center' }}>{item.quantity}</div>
                    <div style={{ textAlign: 'right', fontWeight: 600 }}>
                      <span style={{ fontSize: '12px', color: theme.textSecondary, marginRight: '4px' }}>Rs</span>
                      {formatAmount(getNetItemTotal(item))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', color: theme.textSecondary }}>
                  No orders found for this period.
                </div>
              )}
            </div>

            {/* Table Footer */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr',
              padding: '16px 24px',
              backgroundColor: `${AppColors.primaryOrange}10`,
              borderTop: `2px solid ${AppColors.primaryOrange}`,
              fontWeight: 700,
              fontSize: '16px',
              color: theme.textPrimary
            }}>
              <div>{AppStrings.total}</div>
              <div style={{ textAlign: 'right', color: AppColors.primaryOrange }}>
                <span style={{ fontSize: '14px', marginRight: '4px' }}>Rs</span>
                {formatAmount(getCurrentTotal())}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SkuLinkingModal */}
      {modalVisible && selectedSku && (
        <SkuLinkingModal
          sku={selectedSku}
          onClose={() => setModalVisible(false)}
          onSuccess={handleSkuUpdateSuccess}
          theme={theme}
          firebaseProducts={firebaseProducts}
          BASE_URL={BASE_URL}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}

const SkuLinkingModal = ({ sku, onClose, onSuccess, theme, firebaseProducts, BASE_URL, currentUser }: any) => {
  const [productId, setProductId] = useState(sku.productId || '')
  const [quantity, setQuantity] = useState(sku.productQuantity || '')
  const [price, setPrice] = useState(sku.unitPrice || sku.price || '')
  const [packagingPrice, setPackagingPrice] = useState(sku.packagingPrice || '')
  const [isSaving, setIsSaving] = useState(false)

  const productsList = Object.entries(firebaseProducts).map(([id, product]: [string, any]) => ({
    id,
    name: product.productName,
    price: product.price
  }))

  const handleProductChange = (e: any) => {
    const selectedId = e.target.value
    setProductId(selectedId)
    const product = productsList.find(p => p.id === selectedId)
    if (product) {
      setPrice(product.price)
    }
  }

  const handleSave = async () => {
    if (!productId || !quantity || !currentUser) return
    setIsSaving(true)
    try {
      const product = productsList.find(p => p.id === productId)
      const response = await fetch(`${BASE_URL}/api/skus/${currentUser.uid}/${sku.sku}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity,
          productName: product?.name || '',
          packagingPrice: packagingPrice || '0',
          unitPrice: price || '0',
        }),
      })
      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error updating SKU mapping:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: theme.card,
        padding: '32px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: 0, fontSize: '20px', color: theme.textPrimary }}>Update SKU {sku.sku}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: theme.textSecondary }}>Select Product</label>
          <select
            value={productId}
            onChange={handleProductChange}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgcolor,
              color: theme.textPrimary
            }}
          >
            <option value="">Select a product</option>
            {productsList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: theme.textSecondary }}>Quantity per SKU</label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgcolor,
              color: theme.textPrimary
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: theme.textSecondary }}>Unit Price (Rs)</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgcolor,
              color: theme.textPrimary
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: theme.textSecondary }}>Packaging Price (Rs)</label>
          <input
            type="number"
            value={packagingPrice}
            onChange={e => setPackagingPrice(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgcolor,
              color: theme.textPrimary
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: 'transparent',
              color: theme.textSecondary,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !productId || !quantity}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isSaving ? theme.border : AppColors.primaryOrange,
              color: theme.white,
              cursor: isSaving ? 'default' : 'pointer',
              fontWeight: 600
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DarazPage
