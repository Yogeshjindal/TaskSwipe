import React from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import Interviewee from "./pages/Interviewee";
import Interviewer from "./pages/Interviewer";
import CandidateDetail from "./pages/CandidateDetail";

function App() {
  return (
    <Router>
      <div style={{ padding: 20 }}>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/interviewee" style={{ marginRight: 20 }}>
            Candidate
          </Link>
          <Link to="/interviewer">Interviewer</Link>
        </nav>

        <Routes>
          <Route path="/interviewee" element={<Interviewee />} />
          <Route path="/interviewer" element={<Interviewer />} />
          <Route path="/candidate/:id" element={<CandidateDetail />} />
          <Route path="*" element={<Interviewee />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; // ✅ This is mandatory
