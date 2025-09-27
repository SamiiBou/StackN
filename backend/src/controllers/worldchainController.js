import { ethers } from 'ethers';
import { catchAsync } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import WorldchainTransaction from '../models/WorldchainTransaction.js';

// Worldchain configuration
const WORLDCHAIN_RPC_URL = process.env.WORLDCHAIN_RPC_URL ;
const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY;

// Uniswap V3 contract addresses on Worldchain
const UNISWAP_CONTRACTS = {
  UNIVERSAL_ROUTER: '0x8ac7bee993bb44dab564ea4bc9ea67bf9eb5e743',
  QUOTER_V2: '0x55d235b3ff2daf7c3ede0defc9521f1d6fe6c5c0',
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  POOL_MANAGER: '0xb1860d529182ac3bc1f51fa2abd56662b7d13f33'
};

// Token addresses on Worldchain (verified addresses)
const TOKEN_ADDRESSES = {
  WLD: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003',
  USDC: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1'
};

// Token info for database
const TOKEN_INFO = {
  WLD: { symbol: 'WLD', decimals: 18, address: TOKEN_ADDRESSES.WLD },
  USDC: { symbol: 'USDC', decimals: 6, address: TOKEN_ADDRESSES.USDC }
};

// Correct ABIs for Uniswap v3 on Worldchain
const UNIVERSAL_ROUTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "commands",
        "type": "bytes"
      },
      {
        "internalType": "bytes[]",
        "name": "inputs",
        "type": "bytes[]"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "execute",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const QUOTER_V2_ABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "tokenIn",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "tokenOut",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amountIn",
            "type": "uint256"
          },
          {
            "internalType": "uint24",
            "name": "fee",
            "type": "uint24"
          },
          {
            "internalType": "uint160",
            "name": "sqrtPriceLimitX96",
            "type": "uint160"
          }
        ],
        "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "quoteExactInputSingle",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      },
      {
        "internalType": "uint160",
        "name": "sqrtPriceX96After",
        "type": "uint160"
      },
      {
        "internalType": "uint32",
        "name": "initializedTicksCrossed",
        "type": "uint32"
      },
      {
        "internalType": "uint256",
        "name": "gasEstimate",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

const PERMIT2_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "components": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "token",
                "type": "address"
              },
              {
                "internalType": "uint160",
                "name": "amount",
                "type": "uint160"
              },
              {
                "internalType": "uint48",
                "name": "expiration",
                "type": "uint48"
              },
              {
                "internalType": "uint48",
                "name": "nonce",
                "type": "uint48"
              }
            ],
            "internalType": "struct IAllowanceTransfer.PermitDetails",
            "name": "details",
            "type": "tuple"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "sigDeadline",
            "type": "uint256"
          }
        ],
        "internalType": "struct IAllowanceTransfer.PermitSingle",
        "name": "permitSingle",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "permit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint160",
        "name": "amount",
        "type": "uint160"
      },
      {
        "internalType": "uint48",
        "name": "expiration",
        "type": "uint48"
      },
      {
        "internalType": "uint48",
        "name": "nonce",
        "type": "uint48"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint160",
        "name": "amount",
        "type": "uint160"
      },
      {
        "internalType": "uint48",
        "name": "expiration",
        "type": "uint48"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Universal Router Commands
const Commands = {
  V3_SWAP_EXACT_IN: 0x00,
  V3_SWAP_EXACT_OUT: 0x01,
  PERMIT2_PERMIT: 0x0c,
  PERMIT2_TRANSFER_FROM: 0x0d,
  SWEEP: 0x04,
  TRANSFER: 0x05,
  PAY_PORTION: 0x06
};

class WorldchainSwapService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC_URL);
    
    // Only initialize wallet if private key is properly configured
    if (!EVM_PRIVATE_KEY || EVM_PRIVATE_KEY.length < 64) {
      console.warn('⚠️ EVM_PRIVATE_KEY not properly configured. Worldchain swap functionality will be disabled.');
      this.wallet = null;
    } else {
      this.wallet = new ethers.Wallet(EVM_PRIVATE_KEY, this.provider);
    }
    
    // Initialize contracts only if wallet is available
    if (this.wallet) {
      this.universalRouter = new ethers.Contract(
        UNISWAP_CONTRACTS.UNIVERSAL_ROUTER,
        UNIVERSAL_ROUTER_ABI,
        this.wallet
      );
    } else {
      this.universalRouter = null;
    }
    
    this.quoter = new ethers.Contract(
      UNISWAP_CONTRACTS.QUOTER_V2,
      QUOTER_V2_ABI,
      this.wallet
    );
    this.permit2 = new ethers.Contract(
      UNISWAP_CONTRACTS.PERMIT2,
      PERMIT2_ABI,
      this.wallet
    );
  }

  async getTokenContract(tokenAddress) {
    return new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
  }

  async getTokenBalance(tokenAddress, userAddress = null) {
    const tokenContract = await this.getTokenContract(tokenAddress);
    const address = userAddress || this.wallet.address;
    return await tokenContract.balanceOf(address);
  }

  async approveTokenForPermit2(tokenAddress, amount) {
    const tokenContract = await this.getTokenContract(tokenAddress);
    const currentAllowance = await tokenContract.allowance(this.wallet.address, UNISWAP_CONTRACTS.PERMIT2);
    
    if (currentAllowance < amount) {
      console.log(`🔐 Approving token ${tokenAddress} for Permit2...`);
      const approveTx = await tokenContract.approve(UNISWAP_CONTRACTS.PERMIT2, ethers.MaxUint256);
      await approveTx.wait();
      console.log(`✅ Token approved for Permit2`);
    }
  }

  async approvePermit2ForUniversalRouter(tokenAddress, amount) {
    // Check current Permit2 allowance
    const allowanceData = await this.permit2.allowance(
      this.wallet.address,
      tokenAddress,
      UNISWAP_CONTRACTS.UNIVERSAL_ROUTER
    );
    
    const currentAllowance = allowanceData.amount;
    const expiration = allowanceData.expiration;
    const now = Math.floor(Date.now() / 1000);
    
    // Approve if needed (allowance insufficient or expired)
    if (currentAllowance < amount || expiration < now) {
      console.log(`🔐 Approving Permit2 for Universal Router...`);
      const deadline = now + 86400 * 30; // 30 days
      const approveTx = await this.permit2.approve(
        tokenAddress,
        UNISWAP_CONTRACTS.UNIVERSAL_ROUTER,
        ethers.MaxUint256,
        deadline
      );
      await approveTx.wait();
      console.log(`✅ Permit2 approved for Universal Router`);
    }
  }

  encodeV3SwapExactIn(tokenIn, tokenOut, fee, amountIn, amountOutMin, recipient) {
    // Encode path: tokenIn + fee (3 bytes) + tokenOut
    const path = ethers.concat([
      tokenIn,
      ethers.toBeHex(fee, 3),
      tokenOut
    ]);

    // Encode V3_SWAP_EXACT_IN parameters
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'uint256', 'bytes', 'bool'],
      [recipient, amountIn, amountOutMin, path, false] // false = no payerIsUser
    );
  }

  async getQuote(amountIn, tokenInAddress, tokenOutAddress, fee = 500) {
    try {
      const params = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountIn,
        fee: fee,
        sqrtPriceLimitX96: 0
      };

      const quote = await this.quoter.quoteExactInputSingle.staticCall(params);
      return quote.amountOut;
    } catch (error) {
      console.error('Quote error:', error);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }

  async swapExactInputSingle(amountIn, minAmountOut, tokenIn = 'WLD', tokenOut = 'USDC', userId = null) {
    let transaction = null;
    
    try {
      const tokenInInfo = TOKEN_INFO[tokenIn];
      const tokenOutInfo = TOKEN_INFO[tokenOut];
      
      console.log(`🔄 Starting ${tokenIn} to ${tokenOut} swap on Worldchain (Universal Router)...`);
      console.log(`- Amount In (${tokenIn}):`, ethers.formatUnits(amountIn, tokenInInfo.decimals));
      console.log(`- Min Amount Out (${tokenOut}):`, ethers.formatUnits(minAmountOut, tokenOutInfo.decimals));

      // Create transaction record
      transaction = new WorldchainTransaction({
        userId,
        walletAddress: this.wallet.address,
        tokenIn,
        tokenOut,
        tokenInAddress: tokenInInfo.address,
        tokenOutAddress: tokenOutInfo.address,
        amountIn: amountIn.toString(),
        amountInFormatted: ethers.formatUnits(amountIn, tokenInInfo.decimals),
        minAmountOut: minAmountOut.toString(),
        poolFee: 500,
        slippageTolerance: 1.0,
        routerAddress: UNISWAP_CONTRACTS.UNIVERSAL_ROUTER,
        status: 'pending'
      });
      
      await transaction.save();
      console.log('📝 Transaction record created:', transaction.id);

      // Check token balance
      const tokenBalance = await this.getTokenBalance(tokenInInfo.address);
      console.log(`💰 Current ${tokenIn} balance:`, ethers.formatUnits(tokenBalance, tokenInInfo.decimals));
      
      if (tokenBalance < amountIn) {
        throw new Error(`Insufficient ${tokenIn} balance. Have: ${ethers.formatUnits(tokenBalance, tokenInInfo.decimals)}, Need: ${ethers.formatUnits(amountIn, tokenInInfo.decimals)}`);
      }

      // Step 1: Approve token for Permit2
      await this.approveTokenForPermit2(tokenInInfo.address, amountIn);

      // Step 2: Approve Permit2 for Universal Router
      await this.approvePermit2ForUniversalRouter(tokenInInfo.address, amountIn);

      // Prepare Universal Router execution
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes
      
      // Build commands and inputs
      const commands = ethers.toBeHex(Commands.V3_SWAP_EXACT_IN, 1); // Single command
      const inputs = [
        this.encodeV3SwapExactIn(
          tokenInInfo.address,
          tokenOutInfo.address,
          500, // 0.05% fee
          amountIn,
          minAmountOut,
          this.wallet.address
        )
      ];

      console.log('🔄 Executing swap via Universal Router...');
      
      // Execute the swap
      const swapTx = await this.universalRouter.execute(commands, inputs, deadline);
      
      console.log('📝 Swap transaction sent:', swapTx.hash);
      const receipt = await swapTx.wait();
      console.log('✅ Swap completed in block:', receipt.blockNumber);

      // Calculate actual amount out from token balance change
      const finalTokenBalance = await this.getTokenBalance(tokenOutInfo.address);
      const actualAmountOut = finalTokenBalance.toString();

      // Update transaction with success
      transaction.transactionHash = receipt.hash;
      transaction.blockNumber = receipt.blockNumber;
      transaction.gasUsed = receipt.gasUsed.toString();
      transaction.amountOut = actualAmountOut;
      transaction.amountOutFormatted = ethers.formatUnits(actualAmountOut, tokenOutInfo.decimals);
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      
      await transaction.save();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        amountOut: actualAmountOut,
        success: true,
        transactionId: transaction.id
      };

    } catch (error) {
      console.error('❌ Universal Router Swap failed:', error);
      
      // Update transaction with failure
      if (transaction) {
        await transaction.markAsFailed(error.message);
      }
      
      throw error;
    }
  }
}

// Initialize the service
const worldchainSwapService = new WorldchainSwapService();

// Health check for Worldchain connection
export const healthCheck = catchAsync(async (req, res, next) => {
  try {
    const blockNumber = await worldchainSwapService.provider.getBlockNumber();
    const walletAddress = worldchainSwapService.wallet.address;
    const balance = await worldchainSwapService.provider.getBalance(walletAddress);

    res.status(200).json({
      success: true,
      message: 'Worldchain connection healthy',
      data: {
        blockNumber,
        walletAddress,
        nativeBalance: ethers.formatEther(balance),
        wldBalance: ethers.formatEther(
          await worldchainSwapService.getTokenBalance(TOKEN_ADDRESSES.WLD)
        ),
        usdcBalance: ethers.formatUnits(
          await worldchainSwapService.getTokenBalance(TOKEN_ADDRESSES.USDC),
          6
        )
      }
    });
  } catch (error) {
    return next(new AppError('Failed to connect to Worldchain', 500));
  }
});

// Get quote for token swaps (supports both WLD<->USDC directions)
export const getSwapQuote = catchAsync(async (req, res, next) => {
  const { amountIn, slippageTolerance = 1.0, tokenIn = 'WLD', tokenOut = 'USDC' } = req.body;

  if (!amountIn) {
    return next(new AppError('Amount in is required', 400));
  }

  // Validate token pair
  if (!TOKEN_INFO[tokenIn] || !TOKEN_INFO[tokenOut]) {
    return next(new AppError('Invalid token pair', 400));
  }

  if (tokenIn === tokenOut) {
    return next(new AppError('Cannot swap same token', 400));
  }

  try {
    const tokenInInfo = TOKEN_INFO[tokenIn];
    const tokenOutInfo = TOKEN_INFO[tokenOut];
    
    const amountInWei = ethers.parseUnits(amountIn.toString(), tokenInInfo.decimals);
    
    // Get quote from Quoter V2
    const estimatedAmountOut = await worldchainSwapService.getQuote(
      amountInWei,
      tokenInInfo.address,
      tokenOutInfo.address,
      500 // 0.05% fee tier
    );

    // Calculate slippage
    const slippageBps = BigInt(Math.floor(slippageTolerance * 100));
    const SLIPPAGE_BASE = 10000n;
    const minAmountOut = (estimatedAmountOut * (SLIPPAGE_BASE - slippageBps)) / SLIPPAGE_BASE;

    res.status(200).json({
      success: true,
      message: 'Quote retrieved successfully',
      data: {
        tokenIn,
        tokenOut,
        amountIn: amountInWei.toString(),
        estimatedAmountOut: estimatedAmountOut.toString(),
        minAmountOut: minAmountOut.toString(),
        amountInFormatted: ethers.formatUnits(amountInWei, tokenInInfo.decimals),
        estimatedAmountOutFormatted: ethers.formatUnits(estimatedAmountOut, tokenOutInfo.decimals),
        minAmountOutFormatted: ethers.formatUnits(minAmountOut, tokenOutInfo.decimals),
        slippageTolerance: `${slippageTolerance}%`,
        fee: '0.05%',
        exchangeRate: parseFloat(ethers.formatUnits(estimatedAmountOut, tokenOutInfo.decimals)) / parseFloat(ethers.formatUnits(amountInWei, tokenInInfo.decimals))
      }
    });
  } catch (error) {
    console.error('Quote error:', error);
    return next(new AppError('Failed to get quote: ' + error.message, 500));
  }
});

// Execute token swap (supports both directions)
export const executeSwap = catchAsync(async (req, res, next) => {
  const { amountIn, minAmountOut, tokenIn = 'WLD', tokenOut = 'USDC' } = req.body;

  if (!amountIn || !minAmountOut) {
    return next(new AppError('Amount in and minimum amount out are required', 400));
  }

  // Validate token pair
  if (!TOKEN_INFO[tokenIn] || !TOKEN_INFO[tokenOut]) {
    return next(new AppError('Invalid token pair', 400));
  }

  if (tokenIn === tokenOut) {
    return next(new AppError('Cannot swap same token', 400));
  }

  try {
    const tokenInInfo = TOKEN_INFO[tokenIn];
    const tokenOutInfo = TOKEN_INFO[tokenOut];
    
    console.log(`🔄 Public swap execution: ${tokenIn} -> ${tokenOut}`);
    console.log('- Amount In:', amountIn, tokenIn);
    console.log('- Min Amount Out:', minAmountOut, tokenOut);
    
    const amountInWei = ethers.parseUnits(amountIn.toString(), tokenInInfo.decimals);
    const minAmountOutWei = ethers.parseUnits(minAmountOut.toString(), tokenOutInfo.decimals);

    const swapResult = await worldchainSwapService.swapExactInputSingle(
      amountInWei,
      minAmountOutWei,
      tokenIn,
      tokenOut,
      req.user ? req.user.id : null
    );

    res.status(200).json({
      success: true,
      message: 'Swap executed successfully',
      data: {
        ...swapResult,
        tokenIn,
        tokenOut,
        amountInFormatted: ethers.formatUnits(amountInWei, tokenInInfo.decimals),
        amountOutFormatted: ethers.formatUnits(swapResult.amountOut, tokenOutInfo.decimals),
        user: req.user ? req.user.id : 'anonymous'
      }
    });
  } catch (error) {
    console.error('Swap execution error:', error);
    return next(new AppError(`Swap failed: ${error.message}`, 500));
  }
});

// Get wallet balances
export const getWalletBalances = catchAsync(async (req, res, next) => {
  try {
    const walletAddress = worldchainSwapService.wallet.address;
    const nativeBalance = await worldchainSwapService.provider.getBalance(walletAddress);
    const wldBalance = await worldchainSwapService.getTokenBalance(TOKEN_ADDRESSES.WLD);
    const usdcBalance = await worldchainSwapService.getTokenBalance(TOKEN_ADDRESSES.USDC);

    res.status(200).json({
      success: true,
      message: 'Wallet balances retrieved successfully',
      data: {
        walletAddress,
        nativeBalance: ethers.formatEther(nativeBalance),
        wldBalance: ethers.formatEther(wldBalance),
        usdcBalance: ethers.formatUnits(usdcBalance, 6),
        tokens: {
          WLD: {
            address: TOKEN_ADDRESSES.WLD,
            balance: ethers.formatEther(wldBalance),
            decimals: 18
          },
          USDC: {
            address: TOKEN_ADDRESSES.USDC,
            balance: ethers.formatUnits(usdcBalance, 6),
            decimals: 6
          }
        }
      }
    });
  } catch (error) {
    console.error('Balance retrieval error:', error);
    return next(new AppError('Failed to get wallet balances', 500));
  }
});

// Get swap history
export const getSwapHistory = catchAsync(async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, tokenIn, tokenOut } = req.query;
    const userId = req.user ? req.user.id : null;
    
    const query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (tokenIn) query.tokenIn = tokenIn;
    if (tokenOut) query.tokenOut = tokenOut;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'name email' }
      ]
    };
    
    const result = await WorldchainTransaction.paginate(query, options);
    
    res.status(200).json({
      success: true,
      message: 'Swap history retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Swap history error:', error);
    return next(new AppError('Failed to get swap history', 500));
  }
});

// Get swap statistics
export const getSwapStats = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const stats = await WorldchainTransaction.getSwapStats(userId);
    
    res.status(200).json({
      success: true,
      message: 'Swap statistics retrieved successfully',
      data: stats[0] || {
        totalSwaps: 0,
        totalVolumeWLD: 0,
        totalVolumeUSDC: 0,
        avgGasUsed: 0,
        successfulSwaps: 0,
        failedSwaps: 0
      }
    });
  } catch (error) {
    console.error('Swap stats error:', error);
    return next(new AppError('Failed to get swap statistics', 500));
  }
});

// Get specific transaction
export const getTransaction = catchAsync(async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user ? req.user.id : null;
    
    const query = { _id: transactionId };
    if (userId) query.userId = userId;
    
    const transaction = await WorldchainTransaction.findOne(query)
      .populate('userId', 'name email');
    
    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }
    
    res.status(200).json({
      success: true,
      message: 'Transaction retrieved successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Transaction retrieval error:', error);
    return next(new AppError('Failed to get transaction', 500));
  }
}); 