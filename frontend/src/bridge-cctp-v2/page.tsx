"use client";

import { useEffect, useState } from "react";
import { useCrossChainTransfer } from "@/hooks/use-cctp-cross-chain-transfer";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  SupportedChainId,
  SUPPORTED_CHAINS,
  CHAIN_TO_CHAIN_NAME,
} from "@/lib/cctp-chains";
import { ProgressSteps } from "@/components/progress-step";
import { TransferLog } from "@/components/transfer-log";
import { Timer } from "@/components/timer";
import { TransferTypeSelector } from "@/components/transfer-type";
import { TransactionFees } from "@/components/transaction-fees";

export default function CCTPBridgePage() {
  const { currentStep, logs, error, executeTransfer, getBalance, getNativeBalance, reset, feeSummary } =
    useCrossChainTransfer();
  const [sourceChain, setSourceChain] = useState<SupportedChainId>(
    SupportedChainId.WORLDCHAIN_MAINNET,
  );
  const [destinationChain, setDestinationChain] = useState<SupportedChainId>(
    SupportedChainId.SOLANA_MAINNET,
  );
  const [amount, setAmount] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showFinalTime, setShowFinalTime] = useState(false);
  const [transferType, setTransferType] = useState<"fast" | "standard">("fast");
  const [balance, setBalance] = useState("0");
  const [sourceNativeBalance, setSourceNativeBalance] = useState("0");
  const [destinationNativeBalance, setDestinationNativeBalance] = useState("0");

  const handleStartTransfer = async () => {
    setIsTransferring(true);
    setShowFinalTime(false);
    setElapsedSeconds(0);
    try {
      await executeTransfer(
        sourceChain,
        destinationChain,
        amount,
        transferType,
      );
    } catch (error) {
      console.error("Transfer failed:", error);
    } finally {
      setIsTransferring(false);
      setShowFinalTime(true);
    }
  };

  const handleReset = () => {
    reset();
    setIsTransferring(false);
    setShowFinalTime(false);
    setElapsedSeconds(0);
  };

  useEffect(() => {
    const wrapper = async () => {
      try {
        const balance = await getBalance(sourceChain);
        setBalance(balance);
      } catch (error) {
        console.error("Failed to get balance:", error);
        setBalance("0");
      }
    };
    wrapper();
  }, [sourceChain]);

  // Get native balances for both chains
  useEffect(() => {
    const getNativeBalances = async () => {
      try {
        const [sourceNative, destNative] = await Promise.all([
          getNativeBalance(sourceChain),
          getNativeBalance(destinationChain)
        ]);
        setSourceNativeBalance(sourceNative);
        setDestinationNativeBalance(destNative);
      } catch (error) {
        console.error("Failed to get native balances:", error);
        setSourceNativeBalance("0");
        setDestinationNativeBalance("0");
      }
    };
    getNativeBalances();
  }, [sourceChain, destinationChain]);

  return (
    <div className="min-h-screen bg-black text-white p-8 pb-20">
      <Card className="max-w-3xl mx-auto bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Bridge Worldchain → Solana
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Transfer Type</Label>
            <TransferTypeSelector
              value={transferType}
              onChange={setTransferType}
            />
            <p className="text-sm text-muted-foreground">
              {transferType === "fast"
                ? "Faster transfers with lower finality threshold (1000 blocks)"
                : "Standard transfers with higher finality (2000 blocks)"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Chain</Label>
              <div className="bg-gray-800 rounded-md p-3 border border-gray-600">
                <div className="flex items-center justify-center text-white font-medium">
                  🌍 Worldchain
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Native: {sourceNativeBalance} ETH
              </p>
            </div>
            <div className="space-y-2">
              <Label>Destination Chain</Label>
              <div className="bg-gray-800 rounded-md p-3 border border-gray-600">
                <div className="flex items-center justify-center text-white font-medium">
                  ⚡ Solana
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Native: {destinationNativeBalance} SOL
              </p>
              {parseFloat(destinationNativeBalance) < 0.01 && (
                <p className="text-sm text-red-500 font-medium">
                  ⚠️ Insufficient SOL for transaction fees (min: 0.01 SOL required)
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amount (USDC)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              max={parseFloat(balance)}
              step="any"
            />
            <p className="text-sm text-muted-foreground">{balance} available</p>
          </div>

          <div className="text-center">
            {showFinalTime ? (
              <div className="text-2xl font-mono">
                <span>
                  {Math.floor(elapsedSeconds / 60)
                    .toString()
                    .padStart(2, "0")}
                </span>
                :
                <span>{(elapsedSeconds % 60).toString().padStart(2, "0")}</span>
              </div>
            ) : (
              <Timer
                isRunning={isTransferring}
                initialSeconds={elapsedSeconds}
                onTick={setElapsedSeconds}
              />
            )}
          </div>

          <ProgressSteps currentStep={currentStep} />

          <TransferLog logs={logs} />
          {error && <div className="text-red-500 text-center">{error}</div>}
          
          <TransactionFees 
            feeSummary={feeSummary} 
            isVisible={currentStep === "completed" || !!feeSummary} 
          />
          
          {/* Help section for insufficient balance */}
          {parseFloat(destinationNativeBalance) < 0.01 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Insufficient funds for transaction fees
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You need at least 0.01 {destinationChain === SupportedChainId.SOLANA_DEVNET || destinationChain === SupportedChainId.SOLANA_MAINNET ? "SOL" : "ETH"} on {CHAIN_TO_CHAIN_NAME[destinationChain]} to complete the transfer.
                    </p>
                    <div className="mt-2">
                      <p className="font-medium">To resolve this:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {destinationChain === SupportedChainId.SOLANA_DEVNET || destinationChain === SupportedChainId.SOLANA_MAINNET ? (
                          <>
                            <li>Add SOL to your Solana wallet</li>
                            <li>For devnet: Use the Solana faucet to get free SOL</li>
                            <li>For mainnet: Purchase SOL from an exchange</li>
                          </>
                        ) : (
                          <>
                            <li>Add ETH to your wallet on {CHAIN_TO_CHAIN_NAME[destinationChain]}</li>
                            <li>Use a bridge or testnet faucet if on a testnet</li>
                            <li>For mainnet: Purchase ETH from an exchange</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleStartTransfer}
              disabled={
                isTransferring || 
                currentStep === "completed" || 
                parseFloat(destinationNativeBalance) < 0.01 ||
                !amount ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > parseFloat(balance)
              }
            >
              {currentStep === "completed"
                ? "Transfer Complete"
                : "Start Transfer"}
            </Button>
            {(currentStep === "completed" || currentStep === "error") && (
              <Button onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 