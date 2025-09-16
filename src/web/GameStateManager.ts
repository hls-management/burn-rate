import { GameState } from '../models/GameState.js';
import { validateGameState, ValidationResult } from '../models/validation.js';
import { WebErrorHandler } from './WebErrorHandler.js';

/**
 * Configuration options for GameStateManager
 */
export interface GameStateManagerConfig {
  storageKey?: string;
  enableCompression?: boolean;
  maxStoredStates?: number;
  autoSave?: boolean;
}

/**
 * Result of save/load operations
 */
export interface StorageResult {
  success: boolean;
  error?: string;
  data?: GameState;
}

/**
 * Manages game state persistence and recovery for browser environment
 */
export class GameStateManager {
  private readonly storageKey: string;
  private readonly enableCompression: boolean;
  private readonly maxStoredStates: number;
  private readonly autoSave: boolean;

  constructor(config: GameStateManagerConfig = {}) {
    this.storageKey = config.storageKey || 'burn-rate-game-state';
    this.enableCompression = config.enableCompression || false;
    this.maxStoredStates = config.maxStoredStates || 5;
    this.autoSave = config.autoSave || true;
  }

  /**
   * Saves the current game state to localStorage
   */
  public saveGameState(gameState: GameState): StorageResult {
    try {
      // Validate game state before saving
      const validation = validateGameState(gameState);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid game state: ${validation.errors.join(', ')}`
        };
      }

      // Prepare save data with metadata
      const saveData = {
        gameState,
        timestamp: Date.now(),
        version: '1.0.0',
        turn: gameState.turn
      };

      // Convert to JSON string
      let serializedData = JSON.stringify(saveData);

      // Apply compression if enabled
      if (this.enableCompression) {
        serializedData = this.compressData(serializedData);
      }

      // Save to localStorage
      localStorage.setItem(this.storageKey, serializedData);

      // Manage multiple saved states if configured
      if (this.maxStoredStates > 1) {
        this.manageStoredStates(saveData);
      }

      return { success: true };

    } catch (error) {
      const errorMessage = `Failed to save game state: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (error instanceof Error) {
        WebErrorHandler.handleStorageError(error, 'saveGameState');
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Loads the game state from localStorage
   */
  public loadGameState(): StorageResult {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      
      if (!storedData) {
        return {
          success: false,
          error: 'No saved game state found'
        };
      }

      // Decompress if needed
      let serializedData = storedData;
      if (this.enableCompression) {
        serializedData = this.decompressData(storedData);
      }

      // Parse JSON data
      const saveData = JSON.parse(serializedData);

      // Validate save data structure
      if (!saveData.gameState || !saveData.timestamp) {
        return {
          success: false,
          error: 'Invalid save data format'
        };
      }

      // Validate the game state
      const validation = validateGameState(saveData.gameState);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Corrupted game state: ${validation.errors.join(', ')}`
        };
      }

      return {
        success: true,
        data: saveData.gameState
      };

    } catch (error) {
      const errorMessage = `Failed to load game state: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (error instanceof Error) {
        WebErrorHandler.handleStorageError(error, 'loadGameState');
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Checks if there is a valid saved game state
   */
  public hasValidSavedState(): boolean {
    const result = this.loadGameState();
    return result.success && result.data !== undefined;
  }

  /**
   * Clears all saved game state data
   */
  public clearSavedState(): StorageResult {
    try {
      localStorage.removeItem(this.storageKey);
      
      // Clear multiple states if configured
      if (this.maxStoredStates > 1) {
        for (let i = 1; i < this.maxStoredStates; i++) {
          localStorage.removeItem(`${this.storageKey}-${i}`);
        }
      }

      return { success: true };

    } catch (error) {
      const errorMessage = `Failed to clear saved state: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (error instanceof Error) {
        WebErrorHandler.handleStorageError(error, 'clearSavedState');
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Gets information about saved states
   */
  public getSavedStateInfo(): { hasSavedState: boolean; lastSaved?: Date; turn?: number } {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      
      if (!storedData) {
        return { hasSavedState: false };
      }

      let serializedData = storedData;
      if (this.enableCompression) {
        serializedData = this.decompressData(storedData);
      }

      const saveData = JSON.parse(serializedData);
      
      return {
        hasSavedState: true,
        lastSaved: new Date(saveData.timestamp),
        turn: saveData.turn
      };

    } catch (error) {
      return { hasSavedState: false };
    }
  }

  /**
   * Handles page refresh scenario by checking for saved state
   */
  public handlePageRefresh(): StorageResult {
    if (!this.hasValidSavedState()) {
      return {
        success: false,
        error: 'No valid saved state found for recovery'
      };
    }

    return this.loadGameState();
  }

  /**
   * Creates a backup of the current state before making changes
   */
  public createBackup(gameState: GameState): StorageResult {
    try {
      const backupKey = `${this.storageKey}-backup-${Date.now()}`;
      const backupData = {
        gameState,
        timestamp: Date.now(),
        isBackup: true
      };

      localStorage.setItem(backupKey, JSON.stringify(backupData));

      // Clean up old backups (keep only last 3)
      this.cleanupOldBackups();

      return { success: true };

    } catch (error) {
      const errorMessage = `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (error instanceof Error) {
        WebErrorHandler.handleStorageError(error, 'createBackup');
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validates localStorage availability and functionality
   */
  public validateStorageAvailability(): ValidationResult {
    const errors: string[] = [];

    try {
      // Test localStorage availability
      if (typeof localStorage === 'undefined') {
        errors.push('localStorage is not supported in this browser');
      }

      // Test write/read functionality
      const testKey = `${this.storageKey}-test`;
      const testData = 'test-data';
      
      localStorage.setItem(testKey, testData);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved !== testData) {
        errors.push('localStorage read/write test failed');
      }

      // Check available storage space (approximate)
      const testLargeData = 'x'.repeat(1024 * 1024); // 1MB test
      try {
        localStorage.setItem(`${testKey}-large`, testLargeData);
        localStorage.removeItem(`${testKey}-large`);
      } catch (e) {
        errors.push('Insufficient localStorage space available');
      }

    } catch (error) {
      errors.push(`localStorage validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Manages multiple stored states by rotating old saves
   */
  private manageStoredStates(newSaveData: any): void {
    try {
      // Shift existing saves
      for (let i = this.maxStoredStates - 1; i > 0; i--) {
        const currentKey = i === 1 ? this.storageKey : `${this.storageKey}-${i - 1}`;
        const nextKey = `${this.storageKey}-${i}`;
        
        const existingData = localStorage.getItem(currentKey);
        if (existingData) {
          localStorage.setItem(nextKey, existingData);
        }
      }
    } catch (error) {
      // Silently fail - not critical for game functionality
      console.warn('Failed to manage stored states:', error);
    }
  }

  /**
   * Cleans up old backup files to prevent storage bloat
   */
  private cleanupOldBackups(): void {
    try {
      const backupKeys: string[] = [];
      
      // Find all backup keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${this.storageKey}-backup-`)) {
          backupKeys.push(key);
        }
      }

      // Sort by timestamp (newest first)
      backupKeys.sort((a, b) => {
        const timestampA = parseInt(a.split('-').pop() || '0');
        const timestampB = parseInt(b.split('-').pop() || '0');
        return timestampB - timestampA;
      });

      // Remove old backups (keep only 3 most recent)
      for (let i = 3; i < backupKeys.length; i++) {
        localStorage.removeItem(backupKeys[i]);
      }

    } catch (error) {
      // Silently fail - not critical for game functionality
      console.warn('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Simple compression using basic string manipulation
   * Note: In production, consider using a proper compression library
   */
  private compressData(data: string): string {
    // Simple run-length encoding for repeated characters
    return data.replace(/(.)\1{2,}/g, (match, char) => {
      return `${char}${match.length}${char}`;
    });
  }

  /**
   * Decompresses data compressed with compressData
   */
  private decompressData(compressedData: string): string {
    // Reverse the simple run-length encoding
    return compressedData.replace(/(.)\d+\1/g, (match, char) => {
      const count = parseInt(match.slice(1, -1));
      return char.repeat(count);
    });
  }
}