import axiosClient from './axiosClient';

const teacherApi = {
  getAll: (params) => axiosClient.get('/teachers', { params }),
  getById: (id) => axiosClient.get(`/teachers/${id}`),
  create: (data) => axiosClient.post('/teachers', data),
  update: (id, data) => axiosClient.put(`/teachers/${id}`, data),
  updateStatus: (id, status) => axiosClient.patch(`/teachers/${id}/status`, { trang_thai: status }),
};

export default teacherApi;
