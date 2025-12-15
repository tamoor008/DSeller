// utils/firebaseListener.js
import { ref, onValue, off } from 'firebase/database';
import { auth, database } from '../../../firebase';
import { setFirebaseProducts } from '../../redux/AppReducer';

let isListenerActive = false;
let unsubscribe: (() => void) | null = null;

export const startFirebaseListener = (dispatch: any) => {
  const currentUser = auth.currentUser;

  if (!currentUser || isListenerActive) return;

  const productRef = ref(database, `users/${currentUser.uid}/products`);

  // Mark listener as active
  isListenerActive = true;

  unsubscribe = onValue(productRef, (snapshot) => {
    const data = snapshot.val();    
    console.log('[startFirebaseListener] Firebase products data received:', {
      hasData: !!data,
      keysCount: data ? Object.keys(data).length : 0,
      keys: data ? Object.keys(data).slice(0, 10) : [],
      sampleProduct: data ? (() => {
        const firstKey = Object.keys(data)[0];
        const firstProduct = data[firstKey];
        return firstProduct ? {
          key: firstKey,
          productName: firstProduct.productName,
          price: firstProduct.price,
          hasSku: !!firstProduct.sku
        } : null;
      })() : null
    });
    
    dispatch(setFirebaseProducts(data || {}));
  }, (error) => {
    console.error('[startFirebaseListener] Error listening to products:', error);
  });
};

export const stopFirebaseListener = () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  isListenerActive = false;
};


// export const stopFirebaseListener = (path = '/yourDataPath') => {
//   if (firebaseRef) {
//     database().ref(path).off('value');
//     firebaseRef = null;
//   }
// };
