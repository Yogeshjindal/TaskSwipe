import React from "react";
import CandidateTable from "../components/CandidateTable";

function Interviewer() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Interviewer Dashboard</h2>
      <CandidateTable />
    </div>
  );
}

export default Interviewer;
