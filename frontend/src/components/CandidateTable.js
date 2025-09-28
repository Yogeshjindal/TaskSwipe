import React, { useEffect, useState } from "react";
import { Table, Select, Input, Space, Button } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { fetchCandidates } from "../services/candidateAPI";
import { useDispatch } from "react-redux";
import { setSelectedCandidate } from "../store/candidateSlice";
import { useNavigate } from "react-router-dom";

function CandidateTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("finalScore");
  const [sortOrder, setSortOrder] = useState("desc");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetchCandidates();
      console.log("Fetched candidates response:", res);

      // ✅ Normalize backend response to always be an array
      const candidates = Array.isArray(res.data)
        ? res.data
        : res.data?.candidates || [];

      setData(candidates);
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setData([]); // fallback to empty array so Table doesn't crash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchText) {
      filtered = data.filter(candidate =>
        candidate.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        candidate.phone?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "finalScore":
          aValue = a.interview?.finalScore ?? -1;
          bValue = b.interview?.finalScore ?? -1;
          break;
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          break;
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "completedAt":
          aValue = new Date(a.interview?.completedAt || 0);
          bValue = new Date(b.interview?.completedAt || 0);
          break;
        case "status":
          aValue = a.interview?.status || "";
          bValue = b.interview?.status || "";
          break;
        default:
          aValue = a.interview?.finalScore ?? -1;
          bValue = b.interview?.finalScore ?? -1;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [data, searchText, sortBy, sortOrder]);

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { 
      title: "Interview Status", 
      dataIndex: ["interview", "status"], 
      key: "status",
      render: (status) => {
        const statusColors = {
          'not-started': 'default',
          'ongoing': 'processing',
          'completed': 'success',
          'paused': 'warning'
        };
        return <span style={{ color: statusColors[status] || 'default' }}>{status || 'Not started'}</span>;
      }
    },
    { 
      title: "Final Score", 
      dataIndex: ["interview", "finalScore"], 
      key: "score",
      render: (score) => {
        if (score === null || score === undefined) return 'Not calculated';
        const color = score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f';
        return <span style={{ color, fontWeight: 'bold' }}>{score}/100</span>;
      }
    },
    { 
      title: "Hiring Recommendation", 
      dataIndex: ["interview", "hiringRecommendation"], 
      key: "hiringRecommendation",
      render: (recommendation) => {
        if (!recommendation) return '-';
        const colors = {
          'Yes': '#52c41a',
          'No': '#ff4d4f',
          'Maybe': '#faad14'
        };
        return <span style={{ color: colors[recommendation] || '#666', fontWeight: 'bold' }}>{recommendation}</span>;
      }
    },
    { 
      title: "Questions Answered", 
      key: "answered",
      render: (record) => {
        const questions = record.interview?.questions || [];
        const answered = questions.filter(q => q.a && q.a.trim()).length;
        return `${answered}/${questions.length}`;
      }
    },
    { 
      title: "Completed At", 
      dataIndex: ["interview", "completedAt"], 
      key: "completedAt",
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    }
  ];

  return (
    <div>
      {/* Search and Sort Controls */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input
          placeholder="Search candidates..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
        
        <Space>
          <span>Sort by:</span>
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 150 }}
            options={[
              { value: "finalScore", label: "Final Score" },
              { value: "name", label: "Name" },
              { value: "email", label: "Email" },
              { value: "completedAt", label: "Completed At" },
              { value: "status", label: "Status" }
            ]}
          />
          
          <Select
            value={sortOrder}
            onChange={setSortOrder}
            style={{ width: 100 }}
            options={[
              { value: "desc", label: "Desc" },
              { value: "asc", label: "Asc" }
            ]}
          />
          
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadCandidates}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredAndSortedData}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} candidates`
        }}
        onRow={(record) => ({
          onClick: () => {
            dispatch(setSelectedCandidate(record));
            navigate(`/candidate/${record._id}`);
          },
        })}
      />
    </div>
  );
}

export default CandidateTable;
