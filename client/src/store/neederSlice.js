import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../config/api';

export const registerNeeder = createAsyncThunk(
  'needer/register',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/needers/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const fetchNeeders = createAsyncThunk(
  'needer/fetchAll',
  async () => {
    const response = await axios.get(`${API_URL}/needers`);
    return response.data;
  }
);

const neederSlice = createSlice({
  name: 'needer',
  initialState: {
    needers: [],
    currentNeeder: null,
    loading: false,
    error: null,
    success: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerNeeder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerNeeder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentNeeder = action.payload.needer;
      })
      .addCase(registerNeeder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Registration failed';
      })
      .addCase(fetchNeeders.fulfilled, (state, action) => {
        state.needers = action.payload;
      });
  }
});

export const { clearError, clearSuccess } = neederSlice.actions;
export default neederSlice.reducer;
