import { createSlice } from "@reduxjs/toolkit";
import { log } from "console";
import { act } from "react-test-renderer";

const initialState = {
    isLoggedin: false,
    accessToken: '',

   







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

        
        

    },
});

export const {

    setisLoggedin,
    setAccessToken,

} = AppSlice.actions;

export default AppSlice.reducer;