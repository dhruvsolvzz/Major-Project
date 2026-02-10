import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../config/api';

export const findMatchesForNeeder = createAsyncThunk(
  'match/findForNeeder',
  async ({ neederId, maxDistance = 20 }) => {
    const response = await axios.get(`${API_URL}/match/needer/${neederId}?maxDistance=${maxDistance}`);
    return response.data;
  }
);

export const findMatchesForDonor = createAsyncThunk(
  'match/findForDonor',
  async ({ donorId, maxDistance = 20 }) => {
    const response = await axios.get(`${API_URL}/match/donor/${donorId}?maxDistance=${maxDistance}`);
    return response.data;
  }
);

const matchSlice = createSlice({
  name: 'match',
  initialState: {
    matches: [],
    loading: false,
    error: null
  },
  reducers: {
    clearMatches: (state) => {
      state.matches = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(findMatchesForNeeder.pending, (state) => {
        state.loading = true;
      })
      .addCase(findMatchesForNeeder.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload.matches;
      })
      .addCase(findMatchesForNeeder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(findMatchesForDonor.pending, (state) => {
        state.loading = true;
      })
      .addCase(findMatchesForDonor.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload.matches;
      })
      .addCase(findMatchesForDonor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { clearMatches } = matchSlice.actions;
export default matchSlice.reducer;
