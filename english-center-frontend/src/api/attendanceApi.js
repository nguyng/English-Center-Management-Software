import axiosClient from './axiosClient';

const attendanceApi = {
  getBySession: (sessionId) => axiosClient.get(`/sessions/${sessionId}/attendance`),
  save: (sessionId, data) => axiosClient.post(`/sessions/${sessionId}/attendance`, data),
  saveAndNotify: (sessionId, data) => axiosClient.post(`/sessions/${sessionId}/attendance`, { ...data, sendZalo: true }),
};

export default attendanceApi;
