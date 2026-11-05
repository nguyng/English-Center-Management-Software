import axiosClient from './axiosClient';

const studentApi = {
  getAll: (params) => axiosClient.get('/students', { params }),
  getById: (id) => axiosClient.get(`/students/${id}`),
  create: (data) => axiosClient.post('/students', data),
  update: (id, data) => axiosClient.put(`/students/${id}`, data),
  updateStatus: (id, status) => axiosClient.patch(`/students/${id}/status`, { trang_thai: status }),
  delete: (id) => axiosClient.delete(`/students/${id}`),
};

export default studentApi;
