/**
 * useWebSocket Hook
 * Provides React integration for WebSocket real-time updates
 */

import { useEffect, useCallback, useState } from 'react';
import { wsClient, MessageHandler } from '../services/wsClient';

export interface UseWebSocketOptions<T> {
  /** Message type to subscribe to */
  type: string;
  /** Handler for incoming messages */
  onMessage?: (data: T) => void;
  /** Whether to automatically connect */
  autoConnect?: boolean;
  /** Initial data */
  initialData?: T;
}

export function useWebSocket<T = unknown>(options: UseWebSocketOptions<T>) {
  const { type, onMessage, autoConnect = true, initialData } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);

  // Handle incoming messages
  const handleMessage = useCallback<MessageHandler<T>>((messageData) => {
    setData(messageData);
    onMessage?.(messageData);
  }, [onMessage]);

  // Handle connection status
  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setError(null);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  const handleError = useCallback((err: Event) => {
    setError(err);
  }, []);

  // Subscribe to WebSocket events
  useEffect(() => {
    // Subscribe to message type
    const unsubscribeMessage = wsClient.on<T>(type, handleMessage);
    
    // Subscribe to connection events
    const unsubscribeConnect = wsClient.onConnect(handleConnect);
    const unsubscribeDisconnect = wsClient.onDisconnect(handleDisconnect);
    const unsubscribeError = wsClient.onError(handleError);

    // Auto-connect if enabled
    if (autoConnect && !wsClient.isConnected()) {
      wsClient.connect();
    }

    // Update initial connection state
    setIsConnected(wsClient.isConnected());

    // Cleanup
    return () => {
      unsubscribeMessage();
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
    };
  }, [type, handleMessage, handleConnect, handleDisconnect, handleError, autoConnect]);

  // Send message helper
  const send = useCallback(<D = unknown>(data: D) => {
    wsClient.send(type, data);
  }, [type]);

  return {
    data,
    isConnected,
    error,
    send,
    connect: () => wsClient.connect(),
    disconnect: () => wsClient.disconnect(),
  };
}

/**
 * Hook for subscribing to log streams
 */
export function useLogStream() {
  return useWebSocket<{ level: string; message: string; timestamp: string }>({
    type: 'log',
    autoConnect: true,
  });
}

/**
 * Hook for subscribing to metrics updates
 */
export interface MetricsUpdate {
  cpu: number;
  memory: number;
  temperature: number;
  timestamp: string;
}

export function useMetricsStream() {
  return useWebSocket<MetricsUpdate>({
    type: 'metrics',
    autoConnect: true,
  });
}

/**
 * Hook for subscribing to command execution output
 */
export interface CommandOutput {
  commandId: string;
  output: string;
  exitCode?: number;
  timestamp: string;
}

export function useCommandStream() {
  return useWebSocket<CommandOutput>({
    type: 'command_output',
    autoConnect: true,
  });
}
