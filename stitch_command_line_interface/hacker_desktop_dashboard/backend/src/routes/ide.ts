/**
 * IDE Routes - REST API for IDE operations
 */

import { Router } from 'express';
import { workspaceService } from '../services/workspaceService';
import { executionService } from '../services/executionService';
import { llmService } from '../services/llmService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Workspace Routes
 */

// List files
router.get('/workspace/files', async (req, res) => {
  try {
    const path = (req.query.path as string) || '';
    const tree = await workspaceService.getFileTree(path);
    return res.json({ success: true, data: tree });
  } catch (error) {
    logger.error('Failed to list files:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Read file
router.get('/workspace/files/:path(*)', async (req, res) => {
  try {
    const file = await workspaceService.readFile(req.params.path);
    return res.json({ success: true, data: file });
  } catch (error) {
    logger.error('Failed to read file:', error);
    return res.status(404).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'File not found' 
    });
  }
});

// Create/update file
router.post('/workspace/files', async (req, res) => {
  try {
    const { path, content } = req.body;
    
    if (!path || content === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing path or content' 
      });
    }

    const file = await workspaceService.writeFile(path, content);
    return res.json({ success: true, data: file });
  } catch (error) {
    logger.error('Failed to write file:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Update file
router.put('/workspace/files/:path(*)', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (content === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing content' 
      });
    }

    const file = await workspaceService.writeFile(req.params.path, content);
    return res.json({ success: true, data: file });
  } catch (error) {
    logger.error('Failed to update file:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete file
router.delete('/workspace/files/:path(*)', async (req, res) => {
  try {
    await workspaceService.deleteFile(req.params.path);
    return res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete file:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Create directory
router.post('/workspace/directories', async (req, res) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing path' 
      });
    }

    await workspaceService.createDirectory(path);
    return res.json({ success: true });
  } catch (error) {
    logger.error('Failed to create directory:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Rename file/directory
router.post('/workspace/rename', async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    
    if (!oldPath || !newPath) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing oldPath or newPath' 
      });
    }

    await workspaceService.rename(oldPath, newPath);
    return res.json({ success: true });
  } catch (error) {
    logger.error('Failed to rename:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Search files
router.get('/workspace/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const path = (req.query.path as string) || '';
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing query parameter' 
      });
    }

    const results = await workspaceService.searchFiles(query, path);
    return res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Failed to search files:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get workspace stats
router.get('/workspace/stats', async (_req, res) => {
  try {
    const stats = await workspaceService.getStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Failed to get workspace stats:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Execution Routes
 */

// Execute code
router.post('/execute', async (req, res) => {
  try {
    const { code, language, timeout, memoryLimit } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing code or language' 
      });
    }

    const executionId = await executionService.executeCode({
      code,
      language,
      timeout,
      memoryLimit,
    });

    // Wait a bit for execution to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = executionService.getResult(executionId);
    return res.json({ success: true, executionId, result });
  } catch (error) {
    logger.error('Failed to execute code:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Execution failed' 
    });
  }
});

// Get execution result
router.get('/execute/:id', async (req, res) => {
  try {
    const result = executionService.getResult(req.params.id);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'Execution not found' 
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to get execution result:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Cancel execution
router.delete('/execute/:id', async (req, res) => {
  try {
    await executionService.cancelExecution(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    logger.error('Failed to cancel execution:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// List executions
router.get('/execute', async (_req, res) => {
  try {
    const executions = executionService.listExecutions();
    return res.json({ success: true, data: executions });
  } catch (error) {
    logger.error('Failed to list executions:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get execution stats
router.get('/execute/stats', async (_req, res) => {
  try {
    const stats = executionService.getStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Failed to get execution stats:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * AI Assistant Routes
 */

// Explain code
router.post('/ai/explain', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing code' 
      });
    }

    const sessionId = `explain-${Date.now()}`;
    const prompt = `Explain the following ${language || 'code'} in simple terms:\n\n\`\`\`\n${code}\n\`\`\``;
    
    const response = await llmService.sendMessage(prompt, sessionId);
    return res.json({ success: true, explanation: response.content });
  } catch (error) {
    logger.error('AI explain failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI service unavailable' 
    });
  }
});

// Generate tests
router.post('/ai/test', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing code' 
      });
    }

    const sessionId = `test-${Date.now()}`;
    const prompt = `Generate comprehensive unit tests for the following ${language || 'code'}. Use Jest framework:\n\n\`\`\`\n${code}\n\`\`\``;
    
    const response = await llmService.sendMessage(prompt, sessionId);
    return res.json({ success: true, tests: response.content });
  } catch (error) {
    logger.error('AI test generation failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI service unavailable' 
    });
  }
});

// Refactor code
router.post('/ai/refactor', async (req, res) => {
  try {
    const { code, language, instructions } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing code' 
      });
    }

    const sessionId = `refactor-${Date.now()}`;
    const refactorInstructions = instructions || 'improve code quality, readability, and performance';
    const prompt = `Refactor the following ${language || 'code'} to ${refactorInstructions}:\n\n\`\`\`\n${code}\n\`\`\`\n\nProvide only the refactored code.`;
    
    const response = await llmService.sendMessage(prompt, sessionId);
    return res.json({ success: true, refactored: response.content });
  } catch (error) {
    logger.error('AI refactor failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI service unavailable' 
    });
  }
});

// Fix bugs
router.post('/ai/fix', async (req, res) => {
  try {
    const { code, error: errorMsg, language } = req.body;
    
    if (!code || !errorMsg) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing code or error message' 
      });
    }

    const sessionId = `fix-${Date.now()}`;
    const prompt = `Fix the bug in the following ${language || 'code'}. The error is: ${errorMsg}\n\n\`\`\`\n${code}\n\`\`\`\n\nProvide the fixed code and explain what was wrong.`;
    
    const response = await llmService.sendMessage(prompt, sessionId);
    return res.json({ success: true, fix: response.content });
  } catch (error) {
    logger.error('AI fix failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI service unavailable' 
    });
  }
});

export default router;
