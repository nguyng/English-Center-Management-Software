import axiosClient from './axiosClient';

const sessionApi = {
  getAll: (params) => axiosClient.get('/sessions', { params }),
  getById: (id) => axiosClient.get(`/sessions/${id}`),
  create: (data) => axiosClient.post('/sessions', data),
  cancel: (id, reason, trangThai = 'DaHuy') =>
    axiosClient.patch(`/sessions/${id}/cancel`, {
      reason,
      trang_thai_buoi_hoc: trangThai,
    }),
  substitute: (id, giaoVienId) =>
    axiosClient.patch(`/sessions/${id}/substitute`, { giao_vien_id: giaoVienId }),
  delete: (id) => axiosClient.delete(`/sessions/${id}`),
  confirmAttendance: (id) => axiosClient.patch(`/sessions/${id}/confirm-attendance`),
};

export default sessionApi;
