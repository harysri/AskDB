import React, { useState, useEffect } from "react";
import { testConnection, createConnection } from "../api/connection";

const DB_TYPES = [
  { value: "postgresql", label: "PostgreSQL", defaultPort: "5432" },
  { value: "mysql", label: "MySQL", defaultPort: "3306" },
];

const ConnectModal = ({ isOpen, onClose, onConnect }) => {
  const [dbType, setDbType] = useState("postgresql");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState("idle"); // idle, testing, success, warning, error
  const [connectStatus, setConnectStatus] = useState("idle"); // idle, connecting, connected, error
  const [testMessage, setTestMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTestStatus("idle");
      setConnectStatus("idle");
      setTestMessage("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDbTypeChange = (e) => {
    const next = e.target.value;
    setDbType(next);
    const selected = DB_TYPES.find((t) => t.value === next);
    if (selected && (port === "5432" || port === "3306")) {
      setPort(selected.defaultPort);
    }
  };

  const buildPayload = () => ({
    db_type: dbType,
    host,
    port: parseInt(port, 10) || 0,
    database,
    username,
    password,
    save_credentials: true,
  });

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setError("");
    try {
      const data = await testConnection(buildPayload());
      setTestMessage(data.message || "");
      if (data.is_read_only_verified) {
        setTestStatus("success");
      } else {
        setTestStatus("warning");
      }
    } catch (err) {
      setTestStatus("error");
      setError(err.message);
    }
  };

  const handleConnect = async () => {
    setConnectStatus("connecting");
    setError("");
    try {
      const data = await createConnection(buildPayload());
      setConnectStatus("connected");
      onConnect?.(data);
      setTimeout(() => {
        onClose?.();
        setConnectStatus("idle");
        setTestStatus("idle");
        setTestMessage("");
      }, 1500);
    } catch (err) {
      setConnectStatus("error");
      setError(err.message);
    }
  };

  const isFormValid =
    host && database && username && password && Number.isInteger(parseInt(port, 10));

  return (
    <div className="fixed inset-0 z-[60] bg-background/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      {/* Connect Your Database Modal */}
      <div className="glass-card w-full max-w-lg rounded-xl overflow-hidden animate-fade-in-up shadow-2xl shadow-primary/10">
        {/* Modal Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-on-background">
              {connectStatus === "connected" ? "Connection Established" : "Connect Your Database"}
            </h2>
            <button 
              onClick={onClose}
              className="text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p className="text-on-surface-variant font-body-md">
            {connectStatus === "connected" 
              ? "Your database is now ready for natural language queries."
              : <>Provide your connection details to allow <span className="text-primary font-bold">AskDB</span> to read and analyze your schema securely.</>
            }
          </p>
        </div>

        {connectStatus === "connected" ? (
          /* Success State */
          <div className="px-8 pb-8 flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
              <span className="material-symbols-outlined text-emerald-400 text-4xl">check_circle</span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">Connected successfully!</h3>
            <p className="text-on-surface-variant text-sm">Redirecting to chat interface...</p>
            <div className="mt-6 w-48 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 animate-pulse rounded-full"></div>
            </div>
          </div>
        ) : (
          /* Modal Form */
          <form className="px-8 pb-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
            {/* DB Type Select */}
            <div className="space-y-2">
              <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">Database Type</label>
              <div className="relative">
                <select 
                  value={dbType}
                  onChange={handleDbTypeChange}
                  className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-lg px-4 appearance-none font-body-md text-on-surface"
                >
                  {DB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            {/* Host & Port Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">Host</label>
                <input 
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g. db.example.com"
                  className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-lg px-4 font-body-md text-on-surface placeholder-outline-variant"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">Port</label>
                <input 
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-lg px-4 font-body-md text-on-surface"
                />
              </div>
            </div>

            {/* Database Name */}
            <div className="space-y-2">
              <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">Database Name</label>
              <input 
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="production_db"
                className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-lg px-4 font-body-md text-on-surface placeholder-outline-variant"
              />
            </div>

            {/* Username & Password Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">Username</label>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-lg px-4 font-body-md text-on-surface placeholder-outline-variant"
                />
              </div>
              <div className="space-y-2 relative">
                <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">Password</label>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-lg px-4 pr-12 font-body-md text-on-surface"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-outline hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Status / Error */}
            {testStatus === "warning" && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="material-symbols-outlined text-amber-400 text-lg mt-0.5">
                  warning
                </span>
                <div className="text-body-sm text-amber-400">
                  <p className="font-bold">Read-only could not be verified</p>
                  <p className="mt-0.5 opacity-90">
                    {testMessage ||
                      "Use credentials for a SELECT-only database role."}
                  </p>
                </div>
              </div>
            )}
            {testStatus === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="material-symbols-outlined text-emerald-400 text-lg">
                  check_circle
                </span>
                <div className="text-body-sm text-emerald-400">
                  <p className="font-bold">Connection successful</p>
                  {testMessage && <p className="mt-0.5 opacity-90">{testMessage}</p>}
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/30">
                <span className="material-symbols-outlined text-error text-lg mt-0.5">
                  error
                </span>
                <span className="text-body-sm text-error">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === "testing" || !isFormValid}
                className={`px-6 h-12 rounded-lg font-bold transition-all border active:scale-95 duration-150 flex items-center gap-2 ${
                  testStatus === "success"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : testStatus === "warning"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : testStatus === "error"
                        ? "bg-error/10 text-error border-error/30"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-outline-variant/30 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {testStatus === "testing" ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Testing...
                  </>
                ) : testStatus === "success" ? (
                  <>
                    <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                    Verified
                  </>
                ) : testStatus === "warning" ? (
                  <>
                    <span className="material-symbols-outlined text-amber-400">warning</span>
                    Re-test
                  </>
                ) : testStatus === "error" ? (
                  <>
                    <span className="material-symbols-outlined text-error">error</span>
                    Retry
                  </>
                ) : (
                  "Test Connection"
                )}
              </button>
              <button
                type="button"
                onClick={handleConnect}
                disabled={connectStatus === "connecting" || !isFormValid}
                className="px-8 h-12 rounded-lg font-bold bg-primary-container text-on-primary-container shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 transition-all active:scale-95 duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectStatus === "connecting" ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Connecting...
                  </>
                ) : (
                  <>
                    <span>Connect</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security Badge Footer */}
        <div className="bg-surface-container-lowest/50 border-t border-outline-variant/20 px-8 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: '"FILL" 1'}}>lock</span>
          <span className="text-label-mono text-[10px] text-on-surface-variant uppercase tracking-tight">
            Connections are encrypted via TLS 1.3. Credentials never leave your private workspace.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
