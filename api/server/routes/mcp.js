const { Router } = require('express');
const { logger } = require('@librechat/data-schemas');
const { MCPOAuthHandler } = require('@librechat/api');
const { CacheKeys, Constants } = require('librechat-data-provider');
const { findToken, updateToken, createToken, deleteTokens } = require('~/models');
const { setCachedTools, getCachedTools, loadCustomConfig } = require('~/server/services/Config');
const { getUserPluginAuthValue } = require('~/server/services/PluginService');
const { getMCPManager, getFlowStateManager } = require('~/config');
const { requireJwtAuth } = require('~/server/middleware');
const { getLogStores } = require('~/cache');

const router = Router();

/**
 * Initiate OAuth flow
 * This endpoint is called when the user clicks the auth link in the UI
 */
router.get('/:serverName/oauth/initiate', requireJwtAuth, async (req, res) => {
  try {
    const { serverName } = req.params;
    const { userId, flowId } = req.query;
    const user = req.user;

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return res.status(403).json({ error: 'User mismatch' });
    }

    logger.debug('[MCP OAuth] Initiate request', { serverName, userId, flowId });

    const flowsCache = getLogStores(CacheKeys.FLOWS);
    const flowManager = getFlowStateManager(flowsCache);

    /** Flow state to retrieve OAuth config */
    const flowState = await flowManager.getFlowState(flowId, 'mcp_oauth');
    if (!flowState) {
      logger.error('[MCP OAuth] Flow state not found', { flowId });
      return res.status(404).json({ error: 'Flow not found' });
    }

    const { serverUrl, oauth: oauthConfig } = flowState.metadata || {};
    if (!serverUrl || !oauthConfig) {
      logger.error('[MCP OAuth] Missing server URL or OAuth config in flow state');
      return res.status(400).json({ error: 'Invalid flow state' });
    }

    const { authorizationUrl, flowId: oauthFlowId } = await MCPOAuthHandler.initiateOAuthFlow(
      serverName,
      serverUrl,
      userId,
      oauthConfig,
    );

    logger.debug('[MCP OAuth] OAuth flow initiated', { oauthFlowId, authorizationUrl });

    // Redirect user to the authorization URL
    res.redirect(authorizationUrl);
  } catch (error) {
    logger.error('[MCP OAuth] Failed to initiate OAuth', error);
    res.status(500).json({ error: 'Failed to initiate OAuth' });
  }
});

/**
 * OAuth callback handler
 * This handles the OAuth callback after the user has authorized the application
 */
router.get('/:serverName/oauth/callback', async (req, res) => {
  try {
    const { serverName } = req.params;
    const { code, state, error: oauthError } = req.query;

    logger.debug('[MCP OAuth] Callback received', {
      serverName,
      code: code ? 'present' : 'missing',
      state,
      error: oauthError,
    });

    if (oauthError) {
      logger.error('[MCP OAuth] OAuth error received', { error: oauthError });
      return res.redirect(`/oauth/error?error=${encodeURIComponent(String(oauthError))}`);
    }

    if (!code || typeof code !== 'string') {
      logger.error('[MCP OAuth] Missing or invalid code');
      return res.redirect('/oauth/error?error=missing_code');
    }

    if (!state || typeof state !== 'string') {
      logger.error('[MCP OAuth] Missing or invalid state');
      return res.redirect('/oauth/error?error=missing_state');
    }

    // Extract flow ID from state
    const flowId = state;
    logger.debug('[MCP OAuth] Using flow ID from state', { flowId });

    const flowsCache = getLogStores(CacheKeys.FLOWS);
    const flowManager = getFlowStateManager(flowsCache);

    logger.debug('[MCP OAuth] Getting flow state for flowId: ' + flowId);
    const flowState = await MCPOAuthHandler.getFlowState(flowId, flowManager);

    if (!flowState) {
      logger.error('[MCP OAuth] Flow state not found for flowId:', flowId);
      return res.redirect('/oauth/error?error=invalid_state');
    }

    logger.debug('[MCP OAuth] Flow state details', {
      serverName: flowState.serverName,
      userId: flowState.userId,
      hasMetadata: !!flowState.metadata,
      hasClientInfo: !!flowState.clientInfo,
      hasCodeVerifier: !!flowState.codeVerifier,
    });

    // Complete the OAuth flow
    logger.debug('[MCP OAuth] Completing OAuth flow');
    const tokens = await MCPOAuthHandler.completeOAuthFlow(flowId, code, flowManager);
    logger.info('[MCP OAuth] OAuth flow completed, tokens received in callback route');

    // For system-level OAuth, we need to store the tokens and retry the connection
    if (flowState.userId === 'system') {
      logger.debug(`[MCP OAuth] System-level OAuth completed for ${serverName}`);
    }

    /** ID of the flow that the tool/connection is waiting for */
    const toolFlowId = flowState.metadata?.toolFlowId;
    if (toolFlowId) {
      logger.debug('[MCP OAuth] Completing tool flow', { toolFlowId });
      await flowManager.completeFlow(toolFlowId, 'mcp_oauth', tokens);
    }

    /** Redirect to success page with flowId and serverName */
    const redirectUrl = `/oauth/success?serverName=${encodeURIComponent(serverName)}`;
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('[MCP OAuth] OAuth callback error', error);
    res.redirect('/oauth/error?error=callback_failed');
  }
});

/**
 * Get OAuth tokens for a completed flow
 * This is primarily for user-level OAuth flows
 */
router.get('/oauth/tokens/:flowId', requireJwtAuth, async (req, res) => {
  try {
    const { flowId } = req.params;
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Allow system flows or user-owned flows
    if (!flowId.startsWith(`${user.id}:`) && !flowId.startsWith('system:')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const flowsCache = getLogStores(CacheKeys.FLOWS);
    const flowManager = getFlowStateManager(flowsCache);

    const flowState = await flowManager.getFlowState(flowId, 'mcp_oauth');
    if (!flowState) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    if (flowState.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Flow not completed' });
    }

    res.json({ tokens: flowState.result });
  } catch (error) {
    logger.error('[MCP OAuth] Failed to get tokens', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

/**
 * Check OAuth flow status
 * This endpoint can be used to poll the status of an OAuth flow
 */
router.get('/oauth/status/:flowId', async (req, res) => {
  try {
    const { flowId } = req.params;
    const flowsCache = getLogStores(CacheKeys.FLOWS);
    const flowManager = getFlowStateManager(flowsCache);

    const flowState = await flowManager.getFlowState(flowId, 'mcp_oauth');
    if (!flowState) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    res.json({
      status: flowState.status,
      completed: flowState.status === 'COMPLETED',
      failed: flowState.status === 'FAILED',
      error: flowState.error,
    });
  } catch (error) {
    logger.error('[MCP OAuth] Failed to get flow status', error);
    res.status(500).json({ error: 'Failed to get flow status' });
  }
});

/**
 * Reinitialize MCP server
 * This endpoint allows reinitializing a specific MCP server
 */
router.post('/:serverName/reinitialize', requireJwtAuth, async (req, res) => {
  try {
    const { serverName } = req.params;
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    logger.info(`[MCP Reinitialize] Reinitializing server: ${serverName}`);

    const config = await loadCustomConfig();
    if (!config || !config.mcpServers || !config.mcpServers[serverName]) {
      return res.status(404).json({
        error: `MCP server '${serverName}' not found in configuration`,
      });
    }

    const flowsCache = getLogStores(CacheKeys.FLOWS);
    const flowManager = getFlowStateManager(flowsCache);
    const mcpManager = getMCPManager();

    await mcpManager.disconnectServer(serverName);
    logger.info(`[MCP Reinitialize] Disconnected existing server: ${serverName}`);

    const serverConfig = config.mcpServers[serverName];
    mcpManager.mcpConfigs[serverName] = serverConfig;
    let customUserVars = {};
    if (serverConfig.customUserVars && typeof serverConfig.customUserVars === 'object') {
      for (const varName of Object.keys(serverConfig.customUserVars)) {
        try {
          const value = await getUserPluginAuthValue(user.id, varName, false);
          if (value) {
            customUserVars[varName] = value;
          }
        } catch (err) {
          logger.error(`[MCP Reinitialize] Error fetching ${varName} for user ${user.id}:`, err);
        }
      }
    }

    let userConnection = null;
    try {
      userConnection = await mcpManager.getUserConnection({
        user,
        serverName,
        flowManager,
        customUserVars,
        tokenMethods: {
          findToken,
          updateToken,
          createToken,
          deleteTokens,
        },
      });
    } catch (err) {
      logger.error(`[MCP Reinitialize] Error initializing MCP server ${serverName} for user:`, err);
      return res.status(500).json({ error: 'Failed to reinitialize MCP server for user' });
    }

    const userTools = (await getCachedTools({ userId: user.id })) || {};

    // Remove any old tools from this server in the user's cache
    const mcpDelimiter = Constants.mcp_delimiter;
    for (const key of Object.keys(userTools)) {
      if (key.endsWith(`${mcpDelimiter}${serverName}`)) {
        delete userTools[key];
      }
    }

    // Add the new tools from this server
    const tools = await userConnection.fetchTools();
    for (const tool of tools) {
      const name = `${tool.name}${Constants.mcp_delimiter}${serverName}`;
      userTools[name] = {
        type: 'function',
        ['function']: {
          name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      };
    }

    // Save the updated user tool cache
    await setCachedTools(userTools, { userId: user.id });

    res.json({
      success: true,
      message: `MCP server '${serverName}' reinitialized successfully`,
      serverName,
    });
  } catch (error) {
    logger.error('[MCP Reinitialize] Unexpected error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
