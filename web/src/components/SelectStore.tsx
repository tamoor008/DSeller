import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getDatabase, ref, onValue, off } from 'firebase/database'
import { database } from '../config/firebase'
import { auth } from '../config/firebase'
import { setSelectedStore, setAccessTokens } from '../store/slices/appSlice'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'
import { useNavigate } from 'react-router-dom'

const SelectStore: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const selector = useSelector((state: any) => state.AppReducer)
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    const storesRef = ref(database, `users/${currentUser.uid}/stores`)
    
    const unsubscribe = onValue(storesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const storesArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value as any,
        }))
        setStores(storesArray)
        
        // Set access tokens from stores
        const tokens = storesArray.map((store: any) => ({
          access_token: store.user?.token?.access_token || null,
          storeName: store.user?.seller?.data?.name || null,
          id: store.id
        })).filter((token: any) => token.access_token)
        
        dispatch(setAccessTokens(tokens))
      } else {
        setStores([])
        dispatch(setAccessTokens([]))
      }
    }, (error) => {
      console.error('Error fetching stores:', error)
    })

    return () => off(storesRef, 'value', unsubscribe)
  }, [dispatch])

  const handleSelectStore = (store: any) => {
    dispatch(setSelectedStore(store))
  }

  const handleAddStore = () => {
    navigate('/daraz-oauth')
  }

  if (stores.length === 0) {
    return (
      <div style={{
        backgroundColor: AppColors.card,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: `1px solid ${AppColors.border}`
      }}>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: AppColors.textSecondary,
          marginBottom: '12px'
        }}>
          {AppStrings.youhavenoconnecteddarazstoreatthemoment}
        </p>
        <button
          onClick={handleAddStore}
          style={{
            backgroundColor: AppColors.primaryOrange,
            color: AppColors.white,
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(248, 86, 6, 0.2)'
          }}
        >
          {AppStrings.addaccount}
        </button>
      </div>
    )
  }

    return (
      <div style={{
        backgroundColor: AppColors.card,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: `1px solid ${AppColors.border}`
      }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => dispatch(setSelectedStore({}))}
            style={{
              backgroundColor: !selector.selectedStore?.id ? AppColors.primaryOrange : AppColors.surface,
              color: !selector.selectedStore?.id ? AppColors.white : AppColors.textPrimary,
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: !selector.selectedStore?.id ? '0 2px 4px rgba(248, 86, 6, 0.2)' : 'none'
            }}
        >
          {AppStrings.allstores}
        </button>
        {stores.map((store: any) => (
          <button
            key={store.id}
            onClick={() => handleSelectStore(store)}
            style={{
              backgroundColor: selector.selectedStore?.id === store.id ? AppColors.primaryOrange : AppColors.surface,
              color: selector.selectedStore?.id === store.id ? AppColors.white : AppColors.textPrimary,
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selector.selectedStore?.id === store.id ? '0 2px 4px rgba(248, 86, 6, 0.2)' : 'none'
            }}
          >
            {store.user?.seller?.data?.name || `Store ${store.id}`}
          </button>
        ))}
        <button
          onClick={handleAddStore}
          style={{
            backgroundColor: AppColors.surface,
            color: AppColors.textPrimary,
            border: `1px solid ${AppColors.border}`,
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          + {AppStrings.addaccount}
        </button>
      </div>
    </div>
  )
}

export default SelectStore



