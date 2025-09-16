/**
 * Main entry point for the web version of Burn Rate
 * This file initializes the web interface and starts the game
 */
// Import styles
import './styles/main.css';
// Placeholder for future web interface implementation
console.log('Burn Rate Web Version - Loading...');
// Basic DOM ready handler
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing web interface...');
    // Hide loading overlay once DOM is ready
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    // Basic tab functionality
    setupTabNavigation();
    // Basic modal functionality
    setupModalHandlers();
    console.log('Basic web interface initialized');
});
/**
 * Set up tab navigation for command panels
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const commandPanels = document.querySelectorAll('.command-panel');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            // Remove active class from all tabs and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            commandPanels.forEach(panel => panel.classList.remove('active'));
            // Add active class to clicked tab and corresponding panel
            button.classList.add('active');
            const targetPanel = document.getElementById(`${targetTab}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}
/**
 * Set up modal handlers
 */
function setupModalHandlers() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const helpBtn = document.getElementById('help-btn');
    const settingsBtn = document.getElementById('settings-btn');
    // Close modal handlers
    if (modalClose && modalOverlay) {
        modalClose.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });
    }
    // Help button handler
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            showModal('Help', getHelpContent());
        });
    }
    // Settings button handler
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            showModal('Settings', getSettingsContent());
        });
    }
}
/**
 * Show modal with title and content
 */
function showModal(title, content) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (modalOverlay && modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalOverlay.classList.remove('hidden');
    }
}
/**
 * Get help content
 */
function getHelpContent() {
    return `
        <h4>Game Commands</h4>
        <p><strong>Build:</strong> Construct units and structures to strengthen your forces.</p>
        <p><strong>Attack:</strong> Launch attacks against enemy positions.</p>
        <p><strong>Scan:</strong> Gather intelligence about enemy activities.</p>
        <p><strong>End Turn:</strong> Complete your turn and let the AI take its actions.</p>
        
        <h4>Resources</h4>
        <p>Manage your resources carefully to maintain your military operations.</p>
        
        <h4>Victory Conditions</h4>
        <p>Defeat all enemy forces or achieve strategic objectives to win.</p>
    `;
}
/**
 * Get settings content
 */
function getSettingsContent() {
    return `
        <h4>Game Settings</h4>
        <p>Settings panel will be implemented in future tasks.</p>
        <p>Available options will include:</p>
        <ul>
            <li>AI Difficulty</li>
            <li>Game Speed</li>
            <li>Visual Theme</li>
            <li>Sound Effects</li>
        </ul>
    `;
}
//# sourceMappingURL=main.js.map