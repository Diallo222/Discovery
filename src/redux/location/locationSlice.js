import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';

const baseURL = 'https://api.pexels.com/v1/';


// Pexel Api key 

// JoBzdG9NcrrTBlJtzeEpIl9qD4j0f2ArkaIuQ0fNxCGzaOWKXBRi7s6l
const initialState = {
    locations: [],
    loading: false,
    error: null,
  };

export const getLocations = createAsyncThunk(
    'actuality/getActualities',
    async (payload, {rejectWithValue}) => {
      const {query,page , per_page} = payload;
      try {
        const response = await axios.get(`${baseURL}search?${query}`, {
          params: {
            query : query,
            page: 1,
            per_page : 10
          },
          headers:{
          Authorization : 'JoBzdG9NcrrTBlJtzeEpIl9qD4j0f2ArkaIuQ0fNxCGzaOWKXBRi7s6l'
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
        .addCase(getLocations.pending, state => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getLocations.fulfilled, (state, action) => {
          state.locations = action.payload;
          state.loading = false;
          state.error = null;
        })
        .addCase(getLocations.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }) ;

    },
});
export const {resetSaveResponses} = locationSlice.actions;
export default locationSlice.reducer;