import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDatabase, ref, onValue, off } from 'firebase/database'
import { database } from '../config/firebase'
import { auth } from '../config/firebase'
import Header from '../components/Header'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

const StockPage = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const currentUser = auth.currentUser

  useEffect(() => {
    if (!currentUser) return

    setLoading(true)
    const productRef = ref(database, `users/${currentUser.uid}/products`)
    const unsubscribe = onValue(productRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const array = Object.entries(data).map(([id, value]) => ({
          id,
          ...value as any,
        }))
        setProducts(array)
      } else {
        setProducts([])
      }
      setLoading(false)
    }, (error) => {
      console.error('Error fetching products:', error)
      setLoading(false)
    })

    return () => off(productRef, 'value', unsubscribe)
  }, [currentUser])

  const totalPrice = products.reduce((sum, item) => {
    return sum + (item.price || 0) * (item.quantity || 0)
  }, 0)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor,
      padding: '16px'
    }}>
      <Header title={AppStrings.stock} goBack={() => navigate(-1)} info={AppStrings.stockInfo} />

      {/* Summary */}
      <div style={{
        backgroundColor: AppColors.card,
        borderRadius: '8px',
        padding: '16px',
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{
            fontSize: '14px',
            color: AppColors.textSecondary,
            marginBottom: '4px'
          }}>
            Total Stock Value
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: AppColors.textPrimary
          }}>
            Rs {Math.floor(totalPrice).toLocaleString()}
          </div>
        </div>
        <div style={{
          fontSize: '14px',
          color: AppColors.textSecondary
        }}>
          {products.length} Products
        </div>
      </div>

      {/* Products List */}
      <div style={{ marginTop: '16px' }}>
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
        ) : products.length === 0 ? (
          <div style={{
            backgroundColor: AppColors.card,
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            color: AppColors.textSecondary
          }}>
            {AppStrings.therearenoproductsaddnewproductstoseethemhere}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {products.map((product: any) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: AppColors.card,
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: AppColors.textPrimary,
                    marginBottom: '4px'
                  }}>
                    {product.name || 'Unnamed Product'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: AppColors.textSecondary
                  }}>
                    Qty: {product.quantity || 0} | Price: Rs {product.price || 0}
                  </div>
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: AppColors.primaryOrange
                }}>
                  Rs {((product.price || 0) * (product.quantity || 0)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StockPage



