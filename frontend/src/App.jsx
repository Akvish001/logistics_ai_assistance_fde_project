import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Truck,
  Route,
  Thermometer,
  ShieldCheck,
  ClipboardList,
  Settings,
  Bell,
  Search,
  Package,
  AlertTriangle,
  Activity,
  Menu,
  X,
  Bot,
  Send,
  LoaderCircle,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Server,
} from "lucide-react";

import {
  sendChatMessage,
  checkBackendHealth,
  authenticateAdmin,
  fetchAuditLogs,
  fetchFlociInstances,
} from "./services/api";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "AI Dispatch Console", icon: Bot },
  { name: "Shipment Intelligence", icon: Package },
  { name: "Route Intelligence", icon: Route },
  { name: "Cold-Chain Monitoring", icon: Thermometer },
  { name: "SOP & Compliance", icon: ShieldCheck },
  { name: "Security & Audit", icon: ClipboardList },
  { name: "Infrastructure Monitoring", icon: Server },
  { name: "Settings", icon: Settings },
];

const suggestions = [
  "Show top 3 high-risk shipments and their recommended actions.",
  "Identify cold-chain temperature breaches.",
  "Analyze route congestion and recommend diversions.",
  "Find the applicable cold-chain compliance SOP.",
];

const stats = [
  {
    title: "Total Shipments",
    value: "--",
    description: "Awaiting database connection",
    icon: Package,
  },
  {
    title: "High Risk Shipments",
    value: "--",
    description: "Risk analysis pending",
    icon: AlertTriangle,
  },
  {
    title: "Cold-Chain Alerts",
    value: "--",
    description: "Temperature analysis pending",
    icon: Thermometer,
  },
  {
    title: "Route Risks",
    value: "--",
    description: "Route analysis pending",
    icon: Route,
  },
];

const systems = [
  { name: "React Frontend", status: "RUNNING", active: true },
  { name: "FastAPI Backend", status: "CONNECTED", active: true },
  { name: "LangGraph Agent", status: "INTEGRATED", active: true },
  { name: "Groq LLM", status: "INTEGRATED", active: true },
  { name: "SQL Server", status: "INTEGRATED", active: true },
];

function Sidebar({ activePage, setActivePage, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/10 bg-[#050505] transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D71920]">
              <Truck size={25} className="text-white" />
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-wider">
                LOGISTICS AI
              </h1>
              <p className="mt-1 text-[10px] tracking-[2px] text-gray-500">
                SUPPLY CHAIN INTELLIGENCE
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-400 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-8">
          <p className="mb-4 px-3 text-[10px] font-bold tracking-[2px] text-gray-500">
            WORKSPACE
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const selected = activePage === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActivePage(item.name);
                    setMobileOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                    selected
                      ? "bg-[#D71920] font-semibold text-white shadow-lg shadow-red-950/30"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-5">
          

          <div className="mt-5 rounded-xl border border-white/10 bg-[#151515] p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-white">
                Frontend Status
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              React application running
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-xl border border-white/10 bg-[#151515] p-5 transition hover:border-[#D71920]/60">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{item.title}</p>
        <div className="rounded-lg bg-red-500/10 p-2 text-[#D71920]">
          <Icon size={20} />
        </div>
      </div>

      <h2 className="mt-5 text-3xl font-bold text-white">{item.value}</h2>
      <p className="mt-2 text-xs text-gray-500">{item.description}</p>
    </div>
  );
}

function Overview({ backendOnline }) {
  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Supply Chain Overview</h1>
            <p className="mt-2 text-sm text-gray-500">
              Monitor operations, shipment risks and logistics intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#151515] px-3 py-2 text-xs">
            {backendOnline ? (
              <>
                <Wifi size={14} className="text-green-400" />
                <span className="text-green-400">Backend Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-red-400" />
                <span className="text-red-400">Backend Offline</span>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#151515] p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Logistics Performance</h3>
              <p className="mt-1 text-xs text-gray-500">
                Shipment and operational analytics
              </p>
            </div>
            <Activity className="text-[#D71920]" size={20} />
          </div>

          <div className="mt-8 flex h-56 items-center justify-center rounded-lg border border-dashed border-white/10">
            <div className="text-center">
              <Activity className="mx-auto mb-3 text-gray-600" size={30} />
              <p className="text-sm text-gray-400">
                Analytics will appear here
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Historical database analytics integration pending
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#151515] p-6">
          <h3 className="font-semibold">System Components</h3>
          <p className="mt-1 text-xs text-gray-500">
            Platform integration status
          </p>

          <div className="mt-6 space-y-5">
            {systems.map((system) => (
              <div
                key={system.name}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-sm text-gray-300">{system.name}</span>
                <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-400">
                  {system.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="text-xs text-gray-600">
        Database metrics are not yet displayed as live dashboard statistics.
      </p>
    </div>
  );
}

function ToolTrace({ tools }) {
  const toolDetails = {
    query_telemetry_db: {
      label: "SQL Telemetry Database",
      description: "Shipment and risk telemetry queried",
    },
    search_compliance_sop: {
      label: "SOP & Compliance Retrieval",
      description: "Operational procedures retrieved",
    },
    fetch_corridor_conditions: {
      label: "Corridor Conditions",
      description: "Weather and route conditions retrieved",
    },
  };

  if (!tools?.length) return null;

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-[#101010] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Activity size={16} className="text-[#D71920]" />
        <h4 className="text-sm font-semibold">Agent Execution Trace</h4>
      </div>

      <div className="space-y-3">
        {tools.map((tool, index) => {
          const detail = toolDetails[tool] || {
            label: tool,
            description: "Agent tool executed",
          };

          return (
            <div key={`${tool}-${index}`} className="flex items-start gap-3">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-green-400"
              />
              <div>
                <p className="text-xs font-medium text-gray-200">
                  {detail.label}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {detail.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DispatchConsole() {
  const [sessionId] = useState(
    () => `react-dashboard-${Date.now()}`
  );

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Welcome to the FDE AI Dispatch Console. Ask me about shipment risks, cold-chain conditions, route disruptions, or compliance SOPs.",
      tools: [],
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(messageText = input) {
    const message = messageText.trim();

    if (!message || loading) return;

    setError("");
    setInput("");

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        content: message,
        tools: [],
      },
    ]);

    setLoading(true);

    try {
      const result = await sendChatMessage(message, sessionId);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: result.response,
          tools: result.tool_trace || [],
        },
      ]);
    } catch (err) {
      setError(err.message || "Unable to contact the AI agent.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function resetConversation() {
    if (loading) return;

    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: "New conversation started. How can I help with logistics operations?",
        tools: [],
      },
    ]);
    setInput("");
    setError("");
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#D71920]/15 p-2 text-[#D71920]">
              <Bot size={22} />
            </div>
            <h1 className="text-2xl font-bold">AI Dispatch Console</h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Intelligent logistics assistance powered by LangGraph and Groq.
          </p>
        </div>

        <button
          onClick={resetConversation}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 transition hover:border-[#D71920] hover:text-white disabled:opacity-40"
        >
          <RotateCcw size={14} />
          New Conversation
        </button>
      </section>

      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#151515] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D71920]">
              <Bot size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold">Logistics Agent</p>
              <p className="mt-1 text-[11px] text-green-400">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                Ready to assist
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-[10px] text-gray-500 sm:flex">
            <Sparkles size={14} className="text-[#D71920]" />
            GROQ CLOUD REASONER
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-7">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D71920]">
                  <Bot size={17} />
                </div>
              )}

              <div
                className={`max-w-[90%] rounded-xl p-4 md:max-w-[85%] ${
                  message.role === "user"
                    ? "bg-[#D71920] text-white"
                    : "border border-white/10 bg-[#191919] text-gray-200"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-7">
                  {message.content}
                </p>

                {message.role === "assistant" && (
                  <ToolTrace tools={message.tools} />
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D71920]">
                <Bot size={17} />
              </div>
              <div className="rounded-xl border border-white/10 bg-[#191919] p-4">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <LoaderCircle
                    size={17}
                    className="animate-spin text-[#D71920]"
                  />
                  Analyzing logistics data and consulting agent tools...
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  This may take a little time.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-[#151515] p-4 md:p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Suggested Operations
          </p>

          <div className="mb-5 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                disabled={loading}
                onClick={() => handleSend(suggestion)}
                className="rounded-lg border border-white/10 px-3 py-2 text-left text-[11px] text-gray-400 transition hover:border-[#D71920] hover:text-white disabled:opacity-40"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3 rounded-xl border border-white/10 bg-[#080808] p-3 focus-within:border-[#D71920]/70">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about shipment risks, routes, cold-chain or SOPs..."
              rows={2}
              disabled={loading}
              className="max-h-36 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-gray-600 disabled:opacity-50"
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#D71920] text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              title="Send message"
            >
              {loading ? (
                <LoaderCircle size={19} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-gray-600">
            <span>Enter to send ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Shift + Enter for a new line</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              AI processing may take a moment
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}


function SecurityAudit() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  async function handleAuthenticate(event) {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("Please enter both admin username and password.");
      return;
    }

    setLoading(true);

    try {
      const authResult = await authenticateAdmin(username.trim(), password);

      if (!authResult.access_token) {
        throw new Error("Authentication token was not returned.");
      }

      const accessToken = authResult.access_token;

      const auditResult = await fetchAuditLogs(accessToken);

      setToken(accessToken);
      setLogs(auditResult.logs || []);
      setAuthenticated(true);
      setPassword("");

    } catch (err) {
      setToken("");
      setAuthenticated(false);
      setLogs([]);
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken("");
    setLogs([]);
    setUsername("");
    setPassword("");
    setAuthenticated(false);
    setError("");
  }

  async function refreshLogs() {
    if (!token || loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await fetchAuditLogs(token);
      setLogs(result.logs || []);
    } catch (err) {
      setError(err.message || "Unable to refresh audit logs.");

      if (err.message.toLowerCase().includes("expired") ||
          err.message.toLowerCase().includes("invalid")) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#D71920]/15 p-3 text-[#D71920]">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Security & Audit</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enterprise administrator authentication and audit log inspection.
            </p>
          </div>
        </div>
      </section>

      {!authenticated ? (
        <section className="max-w-2xl rounded-xl border border-white/10 bg-[#151515] p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Database Authorization Gate</h2>
            <p className="mt-2 text-sm text-gray-400">
              Enter administrator credentials to access the FDE agent audit trail.
            </p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter admin username"
                autoComplete="username"
                className="w-full rounded-lg border border-white/10 bg-[#080808] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#D71920]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-white/10 bg-[#080808] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#D71920]"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D71920] px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <ShieldCheck size={18} />
              )}
              {loading ? "Authenticating & Loading Logs..." : "Authenticate & Load Logs"}
            </button>
          </form>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-500/20 bg-[#151515] p-5">
            <div>
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 size={18} />
                <span className="text-sm font-semibold">
                  Administrator Authenticated
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Audit database access granted.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={refreshLogs}
                disabled={loading}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-gray-300 hover:border-[#D71920] disabled:opacity-50"
              >
                Refresh Logs
              </button>

              <button
                onClick={handleLogout}
                className="rounded-lg bg-[#D71920] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-[#151515] p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Enterprise Agent Audit Trail</h2>
                <p className="mt-1 text-xs text-gray-500">
                  FDE_VIEWS.AgentAuditLog
                </p>
              </div>

              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">
                {logs.length} Records
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-400">
                <LoaderCircle size={20} className="animate-spin text-[#D71920]" />
                Loading audit records...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                No audit logs found. Run a query in the Dispatch Console first.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="p-3">ID</th>
                      <th className="p-3">Execution Time</th>
                      <th className="p-3">Session ID</th>
                      <th className="p-3">Graph Node</th>
                      <th className="p-3">Tool Triggered</th>
                      <th className="p-3">Content</th>
                    </tr>
                  </thead>

                  <tbody>
                    {logs.map((log, index) => (
                      <tr
                        key={log.LogID ?? index}
                        className="border-b border-white/5 text-gray-300 hover:bg-white/5"
                      >
                        <td className="p-3">{log.LogID ?? "-"}</td>
                        <td className="p-3 whitespace-nowrap">
                          {log.Timestamp
                            ? new Date(log.Timestamp).toLocaleString()
                            : "-"}
                        </td>
                        <td className="max-w-40 truncate p-3">
                          {log.SessionID ?? "-"}
                        </td>
                        <td className="p-3">{log.NodeExecuted ?? "-"}</td>
                        <td className="p-3">{log.ToolName ?? "-"}</td>
                        <td className="max-w-md whitespace-pre-wrap break-words p-3">
                          {log.Content ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}


// --------------------------------------------------
// FLOCI INFRASTRUCTURE MONITORING
// --------------------------------------------------

function InfrastructureMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadInstances() {
    try {
      const result = await fetchFlociInstances();

      if (!result.success) {
        throw new Error("FLOCI returned an unsuccessful response.");
      }

      setData(result);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to connect to FLOCI.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstances();

    const interval = setInterval(loadInstances, 30000);

    return () => clearInterval(interval);
  }, []);

  const activeInstances = (data?.instances || []).filter(
    (instance) => instance.state === "running"
  );

  return (
    <div className="space-y-8">

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Infrastructure Monitoring
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor EC2 infrastructure running on your local FLOCI environment.
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            loadInstances();
          }}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-[#D71920] disabled:opacity-50"
        >
          <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          FLOCI Connection Error: {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#151515] p-12 text-gray-400">
          <LoaderCircle size={20} className="animate-spin text-[#D71920]" />
          Loading EC2 infrastructure...
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#151515] p-6">
              <p className="text-sm text-gray-400">
                Active EC2 Instances
              </p>
              <h2 className="mt-4 text-4xl font-bold text-white">
                {activeInstances.length}
              </h2>
              <p className="mt-2 text-xs text-gray-500">
                Running instances only
              </p>
            </div>

            <div className="rounded-xl border border-green-500/20 bg-[#151515] p-6">
              <p className="text-sm text-gray-400">
                Infrastructure Status
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <h2 className="text-2xl font-bold text-green-400">
                  {error ? "Connection Error" : "Connected"}
                </h2>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                FLOCI AWS Simulation
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#151515] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  EC2 Instance Details
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Live infrastructure information from FLOCI
                </p>
              </div>

              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                {activeInstances.length} Running
              </span>
            </div>

            {activeInstances.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                No running EC2 instances found.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {activeInstances.map((instance) => (
                  <div
                    key={instance.instance_id}
                    className="rounded-xl border border-white/10 bg-[#101010] p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-red-500/10 p-3 text-[#D71920]">
                          <Server size={23} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            EC2 Instance
                          </h3>
                          <p className="mt-1 text-xs text-gray-500">
                            {instance.instance_id}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-400" />
                        Running
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-gray-500">Private IP</p>
                        <p className="mt-2 text-sm font-medium text-white">
                          {instance.private_ip || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Instance Type</p>
                        <p className="mt-2 text-sm font-medium text-white">
                          {instance.instance_type || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Availability Zone</p>
                        <p className="mt-2 text-sm font-medium text-white">
                          {instance.availability_zone || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lastUpdated && (
              <p className="mt-5 text-right text-xs text-gray-600">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {" ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· "}Auto-refresh every 30 seconds
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    let active = true;

    checkBackendHealth()
      .then(() => {
        if (active) setBackendOnline(true);
      })
      .catch(() => {
        if (active) setBackendOnline(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#080808]/95 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-white/10 p-2 text-gray-400 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 className="text-lg font-semibold">{activePage}</h2>
              <p className="mt-1 hidden text-xs text-gray-500 sm:block">
                FDE Supply Chain Intelligence Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-[#151515] px-3 py-2 md:flex">
              <Search size={16} className="text-gray-500" />
              <input
                placeholder="Search..."
                className="w-32 bg-transparent text-sm outline-none placeholder:text-gray-600"
              />
            </div>

            <div
              className={`hidden items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:flex ${
                backendOnline
                  ? "border-green-500/20 text-green-400"
                  : "border-red-500/20 text-red-400"
              }`}
            >
              {backendOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {backendOnline ? "API Online" : "API Offline"}
            </div>

            <button className="relative rounded-lg border border-white/10 p-2.5 text-gray-400 hover:text-white">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#D71920]" />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D71920] text-sm font-bold">
              F
            </div>
          </div>
        </header>

        <div className="space-y-8 p-5 md:p-8">
          {activePage === "Overview" ? (
            <Overview backendOnline={backendOnline} />
          ) : activePage === "AI Dispatch Console" ? (
            <DispatchConsole />
          ) : activePage === "Infrastructure Monitoring" ? (
            <InfrastructureMonitoring />
          ) : activePage === "Security & Audit" ? (
            <SecurityAudit />
          ) : (
            <section className="rounded-xl border border-white/10 bg-[#151515] p-8">
              <h1 className="text-xl font-bold">{activePage}</h1>
              <p className="mt-3 text-sm text-gray-400">
                This module will be implemented and connected to the FastAPI backend.
              </p>
            </section>
          )}
        </div>

        <footer className="border-t border-white/10 px-8 py-5 text-center text-xs text-gray-600">
          FDE Supply Chain AI Orchestrator | React + FastAPI + LangGraph
        </footer>
      </main>
    </div>
  );
}

export default App;
