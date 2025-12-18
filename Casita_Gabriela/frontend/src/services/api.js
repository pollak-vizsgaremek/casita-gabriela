import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:6969',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export default api;
