import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import SelectStore from '../components/SelectStore'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

const DarazPage = () => {
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState(0)

  const tabs = [
    { title: AppStrings.orders, selected: true },
    { title: AppStrings.income, selected: false },
  ]

  const toggleTabs = (index: number) => {
    setSelectedTab(index)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor,
      padding: '16px'
    }}>
      <Header title={AppStrings.daraz} goBack={() => navigate(-1)} info={AppStrings.darazInfo} />
      <div style={{ marginTop: '16px' }}>
        <SelectStore />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '16px',
        borderBottom: `1px solid ${AppColors.border}`
      }}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => toggleTabs(index)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: selectedTab === index ? `2px solid ${AppColors.primaryOrange}` : '2px solid transparent',
              backgroundColor: 'transparent',
              color: selectedTab === index ? AppColors.primaryOrange : AppColors.textSecondary,
              fontSize: '16px',
              fontWeight: selectedTab === index ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: '16px' }}>
        {selectedTab === 0 && (
          <div style={{
            backgroundColor: AppColors.card,
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: AppColors.textSecondary }}>
              Orders tab - Navigate to Orders page for detailed view
            </p>
            <button
              onClick={() => navigate('/orders')}
              style={{
                marginTop: '1rem',
                backgroundColor: AppColors.primaryOrange,
                color: AppColors.white,
                border: 'none',
                borderRadius: '4px',
                padding: '0.75rem 1.5rem',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              View Orders
            </button>
          </div>
        )}
        {selectedTab === 1 && (
          <div style={{
            backgroundColor: AppColors.card,
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: AppColors.textSecondary }}>
              Income tab feature coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DarazPage






