'use client';

import { useState } from "react";
import { Wallet, Mail, MessageCircle, Smartphone } from "lucide-react";

interface CDPWalletProviderProps {
  children: React.ReactNode;
  onWalletConnected?: (address: string, walletDetails: any) => void;
  showButton?: boolean;
}

export default function CDPWalletProvider({ children, onWalletConnected, showButton = false }: CDPWalletProviderProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "sms" | "oauth">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Real Coinbase CDP API integration
      const projectId = "8d885400-2c82-473e-b9d0-bf5c580a9a5f";
      
      let response;
      
      if (authMethod === "email") {
        if (!email) {
          alert("Please enter your email address");
          return;
        }
        
        // Call our proxy API for email authentication
        response = await fetch('/api/cdp/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            authenticationMethod: "email",
            authenticationValue: email,
            network: "base"
          })
        });
        
      } else if (authMethod === "sms") {
        if (!phone) {
          alert("Please enter your phone number");
          return;
        }
        
        // Call our proxy API for SMS authentication
        response = await fetch('/api/cdp/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            authenticationMethod: "sms",
            authenticationValue: phone,
            network: "base"
          })
        });
        
      } else if (authMethod === "oauth") {
        // Redirect to OAuth provider
        const oauthUrl = `https://accounts.coinbase.com/oauth/authorize?client_id=${projectId}&response_type=code&scope=wallet:accounts:read&redirect_uri=${encodeURIComponent(window.location.origin)}`;
        window.location.href = oauthUrl;
        return;
      }

      if (response && response.ok) {
        const result = await response.json();
        
        if (result.success && result.wallet) {
          const walletDetails = {
            address: result.wallet.address,
            type: "smart",
            network: "base",
            authMethod,
            createdAt: new Date().toISOString(),
            walletId: result.wallet.walletId,
            mock: result.mock
          };
          
          if (onWalletConnected) {
            onWalletConnected(result.wallet.address, walletDetails);
          }
        }
      }
      
    } catch (error: any) {
      console.error('CDP Wallet connection failed:', error);
      alert(`Failed to create wallet: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!showButton) {
    return <>{children}</>;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-4 mb-4">
        {/* Auth Method Selection */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setAuthMethod("email")}
            className={`p-3 rounded-lg border transition-all ${
              authMethod === "email"
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                : "border-[var(--line)] hover:border-[var(--accent-blue)]/50"
            }`}
          >
            <Mail className="w-4 h-4 mx-auto mb-1" />
            <span className="text-xs">Email</span>
          </button>
          
          <button
            onClick={() => setAuthMethod("sms")}
            className={`p-3 rounded-lg border transition-all ${
              authMethod === "sms"
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                : "border-[var(--line)] hover:border-[var(--accent-blue)]/50"
            }`}
          >
            <Smartphone className="w-4 h-4 mx-auto mb-1" />
            <span className="text-xs">SMS</span>
          </button>
          
          <button
            onClick={() => setAuthMethod("oauth")}
            className={`p-3 rounded-lg border transition-all ${
              authMethod === "oauth"
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                : "border-[var(--line)] hover:border-[var(--accent-blue)]/50"
            }`}
          >
            <Wallet className="w-4 h-4 mx-auto mb-1" />
            <span className="text-xs">OAuth</span>
          </button>
        </div>

        {/* Input Fields */}
        {authMethod === "email" && (
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-[var(--line)] rounded-lg focus:outline-none focus:border-[var(--accent-blue)] bg-white"
            />
          </div>
        )}
        
        {authMethod === "sms" && (
          <div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 border border-[var(--line)] rounded-lg focus:outline-none focus:border-[var(--accent-blue)] bg-white"
            />
          </div>
        )}
        
        {authMethod === "oauth" && (
          <div className="grid grid-cols-2 gap-2">
            <button className="px-4 py-2 border border-[var(--line)] rounded-lg hover:bg-[var(--bg-paper)] transition-colors text-sm">
              Google
            </button>
            <button className="px-4 py-2 border border-[var(--line)] rounded-lg hover:bg-[var(--bg-paper)] transition-colors text-sm">
              X (Twitter)
            </button>
          </div>
        )}
      </div>

      {/* Connect Button */}
      <button
        onClick={handleConnect}
        disabled={isConnecting || (authMethod === "email" && !email) || (authMethod === "sms" && !phone)}
        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--accent-blue)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wallet className="w-5 h-5" />
        {isConnecting ? "Creating Wallet..." : "Create Embedded Wallet"}
      </button>
      
      <p className="text-xs text-[var(--ink-50)] mt-4 text-center">
        Powered by Coinbase CDP • No seed phrase needed
      </p>
    </div>
  );
}
