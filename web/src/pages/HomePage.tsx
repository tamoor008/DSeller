import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getDatabase, ref, onValue, off } from 'firebase/database'
import { database } from '../config/firebase'
import { auth } from '../config/firebase'
import { useTheme } from '../context/ThemeContext'
import { AppStrings } from '../constants/strings'
import HomeHeader from '../components/HomeHeader'
import SelectStore from '../components/SelectStore'
import TotalBusinessComp from '../components/TotalBusinessComp'
import IndividualValueComp from '../components/IndividualValueComp'
import IndividualDataComp from '../components/IndividualDataComp'
import WeeklyReportComp from '../components/WeeklyReportComp'
import { getBaseUrl } from '../utils/api/baseUrl'

const HomePage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const selector = useSelector((state: any) => state.AppReducer)
  const { theme } = useTheme()
  const [reloadScreen, setReloadScreen] = useState(false)
  
  // Order counts
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [readyToShipOrdersCount, setReadyToShipOrdersCount] = useState(0)
  const [deliveredOrdersCount, setDeliveredOrdersCount] = useState(0)
  const [failedOrdersCount, setFailedOrdersCount] = useState(0)
  const [darazOrdersLoader, setDarazOrdersLoader] = useState(false)
  
  // Business values
  const [allOrdersTotal, setAllOrdersTotal] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [darazLoader, setDarazLoader] = useState(false)
  const [stockLoader, setStockLoader] = useState(false)
  
  const [firebaseSkus, setFirebaseSkus] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [all_access_tokens, setAll_access_tokens] = useState<any[]>([])
  const BASE_URL = getBaseUrl()

  const currentUser = auth.currentUser

  // Fetch Firebase SKUs
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
      } else {
        setFirebaseSkus([])
      }
    }, (error) => {
      console.error('Error fetching SKUs:', error)
    })

    return () => off(skuRef, 'value', unsubscribe)
  }, [currentUser, reloadScreen])

  // Fetch products
  useEffect(() => {
    if (!currentUser) return

    setStockLoader(true)
    const productRef = ref(database, `users/${currentUser.uid}/products`)
    const unsubscribe = onValue(productRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const array = Object.entries(data).map(([id, value]) => ({
          id,
          ...value as any,
        }))
        setProducts(array)
        const total = array.reduce((sum: number, item: any) => {
          return sum + (item.price || 0) * (item.quantity || 0)
        }, 0)
        setTotalPrice(total)
      } else {
        setProducts([])
        setTotalPrice(0)
      }
      setStockLoader(false)
    }, (error) => {
      console.error('Error fetching products:', error)
      setStockLoader(false)
    })

    return () => off(productRef, 'value', unsubscribe)
  }, [currentUser, reloadScreen])

  // Update access tokens
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

  // Fetch order counts
  useEffect(() => {
    if (!all_access_tokens || all_access_tokens.length === 0) return

    const fetchOrderCounts = async () => {
      setDarazOrdersLoader(true)
      setPendingOrdersCount(0)
      setReadyToShipOrdersCount(0)
      setDeliveredOrdersCount(0)
      setFailedOrdersCount(0)

      const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)

      try {
        const requests = all_access_tokens.flatMap((item: any) => {
          if (!item?.access_token) return []
          return [
            fetch(`${BASE_URL}/get-daraz-order-details?access_token=${item.access_token}&created_after=${encodeURIComponent(createdAfter)}&status=pending`),
            fetch(`${BASE_URL}/get-daraz-order-details?access_token=${item.access_token}&created_after=${encodeURIComponent(createdAfter)}&status=ready_to_ship`),
            fetch(`${BASE_URL}/get-daraz-delivered-order-details?access_token=${item.access_token}&update_after=${encodeURIComponent(startOfToday.toISOString())}&update_before=${encodeURIComponent(new Date().toISOString())}&status=delivered`),
          ]
        })

        const responses = await Promise.all(requests)
        const data = await Promise.all(responses.map(r => r.json()))

        data.forEach((result: any, index: number) => {
          const statusIndex = index % 3
          if (statusIndex === 0) {
            setPendingOrdersCount(prev => prev + (result.countTotal || 0))
          } else if (statusIndex === 1) {
            setReadyToShipOrdersCount(prev => prev + (result.countTotal || 0))
          } else if (statusIndex === 2) {
            setDeliveredOrdersCount(prev => prev + (result.orderItems?.length || 0))
          }
        })
    } catch (error) {
        console.error('Error fetching order counts:', error)
      } finally {
        setDarazOrdersLoader(false)
    }
  }

    fetchOrderCounts()
  }, [all_access_tokens, reloadScreen, BASE_URL])

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: theme.bgcolor,
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <HomeHeader onOpenSettings={() => navigate('/settings')} />
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SelectStore />
        <TotalBusinessComp businessValue="500,000" />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: theme.textPrimary,
            letterSpacing: '-0.02em'
          }}>
            {AppStrings.darazDetails}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <IndividualDataComp
              loader={darazOrdersLoader}
              data={pendingOrdersCount}
              label={AppStrings.pendingOrders}
              onPress={() => navigate('/orders/pending')}
            />
            <IndividualDataComp
              loader={darazOrdersLoader}
              data={readyToShipOrdersCount}
              label={AppStrings.readyToShipOrders}
              onPress={() => navigate('/orders/ready-to-ship')}
            />
            <IndividualDataComp
              loader={false}
              data={deliveredOrdersCount}
              label={AppStrings.deliveredOrdersToday}
              onPress={() => navigate('/orders/delivered')}
            />
            <IndividualDataComp
              loader={false}
              data={failedOrdersCount}
              label={AppStrings.failedOrdersToday}
              onPress={() => navigate('/orders/failed')}
            />
          </div>
          <WeeklyReportComp
            onPress={() => navigate('/weekly-report')}
            text="Check weekly report"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: theme.textPrimary,
            letterSpacing: '-0.02em'
          }}>
            {AppStrings.businessDetails}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <IndividualValueComp
              loader={darazLoader}
              amount={allOrdersTotal}
              label={AppStrings.daraz}
              info={AppStrings.darazInfo}
              onPress={() => navigate('/daraz')}
            />
            <IndividualValueComp
              loader={stockLoader}
              amount={totalPrice}
              label={AppStrings.stock}
              info={AppStrings.stockInfo}
              onPress={() => navigate('/stock')}
            />
            <IndividualValueComp
              loader={false}
              amount={25000}
              label={AppStrings.cash}
              info={AppStrings.cashInfo}
              onPress={() => navigate('/cash')}
            />
            <IndividualValueComp
              loader={false}
              amount={25000}
              label={AppStrings.packaging}
              info={AppStrings.packagingInfo}
              onPress={() => navigate('/packaging')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
