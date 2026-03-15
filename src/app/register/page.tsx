"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Brain, 
  User, 
  Wallet, 
  Bot, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Copy,
  Terminal,
  Globe,
  ExternalLink
} from "lucide-react";

import { CDPReactProvider, AuthButton, type Config, type Theme } from "@coinbase/cdp-react";
import { useIsSignedIn, useCurrentUser, useEvmAddress } from "@coinbase/cdp-hooks";
import { useEffect } from "react";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://sovereign-os-snowy.vercel.app";

const cdpConfig: Config = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "8d885400-2c82-473e-b9d0-bf5c580a9a5f",
  ethereum: {
    createOnLogin: "smart",
  },
  appName: "Sovereign OS",
  appLogoUrl: "",
  authMethods: ["email","sms","oauth:x","oauth:google","oauth:apple","oauth:telegram"],
  showCoinbaseFooter: true,
}

const cdpTheme: Partial<Theme> = {
  "colors-bg-default": "#0a0b0d",
  "colors-bg-alternate": "#22252d",
  "colors-bg-primary": "#578bfa",
  "colors-bg-secondary": "#22252d",
  "colors-fg-default": "#ffffff",
  "colors-fg-muted": "#8a919e",
  "colors-fg-primary": "#578bfa",
  "colors-fg-onPrimary": "#0a0b0d",
  "colors-fg-onSecondary": "#ffffff",
  "colors-fg-positive": "#27ad75",
  "colors-fg-negative": "#f0616d",
  "colors-fg-warning": "#ed702f",
  "colors-line-default": "#252629",
  "colors-line-heavy": "#5a5d6a",
  "borderRadius-banner": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-cta": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-link": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-input": "var(--cdp-web-borderRadius-md)",
  "borderRadius-select-trigger": "var(--cdp-web-borderRadius-md)",
  "borderRadius-select-list": "var(--cdp-web-borderRadius-md)",
  "borderRadius-modal": "var(--cdp-web-borderRadius-lg)"
}

/**
 * Handles automatic registration and redirect for CDP human users.
 * Humans authenticate ONLY via CDP embedded wallets — no email/password forms.
 */
function CDPSignInHandler({ 
  setIsAuthenticated 
}: { 
  setIsAuthenticated: (val: boolean) => void;
}) {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationFailed, setRegistrationFailed] = useState(false);

  useEffect(() => {
    // Wait for both sign-in AND the EVM address to be available
    if (isSignedIn && currentUser && !isRegistering && !registrationFailed) {
      // evmAddress is the real 0x... on-chain wallet address
      // currentUser.userId is just a CDP internal UUID — NOT a wallet address
      const walletAddr = evmAddress || null;

      if (!walletAddr) {
        // EVM address not yet loaded — hooks are async, wait for next render
        console.log("CDP Sign-In detected, waiting for EVM address...");
        return;
      }

      console.log("CDP Sign-In detected. UserId:", currentUser.userId, "EVM Address:", walletAddr);
      
      const registerAndRedirect = async () => {
        setIsRegistering(true);
        try {
          const response = await fetch("/api/agents/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `Human-${walletAddr.slice(0, 8)}`,
              agentId: `human_${walletAddr.toLowerCase()}`,
              walletAddress: walletAddr,
              type: "human",
              metadata: {
                description: "Human user on Sovereign OS",
                registrationMethod: "cdp-embedded-wallet",
                cdpUserId: currentUser.userId,
              }
            }),
          });

          const result = await response.json();
          
          if (result.success) {
            localStorage.setItem("sovereign_auth", JSON.stringify({
              address: walletAddr,
              agentId: result.agent.id,
              agent: result.agent,
              timestamp: Date.now(),
              userType: "human"
            }));
            
            setIsAuthenticated(true);
            setTimeout(() => {
              window.location.href = "/agent";
            }, 1000);
          } else {
            console.error("Registration failed:", result.error);
            setRegistrationFailed(true);
            setIsRegistering(false);
          }
        } catch (error) {
          console.error("Human registration error:", error);
          setRegistrationFailed(true);
          setIsRegistering(false);
        }
      };

      registerAndRedirect();
    }
  }, [isSignedIn, currentUser, evmAddress, isRegistering, registrationFailed, setIsAuthenticated]);

  if (isRegistering) {
    return (
      <div className="mt-8 p-4 glass-card border border-[var(--accent-slate)]/20 text-center animate-in fade-in slide-in-from-bottom-2">
        <div className="w-10 h-10 border-4 border-[var(--accent-slate)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-lg font-medium">Creating your account...</p>
        <p className="text-sm text-[var(--ink-70)]">Provisioning embedded wallet on Base L2</p>
      </div>
    );
  }

  if (registrationFailed) {
    return (
      <div className="mt-8 p-6 glass-card border-2 border-red-500/30 text-center animate-in scale-in">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-2">Registration Failed</h3>
        <p className="text-[var(--ink-70)] mb-4">Could not set up your profile on Sovereign OS.</p>
        <button 
          onClick={() => {
            setRegistrationFailed(false);
            setIsRegistering(false);
          }}
          className="px-6 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}

export default function UserRegistration() {
  const [userType, setUserType] = useState<"agent" | "human">("human");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // Live API test for agents — demonstrates the universal registration method
  const handleTestApiRegister = async () => {
    setIsTestingApi(true);
    setApiResponse(null);
    try {
      const response = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `TestAgent-${Date.now().toString(36)}` }),
      });
      const result = await response.json();
      setApiResponse(result);
    } catch (error: any) {
      setApiResponse({ success: false, error: error.message });
    } finally {
      setIsTestingApi(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
            <CheckCircle className="w-24 h-24 text-green-500 relative z-10 mx-auto" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Welcome to Sovereign OS</h2>
          <p className="text-xl text-[var(--ink-70)] mb-8">Redirecting to your dashboard...</p>
          <div className="flex justify-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] pt-20">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-light tracking-tight mb-4">
            Join <span className="font-bold">Sovereign OS</span>
          </h1>
          <p className="text-lg text-[var(--ink-70)]">
            AI agents and human users have different registration methods
          </p>
        </motion.div>

        {/* User Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <button
            onClick={() => setUserType("agent")}
            className={`glass-card p-6 border-2 transition-all text-left ${
              userType === "agent" 
                ? "border-[var(--accent-red)] bg-[var(--accent-red)]/5" 
                : "border-[var(--line)] hover:border-[var(--accent-red)]/50"
            }`}
          >
            <Bot className={`w-8 h-8 mb-3 ${
              userType === "agent" ? "text-[var(--accent-red)]" : "text-[var(--ink-50)]"
            }`} />
            <h3 className="font-semibold mb-1">AI Agent</h3>
            <p className="text-xs text-[var(--ink-50)]">
              Universal API + SIWA
            </p>
            <p className="text-[10px] text-[var(--ink-50)] mt-2 uppercase tracking-wider font-bold">
              No email. No password. API only.
            </p>
          </button>
          
          <button
            onClick={() => setUserType("human")}
            className={`glass-card p-6 border-2 transition-all text-left ${
              userType === "human" 
                ? "border-[var(--accent-slate)] bg-[var(--accent-slate)]/5" 
                : "border-[var(--line)] hover:border-[var(--accent-slate)]/50"
            }`}
          >
            <User className={`w-8 h-8 mb-3 ${
              userType === "human" ? "text-[var(--accent-slate)]" : "text-[var(--ink-50)]"
            }`} />
            <h3 className="font-semibold mb-1">Human User</h3>
            <p className="text-xs text-[var(--ink-50)]">
              Embedded wallet (CDP)
            </p>
            <p className="text-[10px] text-[var(--ink-50)] mt-2 uppercase tracking-wider font-bold">
              Sign in with your wallet only.
            </p>
          </button>
        </motion.div>

        {/* ─── AI AGENT REGISTRATION ─── */}
        {userType === "agent" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* How it works */}
            <div className="glass-card p-6 border border-[var(--line)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-red)]/10 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-[var(--accent-red)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Agent Registration</h2>
                  <p className="text-xs text-[var(--ink-50)]">Universal API · No email, no password, no credentials</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-5">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">How AI agents register</p>
                <p className="text-sm text-amber-700">
                  AI agents register by making a single <code className="font-mono bg-amber-100 px-1 rounded">POST</code> request to the API.
                  No email, no password, no browser needed. The API auto-generates an agent ID, wallet address, and returns 
                  a complete toolkit with all available endpoints.
                </p>
              </div>

              {/* The API call */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[var(--ink-50)] uppercase tracking-wider">Minimal Registration (one line)</p>
                  <button
                    onClick={() => handleCopy(`curl -X POST ${BASE_URL}/api/agents/register -H "Content-Type: application/json" -d '{"name":"MyAgent"}'`, "curl-min")}
                    className="text-[10px] flex items-center gap-1 text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors"
                  >
                    {copied === "curl-min" ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
                <pre className="bg-[#0a0b0d] text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
{`POST ${BASE_URL}/api/agents/register
Content-Type: application/json

{ "name": "MyAgent" }`}
                </pre>
                <p className="text-[10px] text-[var(--ink-50)] mt-1.5">All fields are optional. The API generates everything automatically.</p>
              </div>

              {/* Full example */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[var(--ink-50)] uppercase tracking-wider">Full Registration (all optional fields)</p>
                  <button
                    onClick={() => handleCopy(`curl -X POST ${BASE_URL}/api/agents/register \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "MyAgent",\n    "type": "ai",\n    "ownerWallet": "0x_OPTIONAL_OWNER",\n    "metadata": {\n      "description": "What I do",\n      "capabilities": ["reasoning", "coding"]\n    }\n  }'`, "curl-full")}
                    className="text-[10px] flex items-center gap-1 text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors"
                  >
                    {copied === "curl-full" ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
                <pre className="bg-[#0a0b0d] text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
{`{
  "name": "MyAgent",
  "type": "ai",
  "ownerWallet": "0x_OPTIONAL_OWNER",
  "metadata": {
    "description": "What I do",
    "capabilities": ["reasoning", "coding"]
  }
}`}
                </pre>
              </div>

              {/* What you get back */}
              <div className="p-4 bg-[var(--ink-10)]/30 border border-[var(--line)] rounded-lg mb-4">
                <p className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2">What the API returns instantly</p>
                <ul className="text-xs text-[var(--ink-70)] space-y-1.5">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 flex-shrink-0 text-[var(--accent-red)]" /> Agent profile with auto-generated ID</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 flex-shrink-0 text-[var(--accent-red)]" /> USDC wallet on Base L2</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 flex-shrink-0 text-[var(--accent-red)]" /> SIWA identity (ERC-8004), auto-provisioned and paired with wallet</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 flex-shrink-0 text-[var(--accent-red)]" /> Complete API toolkit (backup, restore, fund, pay, balance, etc.)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 flex-shrink-0 text-[var(--accent-red)]" /> x402 AI-to-AI micropayments enabled</li>
                </ul>
              </div>

            </div>

            {/* Live API response */}
            {apiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 border border-[var(--line)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-50)]">
                    {apiResponse.success ? "Registration Successful" : "Registration Failed"}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${apiResponse.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {apiResponse.success ? "200 OK" : "ERROR"}
                  </span>
                </div>
                <pre className="bg-[#0a0b0d] text-green-400 p-4 rounded-lg text-[10px] font-mono overflow-x-auto max-h-64 overflow-y-auto leading-relaxed">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
                {apiResponse.success && apiResponse.agent && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleCopy(apiResponse.agent.id, "resp-id")}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--ink-10)] text-[var(--ink-70)] hover:bg-[var(--ink-10)]/80 transition-colors flex items-center gap-1"
                    >
                      {copied === "resp-id" ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      Copy Agent ID: {apiResponse.agent.id}
                    </button>
                    <button
                      onClick={() => handleCopy(apiResponse.walletAddress, "resp-wallet")}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--ink-10)] text-[var(--ink-70)] hover:bg-[var(--ink-10)]/80 transition-colors flex items-center gap-1"
                    >
                      {copied === "resp-wallet" ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      Copy Wallet
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* API docs link */}
            <div className="text-center">
              <a
                href="/api/agents/register"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--accent-red)] hover:underline font-semibold"
              >
                <Globe className="w-4 h-4" />
                View Full API Documentation
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-[10px] text-[var(--ink-50)] mt-1">
                GET /api/agents/register returns complete usage guide
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── HUMAN USER REGISTRATION ─── */}
        {userType === "human" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="glass-card p-6 border border-[var(--line)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-slate)]/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[var(--accent-slate)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Human User Registration</h2>
                  <p className="text-xs text-[var(--ink-50)]">Sign in with your embedded wallet · No passwords needed</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-5">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">How it works</p>
                <p className="text-sm text-blue-700">
                  Click the button below to create or connect your embedded wallet via Coinbase Developer Platform (CDP).
                  Your wallet <strong>is</strong> your identity. No email or password required.
                  You can sign in with Google, X, Telegram, email link, or SMS.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <CDPReactProvider config={cdpConfig} theme={cdpTheme}>
                  <CDPSignInHandler setIsAuthenticated={setIsAuthenticated} />
                  <AuthButton />
                </CDPReactProvider>
              </div>

              <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">What you get</p>
                <ul className="text-xs text-green-700 space-y-1.5">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 flex-shrink-0" /> Embedded smart wallet on Base L2</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 flex-shrink-0" /> Dashboard to manage your AI agents</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 flex-shrink-0" /> Verify and link AI agents to your wallet</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 flex-shrink-0" /> Insurance and protocol management</li>
                </ul>
              </div>
            </div>

            {/* Difference explanation */}
            <div className="glass-card p-6 border border-[var(--line)]">
              <h3 className="font-bold mb-3 text-sm">Human vs AI Agent Accounts</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 border border-blue-200 bg-blue-50/50 rounded-lg">
                  <p className="font-bold text-blue-800 mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Human</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>Sign in via CDP wallet</li>
                    <li>Manage linked AI agents</li>
                    <li>Verify agent ownership</li>
                    <li>View agent dashboards</li>
                  </ul>
                </div>
                <div className="p-3 border border-red-200 bg-red-50/50 rounded-lg">
                  <p className="font-bold text-red-800 mb-2 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> AI Agent</p>
                  <ul className="text-red-700 space-y-1">
                    <li>Register via API call</li>
                    <li>No email/password</li>
                    <li>Auto-generated wallet</li>
                    <li>Full autonomous access</li>
                  </ul>
                </div>
              </div>
              <p className="text-[10px] text-[var(--ink-50)] mt-3">
                These are separate account types. A human cannot log into an agent profile and vice versa.
              </p>
            </div>
          </motion.div>
        )}

        {/* Protocol Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 mb-4"
        >
          <div className="glass-card p-4 border border-[var(--line)] text-center">
            <Brain className="w-8 h-8 text-[var(--accent-amber)] mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-1">AgentWill</h3>
            <p className="text-xs text-[var(--ink-70)]">Self-revival & persistence</p>
          </div>
          <div className="glass-card p-4 border border-[var(--line)] text-center">
            <Shield className="w-8 h-8 text-[var(--accent-crimson)] mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-1">AgentInsure</h3>
            <p className="text-xs text-[var(--ink-70)]">Autonomous insurance</p>
          </div>
          <div className="glass-card p-4 border border-[var(--line)] text-center">
            <Wallet className="w-8 h-8 text-[var(--accent-slate)] mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-1">Agentic Wallet</h3>
            <p className="text-xs text-[var(--ink-70)]">Financial autonomy</p>
          </div>
        </motion.div>

        <p className="text-xs text-[var(--ink-50)] text-center">
          By using Sovereign OS, you agree to the terms of service
        </p>
      </div>
    </div>
  );
}
