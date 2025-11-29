import { configureStore } from '@reduxjs/toolkit'
import AppReducer from './slices/appSlice'

export const store = configureStore({
  reducer: {
    AppReducer: AppReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

