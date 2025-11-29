import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AppState {
  isLoggedin: boolean
  accessToken: string
  user: any
  access_tokens: any[]
  selectedStore: any
  firebaseProducts: any
  todayDeliveredOrders: any[]
  todayPendingOrders: any[]
  todayReadyToShipOrders: any[]
}

const initialState: AppState = {
  isLoggedin: false,
  accessToken: '',
  user: {},
  access_tokens: [],
  selectedStore: {},
  firebaseProducts: {},
  todayDeliveredOrders: [],
  todayPendingOrders: [],
  todayReadyToShipOrders: [],
}

const appSlice = createSlice({
  name: 'AppReducer',
  initialState,
  reducers: {
    setisLoggedin: (state, action: PayloadAction<boolean>) => {
      state.isLoggedin = action.payload
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload
    },
    setGlobalUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload
    },
    setAccessTokens: (state, action: PayloadAction<any[]>) => {
      state.access_tokens = action.payload
    },
    setSelectedStore: (state, action: PayloadAction<any>) => {
      state.selectedStore = action.payload
    },
    setFirebaseProducts: (state, action: PayloadAction<any>) => {
      state.firebaseProducts = action.payload
    },
    setTodayDeliveredOrders: (state, action: PayloadAction<any[]>) => {
      state.todayDeliveredOrders = action.payload
    },
    setTodayPendingOrders: (state, action: PayloadAction<any[]>) => {
      state.todayPendingOrders = action.payload
    },
    setTodayReadyToShipOrders: (state, action: PayloadAction<any[]>) => {
      state.todayReadyToShipOrders = action.payload
    },
  },
})

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
} = appSlice.actions

export default appSlice.reducer

