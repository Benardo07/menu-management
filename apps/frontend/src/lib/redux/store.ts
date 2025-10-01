import { configureStore } from '@reduxjs/toolkit';
import menusReducer from './slices/menu-slice';

export const makeStore = () =>
  configureStore({
    reducer: {
      menus: menusReducer,
    },
  });

export const store = makeStore();

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
