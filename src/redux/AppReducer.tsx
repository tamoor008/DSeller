import { createSlice } from "@reduxjs/toolkit";
import { log } from "console";
import { act } from "react-test-renderer";

const initialState = {
    isLoggedin: false,
    accessToken: '',
    user:{},
    access_tokens:[],
    selectedStore:{
    }

   







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
            // console.log(action.payload,'payload');
            state.access_tokens = action.payload
        },
        setSelectedStore: (state, action) => {    
            // console.log(action.payload,'payload');
            state.selectedStore = action.payload
        },

        
        

    },
});

export const {

    setisLoggedin,
    setAccessToken,
    setGlobalUser,
    setAccessTokens,
    setSelectedStore

} = AppSlice.actions;

export default AppSlice.reducer;