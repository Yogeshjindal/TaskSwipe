import React, { useState } from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { uploadResume } from "../services/interviewAPI";
import { setCandidate, setStatus } from "../store/interviewSlice";

function ResumeUpload() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const props = {
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";
      const isDOCX =
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isPDF && !isDOCX) {
        message.error("You can only upload PDF or DOCX!");
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("resume", file);

        const res = await uploadResume(formData);

        // Validate backend response has _id
        if (!res.data || !res.data._id) {
          throw new Error("Invalid candidate data received from backend.");
        }

        // Save candidate and reset interview status
        dispatch(setCandidate(res.data));
        dispatch(setStatus("not-started"));

        message.success("Resume uploaded successfully!");
        onSuccess("ok");
      } catch (err) {
        console.error("Resume upload failed:", err);
        message.error("Upload failed. Please try again.");
        onError(err);
      } finally {
        setLoading(false);
      }
    },
    showUploadList: false,
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: 20,
      padding: 40,
      textAlign: 'center',
      boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: '4rem', marginBottom: 20 }}>📄</div>
        <h3 style={{ 
          fontSize: '1.8rem', 
          color: '#2c3e50', 
          marginBottom: 10,
          fontWeight: 'bold'
        }}>
          Upload Your Resume
        </h3>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#7f8c8d',
          marginBottom: 30
        }}>
          Get started with your technical interview by uploading your resume
        </p>
      </div>
      
      <Upload {...props}>
        <Button 
          icon={<UploadOutlined />} 
          loading={loading}
          size="large"
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
        >
          📤 Upload Resume
        </Button>
      </Upload>
    </div>
  );
}

export default ResumeUpload;
