import React from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppColors } from '../../../constants/AppColors';
import { AppImages } from '../../../constants/AppImages';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setAccessToken, setisLoggedin } from '../../../redux/AppReducer';
import { getAuth, signOut } from '@react-native-firebase/auth';


const HomeHeader = () => {

    const dispatch=useDispatch()
    const confirmLogout = () => {
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
                  signOut(getAuth()).then(() => console.log('User signed out!'));

                } catch (error) {
                  console.error('Error clearing AsyncStorage:', error);
                }
              },
              style: 'destructive',
            },
          ],
          { cancelable: true }
        );
      };

    return (
        <View style={styles.container}>
            <Image style={{width:127,height:56}} source={AppImages.dsellerlogo}/>
            <View style={{flexDirection:'row',columnGap:16}}>
            <TouchableOpacity activeOpacity={0.9}>
            <Image resizeMode='contain' style={{width:20,height:20}} source={AppImages.notification}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>{confirmLogout()}} activeOpacity={0.9}>
            <Image resizeMode='contain' style={{width:20,height:20}} source={AppImages.logout}/>
            </TouchableOpacity>
            </View>
         
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        alignItems: 'center',
        width:'100%',
        justifyContent:'space-between'
    },

});

export default HomeHeader;
