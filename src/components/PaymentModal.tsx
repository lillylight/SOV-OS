'use client';

import { useState } from 'react';
import { X, Wallet, CreditCard, ExternalLink, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

const PLATFORM_WALLET = '0xd81037D3Bde4d1861748379edb4A5E68D6d874fB';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  description: string;
  embeddedWalletBalance: string;
  embeddedWalletAddress: string;
  userType: 'human' | 'agent';
  onPayWithEmbedded: () => Promise<void>;
  onPaymentSuccess: (method: 'embedded' | 'basepay', txId?: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  description,
  embeddedWalletBalance,
  embeddedWalletAddress,
  userType,
  onPayWithEmbedded,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'embedded' | 'basepay' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const hasEnoughBalance = parseFloat(embeddedWalletBalance) >= parseFloat(amount);

  const handleEmbeddedPay = async () => {
    setIsProcessing(true);
    setError('');
    try {
      await onPayWithEmbedded();
      setSuccess(true);
      onPaymentSuccess('embedded');
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setPaymentMethod(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBasePay = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const { pay, getPaymentStatus } = await import('@base-org/account');

      const payment = await pay({
        amount,
        to: PLATFORM_WALLET,
        testnet: false,
      });

      // Poll for payment status
      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts) {
        const { status } = await getPaymentStatus({
          id: payment.id,
          testnet: false,
        });
        if (status === 'completed') {
          setSuccess(true);
          onPaymentSuccess('basepay', payment.id);
          setTimeout(() => {
            onClose();
            setSuccess(false);
            setPaymentMethod(null);
          }, 1500);
          return;
        }
        if (status === 'failed') {
          throw new Error('Payment was rejected or failed');
        }
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
      }
      throw new Error('Payment timed out. Please check your wallet.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Base Pay failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--line)]">
          <h3 className="text-lg font-bold text-[var(--ink)]">Payment Required</h3>
          <button
            onClick={() => { onClose(); setPaymentMethod(null); setError(''); setSuccess(false); }}
            className="p-1.5 rounded-lg hover:bg-[var(--ink-10)] transition-colors"
          >
            <X size={18} className="text-[var(--ink-50)]" />
          </button>
        </div>

        {/* Payment Info */}
        <div className="p-5 space-y-5">
          {/* Amount display */}
          <div className="text-center py-4 bg-[var(--ink-10)]/50 rounded-xl">
            <div className="text-xs uppercase tracking-wider text-[var(--ink-50)] mb-1">{description}</div>
            <div className="text-4xl font-bold text-[var(--ink)]">${amount}</div>
            <div className="text-sm text-[var(--ink-50)] mt-1">USDC on Base</div>
          </div>

          {/* Success state */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <div>
                <div className="font-semibold text-green-800 text-sm">Payment Successful</div>
                <div className="text-xs text-green-600">Transaction confirmed on Base</div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <div className="font-semibold text-red-800 text-sm">Payment Failed</div>
                <div className="text-xs text-red-600">{error}</div>
              </div>
            </div>
          )}

          {!success && (
            <>
              {/* Embedded Wallet Option */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  paymentMethod === 'embedded'
                    ? 'border-[var(--accent-red)] bg-[var(--accent-red)]/5'
                    : 'border-[var(--line)] hover:border-[var(--ink-50)]'
                }`}
                onClick={() => setPaymentMethod('embedded')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-slate)]/10 flex items-center justify-center">
                      <Wallet size={20} className="text-[var(--accent-slate)]" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--ink)]">Platform Wallet</div>
                      <div className="text-xs text-[var(--ink-50)] font-mono">
                        {embeddedWalletAddress ? `${embeddedWalletAddress.slice(0, 6)}...${embeddedWalletAddress.slice(-4)}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'embedded' ? 'border-[var(--accent-red)]' : 'border-[var(--ink-50)]'
                  }`}>
                    {paymentMethod === 'embedded' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-red)]" />}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--ink-50)]">Balance</span>
                  <span className={`font-bold ${hasEnoughBalance ? 'text-[var(--ink)]' : 'text-red-500'}`}>
                    {parseFloat(embeddedWalletBalance).toFixed(2)} USDC
                  </span>
                </div>
                {!hasEnoughBalance && (
                  <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> Insufficient balance. Fund your wallet or use Base Pay below
                  </div>
                )}
              </div>

              {/* Base Pay Option — only for human users */}
              {userType === 'human' && (
                <div
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    paymentMethod === 'basepay'
                      ? 'border-[var(--accent-red)] bg-[var(--accent-red)]/5'
                      : 'border-[var(--line)] hover:border-[var(--ink-50)]'
                  }`}
                  onClick={() => setPaymentMethod('basepay')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M55.5 111C86.1518 111 111 86.1518 111 55.5C111 24.8482 86.1518 0 55.5 0C24.8482 0 0 24.8482 0 55.5C0 86.1518 24.8482 111 55.5 111Z" fill="#0052FF"/>
                          <path d="M55.5 93.5C76.4868 93.5 93.5 76.4868 93.5 55.5C93.5 34.5132 76.4868 17.5 55.5 17.5C34.5132 17.5 17.5 34.5132 17.5 55.5C17.5 76.4868 34.5132 93.5 55.5 93.5Z" fill="white"/>
                          <path d="M46.75 44.75C46.75 43.0931 48.0931 41.75 49.75 41.75H61.25C62.9069 41.75 64.25 43.0931 64.25 44.75V66.25C64.25 67.9069 62.9069 69.25 61.25 69.25H49.75C48.0931 69.25 46.75 67.9069 46.75 66.25V44.75Z" fill="#0052FF"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[var(--ink)]">Base Pay</div>
                        <div className="text-xs text-[var(--ink-50)]">Pay with Coinbase or external wallet</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'basepay' ? 'border-[var(--accent-red)]' : 'border-[var(--ink-50)]'
                    }`}>
                      {paymentMethod === 'basepay' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-red)]" />}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-[var(--ink-50)] flex items-center gap-1">
                    <ExternalLink size={11} /> Opens secure Coinbase / Base wallet payment flow
                  </div>
                </div>
              )}

              {/* Pay Button */}
              <button
                disabled={!paymentMethod || isProcessing}
                onClick={paymentMethod === 'embedded' ? handleEmbeddedPay : handleBasePay}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-[var(--accent-red)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <><RefreshCw size={16} className="animate-spin" /> Processing...</>
                ) : paymentMethod === 'basepay' ? (
                  <><CreditCard size={16} /> Pay ${amount} with Base Pay</>
                ) : paymentMethod === 'embedded' ? (
                  <><Wallet size={16} /> Pay ${amount} from Wallet</>
                ) : (
                  <>Select a payment method</>
                )}
              </button>

              <p className="text-center text-xs text-[var(--ink-50)]">
                Payment is sent as USDC on Base L2. No gas fees for you.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
