import { configureStore } from "@reduxjs/toolkit";
import AppReducer from "./AppReducer";
export const store = configureStore({
    reducer: {
        AppReducer: AppReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});
