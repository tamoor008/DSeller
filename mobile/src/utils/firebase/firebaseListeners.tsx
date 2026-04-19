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
        return;
      }

      const result = await response.json();

      if (result.error) {
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


      dispatch(setFirebaseProducts(productsObject));
    } catch (error: any) {
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
