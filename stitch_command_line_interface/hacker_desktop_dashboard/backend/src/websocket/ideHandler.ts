/**
 * IDE WebSocket Handler
 * Handles real-time communication for the live coding IDE
 */

import { Server, Socket } from 'socket.io';
import { workspaceService } from '../services/workspaceService';
import { executionService } from '../services/executionService';
import { llmService } from '../services/llmService';
import { logger } from '../utils/logger';

export interface IDEClient {
  id: string;
  userId?: string;
  username?: string;
  currentFile?: string;
  cursorPosition?: { line: number; column: number };
}

/**
 * Setup IDE WebSocket handlers
 */
export function setupIDEWebSocket(io: Server): void {
  const clients = new Map<string, IDEClient>();

  io.on('connection', (socket: Socket) => {
    logger.info(`IDE client connected: ${socket.id}`);

    // Register client
    const client: IDEClient = {
      id: socket.id,
      username: socket.handshake.query.username as string || 'Anonymous',
    };
    clients.set(socket.id, client);

    // Broadcast user join
    socket.broadcast.emit('user:join', {
      userId: socket.id,
      username: client.username,
    });

    /**
     * File Operations
     */
    
    // Get file tree
    socket.on('files:list', async (data, callback) => {
      try {
        const tree = await workspaceService.getFileTree(data?.path || '');
        callback({ success: true, data: tree });
      } catch (error) {
        logger.error('Failed to list files:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Read file
    socket.on('file:read', async (data: { path: string }, callback) => {
      try {
        const file = await workspaceService.readFile(data.path);
        callback({ success: true, data: file });
      } catch (error) {
        logger.error('Failed to read file:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Write file
    socket.on('file:write', async (data: { path: string; content: string }, callback) => {
      try {
        const file = await workspaceService.writeFile(data.path, data.content);
        
        // Broadcast file change to other clients
        socket.broadcast.emit('file:changed', {
          path: data.path,
          hash: file.hash,
          userId: socket.id,
          username: client.username,
        });

        callback({ success: true, data: file });
      } catch (error) {
        logger.error('Failed to write file:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Delete file
    socket.on('file:delete', async (data: { path: string }, callback) => {
      try {
        await workspaceService.deleteFile(data.path);
        
        // Broadcast deletion
        socket.broadcast.emit('file:deleted', {
          path: data.path,
          userId: socket.id,
        });

        callback({ success: true });
      } catch (error) {
        logger.error('Failed to delete file:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    /**
     * Code Execution
     */
    
    // Execute code
    socket.on('code:execute', async (data: { 
      code: string; 
      language: 'javascript' | 'typescript';
      timeout?: number;
    }, callback) => {
      try {
        const executionId = await executionService.executeCode({
          code: data.code,
          language: data.language,
          timeout: data.timeout,
        });

        callback({ success: true, executionId });

        // Stream output in real-time
        const result = executionService.getResult(executionId);
        if (result) {
          socket.emit('execution:result', result);
        }
      } catch (error) {
        logger.error('Failed to execute code:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Get execution result
    socket.on('execution:get', (data: { id: string }, callback) => {
      const result = executionService.getResult(data.id);
      if (result) {
        callback({ success: true, data: result });
      } else {
        callback({ success: false, error: 'Execution not found' });
      }
    });

    // Cancel execution
    socket.on('execution:cancel', async (data: { id: string }, callback) => {
      try {
        await executionService.cancelExecution(data.id);
        callback({ success: true });
      } catch (error) {
        logger.error('Failed to cancel execution:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    /**
     * AI Assistant
     */
    
    // Explain code
    socket.on('ai:explain', async (data: { code: string; language: string }, callback) => {
      try {
        const sessionId = `${socket.id}-explain`;
        const prompt = `Explain the following ${data.language} code in simple terms:\n\n\`\`\`${data.language}\n${data.code}\n\`\`\``;
        
        const response = await llmService.sendMessage(prompt, sessionId);
        callback({ success: true, explanation: response.content });
      } catch (error) {
        logger.error('AI explain failed:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'AI service unavailable' 
        });
      }
    });

    // Generate tests
    socket.on('ai:generate-tests', async (data: { code: string; language: string }, callback) => {
      try {
        const sessionId = `${socket.id}-tests`;
        const prompt = `Generate comprehensive unit tests for the following ${data.language} code. Use Jest framework:\n\n\`\`\`${data.language}\n${data.code}\n\`\`\``;
        
        const response = await llmService.sendMessage(prompt, sessionId);
        callback({ success: true, tests: response.content });
      } catch (error) {
        logger.error('AI test generation failed:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'AI service unavailable' 
        });
      }
    });

    // Refactor code
    socket.on('ai:refactor', async (data: { code: string; language: string; instructions?: string }, callback) => {
      try {
        const sessionId = `${socket.id}-refactor`;
        const instructions = data.instructions || 'improve code quality, readability, and performance';
        const prompt = `Refactor the following ${data.language} code to ${instructions}:\n\n\`\`\`${data.language}\n${data.code}\n\`\`\`\n\nProvide only the refactored code without explanation.`;
        
        const response = await llmService.sendMessage(prompt, sessionId);
        callback({ success: true, refactored: response.content });
      } catch (error) {
        logger.error('AI refactor failed:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'AI service unavailable' 
        });
      }
    });

    // Fix bugs
    socket.on('ai:fix', async (data: { code: string; error: string; language: string }, callback) => {
      try {
        const sessionId = `${socket.id}-fix`;
        const prompt = `Fix the bug in the following ${data.language} code. The error is: ${data.error}\n\n\`\`\`${data.language}\n${data.code}\n\`\`\`\n\nProvide the fixed code and explain what was wrong.`;
        
        const response = await llmService.sendMessage(prompt, sessionId);
        callback({ success: true, fix: response.content });
      } catch (error) {
        logger.error('AI fix failed:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'AI service unavailable' 
        });
      }
    });

    /**
     * Collaboration Features
     */
    
    // Open file (track what file user is viewing)
    socket.on('file:open', (data: { path: string }) => {
      client.currentFile = data.path;
      
      // Broadcast to others
      socket.broadcast.emit('user:file-opened', {
        userId: socket.id,
        username: client.username,
        path: data.path,
      });
    });

    // Cursor position update
    socket.on('cursor:move', (data: { line: number; column: number; path: string }) => {
      client.cursorPosition = { line: data.line, column: data.column };
      
      // Broadcast to others viewing the same file
      socket.broadcast.emit('cursor:update', {
        userId: socket.id,
        username: client.username,
        path: data.path,
        position: data,
      });
    });

    // Code selection
    socket.on('selection:change', (data: { 
      path: string; 
      start: { line: number; column: number };
      end: { line: number; column: number };
    }) => {
      socket.broadcast.emit('selection:update', {
        userId: socket.id,
        username: client.username,
        ...data,
      });
    });

    /**
     * Workspace Management
     */
    
    // Get workspace stats
    socket.on('workspace:stats', async (callback) => {
      try {
        const stats = await workspaceService.getStats();
        callback({ success: true, data: stats });
      } catch (error) {
        logger.error('Failed to get workspace stats:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Search files
    socket.on('workspace:search', async (data: { query: string; path?: string }, callback) => {
      try {
        const results = await workspaceService.searchFiles(data.query, data.path);
        callback({ success: true, data: results });
      } catch (error) {
        logger.error('Failed to search files:', error);
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      logger.info(`IDE client disconnected: ${socket.id}`);
      clients.delete(socket.id);
      
      // Notify others
      socket.broadcast.emit('user:leave', {
        userId: socket.id,
        username: client.username,
      });
    });
  });

  // Listen to execution service events
  executionService.on('execution:output', (data: { id: string; output: string }) => {
    io.emit('execution:output', data);
  });

  executionService.on('execution:complete', (result) => {
    io.emit('execution:result', result);
  });

  logger.info('IDE WebSocket handlers initialized');
}
