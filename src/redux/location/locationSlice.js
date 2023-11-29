import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';

const baseURL = 'https://api.pexels.com/v1/';
const apiKey = 'JoBzdG9NcrrTBlJtzeEpIl9qD4j0f2ArkaIuQ0fNxCGzaOWKXBRi7s6l'

// Pexel Api key 

// JoBzdG9NcrrTBlJtzeEpIl9qD4j0f2ArkaIuQ0fNxCGzaOWKXBRi7s6l
const initialState = {
    images: [],
    next_page : "",
    loading: false,
    error: null,
  };

export const getImages = createAsyncThunk(
    'actuality/getImages',
    async (payload, {rejectWithValue}) => {
      const {query} = payload;
      try {
        const response = await axios.get(`${baseURL}search?${query}`, {
          params: {
            query : query,
            page: 1,
            per_page : 40
          },
          headers:{
          Authorization : apiKey
          }
        });
        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message ?? err.message;
        return rejectWithValue(errorMessage);
      }
    },
  );

  export const getMore = createAsyncThunk(
    'actuality/getMore',
    async (payload, {rejectWithValue}) => {
      const {next_page} = payload;
      try {
        const response = await axios.get(`${next_page}`, {
          headers:{
          Authorization : apiKey
          }
        });
        console.log('Done ok',response.data);
        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message ?? err.message;
        console.log('Error not ok',errorMessage);
        return rejectWithValue(errorMessage);
      }
    },
  );

  const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
      resetSaveResponses: state => {
        state.saveResponse = [];
        state.deleteResponse = false;
        state.elements = [];
      },
    },
    extraReducers: builder => {
      builder
        .addCase(getImages.pending, state => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getImages.fulfilled, (state, action) => {
          state.images = action.payload.photos;
          state.next_page = action.payload.next_page;
          state.loading = false;
          state.error = null;
        })
        .addCase(getImages.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        .addCase(getMore.pending, state => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getMore.fulfilled, (state, action) => {
          state.images = [...state.images.concat(action.payload.photos)];
          state.next_page = action.payload.next_page;
          state.loading = false;
          state.error = null;
        })
        .addCase(getMore.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        ;

    },
});
export const {resetSaveResponses} = locationSlice.actions;
export default locationSlice.reducer;