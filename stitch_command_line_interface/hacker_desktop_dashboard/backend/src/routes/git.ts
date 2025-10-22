/**
 * Git Routes
 * REST API for Git operations
 */

import { Router } from 'express';
import { gitService } from '../services/gitService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/git/status
 * Get repository status
 */
router.get('/status', async (_req, res) => {
  try {
    const status = await gitService.status();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Git status failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get status' 
    });
  }
});

/**
 * POST /api/git/init
 * Initialize Git repository
 */
router.post('/init', async (_req, res) => {
  try {
    await gitService.init();
    res.json({ success: true, message: 'Repository initialized' });
  } catch (error) {
    logger.error('Git init failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initialize repository' 
    });
  }
});

/**
 * POST /api/git/add
 * Add files to staging area
 * Body: { files: string | string[] }
 */
router.post('/add', async (req, res) => {
  try {
    const { files } = req.body;
    
    if (!files) {
      return res.status(400).json({ success: false, error: 'Files required' });
    }

    await gitService.add(files);
    return res.json({ success: true, message: 'Files added to staging' });
  } catch (error) {
    logger.error('Git add failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add files' 
    });
  }
});

/**
 * POST /api/git/commit
 * Commit changes
 * Body: { message: string, author?: { name: string, email: string } }
 */
router.post('/commit', async (req, res) => {
  try {
    const { message, author } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Commit message required' });
    }

    const commit = await gitService.commit(message, author);
    return res.json({ success: true, data: commit });
  } catch (error) {
    logger.error('Git commit failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to commit' 
    });
  }
});

/**
 * POST /api/git/push
 * Push to remote
 * Body: { remote?: string, branch?: string }
 */
router.post('/push', async (req, res) => {
  try {
    const { remote, branch } = req.body;
    await gitService.push(remote, branch);
    res.json({ success: true, message: 'Pushed to remote' });
  } catch (error) {
    logger.error('Git push failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to push' 
    });
  }
});

/**
 * POST /api/git/pull
 * Pull from remote
 * Body: { remote?: string, branch?: string }
 */
router.post('/pull', async (req, res) => {
  try {
    const { remote, branch } = req.body;
    await gitService.pull(remote, branch);
    res.json({ success: true, message: 'Pulled from remote' });
  } catch (error) {
    logger.error('Git pull failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to pull' 
    });
  }
});

/**
 * GET /api/git/diff
 * Get diff
 * Query: ?staged=true&file=path/to/file
 */
router.get('/diff', async (req, res) => {
  try {
    const { staged, file } = req.query;
    
    const diff = await gitService.diff({
      staged: staged === 'true',
      file: typeof file === 'string' ? file : undefined,
    });
    
    res.json({ success: true, data: diff });
  } catch (error) {
    logger.error('Git diff failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get diff' 
    });
  }
});

/**
 * GET /api/git/branches
 * List branches
 */
router.get('/branches', async (_req, res) => {
  try {
    const branches = await gitService.branches();
    res.json({ success: true, data: branches });
  } catch (error) {
    logger.error('Git branches failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list branches' 
    });
  }
});

/**
 * POST /api/git/branch
 * Create new branch
 * Body: { name: string, checkout?: boolean }
 */
router.post('/branch', async (req, res) => {
  try {
    const { name, checkout } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Branch name required' });
    }

    await gitService.createBranch(name, checkout);
    return res.json({ success: true, message: `Branch ${name} created` });
  } catch (error) {
    logger.error('Git create branch failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create branch' 
    });
  }
});

/**
 * DELETE /api/git/branch/:name
 * Delete branch
 * Query: ?force=true
 */
router.delete('/branch/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { force } = req.query;
    
    await gitService.deleteBranch(name, force === 'true');
    res.json({ success: true, message: `Branch ${name} deleted` });
  } catch (error) {
    logger.error('Git delete branch failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete branch' 
    });
  }
});

/**
 * POST /api/git/checkout
 * Checkout branch
 * Body: { branch: string }
 */
router.post('/checkout', async (req, res) => {
  try {
    const { branch } = req.body;
    
    if (!branch) {
      return res.status(400).json({ success: false, error: 'Branch name required' });
    }

    await gitService.checkout(branch);
    return res.json({ success: true, message: `Checked out ${branch}` });
  } catch (error) {
    logger.error('Git checkout failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to checkout' 
    });
  }
});

/**
 * GET /api/git/log
 * Get commit log
 * Query: ?maxCount=10&file=path/to/file
 */
router.get('/log', async (req, res) => {
  try {
    const { maxCount, file } = req.query;
    
    const log = await gitService.log({
      maxCount: maxCount ? parseInt(maxCount as string, 10) : undefined,
      file: typeof file === 'string' ? file : undefined,
    });
    
    res.json({ success: true, data: log });
  } catch (error) {
    logger.error('Git log failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get log' 
    });
  }
});

/**
 * GET /api/git/remotes
 * List remotes
 */
router.get('/remotes', async (_req, res) => {
  try {
    const remotes = await gitService.remotes();
    res.json({ success: true, data: remotes });
  } catch (error) {
    logger.error('Git remotes failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list remotes' 
    });
  }
});

/**
 * POST /api/git/remote
 * Add remote
 * Body: { name: string, url: string }
 */
router.post('/remote', async (req, res) => {
  try {
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'Name and URL required' });
    }

    await gitService.addRemote(name, url);
    return res.json({ success: true, message: `Remote ${name} added` });
  } catch (error) {
    logger.error('Git add remote failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add remote' 
    });
  }
});

/**
 * POST /api/git/clone
 * Clone repository
 * Body: { url: string, directory?: string }
 */
router.post('/clone', async (req, res) => {
  try {
    const { url, directory } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL required' });
    }

    await gitService.clone(url, directory);
    return res.json({ success: true, message: 'Repository cloned' });
  } catch (error) {
    logger.error('Git clone failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to clone repository' 
    });
  }
});

/**
 * POST /api/git/reset
 * Reset changes
 * Body: { mode: 'soft' | 'mixed' | 'hard', ref?: string }
 */
router.post('/reset', async (req, res) => {
  try {
    const { mode, ref } = req.body;
    
    await gitService.reset(mode, ref);
    res.json({ success: true, message: 'Changes reset' });
  } catch (error) {
    logger.error('Git reset failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reset' 
    });
  }
});

/**
 * POST /api/git/stash
 * Stash changes
 * Body: { message?: string }
 */
router.post('/stash', async (req, res) => {
  try {
    const { message } = req.body;
    await gitService.stash(message);
    res.json({ success: true, message: 'Changes stashed' });
  } catch (error) {
    logger.error('Git stash failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to stash' 
    });
  }
});

/**
 * POST /api/git/stash/pop
 * Apply stash
 */
router.post('/stash/pop', async (_req, res) => {
  try {
    await gitService.stashPop();
    res.json({ success: true, message: 'Stash applied' });
  } catch (error) {
    logger.error('Git stash pop failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to apply stash' 
    });
  }
});

export default router;
