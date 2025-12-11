// utils/firebaseListener.js
import { getDatabase, ref } from '@react-native-firebase/database';
import { getAuth } from '@react-native-firebase/auth';
import { setFirebaseProducts } from '../../redux/AppReducer';

let isListenerActive = false;

export const startFirebaseListener = (dispatch) => {
  const currentUser = getAuth().currentUser;

  if (!currentUser || isListenerActive) return;

  const productRef = ref(getDatabase(), `users/${currentUser.uid}/products`);

  // Mark listener as active
  isListenerActive = true;

  productRef.on('value', snapshot => {
    const data = snapshot.val();    
    console.log('Firebase data called');
    
    dispatch(setFirebaseProducts(data));
  });
};

export const stopFirebaseListener = () => {
  const currentUser = getAuth().currentUser;
  if (!currentUser) return;

  const productRef = ref(getDatabase(), `users/${currentUser.uid}/products`);
  productRef.off(); // Removes all listeners

  isListenerActive = false;
};


// export const stopFirebaseListener = (path = '/yourDataPath') => {
//   if (firebaseRef) {
//     database().ref(path).off('value');
//     firebaseRef = null;
//   }
// };
