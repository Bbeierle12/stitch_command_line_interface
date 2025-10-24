import { Router, Request, Response } from 'express';
import { llmService } from '../services/llmService';
import { logger } from '../utils/logger';
import {
  validateLLMExplain,
  validateLLMAnalyzeCode,
  validateLLMGenerateCode,
  validateLLMCompletions,
  validateLLMClearContext,
  validateLLMOptimizeContext,
} from '../middleware/validation';

const router = Router();

router.post('/explain', validateLLMExplain, async (req: Request, res: Response) => {
  try {
    const { context, data, provider, model, sessionId } = req.body || {};
    const session = sessionId || `session-${Date.now()}`;
    
    // Build prompt with context
    const prompt = `Explain the following in the context of ${context || 'software development'}:\n\n${JSON.stringify(data, null, 2)}`;
    
    const response = await llmService.sendMessage(prompt, session, {
      provider: provider || 'openai',
      model,
      temperature: 0.7,
      maxTokens: 500,
    });

    const suggestedActions = [
      { id: 'action-1', label: 'Open related logs', command: 'open logs --tail' },
      { id: 'action-2', label: 'Run sanity tests', command: 'npm run test:sanity' },
    ];

    res.json({
      explanation: response.content,
      suggestedActions,
      confidence: 0.82,
      model: response.model,
      tokensUsed: response.usage.total,
      sessionId: session,
    });
  } catch (error) {
    logger.error('LLM explain error:', error);
    res.status(500).json({ error: { code: 'LLM_ERROR', message: 'Failed to generate explanation' } });
  }
});

router.post('/analyze-code', validateLLMAnalyzeCode, async (req: Request, res: Response) => {
  try {
    const { code, analysisType, provider, model, sessionId } = req.body || {};
    
    // Validation already handled by middleware
    const session = sessionId || `code-analysis-${Date.now()}`;
    const prompt = `Analyze the following ${analysisType || 'code'} and identify potential issues, improvements, and recommendations:\n\n\`\`\`\n${code}\n\`\`\``;

    const response = await llmService.sendMessage(prompt, session, {
      provider: provider || 'openai',
      model,
      temperature: 0.5,
      maxTokens: 800,
    });

    res.json({
      analysis: response.content,
      summary: `Code analysis completed using ${response.model}`,
      tokensUsed: response.usage.total,
      sessionId: session,
    });
  } catch (error) {
    logger.error('LLM analyze error:', error);
    res.status(500).json({ error: { code: 'LLM_ERROR', message: 'Failed to analyze code' } });
  }
});

router.post('/generate-code', validateLLMGenerateCode, async (req: Request, res: Response) => {
  try {
    const { prompt, language, provider, model, sessionId } = req.body || {};
    
    // Validation already handled by middleware
    const session = sessionId || `code-gen-${Date.now()}`;
    const fullPrompt = `Generate ${language} code for the following requirement:\n\n${prompt}\n\nProvide clean, idiomatic code with brief explanations.`;

    const response = await llmService.sendMessage(fullPrompt, session, {
      provider: provider || 'openai',
      model,
      temperature: 0.8,
      maxTokens: 1000,
    });

    res.json({
      code: response.content,
      explanation: `Generated ${language} code`,
      language,
      tokensUsed: response.usage.total,
      sessionId: session,
    });
  } catch (error) {
    logger.error('LLM generate error:', error);
    res.status(500).json({ error: { code: 'LLM_ERROR', message: 'Failed to generate code' } });
  }
});

router.post('/completions', validateLLMCompletions, async (req: Request, res: Response) => {
  try {
    const { prefix, context, provider, model, sessionId } = req.body || {};
    const session = sessionId || `completion-${Date.now()}`;
    
    const prompt = `Provide code completions for the following prefix${context ? ` in the context of ${context}` : ''}:\n\n${prefix}`;

    const response = await llmService.sendMessage(prompt, session, {
      provider: provider || 'openai',
      model,
      temperature: 0.6,
      maxTokens: 200,
    });

    const completions = response.content.split('\n').filter(c => c.trim()).slice(0, 3);

    res.json({
      completions,
      tokensUsed: response.usage.total,
      sessionId: session,
    });
  } catch (error) {
    logger.error('LLM completions error:', error);
    res.status(500).json({ error: { code: 'LLM_ERROR', message: 'Failed to generate completions' } });
  }
});

// Context management endpoints
router.post('/context/clear', validateLLMClearContext, (req: Request, res: Response) => {
  const { sessionId } = req.body || {};
  
  // Validation already handled
  llmService.clearContext(sessionId);
  res.json({ success: true, message: 'Context cleared' });
});

router.get('/context/summary/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const summary = llmService.getContextSummary(sessionId);
  res.json(summary);
});

router.post('/context/optimize', validateLLMOptimizeContext, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body || {};
    
    // Validation already handled
    await llmService.optimizeContext(sessionId);
    const summary = llmService.getContextSummary(sessionId);
    
    res.json({
      success: true,
      message: 'Context optimized',
      summary,
    });
  } catch (error) {
    logger.error('Context optimization error:', error);
    res.status(500).json({ error: { code: 'OPTIMIZATION_ERROR', message: 'Failed to optimize context' } });
  }
});

export default router;
