/**
 * Workspace Security Tests
 * Tests for file extension restrictions and workspace isolation
 */

import { workspaceService } from '../src/services/workspaceService';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Workspace Security Tests', () => {
  const testWorkspaceRoot = path.join(process.cwd(), 'workspace', 'test-security');

  beforeAll(async () => {
    // Ensure test workspace exists
    await fs.mkdir(testWorkspaceRoot, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test workspace
    try {
      await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('File Extension Restrictions', () => {
    it('should allow safe file extensions', async () => {
      const safeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.py'];
      
      for (const ext of safeExtensions) {
        const testFile = `test${ext}`;
        await expect(
          workspaceService.writeFile(path.join('test-security', testFile), '// test content')
        ).resolves.toBeDefined();
      }
    });

    it('should reject .env files', async () => {
      await expect(
        workspaceService.writeFile(path.join('test-security', '.env'), 'SECRET=123')
      ).rejects.toThrow('File extension not allowed');
    });

    it('should reject .sh shell scripts', async () => {
      await expect(
        workspaceService.writeFile(path.join('test-security', 'script.sh'), '#!/bin/bash\necho "test"')
      ).rejects.toThrow('File extension not allowed');
    });

    it('should reject .bash shell scripts', async () => {
      await expect(
        workspaceService.writeFile(path.join('test-security', 'script.bash'), '#!/bin/bash\necho "test"')
      ).rejects.toThrow('File extension not allowed');
    });

    it('should reject .ps1 PowerShell scripts', async () => {
      await expect(
        workspaceService.writeFile(path.join('test-security', 'script.ps1'), 'Write-Host "test"')
      ).rejects.toThrow('File extension not allowed');
    });

    it('should reject files without recognized extensions', async () => {
      await expect(
        workspaceService.writeFile(path.join('test-security', 'file.exe'), 'binary data')
      ).rejects.toThrow('File extension not allowed');
    });
  });

  describe('Path Traversal Protection', () => {
    it('should prevent directory traversal with ../', async () => {
      await expect(
        workspaceService.writeFile('../../../etc/passwd', 'malicious')
      ).rejects.toThrow('Invalid path');
    });

    it('should prevent absolute path access outside workspace', async () => {
      await expect(
        workspaceService.readFile('/etc/passwd')
      ).rejects.toThrow();
    });

    it('should normalize paths to prevent traversal', async () => {
      // Even with normalized paths, should stay within workspace
      const safePath = path.normalize('test-security/safe.js');
      await expect(
        workspaceService.writeFile(safePath, '// safe')
      ).resolves.toBeDefined();
    });
  });

  describe('File Size Limits', () => {
    it('should reject files exceeding size limit', async () => {
      // Create a large string (11MB, exceeds default 10MB limit)
      const largeContent = 'x'.repeat(11 * 1024 * 1024);
      
      await expect(
        workspaceService.writeFile(path.join('test-security', 'large.txt'), largeContent)
      ).rejects.toThrow('File too large');
    });

    it('should accept files within size limit', async () => {
      // 1MB file
      const normalContent = 'x'.repeat(1024 * 1024);
      
      await expect(
        workspaceService.writeFile(path.join('test-security', 'normal.txt'), normalContent)
      ).resolves.toBeDefined();
    });
  });

  describe('Exclude Patterns', () => {
    it('should exclude .env files from listing', async () => {
      // Create a .env file directly via fs (bypassing workspace service)
      const envPath = path.join(testWorkspaceRoot, '.env');
      await fs.writeFile(envPath, 'SECRET=test', 'utf8');

      // List files
      const files = await workspaceService.listFiles('test-security');
      
      // .env should not be in the list
      const envFile = files.find(f => f.name === '.env');
      expect(envFile).toBeUndefined();

      // Cleanup
      await fs.unlink(envPath);
    });

    it('should exclude node_modules from tree', async () => {
      // Create node_modules directory
      const nodeModulesPath = path.join(testWorkspaceRoot, 'node_modules');
      await fs.mkdir(nodeModulesPath, { recursive: true });
      await fs.writeFile(path.join(nodeModulesPath, 'package.json'), '{}', 'utf8');

      // Get file tree
      const tree = await workspaceService.getFileTree('test-security');
      
      // node_modules should not be in the tree
      const nodeModules = tree.find(f => f.name === 'node_modules');
      expect(nodeModules).toBeUndefined();

      // Cleanup
      await fs.rm(nodeModulesPath, { recursive: true, force: true });
    });
  });
});
