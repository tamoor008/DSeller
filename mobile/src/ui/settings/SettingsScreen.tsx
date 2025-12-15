import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  PermissionsAndroid,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import TextComp from '../components/TextComp';
import Header from '../components/Header';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';

const SettingsScreen = ({ navigation }) => {
  const { theme, themeMode, isDark, setThemeMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('Free'); // Free, Basic, Pro

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await signOut(auth);
              console.log('User signed out!');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API level 33+), we need POST_NOTIFICATIONS permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'DSeller needs permission to send you notifications about your orders and business updates.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setNotificationsEnabled(true);
            console.log('Notification permission granted');
          } else {
            setNotificationsEnabled(false);
            Alert.alert(
              'Permission Denied',
              'Notification permission is required to receive alerts. You can enable it later in app settings.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          }
        } else {
          // For older Android versions, notifications are enabled by default
          setNotificationsEnabled(true);
        }
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
        setNotificationsEnabled(false);
        Alert.alert('Error', 'Failed to request notification permission. Please try again.');
      }
    } else if (Platform.OS === 'ios') {
      // For iOS, we need to use a notification library or guide user to settings
      // Since we don't have a notification library, we'll guide the user
      Alert.alert(
        'Enable Notifications',
        'To enable notifications, please go to Settings > DSeller > Notifications and turn on Allow Notifications.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setNotificationsEnabled(false),
          },
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openSettings();
              // We'll assume they enabled it, but in a real app you'd check the permission status
              setNotificationsEnabled(true);
            },
          },
        ]
      );
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      // User wants to enable notifications - request permission
      await requestNotificationPermission();
    } else {
      // User wants to disable notifications
      setNotificationsEnabled(false);
      Alert.alert(
        'Notifications Disabled',
        'You have disabled notifications. You can enable them again anytime from settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePlanUpgrade = (planName: string) => {
    Alert.alert(
      'Upgrade Plan',
      `Are you sure you want to upgrade to ${planName} plan?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Upgrade',
          onPress: () => {
            // Handle plan upgrade logic here
            setCurrentPlan(planName);
            Alert.alert('Success', `You have successfully upgraded to ${planName} plan!`);
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent, 
    showArrow = true 
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: theme.orange20 }]}>
            <Icon name={icon} size={20} color={theme.primaryOrange} />
          </View>
        )}
        <View style={styles.settingItemText}>
          <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: theme.textPrimary }}>
            {title}
          </TextComp>
          {subtitle && (
            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textSecondary, marginTop: 2 }}>
              {subtitle}
            </TextComp>
          )}
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {rightComponent}
        {showArrow && (
          <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const PlanCard = ({ planName, price, features, isCurrent, isPopular }) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        isCurrent && { borderColor: theme.primaryOrange, backgroundColor: theme.orange20 },
        isPopular && { borderColor: theme.primaryOrange },
      ]}
      onPress={() => !isCurrent && handlePlanUpgrade(planName)}
      activeOpacity={0.8}
    >
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: theme.primaryOrange }]}>
          <TextComp size={10} style={{ fontFamily: FontFamilty.bold, color: theme.white }}>
            POPULAR
          </TextComp>
        </View>
      )}
      {isCurrent && (
        <View style={[styles.currentBadge, { backgroundColor: theme.green }]}>
          <TextComp size={10} style={{ fontFamily: FontFamilty.bold, color: theme.white }}>
            CURRENT
          </TextComp>
        </View>
      )}
      <View style={styles.planHeader}>
        <TextComp size={20} style={{ fontFamily: FontFamilty.bold, color: theme.textPrimary }}>
          {planName}
        </TextComp>
        <View style={styles.planPrice}>
          <TextComp size={24} style={{ fontFamily: FontFamilty.bold, color: theme.primaryOrange }}>
            {price}
          </TextComp>
          {price !== 'Free' && (
            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textSecondary, marginLeft: 4 }}>
              /month
            </TextComp>
          )}
        </View>
      </View>
      <View style={styles.planFeatures}>
        {features.map((feature, index) => (
          <View key={index} style={styles.planFeature}>
            <Icon name="checkmark-circle" size={16} color={theme.green} />
            <TextComp size={14} style={{ fontFamily: FontFamilty.regular, color: theme.textPrimary, marginLeft: 8 }}>
              {feature}
            </TextComp>
          </View>
        ))}
      </View>
      {!isCurrent && (
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: theme.primaryOrange }]}
          onPress={() => handlePlanUpgrade(planName)}
          activeOpacity={0.8}
        >
          <TextComp size={14} style={{ fontFamily: FontFamilty.semibold, color: theme.white }}>
            {price === 'Free' ? 'Select Plan' : 'Upgrade Now'}
          </TextComp>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgcolor }]}>
      <View style={styles.container}>
        <Header
          goBack={() => navigation.goBack()}
          title={AppStrings.settings}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Settings Section */}
          <View style={styles.section}>
            <TextComp size={14} style={{ fontFamily: FontFamilty.semibold, color: theme.textSecondary, marginBottom: 12 }}>
              ACCOUNT
            </TextComp>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <SettingItem
                icon="person-outline"
                title="Profile"
                subtitle="Manage your account information"
                onPress={() => navigation.navigate('ProfileScreen')}
              />
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <SettingItem
                icon="lock-closed-outline"
                title="Security"
                subtitle="Password and security settings"
                onPress={() => Alert.alert('Security', 'Security settings coming soon')}
              />
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <SettingItem
                icon="storefront-outline"
                title="Stores"
                subtitle="Manage connected Daraz stores"
                onPress={() => navigation.navigate('StoresScreen')}
              />
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <TextComp size={14} style={{ fontFamily: FontFamilty.semibold, color: theme.textSecondary, marginBottom: 12 }}>
              PREFERENCES
            </TextComp>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <SettingItem
                icon="notifications-outline"
                title="Notifications"
                subtitle="Push notifications and alerts"
                onPress={() => {}}
                showArrow={false}
                rightComponent={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: theme.border, true: theme.primaryOrange }}
                    thumbColor={theme.white}
                  />
                }
              />
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <SettingItem
                icon="color-palette-outline"
                title="Appearance"
                subtitle={isDark ? 'Dark Theme' : 'Light Theme'}
                onPress={() => {}}
                showArrow={false}
                rightComponent={
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: theme.border, true: theme.primaryOrange }}
                    thumbColor={theme.white}
                  />
                }
              />
            </View>
          </View>

          {/* Payment Plans Section */}
          <View style={styles.section}>
            <TextComp size={14} style={{ fontFamily: FontFamilty.semibold, color: theme.textSecondary, marginBottom: 12 }}>
              PAYMENT PLAN
            </TextComp>
            <View style={styles.planSection}>
              <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: theme.textPrimary, marginBottom: 16 }}>
                Current Plan: {currentPlan}
              </TextComp>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.plansContainer}
              >
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
              </ScrollView>
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <TextComp size={14} style={{ fontFamily: FontFamilty.semibold, color: theme.textSecondary, marginBottom: 12 }}>
              SUPPORT
            </TextComp>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <SettingItem
                icon="help-circle-outline"
                title="Help & Support"
                subtitle="Get help and contact support"
                onPress={() => Alert.alert('Help', 'Help center coming soon')}
              />
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <SettingItem
                icon="information-circle-outline"
                title="About"
                subtitle="App version and information"
                onPress={() => Alert.alert('About', 'DSeller v1.0.0\n\nManage your Daraz business efficiently.')}
              />
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <SettingItem
                icon="document-text-outline"
                title="Terms & Privacy"
                subtitle="Terms of service and privacy policy"
                onPress={() => navigation.navigate('TermsPrivacyScreen')}
              />
            </View>
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: theme.card, borderColor: theme.red }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Icon name="log-out-outline" size={20} color={theme.red} />
              <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.red, marginLeft: 8 }}>
                Logout
              </TextComp>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 56,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  planSection: {
    marginTop: 8,
  },
  plansContainer: {
    paddingVertical: 8,
    columnGap: 16,
  },
  planCard: {
    width: 280,
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planHeader: {
    marginBottom: 16,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  planFeatures: {
    marginBottom: 20,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
});

export default SettingsScreen;

