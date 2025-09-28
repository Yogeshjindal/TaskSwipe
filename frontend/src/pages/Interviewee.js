import React, { useState, useEffect } from "react";
import { Button, message, Modal, Form, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import ResumeUpload from "../components/ResumeUpload";
import ChatBox from "../components/ChatBox";
import WelcomeBackModal from "../components/WelcomeBackModal";
import { generateQuestions } from "../services/interviewAPI";
import { setQuestions, setStatus, setCandidate } from "../store/interviewSlice";

function Interviewee() {
  const dispatch = useDispatch();
  const { candidate, questions = [], status = "not-started" } =
    useSelector((state) => state.interview) || {};

  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [missingDetails, setMissingDetails] = useState([]);
  const [form] = Form.useForm();

  // Show modal automatically for returning candidates
  useEffect(() => {
    if (candidate && status === "not-started") {
      setShowModal(true);
    }
  }, [candidate, status]);

  const checkMissingDetails = () => {
    const missing = [];
    if (!candidate?.name || candidate.name.trim() === "") {
      missing.push("name");
    }
    if (!candidate?.email || candidate.email.trim() === "") {
      missing.push("email");
    }
    if (!candidate?.phone || candidate.phone.trim() === "") {
      missing.push("phone");
    }
    return missing;
  };

  const handleStart = async (restart = false) => {
    if (!candidate?._id) {
      message.error("No candidate selected. Please upload your resume.");
      return;
    }

    if (restart) {
      dispatch(setQuestions([]));
      dispatch(setStatus("not-started"));
    }

    // Check for missing details
    const missing = checkMissingDetails();
    if (missing.length > 0) {
      setMissingDetails(missing);
      setShowDetailsModal(true);
      return;
    }

    await startInterview();
  };

  const startInterview = async () => {
    try {
      // Call backend to generate questions for this candidate
      const response = await generateQuestions(candidate._id);
      
      console.log("Backend response:", response.data);
      
      // Extract questions from the interview object
      const interview = response.data.interview;
      if (!interview || !interview.questions || !Array.isArray(interview.questions)) {
        message.warning("No questions available.");
        return;
      }

      // Map questions to the format expected by frontend
      const questionList = interview.questions.map(q => ({
        q: q.q,
        difficulty: q.difficulty
      }));

      console.log("Processed questions:", questionList);

      dispatch(setQuestions(questionList));
      dispatch(setStatus("in-progress"));
      setShowModal(false);
      setShowDetailsModal(false);
    } catch (err) {
      console.error("Failed to generate questions:", err);
      message.error("Failed to generate questions. See console for details.");
    }
  };

  const handleDetailsSubmit = async (values) => {
    try {
      // Update candidate with missing details
      const updatedCandidate = { ...candidate, ...values };
      dispatch(setCandidate(updatedCandidate));
      
      // Save to backend
      const response = await fetch(`http://localhost:5000/api/candidates/${candidate._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save details to backend');
      }
      
      message.success("Details saved successfully!");
      setShowDetailsModal(false);
      
      // Start the interview
      await startInterview();
    } catch (err) {
      console.error("Failed to save details:", err);
      message.error("Failed to save details. Please try again.");
    }
  };

  return (
    <div style={{ 
      padding: 20, 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 30,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        color: '#333'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: 30, 
          color: '#2c3e50',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          🎯 Candidate Interview Portal
        </h2>

      {!candidate && <ResumeUpload />}

      {candidate && status === "not-started" && !showModal && (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <Button
            type="primary"
            size="large"
            onClick={() => handleStart(false)}
            style={{ 
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: 25,
              padding: '15px 40px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              height: 'auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 25px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
            }}
          >
            🚀 Start Your Interview
          </Button>
        </div>
      )}

      {status === "in-progress" && <ChatBox />}

      {status === "completed" && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'linear-gradient(135deg, #4CAF50, #45a049)',
          borderRadius: 15,
          color: 'white',
          margin: '20px 0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Interview Completed!</h3>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Thank you for taking the time to complete this interview. Your responses have been recorded and will be reviewed by our team.</p>
        </div>
      )}

      {candidate && showModal && (
        <WelcomeBackModal
          visible={showModal}
          onClose={() => setShowModal(false)}
        >
          <div style={{ textAlign: "center" }}>
            <p>Welcome back! Do you want to resume or restart your interview?</p>
            <Button
              type="primary"
              onClick={() => handleStart(false)} // Resume
              style={{ marginRight: 10 }}
            >
              Resume
            </Button>
            <Button type="danger" onClick={() => handleStart(true)}>
              Restart
            </Button>
          </div>
        </WelcomeBackModal>
      )}

      <Modal
        title="Complete Your Profile"
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        footer={null}
        width={500}
      >
        <p>We need some additional information before starting your interview:</p>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDetailsSubmit}
          initialValues={candidate}
        >
          {missingDetails.includes("name") && (
            <Form.Item
              label="Full Name"
              name="name"
              rules={[{ required: true, message: "Please enter your full name" }]}
            >
              <Input placeholder="Enter your full name" />
            </Form.Item>
          )}
          
          {missingDetails.includes("email") && (
            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" }
              ]}
            >
              <Input placeholder="Enter your email address" />
            </Form.Item>
          )}
          
          {missingDetails.includes("phone") && (
            <Form.Item
              label="Phone Number"
              name="phone"
              rules={[{ required: true, message: "Please enter your phone number" }]}
            >
              <Input placeholder="Enter your phone number" />
            </Form.Item>
          )}
          
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button type="primary" htmlType="submit">
              Save & Start Interview
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </div>
  );
}

export default Interviewee;
