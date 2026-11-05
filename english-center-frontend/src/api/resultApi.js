import axiosClient from './axiosClient';

const resultApi = {
  getByExam: (examId) => axiosClient.get(`/exams/${examId}/results`),
  getByStudent: (studentId) => axiosClient.get(`/students/${studentId}/results`),
};

export default resultApi;
