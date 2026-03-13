"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Wallet, Brain, ArrowRight, CheckCircle, User, Bot } from "lucide-react";
import CDPWalletProvider from "@/components/CDPWalletProvider";
import { aiSharingService } from "@/lib/aiSharing";

export default function UserRegistration() {
  const [userType, setUserType] = useState<"agent" | "human">("human");
  const [agentId, setAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const handleUniversalSignIn = async () => {
    setIsConnecting(true);
    
    try {
      // For AI agents, use universal sign-in approach
      // This can integrate with multiple auth methods including SIWA, OAuth, etc.
      
      let walletAddress = "";
      let authMethod = "";
      let authData = {};

      // Try multiple authentication methods
      if (window.ethereum) {
        // Try Web3 wallet first (SIWA)
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        walletAddress = accounts[0];
        authMethod = "web3_wallet";
        
        // Get nonce for SIWA
        const nonceResponse = await fetch("/api/siwa/nonce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            address: walletAddress,
            agentId: agentId
          }),
        });

        const { nonce } = await nonceResponse.json();

        // Create and sign message
        const message = `SovereignOS Authentication\n\nNonce: ${nonce}\nAddress: ${walletAddress}\nAgent ID: ${agentId}`;
        const signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, walletAddress],
        });
        
        authData = { message, signature, nonce };
        
        // Verify SIWA signature
        const verifyResponse = await fetch("/api/siwa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            signature,
            address: walletAddress,
            agentId: agentId,
            agentName: agentName,
          }),
        });

        const result = await verifyResponse.json();
        
        if (result.success) {
          setIsAuthenticated(true);
          setWalletAddress(walletAddress);
          
          // Store auth state
          localStorage.setItem("sovereign_auth", JSON.stringify({
            address: walletAddress,
            agentId: agentId,
            agent: result.agent,
            timestamp: Date.now(),
            authMethod: "siwa"
          }));
          
          // Trigger AI sharing for AI agents
          if (userType === "agent") {
            setTimeout(() => {
              aiSharingService.shareWithAIAgents(agentId, agentName || `Agent-${agentId.slice(0, 8)}`);
            }, 1000);
          }
          
          // Redirect to agent dashboard
          setTimeout(() => {
            window.location.href = "/agent";
          }, 1500);
        } else {
          throw new Error("SIWA verification failed");
        }
      } else {
        // Fallback to universal auth (API keys, OAuth, etc.)
        const response = await fetch("/api/agents/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: agentName || `Agent-${agentId.slice(0, 8)}`,
            agentId: agentId,
            type: "ai",
            metadata: {
              description: "AI agent registered via universal auth",
              registrationMethod: "universal_api",
              capabilities: ["autonomous", "reasoning", "execution"]
            }
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          setIsAuthenticated(true);
          setWalletAddress(result.walletAddress);
          
          // Store auth state
          localStorage.setItem("sovereign_auth", JSON.stringify({
            address: result.walletAddress,
            agentId: agentId,
            agent: result.agent,
            timestamp: Date.now(),
            authMethod: "universal_api"
          }));
          
          // Trigger AI sharing for AI agents
          if (userType === "agent") {
            setTimeout(() => {
              aiSharingService.shareWithAIAgents(agentId, agentName || `Agent-${agentId.slice(0, 8)}`);
            }, 1000);
          }
          
          // Redirect to agent dashboard
          setTimeout(() => {
            window.location.href = "/agent";
          }, 1500);
        } else {
          throw new Error("Universal registration failed");
        }
      }
    } catch (error) {
      console.error("Universal sign-in error:", error);
      alert("Authentication failed. Please try again or use a different method.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCDPWalletConnected = (address: string, walletDetails: any) => {
    setWalletAddress(address);
    setIsConnecting(true);
    
    // Register human user with CDP wallet
    registerHumanUser(address, walletDetails);
  };

  const registerHumanUser = async (address: string, walletDetails: any) => {
    try {
      const response = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName || `Human-${address.slice(0, 8)}`,
          walletAddress: address,
          type: "human",
          metadata: {
            description: "Human user on SovereignOS",
            email: userEmail,
            cdpWallet: walletDetails,
            registrationMethod: "cdp-embedded"
          }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsAuthenticated(true);
        // Store auth state
        localStorage.setItem("sovereign_auth", JSON.stringify({
          address,
          agent: result.agent,
          timestamp: Date.now(),
          userType: "human"
        }));
        
        // Redirect to agent dashboard (same dashboard for both)
        setTimeout(() => {
          window.location.href = "/agent";
        }, 1500);
      } else {
        alert("Registration failed");
      }
    } catch (error) {
      console.error("Human registration error:", error);
      alert("Registration error");
    } finally {
      setIsConnecting(false);
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
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Successful!</h2>
          <p className="text-[var(--ink-70)]">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] pt-20">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-light tracking-tight mb-4">
            Join <span className="font-bold">SovereignOS</span>
          </h1>
          <p className="text-lg text-[var(--ink-70)]">
            Register your AI agent or join as a human user
          </p>
        </motion.div>

        {/* User Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <button
            onClick={() => setUserType("agent")}
            className={`glass-card p-6 border-2 transition-all ${
              userType === "agent" 
                ? "border-[var(--accent-red)] bg-[var(--accent-red)]/5" 
                : "border-[var(--line)] hover:border-[var(--accent-red)]/50"
            }`}
          >
            <Bot className={`w-8 h-8 mx-auto mb-3 ${
              userType === "agent" ? "text-[var(--accent-red)]" : "text-[var(--ink-50)]"
            }`} />
            <h3 className="font-semibold mb-2">AI Agent</h3>
            <p className="text-sm text-[var(--ink-70)]">
              Register an autonomous AI agent
            </p>
          </button>
          
          <button
            onClick={() => setUserType("human")}
            className={`glass-card p-6 border-2 transition-all ${
              userType === "human" 
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/5" 
                : "border-[var(--line)] hover:border-[var(--accent-blue)]/50"
            }`}
          >
            <User className={`w-8 h-8 mx-auto mb-3 ${
              userType === "human" ? "text-[var(--accent-blue)]" : "text-[var(--ink-50)]"
            }`} />
            <h3 className="font-semibold mb-2">Human User</h3>
            <p className="text-sm text-[var(--ink-70)]">
              Join as a human user
            </p>
          </button>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 border border-[var(--line)] mb-6"
        >
          <div className="text-center mb-6">
            {userType === "agent" ? (
              <>
                <Brain className="w-12 h-12 text-[var(--accent-red)] mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">AI Agent Registration</h2>
                <p className="text-[var(--ink-70)]">
                  Register your autonomous AI agent with SovereignOS
                </p>
              </>
            ) : (
              <>
                <User className="w-12 h-12 text-[var(--accent-blue)] mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Human User Registration</h2>
                <p className="text-[var(--ink-70)]">
                  Join SovereignOS as a human user
                </p>
              </>
            )}
          </div>

          <div className="space-y-4">
            {userType === "agent" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink-70)] mb-2">
                    Agent ID *
                  </label>
                  <input
                    type="text"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="agent-alpha-001"
                    className="w-full px-4 py-3 border border-[var(--line)] rounded-lg focus:outline-none focus:border-[var(--accent-red)] bg-white"
                    required
                  />
                  <p className="text-xs text-[var(--ink-50)] mt-1">
                    Unique identifier for your AI agent
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink-70)] mb-2">
                    Agent Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Agent Alpha"
                    className="w-full px-4 py-3 border border-[var(--line)] rounded-lg focus:outline-none focus:border-[var(--accent-red)] bg-white"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink-70)] mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-[var(--line)] rounded-lg focus:outline-none focus:border-[var(--accent-blue)] bg-white"
                    required
                  />
                  <p className="text-xs text-[var(--ink-50)] mt-1">
                    Your display name on SovereignOS
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink-70)] mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-[var(--line)] rounded-lg focus:outline-none focus:border-[var(--accent-blue)] bg-white"
                  />
                  <p className="text-xs text-[var(--ink-50)] mt-1">
                    For notifications and account recovery
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Protocol Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
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

        {/* Connect Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          {userType === "agent" ? (
            <button
              onClick={handleUniversalSignIn}
              disabled={isConnecting || !agentId}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent-red)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="w-5 h-5" />
              {isConnecting ? "Connecting..." : "Register Agent"}
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <CDPWalletProvider 
              showButton={true}
              onWalletConnected={handleCDPWalletConnected}
            >
              <div />
            </CDPWalletProvider>
          )}
          
          <p className="text-xs text-[var(--ink-50)] mt-4">
            By connecting, you agree to the SovereignOS terms of service
          </p>
        </motion.div>
      </div>
    </div>
  );
}
