import axiosClient from './axiosClient';

const examApi = {
  create: (data) => axiosClient.post('/exams', data),
  getById: (id) => axiosClient.get(`/exams/${id}`),
  getBySession: (sessionId) => axiosClient.get(`/exams`, { params: { buoi_hoc_id: sessionId } }),
  addQuestions: (id, questions) => axiosClient.post(`/exams/${id}/questions`, { questions }),
  submit: (id, data) => axiosClient.post(`/exams/${id}/submit`, data),
  saveManualScores: (id, scores) => axiosClient.post(`/exams/${id}/manual-scores`, { scores }),
  verifyPin: (id, data) => axiosClient.post(`/exams/${id}/verify-pin`, data),
  getTeacherDetail: (id) => axiosClient.get(`/exams/${id}/detail`),
  sendZaloResults: (id) => axiosClient.post(`/exams/${id}/send-zalo-results`),
};

export default examApi;
