import axiosClient from './axiosClient';

const centerApi = {
  getAll: () => axiosClient.get('/centers'),
  getById: (id) => axiosClient.get(`/centers/${id}`),
  create: (data) => axiosClient.post('/centers', data),
  updateLicense: (id, data) => axiosClient.patch(`/centers/${id}/license`, data),
  updateZaloConfig: (id, data) => axiosClient.patch(`/centers/${id}/zalo-config`, data),
};

export default centerApi;
