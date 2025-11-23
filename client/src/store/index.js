import { configureStore } from '@reduxjs/toolkit';
import donorReducer from './donorSlice';
import neederReducer from './neederSlice';
import matchReducer from './matchSlice';

const store = configureStore({
  reducer: {
    donor: donorReducer,
    needer: neederReducer,
    match: matchReducer,
  },
});

export default store;
