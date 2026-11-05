import axiosClient from './axiosClient';

const classApi = {
  getAll: (params) => axiosClient.get('/classes', { params }),
  getById: (id) => axiosClient.get(`/classes/${id}`),
  create: (data) => axiosClient.post('/classes', data),
  update: (id, data) => axiosClient.put(`/classes/${id}`, data),
  delete: (id) => axiosClient.delete(`/classes/${id}`),
};

export default classApi;
