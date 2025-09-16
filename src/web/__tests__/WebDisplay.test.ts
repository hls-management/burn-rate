import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebDisplay, WebDisplayConfig } from '../WebDisplay.js';
import { GameState, CombatEvent, FleetComposition } from '../../models/GameState.js';
import { PlayerState } from '../../models/PlayerState.js';

// Mock DOM environment
const mockContainer = {
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  appendChild: vi.fn(),
  innerHTML: '',
  children: []
};

// Mock document
global.document = {
  getElementById: vi.fn(() => mockContainer),
  createElement: vi.fn(() => ({
    className: '',
    innerHTML: '',
    textContent: '',
    appendChild: vi.fn(),
    addEventListener: vi.fn(),
    scrollIntoView: vi.fn(),
    remove: vi.fn(),
    classList: {
      toggle: vi.fn()
    },
    dataset: {}
  }))
} as any;

describe('WebDisplay', () => {
  let webDisplay: WebDisplay;
  let config: WebDisplayConfig;

  beforeEach(() => {
    config = {
      containerId: 'test-container',
      showAnimations: true,
      theme: 'dark'
    };
    
    // Reset mocks
    vi.clearAllMocks();
    mockContainer.querySelector.mockReturnValue({
      innerHTML: '',
      textContent: '',
      appendChild: vi.fn(),
      children: [],
      scrollIntoView: vi.fn()
    });
    
    webDisplay = new WebDisplay(config);
  });

  describe('Constructor', () => {
    it('should create WebDisplay instance with valid container', () => {
      expect(webDisplay).toBeInstanceOf(WebDisplay);
    });

    it('should throw error if container not found', () => {
      (document.getElementById as any).mockReturnValue(null);
      
      expect(() => {
        new WebDisplay({ containerId: 'non-existent' });
      }).toThrow("Container element with id 'non-existent' not found");
    });
  });

  describe('displayGameState', () => {
    it('should update game state display without errors', () => {
      const mockGameState: Partial<GameState> = {
        turn: 5,
        gamePhase: 'mid',
        isGameOver: false,
        player: {
          resources: {
            metal: 5000,
            energy: 3000,
            metalIncome: 500,
            energyIncome: 400
          },
          fleet: {
            homeSystem: {
              frigates: 10,
              cruisers: 5,
              battleships: 2
            },
            inTransit: {
              outbound: []
            }
          },
          economy: {
            constructionQueue: [],
            reactors: 2,
            mines: 3
          },
          intelligence: {
            lastScanTurn: 0,
            knownEnemyFleet: {
              frigates: 0,
              cruisers: 0,
              battleships: 0
            }
          }
        } as PlayerState
      };

      expect(() => {
        webDisplay.displayGameState(mockGameState as GameState);
      }).not.toThrow();
    });
  });

  describe('displayCombatResults', () => {
    it('should display combat events', () => {
      const mockEvents: CombatEvent[] = [{
        turn: 3,
        attacker: 'player',
        attackerFleet: { frigates: 5, cruisers: 2, battleships: 1 },
        defenderFleet: { frigates: 3, cruisers: 1, battleships: 0 },
        outcome: 'decisive_attacker',
        casualties: {
          attacker: { frigates: 1, cruisers: 0, battleships: 0 },
          defender: { frigates: 2, cruisers: 1, battleships: 0 }
        },
        survivors: {
          attacker: { frigates: 4, cruisers: 2, battleships: 1 },
          defender: { frigates: 1, cruisers: 0, battleships: 0 }
        }
      }];

      const mockCombatContainer = {
        appendChild: jest.fn(),
        children: []
      };
      mockContainer.querySelector.mockReturnValue(mockCombatContainer);

      expect(() => {
        webDisplay.displayCombatResults(mockEvents);
      }).not.toThrow();
      
      expect(mockCombatContainer.appendChild).toHaveBeenCalled();
    });
  });

  describe('displayError', () => {
    it('should display error message', () => {
      const mockSystemLog = {
        appendChild: jest.fn(),
        children: []
      };
      mockContainer.querySelector.mockReturnValue(mockSystemLog);

      expect(() => {
        webDisplay.displayError('Test error message');
      }).not.toThrow();
      
      expect(mockSystemLog.appendChild).toHaveBeenCalled();
    });
  });

  describe('displaySuccess', () => {
    it('should display success message', () => {
      const mockSystemLog = {
        appendChild: jest.fn(),
        children: []
      };
      mockContainer.querySelector.mockReturnValue(mockSystemLog);

      expect(() => {
        webDisplay.displaySuccess('Test success message');
      }).not.toThrow();
      
      expect(mockSystemLog.appendChild).toHaveBeenCalled();
    });
  });

  describe('initializeCommandInterface', () => {
    it('should initialize command interface without errors', () => {
      const mockTabButtons = [
        { addEventListener: vi.fn(), dataset: { tab: 'build' } },
        { addEventListener: vi.fn(), dataset: { tab: 'attack' } },
        { addEventListener: vi.fn(), dataset: { tab: 'scan' } }
      ];
      
      const mockPanels = [
        { innerHTML: '', querySelector: vi.fn() },
        { innerHTML: '', querySelector: vi.fn() },
        { innerHTML: '', querySelector: vi.fn() }
      ];

      mockContainer.querySelectorAll.mockReturnValue(mockTabButtons);
      mockContainer.querySelector
        .mockReturnValueOnce(mockPanels[0])  // build panel
        .mockReturnValueOnce(mockPanels[1])  // attack panel
        .mockReturnValueOnce(mockPanels[2]); // scan panel

      expect(() => {
        webDisplay.initializeCommandInterface();
      }).not.toThrow();
      
      // Verify event listeners were added
      mockTabButtons.forEach(button => {
        expect(button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      });
    });
  });

  describe('updateResourceDisplay', () => {
    it('should update resource display with proper formatting', () => {
      const mockResourcesDisplay = {
        innerHTML: ''
      };
      mockContainer.querySelector.mockReturnValue(mockResourcesDisplay);

      const resources = {
        metal: 12500,
        energy: 8750,
        metalIncome: 650,
        energyIncome: -200
      };

      webDisplay.updateResourceDisplay(resources);

      expect(mockResourcesDisplay.innerHTML).toContain('12,500');
      expect(mockResourcesDisplay.innerHTML).toContain('8,750');
      expect(mockResourcesDisplay.innerHTML).toContain('+650');
      expect(mockResourcesDisplay.innerHTML).toContain('-200');
      expect(mockResourcesDisplay.innerHTML).toContain('stalled');
    });
  });
});