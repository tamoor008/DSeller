// utils/firebaseListener.js
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import { setFirebaseProducts } from '../../redux/AppReducer';

let isListenerActive = false;

export const startFirebaseListener = (dispatch) => {
  const currentUser = auth().currentUser;

  if (!currentUser || isListenerActive) return;

  const productRef = database().ref(`users/${currentUser.uid}/products`);

  // Mark listener as active
  isListenerActive = true;

  productRef.on('value', snapshot => {
    const data = snapshot.val();    
    console.log('Firebase data called');
    
    dispatch(setFirebaseProducts(data));
  });
};

export const stopFirebaseListener = () => {
  const currentUser = auth().currentUser;
  if (!currentUser) return;

  const productRef = database().ref(`users/${currentUser.uid}/products`);
  productRef.off(); // Removes all listeners

  isListenerActive = false;
};


// export const stopFirebaseListener = (path = '/yourDataPath') => {
//   if (firebaseRef) {
//     database().ref(path).off('value');
//     firebaseRef = null;
//   }
// };
