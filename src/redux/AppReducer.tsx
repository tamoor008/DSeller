import { createSlice } from "@reduxjs/toolkit";
import { log } from "console";
import { act } from "react-test-renderer";

const initialState = {
    isLoggedin: false,
    accessToken: '',
    user:{},
    access_tokens:[],
    selectedStore:{},
    firebaseProducts:{},
    todayDeliveredOrders:[]

   







};



export const AppSlice = createSlice({
    name: "AppReducer",
    initialState,
    reducers: {

        
        setisLoggedin: (state, action) => {
            state.isLoggedin = action.payload
        },
     
        setAccessToken: (state, action) => {
            state.accessToken = action.payload
        },
        setGlobalUser: (state, action) => {
            state.user = action.payload
        },
        setAccessTokens: (state, action) => {
            state.access_tokens = action.payload
        },
        setSelectedStore: (state, action) => {    
            state.selectedStore = action.payload
        },
        setFirebaseProducts: (state, action) => {    
            state.firebaseProducts = action.payload
        },
        setTodayDeliveredOrders: (state, action) => {    
            state.todayDeliveredOrders = action.payload
            
            
        },
        
        
    },
});

export const {

    setisLoggedin,
    setAccessToken,
    setGlobalUser,
    setAccessTokens,
    setSelectedStore,
    setFirebaseProducts,
    setTodayDeliveredOrders

} = AppSlice.actions;

export default AppSlice.reducer;