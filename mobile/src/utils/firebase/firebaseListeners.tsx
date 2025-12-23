// utils/firebaseListener.js - Now uses backend API instead of direct Firebase
import { auth } from '../../../firebase';
import { setFirebaseProducts } from '../../redux/AppReducer';
import { getBaseUrl } from '../api/baseUrl';

let isPollingActive = false;
let pollingInterval: NodeJS.Timeout | null = null;

/**
 * Start polling backend API for products (replaces Firebase listener)
 * All Firebase operations now go through backend
 */
export const startFirebaseListener = (dispatch: any) => {
  const currentUser = auth.currentUser;

  if (!currentUser || isPollingActive) return;

  const BASE_URL = getBaseUrl();

  // Mark polling as active
  isPollingActive = true;

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/products/${currentUser.uid}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[startFirebaseListener] Error fetching products:', errorData.error || 'Unknown error');
        return;
      }

      const result = await response.json();
      
      if (result.error) {
        console.warn('[startFirebaseListener] API returned error:', result.error);
        return;
      }

      const products = result.data || [];
      
      // Convert array to object format (keyed by productId) to match Redux state structure
      const productsObject: { [key: string]: any } = {};
      products.forEach((product: any) => {
        const productId = product.id || product.productId;
        if (productId) {
          productsObject[productId] = product;
        }
      });
      
      console.log('[startFirebaseListener] Products data received from backend:', {
        hasData: products.length > 0,
        productsCount: products.length,
        keys: Object.keys(productsObject).slice(0, 10),
        sampleProduct: products.length > 0 ? {
          key: Object.keys(productsObject)[0],
          productName: products[0].productName,
          price: products[0].price,
          hasSku: !!products[0].sku
        } : null
      });
      
      dispatch(setFirebaseProducts(productsObject));
    } catch (error: any) {
      console.error('[startFirebaseListener] Error fetching products:', error.message);
    }
  };

  // Fetch immediately
  fetchProducts();

  // Set up polling every 30 seconds (replaces Firebase real-time listener)
  pollingInterval = setInterval(fetchProducts, 30000);
};

export const stopFirebaseListener = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  isPollingActive = false;
};
