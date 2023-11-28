import axios from 'axios';
// 'http://64.226.125.215:8082'
const axiosInstance = axios.create({
  baseURL: 'http://172.17.0.1:8082',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;