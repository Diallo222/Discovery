import {createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
// import authReducer from './auth/authSlice';
import locationReducer from './location/locationSlice';

const rootReducer = combineReducers({
   location: locationReducer,
  // additional reducers could be added here
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;