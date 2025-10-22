/**
 * Git Integration Service
 * Provides Git operations: commit, push, pull, diff, branch management
 */

import simpleGit, { SimpleGit, StatusResult, BranchSummary } from 'simple-git';
import { logger } from '../utils/logger';
import { workspaceService } from './workspaceService';

export interface GitCommitInfo {
  hash: string;
  date: string;
  message: string;
  author: string;
  email: string;
}

export interface GitBranchInfo {
  name: string;
  current: boolean;
  commit: string;
}

export interface GitStatus {
  current: string;
  tracking?: string;
  ahead: number;
  behind: number;
  files: Array<{
    path: string;
    status: string;
    staged: boolean;
  }>;
}

export interface GitDiffInfo {
  file: string;
  changes: string;
  additions: number;
  deletions: number;
}

/**
 * Git Service
 */
export class GitService {
  private git: SimpleGit;
  private workspacePath: string;

  constructor() {
    this.workspacePath = workspaceService.getWorkspaceRoot();
    this.git = simpleGit(this.workspacePath);
    
    logger.info(`Git service initialized at: ${this.workspacePath}`);
  }

  /**
   * Initialize new Git repository
   */
  async init(): Promise<void> {
    try {
      await this.git.init();
      logger.info('Git repository initialized');
    } catch (error) {
      logger.error('Git init failed:', error);
      throw new Error('Failed to initialize Git repository');
    }
  }

  /**
   * Check if workspace is a Git repository
   */
  async isRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get repository status
   */
  async status(): Promise<GitStatus> {
    try {
      const status: StatusResult = await this.git.status();

      return {
        current: status.current || 'main',
        tracking: status.tracking || undefined,
        ahead: status.ahead,
        behind: status.behind,
        files: [
          ...status.modified.map(f => ({ path: f, status: 'modified', staged: false })),
          ...status.created.map(f => ({ path: f, status: 'created', staged: false })),
          ...status.deleted.map(f => ({ path: f, status: 'deleted', staged: false })),
          ...status.staged.map(f => ({ path: f, status: 'staged', staged: true })),
        ],
      };
    } catch (error) {
      logger.error('Git status failed:', error);
      throw new Error('Failed to get Git status');
    }
  }

  /**
   * Add files to staging area
   */
  async add(files: string | string[]): Promise<void> {
    try {
      await this.git.add(files);
      logger.info(`Added to staging: ${Array.isArray(files) ? files.join(', ') : files}`);
    } catch (error) {
      logger.error('Git add failed:', error);
      throw new Error('Failed to add files to staging');
    }
  }

  /**
   * Commit changes
   */
  async commit(message: string, author?: { name: string; email: string }): Promise<GitCommitInfo> {
    try {
      // Set author if provided
      if (author) {
        await this.git.addConfig('user.name', author.name);
        await this.git.addConfig('user.email', author.email);
      }

      const result = await this.git.commit(message);
      logger.info(`Committed: ${result.commit}`);

      const log = await this.git.log({ maxCount: 1 });
      const latest = log.latest;

      if (!latest) {
        throw new Error('No commit information available');
      }

      return {
        hash: latest.hash,
        date: latest.date,
        message: latest.message,
        author: latest.author_name,
        email: latest.author_email,
      };
    } catch (error) {
      logger.error('Git commit failed:', error);
      throw new Error('Failed to commit changes');
    }
  }

  /**
   * Push to remote
   */
  async push(remote: string = 'origin', branch?: string): Promise<void> {
    try {
      const currentBranch = branch || (await this.git.status()).current || 'main';
      await this.git.push(remote, currentBranch);
      logger.info(`Pushed to ${remote}/${currentBranch}`);
    } catch (error) {
      logger.error('Git push failed:', error);
      throw new Error('Failed to push to remote');
    }
  }

  /**
   * Pull from remote
   */
  async pull(remote: string = 'origin', branch?: string): Promise<void> {
    try {
      const currentBranch = branch || (await this.git.status()).current || 'main';
      await this.git.pull(remote, currentBranch);
      logger.info(`Pulled from ${remote}/${currentBranch}`);
    } catch (error) {
      logger.error('Git pull failed:', error);
      throw new Error('Failed to pull from remote');
    }
  }

  /**
   * Get diff
   */
  async diff(options?: { staged?: boolean; file?: string }): Promise<GitDiffInfo[]> {
    try {
      const diffArgs: string[] = [];
      
      if (options?.staged) {
        diffArgs.push('--cached');
      }
      
      if (options?.file) {
        diffArgs.push('--', options.file);
      }

      // Get raw diff output as string
      const diffOutput = await this.git.diff(diffArgs);
      
      // Parse diff output - for now return simplified info
      // In production, you'd parse the diff text to extract file changes
      const files: GitDiffInfo[] = [];
      
      // Get diff summary instead for file stats
      const diffSummary = await this.git.diffSummary(diffArgs);
      
      if (diffSummary.files && diffSummary.files.length > 0) {
        for (const file of diffSummary.files) {
          // Type guard to handle different file types
          const insertions = 'insertions' in file ? file.insertions : 0;
          const deletions = 'deletions' in file ? file.deletions : 0;
          
          files.push({
            file: file.file,
            changes: typeof diffOutput === 'string' ? diffOutput : '',
            additions: insertions || 0,
            deletions: deletions || 0,
          });
        }
      }

      return files;
    } catch (error) {
      logger.error('Git diff failed:', error);
      throw new Error('Failed to get diff');
    }
  }

  /**
   * List branches
   */
  async branches(): Promise<GitBranchInfo[]> {
    try {
      const branches: BranchSummary = await this.git.branch();
      
      return Object.keys(branches.branches).map(name => ({
        name,
        current: name === branches.current,
        commit: branches.branches[name].commit,
      }));
    } catch (error) {
      logger.error('Git branches failed:', error);
      throw new Error('Failed to list branches');
    }
  }

  /**
   * Create new branch
   */
  async createBranch(name: string, checkout: boolean = false): Promise<void> {
    try {
      if (checkout) {
        await this.git.checkoutLocalBranch(name);
      } else {
        await this.git.branch([name]);
      }
      logger.info(`Branch created: ${name}`);
    } catch (error) {
      logger.error('Git create branch failed:', error);
      throw new Error('Failed to create branch');
    }
  }

  /**
   * Checkout branch
   */
  async checkout(branch: string): Promise<void> {
    try {
      await this.git.checkout(branch);
      logger.info(`Checked out: ${branch}`);
    } catch (error) {
      logger.error('Git checkout failed:', error);
      throw new Error('Failed to checkout branch');
    }
  }

  /**
   * Delete branch
   */
  async deleteBranch(name: string, force: boolean = false): Promise<void> {
    try {
      await this.git.branch(force ? ['-D', name] : ['-d', name]);
      logger.info(`Branch deleted: ${name}`);
    } catch (error) {
      logger.error('Git delete branch failed:', error);
      throw new Error('Failed to delete branch');
    }
  }

  /**
   * Get commit log
   */
  async log(options?: { maxCount?: number; file?: string }): Promise<GitCommitInfo[]> {
    try {
      const logOptions: any = {};
      
      if (options?.maxCount) {
        logOptions.maxCount = options.maxCount;
      }
      
      if (options?.file) {
        logOptions.file = options.file;
      }

      const log = await this.git.log(logOptions);
      
      return log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name,
        email: commit.author_email,
      }));
    } catch (error) {
      logger.error('Git log failed:', error);
      throw new Error('Failed to get commit log');
    }
  }

  /**
   * Add remote
   */
  async addRemote(name: string, url: string): Promise<void> {
    try {
      await this.git.addRemote(name, url);
      logger.info(`Remote added: ${name} -> ${url}`);
    } catch (error) {
      logger.error('Git add remote failed:', error);
      throw new Error('Failed to add remote');
    }
  }

  /**
   * List remotes
   */
  async remotes(): Promise<Array<{ name: string; refs: { fetch: string; push: string } }>> {
    try {
      const remotes = await this.git.getRemotes(true);
      return remotes.map(r => ({
        name: r.name,
        refs: {
          fetch: r.refs.fetch || '',
          push: r.refs.push || '',
        },
      }));
    } catch (error) {
      logger.error('Git remotes failed:', error);
      throw new Error('Failed to list remotes');
    }
  }

  /**
   * Clone repository
   */
  async clone(url: string, directory?: string): Promise<void> {
    try {
      const targetDir = directory || this.workspacePath;
      await this.git.clone(url, targetDir);
      logger.info(`Cloned repository: ${url} -> ${targetDir}`);
    } catch (error) {
      logger.error('Git clone failed:', error);
      throw new Error('Failed to clone repository');
    }
  }

  /**
   * Reset changes
   */
  async reset(mode: 'soft' | 'mixed' | 'hard' = 'mixed', ref: string = 'HEAD'): Promise<void> {
    try {
      await this.git.reset([`--${mode}`, ref]);
      logger.info(`Reset to ${ref} (${mode})`);
    } catch (error) {
      logger.error('Git reset failed:', error);
      throw new Error('Failed to reset changes');
    }
  }

  /**
   * Stash changes
   */
  async stash(message?: string): Promise<void> {
    try {
      if (message) {
        await this.git.stash(['save', message]);
      } else {
        await this.git.stash();
      }
      logger.info('Changes stashed');
    } catch (error) {
      logger.error('Git stash failed:', error);
      throw new Error('Failed to stash changes');
    }
  }

  /**
   * Apply stash
   */
  async stashPop(): Promise<void> {
    try {
      await this.git.stash(['pop']);
      logger.info('Stash applied');
    } catch (error) {
      logger.error('Git stash pop failed:', error);
      throw new Error('Failed to apply stash');
    }
  }

  /**
   * Get current branch
   */
  async currentBranch(): Promise<string> {
    try {
      const status = await this.git.status();
      return status.current || 'main';
    } catch (error) {
      logger.error('Get current branch failed:', error);
      throw new Error('Failed to get current branch');
    }
  }
}

// Singleton instance
export const gitService = new GitService();
