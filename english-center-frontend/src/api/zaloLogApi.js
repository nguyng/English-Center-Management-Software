import axiosClient from './axiosClient';

const zaloLogApi = {
  getAll: (params) => axiosClient.get('/zalo-logs', { params }),
  getStats: (params) => axiosClient.get('/zalo-logs/stats', { params }),
};

export default zaloLogApi;
