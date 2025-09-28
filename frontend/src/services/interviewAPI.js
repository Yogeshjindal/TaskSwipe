import axios from "axios";

const API_URL = "http://localhost:5000/api"; // your backend URL

export const uploadResume = async (formData) => {
  return axios.post(`${API_URL}/resume/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const generateQuestions = async (candidateId) => {
  return axios.post(`${API_URL}/interview/start`, { candidateId });
};

export const submitAnswer = async (candidateId, questionIndex, answer) => {
  return axios.post(`${API_URL}/interview/answer`, {
    candidateId,
    questionIndex,
    answer,
  });
};

export const finishInterview = async (candidateId) => {
  return axios.post(`${API_URL}/interview/finish`, { candidateId });
};
