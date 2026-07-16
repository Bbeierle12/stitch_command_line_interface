import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import ignore from 'ignore';

export type FileNodeType = 'file' | 'directory';

export interface FileNode {
  name: string;
  path: string;
  absolutePath: string;
  type: FileNodeType;
  size?: number;
  children?: FileNode[];
}

export interface FlatFileNode extends FileNode {
  depth: number;
}

export interface WorkspaceSnapshot {
  root: string;
  tree: FileNode[];
  flat: FlatFileNode[];
}

const DEFAULT_IGNORES = [
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.cache',
  '.DS_Store'
];

const TEXT_EXTENSIONS = new Set([
  '.c',
  '.css',
  '.go',
  '.h',
  '.html',
  '.java',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.py',
  '.rs',
  '.sh',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml'
]);

export function resolveWorkspaceRoot(inputPath: string): string {
  return path.resolve(process.cwd(), inputPath);
}

export function assertInsideWorkspace(root: string, targetPath: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, targetPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes workspace: ${targetPath}`);
  }

  return resolvedTarget;
}

export async function readWorkspaceSnapshot(root: string, maxDepth = 4): Promise<WorkspaceSnapshot> {
  const resolvedRoot = path.resolve(root);
  const matcher = await createIgnoreMatcher(resolvedRoot);
  const tree = await listDirectory(resolvedRoot, resolvedRoot, matcher, maxDepth, 0);
  const flat = flattenTree(tree);

  return {
    root: resolvedRoot,
    tree,
    flat
  };
}

export async function readTextFile(root: string, relativePath: string, maxBytes = 80_000): Promise<string> {
  const absolutePath = assertInsideWorkspace(root, relativePath);
  const info = await stat(absolutePath);

  if (!info.isFile()) {
    throw new Error(`Not a file: ${relativePath}`);
  }

  if (info.size > maxBytes) {
    return `[File is ${info.size.toLocaleString()} bytes. Preview skipped.]`;
  }

  if (!looksTextual(absolutePath)) {
    return '[Binary or unsupported file type. Preview skipped.]';
  }

  return readFile(absolutePath, 'utf8');
}

function flattenTree(nodes: FileNode[], depth = 0): FlatFileNode[] {
  const output: FlatFileNode[] = [];

  for (const node of nodes) {
    output.push({...node, depth});
    if (node.children) {
      output.push(...flattenTree(node.children, depth + 1));
    }
  }

  return output;
}

async function createIgnoreMatcher(root: string) {
  const matcher = ignore().add(DEFAULT_IGNORES);

  try {
    const gitignore = await readFile(path.join(root, '.gitignore'), 'utf8');
    matcher.add(gitignore);
  } catch {
    // Workspaces do not need a .gitignore.
  }

  return matcher;
}

async function listDirectory(
  root: string,
  currentDirectory: string,
  matcher: ReturnType<typeof ignore>,
  maxDepth: number,
  depth: number
): Promise<FileNode[]> {
  if (depth > maxDepth) {
    return [];
  }

  const entries = await readdir(currentDirectory, {withFileTypes: true});
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDirectory, entry.name);
    const relativePath = path.relative(root, absolutePath) || entry.name;

    if (matcher.ignores(relativePath)) {
      continue;
    }

    const info = await stat(absolutePath);
    const node: FileNode = {
      name: entry.name,
      path: relativePath,
      absolutePath,
      type: entry.isDirectory() ? 'directory' : 'file',
      size: entry.isFile() ? info.size : undefined
    };

    if (entry.isDirectory()) {
      node.children = await listDirectory(root, absolutePath, matcher, maxDepth, depth + 1);
    }

    nodes.push(node);
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

function looksTextual(filePath: string): boolean {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}
