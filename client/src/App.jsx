import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Login from "./Login";
import { exportReportToPDF } from "./exportReport";
import VoiceMentor from "./VoiceMentor";

function ScoreCard({ label, score }) {
  const getColor = (s) => {
    if (s >= 80) return "#22c55e";
    if (s >= 50) return "#eab308";
    return "#ef4444";
  };

  return (
    <div style={{ background: "#1e1e1e", borderRadius: "12px", padding: "20px", textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: "36px", fontWeight: "bold", color: getColor(score) }}>{score}</div>
      <div style={{ color: "#aaa", marginTop: "5px" }}>{label}</div>
    </div>
  );
}

function IssueRow({ issue, repoPath }) {
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiType, setAiType] = useState(null);

  const callAI = async (endpoint, type) => {
    setAiLoading(true);
    setAiType(type);
    setAiResult(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/repo/${endpoint}`,
        { repoPath, file: issue.file, line: issue.line },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiResult(response.data);
    } catch (err) {
      setAiResult({ error: err.response?.data?.message || "AI request failed" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ background: "#1e1e1e", borderRadius: "8px", padding: "15px", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontWeight: "bold" }}>{issue.file}:{issue.line}</div>
          <div style={{ color: "#aaa", fontSize: "14px" }}>{issue.rule} — {issue.message}</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => callAI("explain", "explain")}
            disabled={aiLoading}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer" }}
          >
            {aiLoading && aiType === "explain" ? "..." : "Explain"}
          </button>
          <button
            onClick={() => callAI("refactor", "refactor")}
            disabled={aiLoading}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#8b5cf6", color: "#fff", cursor: "pointer" }}
          >
            {aiLoading && aiType === "refactor" ? "..." : "Suggest Refactor"}
          </button>
        </div>
      </div>

      {aiResult && (
        <div style={{ marginTop: "12px", background: "#111", borderRadius: "6px", padding: "12px", whiteSpace: "pre-wrap", color: "#ddd", fontSize: "14px" }}>
          {aiResult.error ? (
            <span style={{ color: "#ef4444" }}>{aiResult.error}</span>
          ) : (
            aiResult.explanation || aiResult.suggestions
          )}
        </div>
      )}
    </div>
  );
}

function PriorityCard({ item }) {
  const impactColor = { High: "#ef4444", Medium: "#eab308", Low: "#22c55e" };
  const effortColor = { Low: "#22c55e", Medium: "#eab308", High: "#ef4444" };

  return (
    <div style={{ background: "#1e1e1e", borderRadius: "8px", padding: "15px", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: "bold", fontSize: "16px" }}>
          #{item.priority} — {item.rule}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ background: impactColor[item.impact] || "#666", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" }}>
            Impact: {item.impact}
          </span>
          <span style={{ background: effortColor[item.effort] || "#666", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" }}>
            Effort: {item.effort}
          </span>
        </div>
      </div>
      <p style={{ color: "#ccc", marginTop: "8px", marginBottom: 0 }}>{item.reasoning}</p>
    </div>
  );
}

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  const [priorities, setPriorities] = useState(null);
  const [priorityLoading, setPriorityLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setPriorities(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/repo/import",
        { repoUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritize = async () => {
    setPriorityLoading(true);
    setPriorities(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/repo/prioritize",
        { issues: result.staticAnalysis.issues },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPriorities(response.data.prioritized);
    } catch (err) {
      setPriorities([]);
    } finally {
      setPriorityLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  const chartData = result
    ? [
        { name: "Security", count: result.debtScore.breakdown.securityIssues },
        { name: "Complexity", count: result.debtScore.breakdown.complexityIssues },
        { name: "Maintainability", count: result.debtScore.breakdown.maintainabilityIssues },
      ]
    : [];

  const topIssues = result ? result.staticAnalysis.issues.slice(0, 15) : [];

  return (
    <div style={{ maxWidth: "900px", margin: "50px auto", fontFamily: "sans-serif", color: "#eee" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>AI Technical Debt Analyzer</h1>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            setIsLoggedIn(false);
          }}
          style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#444", color: "#fff", cursor: "pointer", height: "40px" }}
        >
          Logout
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Enter GitHub repo URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          style={{ width: "60%", padding: "12px", fontSize: "16px", borderRadius: "6px", border: "1px solid #444", background: "#2a2a2a", color: "#fff" }}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{ padding: "12px 24px", fontSize: "16px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer" }}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && <p style={{ color: "#ef4444", textAlign: "center" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
            <button
              onClick={() => exportReportToPDF(result, priorities, repoUrl)}
              style={{ padding: "10px 20px", borderRadius: "6px", border: "none", background: "#f97316", color: "#fff", cursor: "pointer" }}
            >
              Export PDF Report
            </button>
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <ScoreCard label="Overall" score={result.debtScore.overall} />
            <ScoreCard label="Maintainability" score={result.debtScore.maintainability} />
            <ScoreCard label="Security" score={result.debtScore.security} />
            <ScoreCard label="Complexity" score={result.debtScore.complexity} />
          </div>

          {result.costEstimate && (
            <div
              style={{
                marginTop: "20px",
                background: "#1e1e1e",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6" }}>
                  {result.costEstimate.estimatedHours} hrs
                </div>
                <div style={{ color: "#aaa", marginTop: "5px" }}>Estimated Effort</div>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#22c55e" }}>
                  ₹{result.costEstimate.estimatedCostINR.toLocaleString("en-IN")}
                </div>
                <div style={{ color: "#aaa", marginTop: "5px" }}>Estimated Cost to Fix</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "40px", background: "#1e1e1e", borderRadius: "12px", padding: "20px" }}>
            <h3>Issue Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>AI-Prioritized Action Plan</h3>
              <button
                onClick={handlePrioritize}
                disabled={priorityLoading}
                style={{ padding: "10px 20px", borderRadius: "6px", border: "none", background: "#22c55e", color: "#fff", cursor: "pointer" }}
              >
                {priorityLoading ? "Thinking..." : "Prioritize My Fixes"}
              </button>
            </div>

            {priorities && priorities.length === 0 && (
              <p style={{ color: "#ef4444" }}>Could not generate priorities. Try again.</p>
            )}

            {priorities && priorities.length > 0 && (
              <div style={{ marginTop: "15px" }}>
                {priorities.map((item, idx) => (
                  <PriorityCard key={idx} item={item} />
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: "40px" }}>
            <h3>Top Issues (click Explain or Suggest Refactor)</h3>
            {topIssues.map((issue, idx) => (
              <IssueRow key={idx} issue={issue} repoPath={result.path} />
            ))}
            
          </div>
          {topIssues.length > 0 && (
  <VoiceMentor
    repoPath={result.path}
    defaultFile={topIssues[0].file}
    defaultLine={topIssues[0].line}
  />
)}
        </div>
      )}
    </div>
  );
}

export default App;