import { EventStore } from 'applesauce-core';
import { RelayPool } from 'applesauce-relay';

/**
 * Singleton instances for Applesauce core functionality
 * These should be imported and used throughout the application
 */

// Central event storage
export const eventStore = new EventStore();

// Relay pool for managing connections
export const relayPool = new RelayPool();