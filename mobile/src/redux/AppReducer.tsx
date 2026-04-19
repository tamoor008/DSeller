import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isLoggedin: false,
    accessToken: '',
    user: {},
    access_tokens: [],
    selectedStore: {},
    firebaseProducts: {},
    todayDeliveredOrders: [],
    todayPendingOrders: [],
    todayReadyToShipOrders: [],
};

export const AppSlice = createSlice({
    name: "AppReducer",
    initialState,
    reducers: {
        setisLoggedin: (state, action) => {
            state.isLoggedin = action.payload;
        },
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
        },
        setGlobalUser: (state, action) => {
            state.user = action.payload;
        },
        setAccessTokens: (state, action) => {
            state.access_tokens = action.payload;
        },
        setSelectedStore: (state, action) => {
            state.selectedStore = action.payload;
        },
        setFirebaseProducts: (state, action) => {
            state.firebaseProducts = action.payload;
        },
        setTodayDeliveredOrders: (state, action) => {
            state.todayDeliveredOrders = action.payload;
        },
        setTodayPendingOrders: (state, action) => {
            state.todayPendingOrders = action.payload;
        },
        setTodayReadyToShipOrders: (state, action) => {
            state.todayReadyToShipOrders = action.payload;
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
    setTodayDeliveredOrders,
    setTodayPendingOrders,
    setTodayReadyToShipOrders,
} = AppSlice.actions;

export default AppSlice.reducer;
