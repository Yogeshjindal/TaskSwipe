import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card, List, Spin, message } from "antd";
import { fetchCandidateById } from "../services/candidateAPI";

function CandidateDetail() {
  const { selectedCandidate } = useSelector((state) => state.candidate);
  const [candidateData, setCandidateData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCandidate?._id) {
      loadCandidateDetails();
    }
  }, [selectedCandidate]);

  const loadCandidateDetails = async () => {
    setLoading(true);
    try {
      const response = await fetchCandidateById(selectedCandidate._id);
      setCandidateData(response.data.candidate);
    } catch (error) {
      console.error("Error loading candidate details:", error);
      message.error("Failed to load candidate details");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCandidate) return <p>No candidate selected.</p>;

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;

  const candidate = candidateData || selectedCandidate;
  const interview = candidate.interview || {};
  const questions = interview.questions || [];

  return (
    <div style={{ padding: 20 }}>
      <h2>{candidate.name}</h2>
      <p><strong>Email:</strong> {candidate.email}</p>
      <p><strong>Phone:</strong> {candidate.phone}</p>
      
      <Card title="Interview Summary" style={{ marginTop: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <strong>Final Score:</strong> 
            <span style={{ 
              color: (interview.finalScore || 0) >= 80 ? '#52c41a' : 
                     (interview.finalScore || 0) >= 60 ? '#faad14' : '#ff4d4f',
              fontWeight: 'bold',
              marginLeft: 8
            }}>
              {interview.finalScore || 'Not calculated'}/100
            </span>
          </div>
          <div>
            <strong>Status:</strong> 
            <span style={{ 
              color: interview.status === 'completed' ? '#52c41a' : 
                     interview.status === 'in-progress' ? '#1890ff' : '#666',
              marginLeft: 8
            }}>
              {interview.status || 'Not started'}
            </span>
          </div>
          <div>
            <strong>Hiring Recommendation:</strong> 
            <span style={{ 
              color: interview.hiringRecommendation === 'Yes' ? '#52c41a' : 
                     interview.hiringRecommendation === 'No' ? '#ff4d4f' : '#faad14',
              fontWeight: 'bold',
              marginLeft: 8
            }}>
              {interview.hiringRecommendation || 'Not available'}
            </span>
          </div>
        </div>
        
        {interview.summary && (
          <div style={{ marginBottom: 16 }}>
            <strong>AI Summary:</strong>
            <p style={{ marginTop: 8, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              {interview.summary}
            </p>
          </div>
        )}

        {interview.strengths && (
          <div style={{ marginBottom: 16 }}>
            <strong>Strengths:</strong>
            <p style={{ marginTop: 8, padding: 12, backgroundColor: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
              {interview.strengths}
            </p>
          </div>
        )}

        {interview.areasForImprovement && (
          <div style={{ marginBottom: 16 }}>
            <strong>Areas for Improvement:</strong>
            <p style={{ marginTop: 8, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
              {interview.areasForImprovement}
            </p>
          </div>
        )}
      </Card>

      <Card title="Interview Questions & Answers" style={{ marginTop: 20 }}>
        {questions.length > 0 ? (
          <List
            dataSource={questions}
            renderItem={(item, idx) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <p><strong>Q{idx + 1}:</strong> {item.q}</p>
                  <p><strong>Difficulty:</strong> {item.difficulty}</p>
                  <p><strong>Answer:</strong> {item.a || 'No answer provided'}</p>
                  <p><strong>Score:</strong> {item.score !== null ? `${item.score}/100` : 'Not scored'}</p>
                  {item.timeTakenSec && <p><strong>Time Taken:</strong> {item.timeTakenSec} seconds</p>}
                </div>
              </List.Item>
            )}
          />
        ) : (
          <p>No interview data available yet.</p>
        )}
      </Card>
    </div>
  );
}

export default CandidateDetail;
