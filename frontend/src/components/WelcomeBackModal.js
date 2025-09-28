import React from "react";
import { Modal, Button } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { resetInterview } from "../store/interviewSlice";

function WelcomeBackModal({ visible, onClose }) {
  const { candidate, status } = useSelector((state) => state.interview);
  const dispatch = useDispatch();

  if (!visible || !candidate) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title="Welcome Back!"
    >
      <p>
        Hi {candidate.name}, your interview is still {status}. Do you want to
        resume?
      </p>
      <Button type="primary" onClick={onClose} style={{ marginRight: 10 }}>
        Resume
      </Button>
      <Button danger onClick={() => dispatch(resetInterview())}>
        Restart
      </Button>
    </Modal>
  );
}

export default WelcomeBackModal;
