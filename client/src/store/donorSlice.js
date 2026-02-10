import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../config/api';

export const registerDonor = createAsyncThunk(
  'donor/register',
  async (formData, { rejectWithValue }) => {
    try {
      console.log('Sending registration request...');
      const response = await axios.post(`${API_URL}/donors/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const fetchDonors = createAsyncThunk(
  'donor/fetchAll',
  async () => {
    const response = await axios.get(`${API_URL}/donors`);
    return response.data;
  }
);

const donorSlice = createSlice({
  name: 'donor',
  initialState: {
    donors: [],
    currentDonor: null,
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
      .addCase(registerDonor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerDonor.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentDonor = action.payload.donor;
      })
      .addCase(registerDonor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { error: 'Registration failed' };
      })
      .addCase(fetchDonors.fulfilled, (state, action) => {
        state.donors = action.payload;
      });
  }
});

export const { clearError, clearSuccess } = donorSlice.actions;
export default donorSlice.reducer;
