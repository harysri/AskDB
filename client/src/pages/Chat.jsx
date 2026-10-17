import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ConnectModal from "../components/ConnectModal";
import ChatMessage from "../components/ChatMessage";
import {
  listSessions,
  getSessionMessages,
  deleteSession,
  updateSession,
} from "../api/sessions";
import { listConnections } from "../api/connection";
import { sendMessage } from "../api/chat";
import { useAuth } from "../context/AuthContext";
import { getFirstName } from "../utils/user";
import { mapMessage, mapSession } from "../utils/messages";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

const SUGGESTION_CHIPS = [
  "Show me total revenue by region",
  "What were our top 10 products last month?",
  "Compare Q3 vs Q4 customer churn",
  "List all inactive users from last week",
];

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = getFirstName(user);

  const GREETINGS = [
    `Welcome back, ${firstName}`,

    "How can I help you with your data today?",

    "Ready to dive into your data?",
    "Ask anything about your database...",
  ];

  const [isConnected, setIsConnected] = useState(() =>
    Boolean(localStorage.getItem("askdb_connection_info")),
  );
  const [connectionInfo, setConnectionInfo] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("askdb_connection_info") || "null",
      );
    } catch {
      return null;
    }
  });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [showGreeting, setShowGreeting] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [connections, setConnections] = useState([]);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const suggestionScrollRef = useRef(null);

  // Speech-to-text (Web Speech API). Finalized text is appended to the
  // textarea live; on stop the dictated text stays for review — never auto-sends.
  const speech = useSpeechRecognition();
  const dictatedText = speech.transcript + speech.interim;

  useEffect(() => {
    if (speech.isListening && dictatedText) {
      setInputValue(dictatedText);
    }
  }, [dictatedText, speech.isListening]);

  useEffect(() => {
    if (speech.error) {
      setChatError(speech.error);
    }
  }, [speech.error]);

  const toggleDictation = () => {
    if (!speech.supported) {
      setChatError(
        "Voice input isn't supported in this browser. Please use Chrome or Edge.",
      );
      return;
    }
    if (speech.isListening) {
      speech.stop(); // dictated text stays in the textarea for review
    } else {
      setInputValue("");
      speech.reset();
      speech.start();
    }
  };

  const refreshSessions = async () => {
    try {
      const data = await listSessions();
      setSessions(data.map(mapSession));
    } catch {
      // Non-fatal: keep whatever sessions we already have.
    }
  };

  const refreshConnections = async () => {
    try {
      setConnections(await listConnections());
    } catch {
      // Non-fatal: keep whatever connections we already have.
    }
  };

  // Load real session history + saved connections on mount.
  useEffect(() => {
    refreshSessions();
    refreshConnections();
  }, []);

  // Greeting cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setShowGreeting(false);
      setTimeout(() => {
        setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
        setShowGreeting(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [inputValue]);

  // Suggestion chips carousel auto-scroll
  useEffect(() => {
    const el = suggestionScrollRef.current;
    if (!el || messages.length !== 0) return;

    let direction = 1;
    const step = 3;
    const interval = window.setInterval(() => {
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += direction * step;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
        direction = -1;
      } else if (el.scrollLeft <= 0) {
        direction = 1;
      }
    }, 12);

    return () => window.clearInterval(interval);
  }, [messages.length]);

  const handleConnect = (info) => {
    setIsConnected(true);
    setConnectionInfo(info);
    localStorage.setItem("askdb_connection_info", JSON.stringify(info));
    setShowConnectModal(false);
    refreshConnections();
  };

  const handleSelectConnection = async (connectionId) => {
    const conn = connections.find((c) => c.connection_id === connectionId);
    if (activeSessionId) {
      // Re-bind the active session to the chosen database.
      try {
        await updateSession(activeSessionId, { connection_id: connectionId });
        await refreshSessions();
        if (conn) {
          setConnectionInfo(conn);
          setIsConnected(true);
          localStorage.setItem("askdb_connection_info", JSON.stringify(conn));
        }
      } catch (err) {
        setChatError(err.message || "Could not switch the database.");
      }
    } else if (conn) {
      // No session yet -> this becomes the default for the next new session.
      setConnectionInfo(conn);
      setIsConnected(true);
      localStorage.setItem("askdb_connection_info", JSON.stringify(conn));
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setChatError("");
    setActiveSessionId(null);
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewSession();
    }
  };

  const handleSessionClick = async (sessionId) => {
    setActiveSessionId(sessionId);
    setChatError("");
    setMessages([]);
    try {
      const data = await getSessionMessages(sessionId);
      setMessages(data.map(mapMessage));
    } catch (err) {
      setChatError(err.message || "Could not load session history.");
    }
  };

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim() || isLoading) return;

    // Leaving dictation running would keep overwriting the (now empty) input.
    speech.stop();

    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }

    const userMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setChatError("");
    setIsLoading(true);

    try {
      const data = await sendMessage({
        session_id: activeSessionId,
        message: text,
        connection_id: activeSessionId
          ? undefined
          : connectionInfo?.connection_id,
      });

      setMessages((prev) => [...prev, ...data.messages.map(mapMessage)]);

      if (!activeSessionId) {
        setActiveSessionId(data.session_id);
      }
      await refreshSessions();
    } catch (err) {
      if (err.status === 429) {
        setChatError(
          "You're sending questions too quickly. Please wait a moment before asking again.",
        );
      } else if (err.status === 400 && /connect/i.test(err.message || "")) {
        setChatError(err.message || "No connected database. Please reconnect.");
        setShowConnectModal(true);
      } else {
        setChatError(
          err.message || "Something went wrong while sending your message.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        onConnectClick={() => setShowConnectModal(true)}
        isConnected={isConnected}
        connectionInfo={connectionInfo}
        connections={connections}
        activeConnectionId={
          sessions.find((s) => s.id === activeSessionId)?.connection_id
        }
        onSelectConnection={handleSelectConnection}
        onNewSession={handleNewSession}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionClick={handleSessionClick}
        onDeleteSession={handleDeleteSession}
      />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/20 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-background text-xl font-bold">
              database
            </span>
          </div>
          <span className="font-headline-md text-lg font-bold text-on-surface">
            AskDB
          </span>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="p-2 rounded-lg bg-surface-container-high/50 border border-white/5"
        >
          <span className="material-symbols-outlined text-primary">
            settings_ethernet
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="lg:ml-[280px] flex-1 h-screen flex flex-col relative bg-background">
        {/* Chat Canvas */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-32 pt-16 lg:pt-0">
          {messages.length === 0 ? (
            <div className="max-w-[800px] mx-auto h-full flex flex-col justify-center">
              <div className="text-center space-y-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-primary-container/20 border border-primary/20 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
                  <span
                    className="material-symbols-outlined text-primary text-5xl"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    database
                  </span>
                </div>
                <h2
                  className={`font-headline-lg text-4xl md:text-5xl text-on-surface font-extrabold tracking-tight min-h-[1.2em] transition-opacity duration-500 ${showGreeting ? "opacity-100" : "opacity-0"}`}
                >
                  {GREETINGS[greetingIndex]}
                </h2>
                <p className="text-xl md:text-2xl text-on-surface-variant/80 max-w-2xl mx-auto leading-relaxed">
                  Ask questions in natural language, and I'll generate the SQL
                  and visualize the results for you in real-time.
                </p>
              </div>

              <div className="opacity-0 pointer-events-none h-20"></div>
            </div>
          ) : (
            <div className="max-w-[1000px] mx-auto space-y-6 pt-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex gap-4 animate-fade-in-up">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-container/30 border border-primary/30 flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-primary text-sm"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      smart_toy
                    </span>
                  </div>
                  <div className="bg-surface-container-high border border-white/5 rounded-2xl px-5 py-4 chat-bubble-assistant">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                      <span className="text-base md:text-lg text-on-surface-variant">
                        Analyzing your database...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Fixed Bottom Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none flex justify-center">
            <div className="max-w-[1000px] mx-auto pointer-events-auto w-full">
              {/* Listening indicator with equalizer animation */}
              {speech.isListening && (
                <div className="animate-fade-in-up flex items-center gap-3 px-4 py-2.5 mb-3 mx-auto w-fit rounded-full bg-surface-container-highest/90 backdrop-blur-xl border border-primary/30 shadow-lg shadow-primary/10">
                  <div className="flex items-end gap-[3px] h-5">
                    {[0.35, 0.62, 0.48, 0.78, 0.55].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full ${i % 2 ? "bg-tertiary" : "bg-primary"} animate-listen-bar`}
                        style={{
                          height: `${h * 100}%`,
                          animationDelay: `${i * 120}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-label-caps text-primary uppercase tracking-[0.15em]">
                    Listening
                  </span>
                  <button
                    type="button"
                    onClick={toggleDictation}
                    className="text-on-surface-variant hover:text-error transition-colors"
                    title="Stop dictation"
                  >
                    <span className="material-symbols-outlined text-base">
                      stop_circle
                    </span>
                  </button>
                </div>
              )}
              {/* Request error banner */}
            {chatError && (
              <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-error/10 border border-error/30">
                <span className="material-symbols-outlined text-error text-lg">
                  error
                </span>
                <span className="text-body-sm text-error flex-1">
                  {chatError}
                </span>
                <button
                  onClick={() => setChatError("")}
                  className="text-error/70 hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    close
                  </span>
                </button>
              </div>
            )}
            {/* Assistant Suggestions Pill */}
            {messages.length === 0 && (
              <div
                ref={suggestionScrollRef}
                className="flex gap-3 mb-3 overflow-x-auto no-scrollbar max-w-full scroll-smooth"
              >
                {SUGGESTION_CHIPS.map((chip, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(chip)}
                    className="flex-shrink-0 px-5 py-3 rounded-full bg-surface-container-high/60 border border-white/5 text-base md:text-sm font-semibold text-on-surface hover:text-primary hover:border-primary/30 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div className="relative group bg-surface-container-high/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl focus-within:border-primary/50 transition-all duration-300">
              <div className="flex items-end p-2 gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    speech.isListening
                      ? "Listening… speak your question now"
                      : isConnected
                        ? "Type your data question here..."
                        : "Connect a database to start querying..."
                  }
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 py-4 text-lg md:text-xl text-on-surface placeholder-on-surface-variant/40 resize-none min-h-[56px] max-h-[220px] outline-none"
                  disabled={!isConnected && messages.length > 0}
                />
                <div className="flex items-center gap-2 mb-2 pr-2">
                  {/* Voice input toggle (Web Speech API) */}
                  <div className="relative">
                    {speech.isListening && (
                      <span className="absolute inset-0 rounded-xl bg-primary/50 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={toggleDictation}
                      disabled={!speech.supported}
                      title={
                        speech.supported
                          ? speech.isListening
                            ? "Stop dictation"
                            : "Dictate your question"
                          : "Voice input requires Chrome or Edge"
                      }
                      aria-pressed={speech.isListening}
                      className={`relative p-3 rounded-xl transition-all ${
                        speech.isListening
                          ? "bg-primary text-on-primary shadow-lg shadow-primary/30"
                          : "text-on-surface-variant hover:text-primary hover:bg-white/5"
                      } ${!speech.supported ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`material-symbols-outlined ${speech.isListening ? "animate-pulse" : ""}`}
                        style={
                          speech.isListening
                            ? { fontVariationSettings: '"FILL" 1' }
                            : undefined
                        }
                      >
                        mic
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      send
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-[10px] text-on-surface-variant/40 uppercase font-bold tracking-[0.15em]">
                Powered by SQL Analyst AI v2.4 • SOC2 Compliant Environment
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Connect Modal */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnect}
      />
    </div>
  );
};

export default Chat;
