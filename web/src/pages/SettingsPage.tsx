import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import Header from '../components/Header'
import { useTheme } from '../context/ThemeContext'
import { AppStrings } from '../constants/strings'

const SettingsPage = () => {
  const navigate = useNavigate()
  const { theme, isDark, toggleTheme } = useTheme()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('Free')

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      signOut(auth).then(() => {
        console.log('User signed out!')
        navigate('/login')
      }).catch((error) => {
        console.error('Error signing out:', error)
        alert('Failed to sign out. Please try again.')
      })
    }
  }

  const handlePlanUpgrade = (planName: string) => {
    if (window.confirm(`Are you sure you want to upgrade to ${planName} plan?`)) {
      setCurrentPlan(planName)
      alert(`You have successfully upgraded to ${planName} plan!`)
    }
  }

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent, 
    showArrow = true 
  }: {
    icon?: string
    title: string
    subtitle?: string
    onPress?: () => void
    rightComponent?: React.ReactNode
    showArrow?: boolean
  }) => (
    <div
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        minHeight: '56px',
        cursor: onPress ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        if (onPress) {
          e.currentTarget.style.backgroundColor = theme.surface
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {icon && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '20px',
            backgroundColor: theme.orange20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '20px'
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 500,
            color: theme.textPrimary,
            marginBottom: subtitle ? '2px' : 0
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: '12px',
              color: theme.textSecondary,
              marginTop: '2px'
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {rightComponent}
        {showArrow && (
          <span style={{ color: theme.textSecondary }}>›</span>
        )}
      </div>
    </div>
  )

  const PlanCard = ({ planName, price, features, isCurrent, isPopular }: {
    planName: string
    price: string
    features: string[]
    isCurrent: boolean
    isPopular?: boolean
  }) => (
    <div
      onClick={() => !isCurrent && handlePlanUpgrade(planName)}
      style={{
        width: '280px',
        backgroundColor: theme.card,
        borderRadius: '12px',
        border: `2px solid ${isCurrent ? theme.primaryOrange : theme.border}`,
        padding: '20px',
        position: 'relative',
        cursor: isCurrent ? 'default' : 'pointer',
        ...(isCurrent && { backgroundColor: theme.orange20 })
      }}
    >
      {isPopular && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '16px',
          backgroundColor: theme.primaryOrange,
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: 700,
          color: theme.white
        }}>
          POPULAR
        </div>
      )}
      {isCurrent && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '16px',
          backgroundColor: theme.green,
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: 700,
          color: theme.white
        }}>
          CURRENT
        </div>
      )}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 700,
          color: theme.textPrimary,
          marginBottom: '8px'
        }}>
          {planName}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{
            fontSize: '24px',
            fontWeight: 700,
            color: theme.primaryOrange
          }}>
            {price}
          </span>
          {price !== 'Free' && (
            <span style={{
              fontSize: '12px',
              color: theme.textSecondary,
              marginLeft: '4px'
            }}>
              /month
            </span>
          )}
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        {features.map((feature, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ color: theme.green, marginRight: '8px' }}>✓</span>
            <span style={{
              fontSize: '14px',
              color: theme.textPrimary
            }}>
              {feature}
            </span>
          </div>
        ))}
      </div>
      {!isCurrent && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handlePlanUpgrade(planName)
          }}
          style={{
            width: '100%',
            backgroundColor: theme.primaryOrange,
            color: theme.white,
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {price === 'Free' ? 'Select Plan' : 'Upgrade Now'}
        </button>
      )}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bgcolor,
      padding: '16px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <Header title={AppStrings.settings} goBack={() => navigate(-1)} />
      
      <div style={{ paddingTop: '16px' }}>
        {/* Account Settings Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: theme.textSecondary,
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            ACCOUNT
          </div>
          <div style={{
            backgroundColor: theme.card,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden'
          }}>
            <SettingItem
              icon="👤"
              title="Profile"
              subtitle="Manage your account information"
              onPress={() => alert('Profile settings coming soon')}
            />
            <div style={{ height: '1px', backgroundColor: theme.border, marginLeft: '52px' }} />
            <SettingItem
              icon="🔒"
              title="Security"
              subtitle="Password and security settings"
              onPress={() => alert('Security settings coming soon')}
            />
            <div style={{ height: '1px', backgroundColor: theme.border, marginLeft: '52px' }} />
            <SettingItem
              icon="🏪"
              title="Stores"
              subtitle="Manage connected Daraz stores"
              onPress={() => alert('Store management coming soon')}
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: theme.textSecondary,
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            PREFERENCES
          </div>
          <div style={{
            backgroundColor: theme.card,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden'
          }}>
            <SettingItem
              icon="🔔"
              title="Notifications"
              subtitle="Push notifications and alerts"
              showArrow={false}
              rightComponent={
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: notificationsEnabled ? theme.primaryOrange : theme.border,
                    borderRadius: '28px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: '4px',
                      bottom: '4px',
                      backgroundColor: theme.white,
                      borderRadius: '50%',
                      transition: '0.3s',
                      transform: notificationsEnabled ? 'translateX(22px)' : 'translateX(0)'
                    }} />
                  </span>
                </label>
              }
            />
            <div style={{ height: '1px', backgroundColor: theme.border, marginLeft: '52px' }} />
            <SettingItem
              icon="🎨"
              title="Appearance"
              subtitle={isDark ? 'Dark Theme' : 'Light Theme'}
              showArrow={false}
              rightComponent={
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isDark ? theme.primaryOrange : theme.border,
                    borderRadius: '28px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: '4px',
                      bottom: '4px',
                      backgroundColor: theme.white,
                      borderRadius: '50%',
                      transition: '0.3s',
                      transform: isDark ? 'translateX(22px)' : 'translateX(0)'
                    }} />
                  </span>
                </label>
              }
            />
          </div>
        </div>

        {/* Payment Plans Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: theme.textSecondary,
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            PAYMENT PLAN
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 500,
              color: theme.textPrimary,
              marginBottom: '16px'
            }}>
              Current Plan: {currentPlan}
            </div>
            <div style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '8px'
            }}>
              <PlanCard
                planName="Free"
                price="Free"
                features={[
                  'Basic order tracking',
                  'Up to 1 store',
                  'Basic reports',
                ]}
                isCurrent={currentPlan === 'Free'}
              />
              <PlanCard
                planName="Basic"
                price="Rs. 999"
                features={[
                  'All Free features',
                  'Up to 3 stores',
                  'Advanced reports',
                  'Email support',
                ]}
                isCurrent={currentPlan === 'Basic'}
                isPopular={true}
              />
              <PlanCard
                planName="Pro"
                price="Rs. 2,499"
                features={[
                  'All Basic features',
                  'Unlimited stores',
                  'Real-time analytics',
                  'Priority support',
                  'API access',
                ]}
                isCurrent={currentPlan === 'Pro'}
              />
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: theme.textSecondary,
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            SUPPORT
          </div>
          <div style={{
            backgroundColor: theme.card,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden'
          }}>
            <SettingItem
              icon="❓"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => alert('Help center coming soon')}
            />
            <div style={{ height: '1px', backgroundColor: theme.border, marginLeft: '52px' }} />
            <SettingItem
              icon="ℹ️"
              title="About"
              subtitle="App version and information"
              onPress={() => alert('DSeller v1.0.0\n\nManage your Daraz business efficiently.')}
            />
            <div style={{ height: '1px', backgroundColor: theme.border, marginLeft: '52px' }} />
            <SettingItem
              icon="📄"
              title="Terms & Privacy"
              subtitle="Terms of service and privacy policy"
              onPress={() => alert('Terms and privacy policy coming soon')}
            />
          </div>
        </div>

        {/* Logout Section */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: theme.card,
              borderRadius: '12px',
              border: `1px solid ${theme.red}`,
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              color: theme.red,
              cursor: 'pointer'
            }}
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
