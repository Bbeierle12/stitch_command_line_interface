/**
 * Deployment Service
 * Provides deployment automation: build, test, deploy to various platforms
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { gitService } from './gitService';
import { logger } from '../utils/logger';
import { workspaceService } from './workspaceService';
import path from 'path';
import fs from 'fs/promises';

export interface DeploymentConfig {
  platform: 'docker' | 'kubernetes' | 'vercel' | 'netlify' | 'aws' | 'custom';
  environment: 'development' | 'staging' | 'production';
  branch?: string;
  buildCommand?: string;
  testCommand?: string;
  deployCommand?: string;
  envVars?: Record<string, string>;
}

export interface DeploymentStatus {
  id: string;
  status: 'pending' | 'building' | 'testing' | 'deploying' | 'success' | 'failed';
  platform: string;
  environment: string;
  startTime: Date;
  endTime?: Date;
  logs: string[];
  error?: string;
  url?: string;
}

/**
 * Deployment Service
 */
export class DeploymentService extends EventEmitter {
  private activeDeployments: Map<string, DeploymentStatus> = new Map();
  private nextDeploymentId = 1;

  constructor() {
    super();
  }

  /**
   * Deploy application
   */
  async deploy(config: DeploymentConfig): Promise<DeploymentStatus> {
    const deployment: DeploymentStatus = {
      id: `deploy-${this.nextDeploymentId++}`,
      status: 'pending',
      platform: config.platform,
      environment: config.environment,
      startTime: new Date(),
      logs: [],
    };

    this.activeDeployments.set(deployment.id, deployment);
    this.emit('deployment:started', deployment);

    try {
      // Step 1: Verify Git repository
      await this.verifyRepository(deployment);

      // Step 2: Checkout branch
      if (config.branch) {
        await this.checkoutBranch(deployment, config.branch);
      }

      // Step 3: Build
      if (config.buildCommand) {
        await this.build(deployment, config.buildCommand, config.envVars);
      }

      // Step 4: Test
      if (config.testCommand) {
        await this.test(deployment, config.testCommand);
      }

      // Step 5: Deploy
      await this.deployToPlatform(deployment, config);

      deployment.status = 'success';
      deployment.endTime = new Date();
      this.emit('deployment:success', deployment);
      
      logger.info(`Deployment ${deployment.id} completed successfully`);
      return deployment;
    } catch (error) {
      deployment.status = 'failed';
      deployment.endTime = new Date();
      deployment.error = error instanceof Error ? error.message : 'Deployment failed';
      
      this.emit('deployment:failed', deployment);
      logger.error(`Deployment ${deployment.id} failed:`, error);
      
      throw error;
    }
  }

  /**
   * Verify Git repository
   */
  private async verifyRepository(deployment: DeploymentStatus): Promise<void> {
    deployment.logs.push('Verifying Git repository...');
    this.emit('deployment:log', { id: deployment.id, log: 'Verifying Git repository...' });

    const isRepo = await gitService.isRepo();
    if (!isRepo) {
      throw new Error('Not a Git repository');
    }

    // Check for uncommitted changes
    const status = await gitService.status();
    if (status.files.length > 0) {
      deployment.logs.push(`Warning: ${status.files.length} uncommitted changes`);
      this.emit('deployment:log', { 
        id: deployment.id, 
        log: `Warning: ${status.files.length} uncommitted changes` 
      });
    }
  }

  /**
   * Checkout branch
   */
  private async checkoutBranch(deployment: DeploymentStatus, branch: string): Promise<void> {
    deployment.logs.push(`Checking out branch: ${branch}`);
    this.emit('deployment:log', { id: deployment.id, log: `Checking out branch: ${branch}` });

    try {
      await gitService.checkout(branch);
    } catch (error) {
      throw new Error(`Failed to checkout branch ${branch}: ${error}`);
    }
  }

  /**
   * Build application
   */
  private async build(
    deployment: DeploymentStatus,
    buildCommand: string,
    envVars?: Record<string, string>
  ): Promise<void> {
    deployment.status = 'building';
    deployment.logs.push(`Building: ${buildCommand}`);
    this.emit('deployment:log', { id: deployment.id, log: `Building: ${buildCommand}` });

    await this.runCommand(deployment, buildCommand, envVars);
  }

  /**
   * Run tests
   */
  private async test(deployment: DeploymentStatus, testCommand: string): Promise<void> {
    deployment.status = 'testing';
    deployment.logs.push(`Testing: ${testCommand}`);
    this.emit('deployment:log', { id: deployment.id, log: `Testing: ${testCommand}` });

    await this.runCommand(deployment, testCommand);
  }

  /**
   * Deploy to platform
   */
  private async deployToPlatform(
    deployment: DeploymentStatus,
    config: DeploymentConfig
  ): Promise<void> {
    deployment.status = 'deploying';
    
    switch (config.platform) {
      case 'docker':
        await this.deployToDocker(deployment, config);
        break;
      case 'kubernetes':
        await this.deployToKubernetes(deployment, config);
        break;
      case 'vercel':
        await this.deployToVercel(deployment, config);
        break;
      case 'netlify':
        await this.deployToNetlify(deployment, config);
        break;
      case 'aws':
        await this.deployToAWS(deployment, config);
        break;
      case 'custom':
        if (config.deployCommand) {
          await this.runCommand(deployment, config.deployCommand, config.envVars);
        }
        break;
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
  }

  /**
   * Deploy to Docker
   */
  private async deployToDocker(
    deployment: DeploymentStatus,
    config: DeploymentConfig
  ): Promise<void> {
    deployment.logs.push('Deploying to Docker...');
    this.emit('deployment:log', { id: deployment.id, log: 'Deploying to Docker...' });

    // Check for Dockerfile
    const dockerfilePath = path.join(workspaceService.getWorkspaceRoot(), 'Dockerfile');
    try {
      await fs.access(dockerfilePath);
    } catch {
      throw new Error('Dockerfile not found');
    }

    // Build Docker image
    const imageName = `app-${config.environment}:latest`;
    await this.runCommand(deployment, `docker build -t ${imageName} .`);

    // Run container
    const containerName = `app-${config.environment}`;
    await this.runCommand(
      deployment,
      `docker run -d --name ${containerName} -p 3000:3000 ${imageName}`
    );

    deployment.url = 'http://localhost:3000';
    deployment.logs.push(`Deployed to Docker: ${deployment.url}`);
  }

  /**
   * Deploy to Kubernetes
   */
  private async deployToKubernetes(
    deployment: DeploymentStatus,
    config: DeploymentConfig
  ): Promise<void> {
    deployment.logs.push('Deploying to Kubernetes...');
    this.emit('deployment:log', { id: deployment.id, log: 'Deploying to Kubernetes...' });

    // Check for k8s manifests
    const k8sDir = path.join(workspaceService.getWorkspaceRoot(), 'k8s');
    try {
      await fs.access(k8sDir);
    } catch {
      throw new Error('Kubernetes manifests not found in k8s/ directory');
    }

    // Apply manifests
    await this.runCommand(deployment, `kubectl apply -f k8s/ -n ${config.environment}`);
    
    deployment.logs.push('Deployed to Kubernetes');
  }

  /**
   * Deploy to Vercel
   */
  private async deployToVercel(
    deployment: DeploymentStatus,
    config: DeploymentConfig
  ): Promise<void> {
    deployment.logs.push('Deploying to Vercel...');
    this.emit('deployment:log', { id: deployment.id, log: 'Deploying to Vercel...' });

    const prodFlag = config.environment === 'production' ? '--prod' : '';
    await this.runCommand(deployment, `vercel ${prodFlag} --yes`);
    
    deployment.logs.push('Deployed to Vercel');
  }

  /**
   * Deploy to Netlify
   */
  private async deployToNetlify(
    deployment: DeploymentStatus,
    config: DeploymentConfig
  ): Promise<void> {
    deployment.logs.push('Deploying to Netlify...');
    this.emit('deployment:log', { id: deployment.id, log: 'Deploying to Netlify...' });

    const prodFlag = config.environment === 'production' ? '--prod' : '';
    await this.runCommand(deployment, `netlify deploy ${prodFlag}`);
    
    deployment.logs.push('Deployed to Netlify');
  }

  /**
   * Deploy to AWS
   */
  private async deployToAWS(
    deployment: DeploymentStatus,
    config: DeploymentConfig
  ): Promise<void> {
    deployment.logs.push('Deploying to AWS...');
    this.emit('deployment:log', { id: deployment.id, log: 'Deploying to AWS...' });

    // Check for AWS CDK or SAM
    const cdkPath = path.join(workspaceService.getWorkspaceRoot(), 'cdk.json');
    const samPath = path.join(workspaceService.getWorkspaceRoot(), 'template.yaml');

    try {
      await fs.access(cdkPath);
      // Deploy with CDK
      await this.runCommand(deployment, 'cdk deploy --require-approval never');
    } catch {
      try {
        await fs.access(samPath);
        // Deploy with SAM
        await this.runCommand(
          deployment,
          `sam deploy --stack-name app-${config.environment} --no-confirm-changeset`
        );
      } catch {
        throw new Error('No AWS deployment configuration found (cdk.json or template.yaml)');
      }
    }

    deployment.logs.push('Deployed to AWS');
  }

  /**
   * Run shell command
   */
  private async runCommand(
    deployment: DeploymentStatus,
    command: string,
    envVars?: Record<string, string>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      
      const childProcess: ChildProcess = spawn(cmd, args, {
        cwd: workspaceService.getWorkspaceRoot(),
        env: { ...process.env, ...envVars },
        shell: true,
      });

      childProcess.stdout?.on('data', (data) => {
        const log = data.toString();
        deployment.logs.push(log);
        this.emit('deployment:log', { id: deployment.id, log });
      });

      childProcess.stderr?.on('data', (data) => {
        const log = data.toString();
        deployment.logs.push(log);
        this.emit('deployment:log', { id: deployment.id, log });
      });

      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${command}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get deployment status
   */
  getDeployment(id: string): DeploymentStatus | undefined {
    return this.activeDeployments.get(id);
  }

  /**
   * List all deployments
   */
  listDeployments(): DeploymentStatus[] {
    return Array.from(this.activeDeployments.values());
  }

  /**
   * Cancel deployment
   */
  async cancelDeployment(id: string): Promise<void> {
    const deployment = this.activeDeployments.get(id);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    if (deployment.status === 'success' || deployment.status === 'failed') {
      throw new Error('Cannot cancel completed deployment');
    }

    deployment.status = 'failed';
    deployment.endTime = new Date();
    deployment.error = 'Cancelled by user';
    
    this.emit('deployment:cancelled', deployment);
    logger.info(`Deployment ${id} cancelled`);
  }

  /**
   * Quick deploy to Docker (default configuration)
   */
  async quickDeployDocker(environment: 'development' | 'staging' | 'production'): Promise<DeploymentStatus> {
    return this.deploy({
      platform: 'docker',
      environment,
      buildCommand: 'npm run build',
      testCommand: 'npm test',
    });
  }

  /**
   * Quick deploy to Vercel
   */
  async quickDeployVercel(environment: 'development' | 'staging' | 'production'): Promise<DeploymentStatus> {
    return this.deploy({
      platform: 'vercel',
      environment,
      buildCommand: 'npm run build',
    });
  }

  /**
   * CI/CD webhook trigger
   */
  async triggerCICD(webhook: string, data?: Record<string, any>): Promise<void> {
    logger.info(`Triggering CI/CD webhook: ${webhook}`);
    this.emit('deployment:log', { log: `Triggering CI/CD: ${webhook}` });

    // Send webhook request
    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    logger.info(`CI/CD triggered: ${webhook}`);
  }
}

// Singleton instance
export const deploymentService = new DeploymentService();
