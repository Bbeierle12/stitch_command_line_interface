import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {
  type FlatFileNode,
  type StitchCommand,
  discoverCommands,
  findCommand,
  readTextFile,
  readWorkspaceSnapshot,
  runCommand
} from '@stitch/core';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

interface AppProps {
  root: string;
  maxDepth: number;
}

interface LogEntry {
  level: 'info' | 'error' | 'success';
  message: string;
}

export function App({root, maxDepth}: AppProps) {
  const {exit} = useApp();
  const [files, setFiles] = useState<FlatFileNode[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [preview, setPreview] = useState('Loading workspace...');
  const [commands, setCommands] = useState<StitchCommand[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [runningCommandId, setRunningCommandId] = useState<string | null>(null);

  const selectedFile = files[selectedFileIndex];
  const filteredCommands = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) {
      return commands;
    }

    return commands.filter(command =>
      command.label.toLowerCase().includes(query) ||
      command.id.toLowerCase().includes(query)
    );
  }, [commandQuery, commands]);

  const addLog = (level: LogEntry['level'], message: string) => {
    setLogs(previous => [...previous.slice(-7), {level, message}]);
  };

  const refreshWorkspace = async () => {
    try {
      const snapshot = await readWorkspaceSnapshot(root, maxDepth);
      setFiles(snapshot.flat);
      setSelectedFileIndex(index => Math.min(index, Math.max(snapshot.flat.length - 1, 0)));
      setCommands(await discoverCommands(root));
      addLog('success', `Loaded ${snapshot.flat.length} workspace entries`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read workspace';
      setPreview(message);
      addLog('error', message);
    }
  };

  const refreshPreview = async (node: FlatFileNode | undefined) => {
    if (!node) {
      setPreview('No file selected.');
      return;
    }

    if (node.type === 'directory') {
      setPreview(`[Directory] ${node.path}`);
      return;
    }

    try {
      setPreview(await readTextFile(root, node.path));
    } catch (error) {
      setPreview(error instanceof Error ? error.message : 'Unable to preview file');
    }
  };

  const editSelectedFile = async () => {
    if (!selectedFile || selectedFile.type !== 'file') {
      addLog('info', 'Select a file before opening the editor');
      return;
    }

    const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
    addLog('info', `Opening ${selectedFile.path} in ${editor}`);

    const wasRaw = process.stdin.isRaw;
    if (wasRaw) {
      process.stdin.setRawMode(false);
    }

    spawnSync(editor, [path.join(root, selectedFile.path)], {
      stdio: 'inherit'
    });

    if (wasRaw) {
      process.stdin.setRawMode(true);
    }

    await refreshWorkspace();
    await refreshPreview(selectedFile);
  };

  const executeCommand = async (commandId: string) => {
    const command = findCommand(commands, commandId);
    if (!command || runningCommandId) {
      return;
    }

    setPaletteOpen(false);
    setCommandQuery('');
    setRunningCommandId(command.id);
    addLog('info', `Running ${command.label}`);

    const result = await runCommand(root, command);
    const status = result.code === 0 ? 'success' : 'error';
    const output = result.output || `[No output, exit code ${result.code ?? 'unknown'}]`;
    setPreview(output);
    addLog(status, `${command.label} exited ${result.code ?? result.signal ?? 'unknown'}`);
    setRunningCommandId(null);
  };

  useEffect(() => {
    void refreshWorkspace();
  }, [root, maxDepth]);

  useEffect(() => {
    void refreshPreview(selectedFile);
  }, [selectedFile?.path]);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (paletteOpen) {
      if (key.escape) {
        setPaletteOpen(false);
        setCommandQuery('');
        setSelectedCommandIndex(0);
        return;
      }

      if (key.upArrow) {
        setSelectedCommandIndex(index => Math.max(index - 1, 0));
        return;
      }

      if (key.downArrow) {
        setSelectedCommandIndex(index => Math.min(index + 1, Math.max(filteredCommands.length - 1, 0)));
        return;
      }

      if (key.return) {
        const command = filteredCommands[selectedCommandIndex];
        if (command) {
          void executeCommand(command.id);
        }
        return;
      }

      if (key.backspace || key.delete) {
        setCommandQuery(query => query.slice(0, -1));
        setSelectedCommandIndex(0);
        return;
      }

      if (input && !key.ctrl && !key.meta) {
        setCommandQuery(query => query + input);
        setSelectedCommandIndex(0);
      }

      return;
    }

    if (input === 'q') {
      exit();
      return;
    }

    if (input === 'c' || (key.ctrl && input === 'k')) {
      setPaletteOpen(true);
      setSelectedCommandIndex(0);
      return;
    }

    if (input === 'e') {
      void editSelectedFile();
      return;
    }

    if (input === 'g') {
      void refreshWorkspace();
      return;
    }

    if (key.upArrow) {
      setSelectedFileIndex(index => Math.max(index - 1, 0));
      return;
    }

    if (key.downArrow) {
      setSelectedFileIndex(index => Math.min(index + 1, Math.max(files.length - 1, 0)));
      return;
    }

    if (key.return) {
      void refreshPreview(selectedFile);
    }
  });

  return (
    <Box flexDirection="column" minHeight={24}>
      <Header root={root} running={runningCommandId !== null} />
      <Box flexGrow={1}>
        <FilePane files={files} selectedIndex={selectedFileIndex} />
        <PreviewPane selectedFile={selectedFile} preview={preview} />
      </Box>
      <LogPane logs={logs} />
      <HelpLine paletteOpen={paletteOpen} />
      {paletteOpen && (
        <CommandPalette
          commands={filteredCommands}
          query={commandQuery}
          selectedIndex={selectedCommandIndex}
          runningCommandId={runningCommandId}
        />
      )}
    </Box>
  );
}

function Header({root, running}: {root: string; running: boolean}) {
  return (
    <Box borderStyle="single" paddingX={1}>
      <Text color="cyan">stitch</Text>
      <Text>  </Text>
      <Text>{root}</Text>
      {running && (
        <>
          <Text>  </Text>
          <Text color="yellow">running command...</Text>
        </>
      )}
    </Box>
  );
}

function FilePane({files, selectedIndex}: {files: FlatFileNode[]; selectedIndex: number}) {
  const visible = files.slice(Math.max(0, selectedIndex - 12), Math.max(24, selectedIndex + 12));

  return (
    <Box width={42} borderStyle="single" flexDirection="column" paddingX={1}>
      <Text color="cyan">Files</Text>
      {visible.map(node => {
        const selected = files[selectedIndex]?.path === node.path;
        const prefix = node.type === 'directory' ? '[d]' : '   ';
        const indent = '  '.repeat(node.depth);
        const label = `${indent}${prefix} ${node.name}`;

        return (
          <Text key={node.path} inverse={selected} color={node.type === 'directory' ? 'blue' : undefined}>
            {truncate(label, 38)}
          </Text>
        );
      })}
    </Box>
  );
}

function PreviewPane({selectedFile, preview}: {selectedFile: FlatFileNode | undefined; preview: string}) {
  const lines = preview.split('\n').slice(0, 22);

  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1} flexGrow={1}>
      <Text color="cyan">{selectedFile ? selectedFile.path : 'Preview'}</Text>
      {lines.map((line, index) => (
        <Text key={`${index}:${line}`}>{truncate(line.replace(/\t/g, '  '), 96)}</Text>
      ))}
    </Box>
  );
}

function LogPane({logs}: {logs: LogEntry[]}) {
  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1} height={6}>
      <Text color="cyan">Output</Text>
      {logs.length === 0 ? (
        <Text color="gray">No activity yet.</Text>
      ) : (
        logs.slice(-4).map((log, index) => (
          <Text key={`${index}:${log.message}`} color={log.level === 'error' ? 'red' : log.level === 'success' ? 'green' : undefined}>
            {truncate(log.message, 120)}
          </Text>
        ))
      )}
    </Box>
  );
}

function HelpLine({paletteOpen}: {paletteOpen: boolean}) {
  if (paletteOpen) {
    return (
      <Box paddingX={1}>
        <Text color="gray">Palette: type to filter, up/down select, enter run, esc close</Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1}>
      <Text color="gray">up/down select | enter preview | e edit | c or ctrl+k commands | g refresh | q quit</Text>
    </Box>
  );
}

function CommandPalette({
  commands,
  query,
  selectedIndex,
  runningCommandId
}: {
  commands: StitchCommand[];
  query: string;
  selectedIndex: number;
  runningCommandId: string | null;
}) {
  return (
    <Box borderStyle="double" flexDirection="column" paddingX={1}>
      <Text color="yellow">Command Palette: {query || '<all>'}</Text>
      {commands.length === 0 ? (
        <Text color="gray">No commands match.</Text>
      ) : (
        commands.slice(0, 8).map((command, index) => (
          <Text key={command.id} inverse={index === selectedIndex} color={command.risk === 'medium' ? 'yellow' : undefined}>
            {runningCommandId === command.id ? '* ' : '  '}
            {truncate(`${command.label}  (${command.command} ${command.args.join(' ')})`, 110)}
          </Text>
        ))
      )}
    </Box>
  );
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}
