import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

export interface StitchCommand {
  id: string;
  label: string;
  command: string;
  args: string[];
  risk: 'low' | 'medium';
}

export interface CommandResult {
  id: string;
  code: number | null;
  signal: NodeJS.Signals | null;
  output: string;
}

const MAX_OUTPUT_BYTES = 120_000;

export async function discoverCommands(root: string): Promise<StitchCommand[]> {
  const commands: StitchCommand[] = [
    {
      id: 'git-status',
      label: 'Git status',
      command: 'git',
      args: ['status', '--short', '--branch'],
      risk: 'low'
    },
    {
      id: 'git-diff',
      label: 'Git diff',
      command: 'git',
      args: ['diff', '--stat'],
      risk: 'low'
    }
  ];

  const packageJson = await readPackageJson(root);
  const scripts = packageJson?.scripts ?? {};

  for (const scriptName of ['test', 'build', 'lint', 'typecheck']) {
    if (typeof scripts[scriptName] === 'string') {
      commands.push({
        id: `npm-${scriptName}`,
        label: `npm run ${scriptName}`,
        command: 'npm',
        args: scriptName === 'test' ? ['test'] : ['run', scriptName],
        risk: scriptName === 'test' ? 'low' : 'medium'
      });
    }
  }

  return commands;
}

export function findCommand(commands: StitchCommand[], id: string): StitchCommand | undefined {
  return commands.find(command => command.id === id);
}

export function runCommand(root: string, command: StitchCommand): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command.command, command.args, {
      cwd: root,
      env: process.env,
      shell: false
    });

    let output = '';
    const append = (chunk: Buffer) => {
      output += chunk.toString();
      if (Buffer.byteLength(output, 'utf8') > MAX_OUTPUT_BYTES) {
        output = output.slice(-MAX_OUTPUT_BYTES);
      }
    };

    child.stdout.on('data', append);
    child.stderr.on('data', append);

    child.on('error', error => {
      resolve({
        id: command.id,
        code: 1,
        signal: null,
        output: error.message
      });
    });

    child.on('close', (code, signal) => {
      resolve({
        id: command.id,
        code,
        signal,
        output: output.trimEnd()
      });
    });
  });
}

async function readPackageJson(root: string): Promise<{scripts?: Record<string, unknown>} | undefined> {
  try {
    const content = await readFile(path.join(root, 'package.json'), 'utf8');
    return JSON.parse(content) as {scripts?: Record<string, unknown>};
  } catch {
    return undefined;
  }
}
