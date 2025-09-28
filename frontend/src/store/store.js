import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import interviewReducer from "./interviewSlice";
import candidateReducer from "./candidateSlice";

const persistConfig = {
  key: "root",
  storage,
};

const rootReducer = combineReducers({
  interview: interviewReducer,
  candidate: candidateReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }), // ✅ no need to concat thunk
});

export const persistor = persistStore(store);
