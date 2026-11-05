import axiosClient from './axiosClient';

const examApi = {
  create: (data) => axiosClient.post('/exams', data),
  getById: (id) => axiosClient.get(`/exams/${id}`),
  getBySession: (sessionId) => axiosClient.get(`/exams`, { params: { buoi_hoc_id: sessionId } }),
  addQuestions: (id, questions) => axiosClient.post(`/exams/${id}/questions`, { questions }),
  submit: (id, data) => axiosClient.post(`/exams/${id}/submit`, data),
  saveManualScores: (id, scores) => axiosClient.post(`/exams/${id}/manual-scores`, { scores }),
};

export default examApi;
