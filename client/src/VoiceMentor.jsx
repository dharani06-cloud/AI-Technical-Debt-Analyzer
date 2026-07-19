import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function VoiceMentor({ repoPath, defaultFile, defaultLine }) {
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [textQuestion, setTextQuestion] = useState("");
  const recognitionRef = useRef(null);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/repo/chat/history?repoPath=${encodeURIComponent(repoPath)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const pastMessages = [];
      response.data.history.forEach((entry) => {
        pastMessages.push({ role: "user", text: entry.question });
        pastMessages.push({ role: "ai", text: entry.answer });
      });

      setChatHistory(pastMessages);
    } catch (err) {
      console.log("Could not load chat history:", err.message);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [repoPath]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    window.speechSynthesis.cancel();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      askQuestion(transcript);
    };

    recognition.onerror = (event) => {
      console.log("Speech recognition error:", event.error);
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const askQuestion = async (questionText) => {
    if (!questionText || !questionText.trim()) return;

    setLoading(true);
    setChatHistory((prev) => [...prev, { role: "user", text: questionText }]);
    setTextQuestion("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/repo/chat",
        {
          repoPath,
          file: defaultFile,
          line: defaultLine,
          question: questionText,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const answer = response.data.answer;
      setChatHistory((prev) => [...prev, { role: "ai", text: answer }]);

      if (voiceEnabled) {
        speakAnswer(answer);
      }
    } catch (err) {
      const errMsg = "Sorry, something went wrong answering that question.";
      setChatHistory((prev) => [...prev, { role: "ai", text: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    askQuestion(textQuestion);
  };

  const speakAnswer = (text) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, " Here is the code shown above. ")
      .replace(/[#*`_]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (e) => {
      console.log("Speech synthesis error:", e.error);
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <div style={{ background: "#1e1e1e", borderRadius: "12px", padding: "20px", marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>🎙️ AI Voice Mentor</h3>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#aaa" }}>
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
          />
          Speak answers aloud
        </label>
      </div>

      <p style={{ color: "#aaa", fontSize: "14px" }}>
        Ask about <strong>{defaultFile}</strong> — e.g. "Why is this insecure?" or "Why is this slow?"
      </p>

      <form onSubmit={handleTextSubmit} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          type="text"
          value={textQuestion}
          onChange={(e) => setTextQuestion(e.target.value)}
          placeholder="Type your question here..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #444",
            background: "#2a2a2a",
            color: "#fff",
            fontSize: "14px",
          }}
        />
        <button
          type="submit"
          disabled={loading || !textQuestion.trim()}
          style={{ padding: "12px 20px", borderRadius: "6px", border: "none", background: "#8b5cf6", color: "#fff", cursor: "pointer" }}
        >
          Send
        </button>
      </form>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={startListening}
          disabled={listening || loading}
          style={{
            padding: "12px 24px",
            borderRadius: "6px",
            border: "none",
            background: listening ? "#ef4444" : "#3b82f6",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {listening ? "🔴 Listening..." : "🎤 Ask by Voice"}
        </button>

        {speaking && (
          <button
            onClick={stopSpeaking}
            style={{ padding: "12px 20px", borderRadius: "6px", border: "none", background: "#666", color: "#fff", cursor: "pointer" }}
          >
            ⏹ Stop Speaking
          </button>
        )}

        {loading && <span style={{ color: "#aaa" }}>Thinking...</span>}
      </div>

      <div style={{ marginTop: "20px", maxHeight: "500px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "90%",
              background: msg.role === "user" ? "#3b82f6" : "#111",
              color: msg.role === "user" ? "#fff" : "#ddd",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "14px",
            }}
          >
            <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "6px" }}>
              {msg.role === "user" ? "You" : "AI Mentor"}
            </div>

            {msg.role === "user" ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
            ) : (
              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match ? match[1] : "javascript"}
                        PreTag="div"
                        customStyle={{ borderRadius: "6px", fontSize: "13px" }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code
                        style={{ background: "#2a2a2a", padding: "2px 6px", borderRadius: "4px", color: "#f97316" }}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {msg.text}
              </ReactMarkdown>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VoiceMentor;