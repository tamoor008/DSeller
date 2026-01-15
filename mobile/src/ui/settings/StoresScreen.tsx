import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import TextComp from '../components/TextComp';
import Header from '../components/Header';
import FontFamilty from '../../constants/FontFamilty';
import { auth } from '../../../firebase';
import { useDispatch, useSelector } from 'react-redux';
import { getBaseUrl } from '../../utils/api/baseUrl';
import WebView from 'react-native-webview';
import { AppStrings } from '../../constants/AppStrings';

const StoresScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const BASE_URL = getBaseUrl();
  const currentUser = auth.currentUser;
  const dispatch = useDispatch();
  const selector = useSelector((state: any) => state.AppReducer);
  
  const [stores, setStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [darazOAuth, setDarazOAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchStoresRef = useRef<(() => Promise<void>) | null>(null);

  const CLIENT_ID = '503646';
  const REDIRECT_URI = 'https://www.moonsys.co';
  const AUTH_URL = `https://api.daraz.pk/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}`;

  const fetchStores = async () => {
    if (!currentUser) {
      setStores([]);
      setStoresLoading(false);
      return;
    }

    try {
      setStoresLoading(true);
      const response = await fetch(`${BASE_URL}/api/stores/${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch stores');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      const dataset = result.data || [];
      setStores(dataset);
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      Alert.alert('Error', 'Failed to load stores. Please check your connection and try again.', [{ text: 'OK' }]);
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  useEffect(() => {
    fetchStoresRef.current = fetchStores;
    fetchStores();

    return () => {
      fetchStoresRef.current = null;
    };
  }, [currentUser]);

  const addAccessToken = async (user: any) => {
    try {
      const sellerId = user.seller_id || user.user?.seller?.data?.short_code;
      
      if (!sellerId) {
        throw new Error('Seller ID not found');
      }

      const response = await fetch(`${BASE_URL}/api/stores/${currentUser.uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: sellerId,
          storeData: { user }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add store');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data.added) {
        Alert.alert('Info', 'Store is already connected.');
        return;
      }

      Alert.alert('Success', 'Store added successfully!');
      
      // Refresh stores list
      if (fetchStoresRef.current) {
        setTimeout(() => {
          fetchStoresRef.current?.();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error adding store:', error);
      Alert.alert('Error', error.message || 'Failed to add store. Please try again.');
    }
  };

  const deleteStore = async (sellerId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this store?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/api/stores/${currentUser.uid}/${sellerId}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete store');
              }

              Alert.alert('Success', 'Store deleted successfully!');
              
              // Refresh stores list
              if (fetchStoresRef.current) {
                setTimeout(() => {
                  fetchStoresRef.current?.();
                }, 500);
              }
            } catch (error: any) {
              console.error('Error deleting store:', error);
              Alert.alert('Error', error.message || 'Failed to delete store. Please try again.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    if (url.startsWith(REDIRECT_URI)) {
      const match = url.match(/[?&]code=([^&]+)/);
      const code = match?.[1];

      if (code) {
        getDarazToken(code);
        setLoading(true);
      }
    }
  };

  const getDarazToken = async (code: string) => {
    try {
      const response = await fetch(`${BASE_URL}/get-daraz-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      await addAccessToken(data);
      setDarazOAuth(false);
      setLoading(false);
    } catch (error: any) {
      console.error('Error getting Daraz token:', error);
      Alert.alert('Error', 'Failed to authenticate with Daraz. Please try again.', [{ text: 'OK' }]);
      setLoading(false);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  const styles = getStyles(theme);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgcolor }}>
      <View style={{ flex: 1, borderBottomWidth: 0, borderColor: theme.white }}>
        <View style={{ rowGap: 16, margin: 16 }}>
          <Header title="Stores" goBack={goBack} />
          
          <TouchableOpacity
            style={{
              backgroundColor: theme.primaryOrange,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center',
            }}
            onPress={() => {
              console.log('🔘 [STORES SCREEN] Add New Store button pressed');
              console.log('🔘 [STORES SCREEN] Current darazOAuth state:', darazOAuth);
              console.log('🔘 [STORES SCREEN] Setting darazOAuth to true');
              setDarazOAuth(true);
              console.log('🔘 [STORES SCREEN] AUTH_URL:', AUTH_URL);
            }}
            activeOpacity={0.7}
          >
            <TextComp size={16} numberOfLines={1} style={{ color: theme.white, fontFamily: FontFamilty.bold }}>
              Add New Store
            </TextComp>
          </TouchableOpacity>
        </View>

        {storesLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primaryOrange} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
              {stores.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <TextComp size={16} numberOfLines={1} style={styles.emptyText}>
                    No stores connected. Add a store to get started.
                  </TextComp>
                </View>
              ) : (
                stores.map((store: any, index: number) => {
                  const sellerId = store.user?.seller?.data?.short_code || store.seller_id || 'Unknown';
                  const storeName = store.user?.seller?.data?.name || 'Unknown Store';
                  
                  return (
                    <View key={index} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.storeInfo}>
                          <Icon name="storefront" size={24} color={theme.primaryOrange} />
                          <View style={styles.storeDetails}>
                            <TextComp size={16} numberOfLines={1} style={styles.storeName}>
                              {storeName}
                            </TextComp>
                            <TextComp size={12} numberOfLines={1} style={styles.storeId}>
                              ID: {sellerId}
                            </TextComp>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => deleteStore(sellerId)}
                          style={styles.deleteButton}
                        >
                          <Icon name="trash-outline" size={20} color={theme.red} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}

        {/* OAuth Modal */}
        <Modal
          visible={darazOAuth}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            console.log('🔘 [STORES SCREEN] Modal close requested');
            setDarazOAuth(false);
          }}
          onShow={() => {
            console.log('✅ [STORES SCREEN] OAuth Modal opened');
            console.log('✅ [STORES SCREEN] Modal AUTH_URL:', AUTH_URL);
          }}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgcolor }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <TextComp size={18} style={{ fontFamily: FontFamilty.bold, color: theme.textPrimary }}>
                Connect Daraz Store
              </TextComp>
              <TouchableOpacity onPress={() => setDarazOAuth(false)}>
                <Icon name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            {loading && (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primaryOrange} />
                <TextComp size={14} style={{ marginTop: 16, color: theme.textSecondary }}>
                  Authenticating...
                </TextComp>
              </View>
            )}
            <WebView
              source={{ uri: AUTH_URL }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              onLoadStart={() => {
                console.log('🌐 [STORES SCREEN - WEBVIEW] Loading started:', AUTH_URL);
                setLoading(true);
              }}
              onLoadEnd={() => {
                console.log('✅ [STORES SCREEN - WEBVIEW] Loading completed');
                setLoading(false);
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('❌ [STORES SCREEN - WEBVIEW] Error loading:', nativeEvent.url);
                console.error('❌ [STORES SCREEN - WEBVIEW] Error code:', nativeEvent.code);
                console.error('❌ [STORES SCREEN - WEBVIEW] Error description:', nativeEvent.description);
                setLoading(false);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('❌ [STORES SCREEN - WEBVIEW] HTTP Error:', nativeEvent.statusCode, nativeEvent.url);
                setLoading(false);
              }}
              onNavigationStateChange={(navState) => {
                console.log('🌐 [STORES SCREEN - WEBVIEW] Navigation changed to:', navState.url);
                console.log('🌐 [STORES SCREEN - WEBVIEW] Can go back:', navState.canGoBack);
                console.log('🌐 [STORES SCREEN - WEBVIEW] Can go forward:', navState.canGoForward);
                console.log('🌐 [STORES SCREEN - WEBVIEW] Loading:', navState.loading);
                handleNavigationStateChange(navState);
              }}
              style={{ flex: 1 }}
              userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              onShouldStartLoadWithRequest={(request) => {
                // Prevent opening in external apps, force web view
                const url = request.url;
                console.log('🔍 [STORES SCREEN - WEBVIEW] Should start load with request:', url);
                console.log('🔍 [STORES SCREEN - WEBVIEW] Request method:', request.method);
                console.log('🔍 [STORES SCREEN - WEBVIEW] Request navigationType:', request.navigationType);
                
                // Allow navigation within Daraz domains or to redirect URI
                if (
                  url.startsWith('https://api.daraz.pk') || 
                  url.startsWith(REDIRECT_URI) || 
                  url.startsWith('https://www.daraz.pk') || 
                  url.startsWith('https://login.daraz.pk') ||
                  url.startsWith('https://sellercenter.daraz.pk') ||
                  url.startsWith('https://account.daraz.pk')
                ) {
                  console.log('✅ [STORES SCREEN - WEBVIEW] Allowing navigation to:', url);
                  return true;
                }
                // Block other URLs to prevent app opening
                console.log('⚠️ [STORES SCREEN - WEBVIEW] Blocking navigation to:', url);
                return false;
              }}
              onMessage={(event) => {
                console.log('📨 [STORES SCREEN - WEBVIEW] Message from WebView:', event.nativeEvent.data);
              }}
              injectedJavaScript={`
                (function() {
                    console.log('🔧 [STORES SCREEN - WEBVIEW] JavaScript injected');
                    // Enable all button clicks
                    document.addEventListener('click', function(e) {
                        console.log('🖱️ [STORES SCREEN - WEBVIEW] Click detected on:', e.target);
                        console.log('🖱️ [STORES SCREEN - WEBVIEW] Click target tag:', e.target.tagName);
                        console.log('🖱️ [STORES SCREEN - WEBVIEW] Click target href:', e.target.href || 'none');
                    }, true);
                    
                    // Log when page is ready
                    if (document.readyState === 'complete') {
                        console.log('✅ [STORES SCREEN - WEBVIEW] Page fully loaded');
                        window.ReactNativeWebView.postMessage('PageLoaded');
                    }
                })();
              `}
            />
          </SafeAreaView>
        </Modal>
      </View>
    </View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 16,
      flexGrow: 1,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    storeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    storeDetails: {
      marginLeft: 12,
      flex: 1,
    },
    storeName: {
      fontFamily: FontFamilty.medium,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    storeId: {
      fontFamily: FontFamilty.regular,
      color: theme.textSecondary,
    },
    deleteButton: {
      padding: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.textSecondary,
      fontFamily: FontFamilty.regular,
    },
  });

export default StoresScreen;
