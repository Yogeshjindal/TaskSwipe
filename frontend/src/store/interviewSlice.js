import { createSlice } from "@reduxjs/toolkit";

const interviewSlice = createSlice({
  name: "interview",
  initialState: {
    candidate: null,
    questions: [],
    currentQuestion: 0,
    answers: [],
    status: "not-started", // not-started, in-progress, completed
  },
  reducers: {
    setCandidate: (state, action) => {
      state.candidate = action.payload;
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    addAnswer: (state, action) => {
      state.answers.push(action.payload);
    },
    nextQuestion: (state) => {
      if (state.currentQuestion < state.questions.length - 1) {
        state.currentQuestion += 1;
      } else {
        state.status = "completed";
      }
    },
    resetInterview: (state) => {
      state.candidate = null;
      state.questions = [];
      state.currentQuestion = 0;
      state.answers = [];
      state.status = "not-started";
    },
  },
});

export const {
  setCandidate,
  setQuestions,
  setStatus,
  addAnswer,
  nextQuestion, // Make sure this is exported
  resetInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;
