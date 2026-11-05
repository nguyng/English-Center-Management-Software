import axiosClient from './axiosClient';

const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  logout: () => axiosClient.post('/auth/logout'),
  getMe: () => axiosClient.get('/auth/me'),
};

export default authApi;
