import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const fetchCandidates = async () => {
  return axios.get(`${API_URL}/candidates`);
};

export const fetchCandidateById = async (id) => {
  return axios.get(`${API_URL}/candidates/${id}`);
};
