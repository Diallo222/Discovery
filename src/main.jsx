import React from "react";
import ReactDOM from "react-dom/client";
import {Provider} from 'react-redux';
import App from "./App";
import store from './redux/configureStore';
import "./index.css";
import { ErrorBoundary } from "./components/error";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App /> 
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);
