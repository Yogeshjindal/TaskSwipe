import { createSlice } from "@reduxjs/toolkit";

const candidateSlice = createSlice({
  name: "candidate",
  initialState: {
    list: [],
    selectedCandidate: null,
  },
  reducers: {
    setCandidates(state, action) {
      state.list = action.payload;
    },
    addCandidate(state, action) {
      state.list.push(action.payload);
    },
    setSelectedCandidate(state, action) {
      state.selectedCandidate = action.payload;
    },
  },
});

export const { setCandidates, addCandidate, setSelectedCandidate } =
  candidateSlice.actions;
export default candidateSlice.reducer;
