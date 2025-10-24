/**
 * Workspace Service - File System Operations
 * Provides secure CRUD operations for workspace files and directories
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  content: string;
  encoding: string;
  hash: string;
  size: number;
  modified: Date;
}

export interface WorkspaceStats {
  totalFiles: number;
  totalSize: number;
  languages: Record<string, number>;
}

/**
 * Workspace Service
 */
export class WorkspaceService {
  private workspaceRoot: string;
  private allowedExtensions: Set<string>;
  private maxFileSize: number;
  private excludePatterns: string[];

  constructor() {
    this.workspaceRoot = process.env.WORKSPACE_ROOT || path.join(process.cwd(), 'workspace');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024;
    
    // Restricted extensions removed: .env (secrets), .sh/.bash/.ps1 (shell scripts)
    // These pose security risks and should be managed through proper deployment/config
    this.allowedExtensions = new Set([
      '.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css', '.scss',
      '.py', '.java', '.cpp', '.c', '.h', '.rs', '.go', '.rb',
      '.md', '.txt', '.yaml', '.yml', '.toml', '.xml', '.sql'
    ]);

    this.excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.env.local',
      '.env',
      '.DS_Store',
      'thumbs.db',
    ];
  }

  /**
   * Initialize workspace directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.workspaceRoot, { recursive: true });
      logger.info(`Workspace initialized at: ${this.workspaceRoot}`);
      
      // Create default structure
      const defaultDirs = ['src', 'tests', 'docs'];
      for (const dir of defaultDirs) {
        await fs.mkdir(path.join(this.workspaceRoot, dir), { recursive: true });
      }

      // Create welcome file
      const welcomePath = path.join(this.workspaceRoot, 'README.md');
      const welcomeContent = `# Welcome to SecureCode IDE

Start coding in a secure, sandboxed environment with AI assistance.

## Getting Started

1. Create a new file in the \`src/\` directory
2. Write your code with syntax highlighting and IntelliSense
3. Click "Run" to execute in a secure sandbox
4. Use the AI assistant to explain, test, or refactor your code

## Security

All code runs in an isolated environment with:
- Resource limits (CPU, memory)
- No network access by default
- Read-only file system
- Audit logging

Happy coding! 🚀
`;
      
      try {
        await fs.access(welcomePath);
      } catch {
        await fs.writeFile(welcomePath, welcomeContent, 'utf8');
      }
    } catch (error) {
      logger.error('Failed to initialize workspace:', error);
      throw error;
    }
  }

  /**
   * Validate and normalize path
   */
  private validatePath(filePath: string): string {
    const normalized = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(this.workspaceRoot, normalized);

    // Prevent directory traversal
    if (!fullPath.startsWith(this.workspaceRoot)) {
      throw new Error('Invalid path: Directory traversal detected');
    }

    return fullPath;
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(filePath: string): boolean {
    return this.excludePatterns.some(pattern => 
      filePath.includes(pattern)
    );
  }

  /**
   * Get file extension language
   */
  private getLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.rs': 'rust',
      '.go': 'go',
      '.rb': 'ruby',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.json': 'json',
      '.md': 'markdown',
    };
    return languageMap[ext] || 'plaintext';
  }

  /**
   * List files in directory
   */
  async listFiles(dirPath: string = ''): Promise<FileNode[]> {
    const fullPath = this.validatePath(dirPath);

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const nodes: FileNode[] = [];

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (this.shouldExclude(entryPath)) {
          continue;
        }

        const stats = await fs.stat(path.join(fullPath, entry.name));
        const node: FileNode = {
          name: entry.name,
          path: entryPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: entry.isFile() ? stats.size : undefined,
          modified: stats.mtime,
        };

        nodes.push(node);
      }

      // Sort: directories first, then files alphabetically
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      logger.error(`Failed to list files in ${dirPath}:`, error);
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file tree recursively
   */
  async getFileTree(dirPath: string = '', maxDepth: number = 5, currentDepth: number = 0): Promise<FileNode[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const nodes = await this.listFiles(dirPath);

    for (const node of nodes) {
      if (node.type === 'directory') {
        node.children = await this.getFileTree(node.path, maxDepth, currentDepth + 1);
      }
    }

    return nodes;
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<FileContent> {
    const fullPath = this.validatePath(filePath);

    try {
      const stats = await fs.stat(fullPath);

      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      if (stats.size > this.maxFileSize) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
      }

      const content = await fs.readFile(fullPath, 'utf8');
      const hash = createHash('sha256').update(content).digest('hex');

      return {
        path: filePath,
        content,
        encoding: 'utf8',
        hash,
        size: stats.size,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.error(`Failed to read file ${filePath}:`, error);
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string): Promise<FileContent> {
    const fullPath = this.validatePath(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Validate extension
    if (!this.allowedExtensions.has(ext)) {
      throw new Error(`File extension not allowed: ${ext}`);
    }

    // Validate size
    const size = Buffer.byteLength(content, 'utf8');
    if (size > this.maxFileSize) {
      throw new Error(`File too large: ${size} bytes (max: ${this.maxFileSize})`);
    }

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file
      await fs.writeFile(fullPath, content, 'utf8');

      // Return file info
      const hash = createHash('sha256').update(content).digest('hex');
      const stats = await fs.stat(fullPath);

      logger.info(`File written: ${filePath} (${size} bytes)`);

      return {
        path: filePath,
        content,
        encoding: 'utf8',
        hash,
        size: stats.size,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.error(`Failed to write file ${filePath}:`, error);
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file or directory
   */
  async deleteFile(filePath: string): Promise<void> {
    const fullPath = this.validatePath(filePath);

    try {
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true });
        logger.info(`Directory deleted: ${filePath}`);
      } else {
        await fs.unlink(fullPath);
        logger.info(`File deleted: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Failed to delete ${filePath}:`, error);
      throw new Error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    const fullPath = this.validatePath(dirPath);

    try {
      await fs.mkdir(fullPath, { recursive: true });
      logger.info(`Directory created: ${dirPath}`);
    } catch (error) {
      logger.error(`Failed to create directory ${dirPath}:`, error);
      throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rename/move file or directory
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    const fullOldPath = this.validatePath(oldPath);
    const fullNewPath = this.validatePath(newPath);

    try {
      await fs.rename(fullOldPath, fullNewPath);
      logger.info(`Renamed: ${oldPath} -> ${newPath}`);
    } catch (error) {
      logger.error(`Failed to rename ${oldPath} to ${newPath}:`, error);
      throw new Error(`Failed to rename: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search files by content
   */
  async searchFiles(query: string, dirPath: string = ''): Promise<Array<{ path: string; line: number; content: string }>> {
    const files = await this.getFileTree(dirPath);
    const results: Array<{ path: string; line: number; content: string }> = [];

    const searchInNode = async (node: FileNode) => {
      if (node.type === 'file') {
        try {
          const fileContent = await this.readFile(node.path);
          const lines = fileContent.content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                path: node.path,
                line: index + 1,
                content: line.trim(),
              });
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      } else if (node.children) {
        for (const child of node.children) {
          await searchInNode(child);
        }
      }
    };

    for (const node of files) {
      await searchInNode(node);
    }

    return results.slice(0, 100); // Limit results
  }

  /**
   * Get workspace statistics
   */
  async getStats(): Promise<WorkspaceStats> {
    const files = await this.getFileTree();
    const stats: WorkspaceStats = {
      totalFiles: 0,
      totalSize: 0,
      languages: {},
    };

    const countNode = (node: FileNode) => {
      if (node.type === 'file') {
        stats.totalFiles++;
        stats.totalSize += node.size || 0;
        
        const lang = this.getLanguage(node.name);
        stats.languages[lang] = (stats.languages[lang] || 0) + 1;
      } else if (node.children) {
        node.children.forEach(countNode);
      }
    };

    files.forEach(countNode);
    return stats;
  }

  /**
   * Get workspace root path
   */
  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }
}

// Singleton instance
export const workspaceService = new WorkspaceService();
