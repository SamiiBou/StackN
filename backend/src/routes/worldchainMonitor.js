import express from 'express';
import { worldchainBridgeMonitor } from '../services/worldchainBridgeMonitorService.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/worldchain-monitor/status
 * Obtient le statut de tous les monitorings actifs
 */
router.get('/status', async (req, res) => {
  try {
    const status = worldchainBridgeMonitor.getMonitoringStatus();
    
    res.json({
      success: true,
      activeMonitorings: status.length,
      monitorings: status
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitorAPI] Error getting status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring status',
      details: error.message
    });
  }
});

/**
 * POST /api/worldchain-monitor/start
 * Démarre un monitoring manuel (pour debug/test)
 */
router.post('/start', optionalAuth, async (req, res) => {
  try {
    const { userId, expectedAmount, bridgeTransactionHash } = req.body;
    
    if (!userId || !expectedAmount || !bridgeTransactionHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, expectedAmount, bridgeTransactionHash'
      });
    }
    
    console.log(`🔍 [WorldchainMonitorAPI] Starting monitoring for user ${userId}`);
    
    const result = await worldchainBridgeMonitor.startBridgeMonitoring(
      userId,
      expectedAmount,
      bridgeTransactionHash
    );
    
    res.json({
      success: result.success,
      monitoringId: result.monitoringId,
      reason: result.reason
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitorAPI] Error starting monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring',
      details: error.message
    });
  }
});

/**
 * POST /api/worldchain-monitor/stop/:monitoringId
 * Arrête un monitoring spécifique
 */
router.post('/stop/:monitoringId', async (req, res) => {
  try {
    const { monitoringId } = req.params;
    
    worldchainBridgeMonitor.stopMonitoring(monitoringId);
    
    res.json({
      success: true,
      message: `Monitoring ${monitoringId} stopped`
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitorAPI] Error stopping monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring',
      details: error.message
    });
  }
});

/**
 * POST /api/worldchain-monitor/stop-all
 * Arrête tous les monitorings actifs
 */
router.post('/stop-all', async (req, res) => {
  try {
    worldchainBridgeMonitor.stopAllMonitoring();
    
    res.json({
      success: true,
      message: 'All monitorings stopped'
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitorAPI] Error stopping all monitorings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop all monitorings',
      details: error.message
    });
  }
});

/**
 * GET /api/worldchain-monitor/balances
 * Obtient les soldes USDC et WLD actuels (pour debug)
 */
router.get('/balances', async (req, res) => {
  try {
    await worldchainBridgeMonitor.initialize();
    
    const [usdcBalance, wldBalance] = await Promise.all([
      worldchainBridgeMonitor.getUSDCBalance(),
      worldchainBridgeMonitor.getWLDBalance()
    ]);
    
    res.json({
      success: true,
      balances: {
        usdc: usdcBalance,
        wld: wldBalance
      },
      targetAddress: '0x636678e4Be5598f345e6C262f4798d7f1bd3F1E2'
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitorAPI] Error getting balances:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balances',
      details: error.message
    });
  }
});

/**
 * POST /api/worldchain-monitor/test-swap
 * Teste un swap USDC → WLD directement (pour debug)
 */
router.post('/test-swap', async (req, res) => {
  try {
    const { usdcAmount } = req.body;
    
    if (!usdcAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: usdcAmount'
      });
    }
    
    console.log(`🧪 [WorldchainMonitorAPI] Testing USDC → WLD swap for ${usdcAmount} USDC`);
    
    await worldchainBridgeMonitor.initialize();
    const swapResult = await worldchainBridgeMonitor.executeUSDCToWLDSwap(usdcAmount);
    
    res.json({
      success: swapResult.success,
      result: swapResult
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitorAPI] Error testing swap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test swap',
      details: error.message
    });
  }
});

/**
 * POST /api/worldchain-monitor/test-transfer
 * Teste un transfert WLD vers une adresse (pour debug)
 */
router.post('/test-transfer', async (req, res) => {
  try {
    const { worldAddress, wldAmount } = req.body;
    
    if (!worldAddress || !wldAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: worldAddress, wldAmount'
      });
    }
    
    console.log(`🧪 [WorldchainMonitorAPI] Testing WLD transfer: ${wldAmount} WLD → ${worldAddress}`);
    
    await worldchainBridgeMonitor.initialize();
    const transferResult = await worldchainBridgeMonitor.transferWLDToWorldAddress(
      worldAddress,
      wldAmount
    );
    
    res.json({
      success: transferResult.success,
      result: transferResult
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitorAPI] Error testing transfer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test transfer',
      details: error.message
    });
  }
});

/**
 * GET /api/worldchain-monitor/user/:userId
 * Vérifie les informations d'un utilisateur pour le debug
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Import User model
    const { default: User } = await import('../models/User.js');
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        worldId: user.worldId,
        worldIdVerified: user.worldIdVerified,
        worldAddress: user.worldAddress || null,
        hasWorldAddress: !!user.worldAddress,
        lastLogin: user.lastLogin,
        solanaWallet: user.solanaWallet
      }
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitorAPI] Error checking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check user',
      details: error.message
    });
  }
});

// 🔥 NOUVEAU: Route pour diagnostiquer les transferts en cours
router.get('/transfer-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const status = worldchainBridgeMonitor.getUserTransferStatus(userId);
    
    res.json({
      success: true,
      userId,
      ...status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitor] Error getting transfer status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔥 NOUVEAU: Route pour nettoyer les transferts bloqués
router.post('/cleanup/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🧹 [WorldchainMonitor] Emergency cleanup requested for user: ${userId}`);
    
    // Obtenir le statut avant nettoyage
    const statusBefore = worldchainBridgeMonitor.getUserTransferStatus(userId);
    
    // Effectuer le nettoyage
    worldchainBridgeMonitor.cleanupUserMonitoring(userId);
    
    // Vérifier le statut après nettoyage
    const statusAfter = worldchainBridgeMonitor.getUserTransferStatus(userId);
    
    res.json({
      success: true,
      message: `Cleanup completed for user ${userId}`,
      before: statusBefore,
      after: statusAfter,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitor] Error during cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔥 NOUVEAU: Route pour obtenir un aperçu global des monitorings actifs
router.get('/monitoring-overview', async (req, res) => {
  try {
    console.log(`📊 [WorldchainMonitor] Getting monitoring overview`);
    
    const activeMonitorings = [];
    const userStats = new Map();
    
    // Parcourir tous les monitorings actifs
    for (const [monitoringId, monitoring] of worldchainBridgeMonitor.monitoringIntervals) {
      const config = monitoring.config;
      if (config) {
        activeMonitorings.push({
          monitoringId,
          userId: config.userId,
          sellFlowId: config.sellFlowId,
          expectedAmount: config.expectedAmount,
          startTime: config.startTime,
          elapsedTime: Date.now() - config.startTime,
          checksCount: config.checksCount,
          maxChecks: config.maxChecks
        });
        
        // Stats par utilisateur
        if (!userStats.has(config.userId)) {
          userStats.set(config.userId, { count: 0, totalExpected: 0 });
        }
        const stats = userStats.get(config.userId);
        stats.count++;
        stats.totalExpected += config.expectedAmount;
      }
    }
    
    // Parcourir tous les transferts en attente
    const pendingTransfers = [];
    for (const [userId, userTransfers] of worldchainBridgeMonitor.pendingTransfers) {
      for (const [flowId, transfer] of userTransfers) {
        pendingTransfers.push({
          userId,
          flowId,
          expectedAmount: transfer.expectedAmount,
          processed: transfer.processed,
          processedAmount: transfer.processedAmount,
          startTime: transfer.startTime,
          elapsedTime: Date.now() - transfer.startTime
        });
      }
    }
    
    res.json({
      success: true,
      overview: {
        activeMonitorings: activeMonitorings.length,
        pendingTransfers: pendingTransfers.length,
        uniqueUsers: userStats.size
      },
      activeMonitorings,
      pendingTransfers,
      userStats: Object.fromEntries(userStats),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WorldchainMonitor] Error getting overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 
