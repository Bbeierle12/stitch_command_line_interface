#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import {Command} from 'commander';
import {resolveWorkspaceRoot} from '@stitch/core';
import {App} from './ui/App.js';

const program = new Command()
  .name('stitch')
  .description('Terminal-first IDE for local code workspaces')
  .argument('[workspace]', 'workspace directory', '.')
  .option('--depth <number>', 'maximum file tree depth', '4')
  .parse(process.argv);

const workspaceArg = program.args[0] ?? '.';
const options = program.opts<{depth: string}>();
const depth = Number.parseInt(options.depth, 10);
const root = resolveWorkspaceRoot(workspaceArg);

render(<App root={root} maxDepth={Number.isFinite(depth) ? depth : 4} />);
