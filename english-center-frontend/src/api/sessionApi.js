import axiosClient from './axiosClient';

const sessionApi = {
  getAll: (params) => axiosClient.get('/sessions', { params }),
  getById: (id) => axiosClient.get(`/sessions/${id}`),
  create: (data) => axiosClient.post('/sessions', data),
  cancel: (id, reason) => axiosClient.patch(`/sessions/${id}/cancel`, { reason }),
  confirmAttendance: (id) => axiosClient.patch(`/sessions/${id}/confirm-attendance`),
};

export default sessionApi;
