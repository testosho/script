// Toscript3 Professional - Complete Merged Version with Pro Features
// =======================================
// This is the full, expanded JavaScript code for Toscript3, merging all functionalities from Toscript2
// (advanced UI, cloud integration, Android bridge, enhanced exports, modals, toasts, focus mode, etc.)
// while maintaining Toscript1's core card view rendering logic (basic non-editable index cards with summaries,
// 5 cards per page pagination, click-to-jump without drag-drop or edits).
// 
// Pro User Logic:
// - Flag: localStorage 'toscriptProUser' (set to 'true' via simulated purchase or Android in-app purchase).
// - Cloud storage (Google Drive/Dropbox) only for Pro; gated behind checks.
// - Ads: Assumes elements like #ad-banner, #interstitial-ad exist; hidden/shown based on isProUser.
// - Upgrade prompt: Button to simulate purchase (in web) or listen for native bridge event.
// 
// Dependencies (assumed loaded via HTML):
// - jsPDF and html2canvas for PDF exports.
// - JSZip for ZIP exports.
// - Google API (gapi) for Drive.
// - Dropbox SDK for Dropbox.
// - Sortable.js (not used in card view per Toscript1, but included for navigator if needed).
// 
// Android WebView Integration:
// - Bridge object: window.Android for back handling, save/load, PDF export as base64, pro purchase events.
// 
// File Handling: Supports .fountain, .txt, .filmproj (JSON export with metadata).
// Offline Support: Service Worker registration.
// 
// Length: Approximately 3000+ lines (expanded with comments, error handling, sub-functions for robustness).
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================
    // GLOBAL VARIABLES - Extended from Toscript2
    // ========================================
    // Project Data Structure
    let projectData = {
        projectInfo: {
            projectName: 'Untitled',
            prodName: 'Author',
            scriptContent: '',
            scenes: [],
            lastSaved: null,
            version: '3.0'
        }
    };
    
    // UI State
    let fontSize = 16; // Base font size for previews
    let autoSaveInterval = null; // Auto-save timer
    let showSceneNumbers = true; // Toggle for script view numbering
    let currentView = 'write'; // Active view: 'write', 'script', 'card'
    let debounceTimeout = null; // For input debouncing
    let isUpdatingFromSync = false; // Flag to prevent loops during cloud sync
    let currentPage = 0; // For card pagination
    const cardsPerPage = 5; // Toscript1 value: Basic pagination for mobile/desktop
    
    // History Management (Toscript2)
    let undoStack = []; // Array of script states
    let redoStack = []; // Redo states
    let historyLimit = 50; // Max undo steps
    
    // Modes and Flags
    let isPlaceholder = true; // If editor is empty
    let isFocusMode = false; // Minimal distractions mode
    let isFullscreen = false; // Browser fullscreen
    let isMobileDevice = false; // Detected on init
    
    // Pro and Monetization
    let isProUser = localStorage.getItem('toscriptProUser') === 'true'; // Pro status
    
    // Cloud Integration (Gated for Pro)
    let gapi = null; // Google API client
    let dropboxApi = null; // Dropbox instance
    let cloudSyncInterval = null; // Sync timer
    let cloudEnabled = localStorage.getItem('cloudEnabled') === 'true'; // User toggle
    let gdriveFolderId = localStorage.getItem('gdriveFolderId') || null; // Custom folder
    
    // DOM Elements Cache - Expanded for All UI Components
    let domElements = {}; // Object to store all refs
    
    // Common Elements
    domElements.fountainInput = document.getElementById('fountain-input');
    domElements.screenplayOutput = document.getElementById('screenplay-output');
    domElements.menuPanel = document.getElementById('menu-panel');
    domElements.sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    domElements.writeView = document.getElementById('write-view');
    domElements.scriptView = document.getElementById('script-view');
    domElements.cardView = document.getElementById('card-view');
    domElements.toolbar = document.getElementById('toolbar');
    
    // Ad Elements (To Hide for Pro)
    domElements.adBanner = document.getElementById('ad-banner');
    domElements.footerAd = document.getElementById('footer-ad');
    domElements.interstitialAd = document.getElementById('interstitial-ad');
    
    // Pro/Cloud Buttons
    domElements.proUpgradeBtn = document.getElementById('pro-upgrade-btn');
    domElements.cloudSyncBtn = document.getElementById('cloud-sync-btn');
    domElements.openCloudBtn = document.getElementById('open-from-cloud-btn');
    
    // View Switchers
    domElements.writeBtn = document.getElementById('write-btn');
    domElements.scriptBtn = document.getElementById('script-btn');
    domElements.cardBtn = document.getElementById('card-btn');
    
    // Menu Actions
    domElements.projectInfoBtn = document.getElementById('project-info-btn');
    domElements.exportPdfBtn = document.getElementById('export-pdf-btn');
    domElements.exportFountainBtn = document.getElementById('export-fountain-btn');
    domElements.exportFilmprojBtn = document.getElementById('export-filmproj-btn');
    domElements.shareBtn = document.getElementById('share-btn');
    domElements.fullscreenBtn = document.getElementById('fullscreen-btn');
    domElements.focusBtn = document.getElementById('focus-mode-btn');
    domElements.sceneNumbersBtn = document.getElementById('scene-numbers-btn');
    
    // Quick Actions
    domElements.insertSceneBtn = document.getElementById('insert-scene-btn');
    domElements.toggleCaseBtn = document.getElementById('toggle-case-btn');
    domElements.undoBtn = document.getElementById('undo-btn');
    domElements.redoBtn = document.getElementById('redo-btn');
    domElements.exportCardsBtn = document.getElementById('export-cards-btn');
    
    // Modals
    domElements.projectModal = document.getElementById('project-modal');
    domElements.titlePageModal = document.getElementById('title-page-modal');
    domElements.helpModal = document.getElementById('help-modal');
    domElements.cloudConfigModal = document.getElementById('cloud-config-modal');
    
    // Modal Fields
    domElements.projNameInput = document.getElementById('proj-name');
    domElements.prodNameInput = document.getElementById('prod-name');
    domElements.statsDisplay = document.getElementById('stats-display');
    
    // Splash and Loading
    domElements.splashScreen = document.getElementById('splash-screen');
    domElements.loadingIndicator = document.getElementById('loading-indicator');
    
    // Android Bridge
    let AndroidBridge = window.Android || null; // Native bridge if in WebView
    
    // Regex Patterns for Parsing (Pre-defined for Efficiency)
    const sceneHeadingRegex = /^(INT\.|EXT\.|I\/E\.)?\s*([A-Z\s\-]+)\s*-\s*([A-Z]+(?:\s*\d+)?)/i;
    const characterRegex = /^[A-Z0-9\s\.\-\']+$/;
    const dialogueRegex = /^[\s\S]*$/; // Broad for indented lines
    const transitionRegex = /.*(TO:|CUT TO:)$/i;
    const parentheticalRegex = /^\([^\)]+\)$/;
    const actionRegex = /^[\s\S]*$/; // Default
    
    console.log('Toscript3 Initialized - Pro Status:', isProUser);
    
    // ========================================
    // PRO FEATURES INITIALIZATION
    // ========================================
    function initProFeatures() {
        try {
            if (isProUser) {
                // Hide All Ads
                [domElements.adBanner, domElements.footerAd, domElements.interstitialAd].forEach(ad => {
                    if (ad) ad.style.display = 'none';
                });
                // Show Pro-Only UI
                if (domElements.cloudSyncBtn) domElements.cloudSyncBtn.style.display = 'inline-block';
                if (domElements.openCloudBtn) domElements.openCloudBtn.style.display = 'inline-block';
                if (domElements.exportCardsBtn) domElements.exportCardsBtn.style.display = 'inline-block';
                // Enable Cloud if Toggled
                if (cloudEnabled) {
                    setupCloudIntegration();
                }
                // Remove Upgrade Prompts
                if (domElements.proUpgradeBtn) domElements.proUpgradeBtn.style.display = 'none';
                showToast('Pro mode active: Ads removed, cloud enabled.', 'success', 4000);
            } else {
                // Show Ads
                [domElements.adBanner, domElements.footerAd].forEach(ad => {
                    if (ad) ad.style.display = 'block';
                });
                // Hide Pro Features
                [domElements.cloudSyncBtn, domElements.openCloudBtn, domElements.exportCardsBtn].forEach(btn => {
                    if (btn) btn.style.display = 'none';
                });
                // Show Upgrade Button
                if (domElements.proUpgradeBtn) domElements.proUpgradeBtn.style.display = 'inline-block';
                showToast('Upgrade to Pro for cloud sync and ad-free experience.', 'info', 5000);
            }
            // Listen for Native Pro Purchase Event
            if (AndroidBridge && typeof AndroidBridge.onProPurchased === 'function') {
                AndroidBridge.onProPurchased = () => {
                    localStorage.setItem('toscriptProUser', 'true');
                    isProUser = true;
                    initProFeatures(); // Refresh UI
                    showToast('Pro unlocked via in-app purchase!', 'success');
                    if (AndroidBridge.showProConfirmation) AndroidBridge.showProConfirmation();
                };
            }
        } catch (error) {
            console.error('Pro init error:', error);
            showToast('Error initializing pro features.', 'error');
        }
    }
    
    // Pro Upgrade Simulation (Web Testing)
    function simulateProPurchase() {
        if (confirm('Simulate Pro upgrade? (Sets localStorage flag. Real app uses in-app purchase.)')) {
            localStorage.setItem('toscriptProUser', 'true');
            isProUser = true;
            initProFeatures();
            showToast('Pro mode simulated!', 'success');
        }
    }
    
    // ========================================
    // APP INITIALIZATION - Comprehensive Setup
    // ========================================
    function initializeApp() {
        try {
            // Detect Mobile
            isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Load Existing Project
            loadProjectFromStorage();
            
            // Setup All Event Listeners
            setupAllEventListeners();
            
            // Update All Views Initially
            updateAllViews();
            
            // Initialize Pro Features
            initProFeatures();
            
            // Splash Screen Animation (Toscript2 Style)
            if (domElements.splashScreen) {
                domElements.splashScreen.style.transition = 'opacity 0.5s ease-out';
                setTimeout(() => {
                    domElements.splashScreen.style.opacity = '0';
                    setTimeout(() => {
                        if (domElements.splashScreen) domElements.splashScreen.remove();
                    }, 500);
                }, 1500);
            }
            
            // Register Service Worker for Offline (PWA Support)
            if ('serviceWorker' in navigator && !isMobileDevice) { // Skip in WebView
                navigator.serviceWorker.register('/toscript-sw.js')
                    .then(reg => console.log('SW registered:', reg))
                    .catch(err => console.log('SW registration failed:', err));
            }
            
            // Android-Specific Initialization
            if (isMobileDevice && AndroidBridge) {
                setupAndroidBridge();
                AndroidBridge.onAppReady(); // Signal native app
            }
            
            // Start Auto-Save
            startAutoSaveTimer();
            
            // Initial Toast
            showToast('Toscript3 loaded successfully!', 'success', 2000);
            
            console.log('App fully initialized.');
        } catch (error) {
            console.error('Initialization error:', error);
            showToast('Error starting app. Check console.', 'error');
            if (AndroidBridge && AndroidBridge.reportError) {
                AndroidBridge.reportError('Init failed: ' + error.message);
            }
        }
    }
    
    // ========================================
    // EVENT LISTENERS SETUP - Detailed Binding
    // ========================================
    function setupAllEventListeners() {
        // Input Events
        if (domElements.fountainInput) {
            domElements.fountainInput.addEventListener('input', debounce(handleEditorInput, 300));
            domElements.fountainInput.addEventListener('keydown', handleEditorKeydown);
            domElements.fountainInput.addEventListener('paste', handlePasteEvent);
            domElements.fountainInput.addEventListener('focus', handleEditorFocus);
            domElements.fountainInput.addEventListener('blur', handleEditorBlur);
        }
        
        // View Switching Buttons
        if (domElements.writeBtn) domElements.writeBtn.addEventListener('click', () => safeSwitchView('write'));
        if (domElements.scriptBtn) domElements.scriptBtn.addEventListener('click', () => safeSwitchView('script'));
        if (domElements.cardBtn) domElements.cardBtn.addEventListener('click', () => safeSwitchView('card'));
        
        // Menu and Action Buttons
        if (domElements.projectInfoBtn) domElements.projectInfoBtn.addEventListener('click', openProjectInfoModal);
        if (domElements.exportPdfBtn) domElements.exportPdfBtn.addEventListener('click', exportToPdfDocument);
        if (domElements.exportFountainBtn) domElements.exportFountainBtn.addEventListener('click', () => exportToFile('fountain'));
        if (domElements.exportFilmprojBtn) domElements.exportFilmprojBtn.addEventListener('click', () => exportToFile('filmproj'));
        if (domElements.shareBtn) domElements.shareBtn.addEventListener('click', shareCurrentScript);
        if (domElements.fullscreenBtn) domElements.fullscreenBtn.addEventListener('click', toggleFullscreenMode);
        if (domElements.focusBtn) domElements.focusBtn.addEventListener('click', toggleFocusMode);
        if (domElements.sceneNumbersBtn) domElements.sceneNumbersBtn.addEventListener('click', toggleSceneNumbers);
        
        // Quick Actions
        if (domElements.insertSceneBtn) domElements.insertSceneBtn.addEventListener('click', insertDefaultSceneHeading);
        if (domElements.toggleCaseBtn) domElements.toggleCaseBtn.addEventListener('click', toggleSelectedTextCase);
        if (domElements.undoBtn) domElements.undoBtn.addEventListener('click', performUndo);
        if (domElements.redoBtn) domElements.redoBtn.addEventListener('click', performRedo);
        if (domElements.exportCardsBtn) domElements.exportCardsBtn.addEventListener('click', exportIndexCards);
        
        // Pro Upgrade
        if (domElements.proUpgradeBtn) domElements.proUpgradeBtn.addEventListener('click', simulateProPurchase);
        if (domElements.cloudSyncBtn) domElements.cloudSyncBtn.addEventListener('click', toggleCloudSyncStatus);
        if (domElements.openCloudBtn) domElements.openCloudBtn.addEventListener('click', openFileFromCloud);
        
        // Modal Close Events (Generic)
        document.addEventListener('click', handleModalOutsideClick);
        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
            el.addEventListener('click', closeAllModals);
        });
        
        // Global Keyboard Shortcuts
        document.addEventListener('keydown', handleGlobalKeydown);
        
        // Window Events
        window.addEventListener('resize', debounce(handleWindowResize, 250));
        window.addEventListener('orientationchange', handleOrientationChange, false);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Drag/Drop for File Open (Desktop)
        if (!isMobileDevice) {
            document.addEventListener('dragover', handleDragOver);
            document.addEventListener('drop', handleFileDrop);
        }
        
        // Haptic Feedback Setup (Mobile)
        if (isMobileDevice && 'vibrate' in navigator) {
            console.log('Haptic support detected.');
        }
        
        console.log('All event listeners bound.');
    }
    
    // Safe View Switch with Validation
    function safeSwitchView(newView) {
        if (!['write', 'script', 'card'].includes(newView)) {
            console.warn('Invalid view:', newView);
            return;
        }
        switchView(newView);
        triggerHapticFeedback(50); // Short vibe
    }
    
    // ========================================
    // PROJECT MANAGEMENT - Load/Save/Undo
    // ========================================
    function loadProjectFromStorage() {
        try {
            const storageKey = 'universalFilmProjectToScript_v3';
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                projectData = JSON.parse(savedData);
                if (domElements.fountainInput) {
                    domElements.fountainInput.value = projectData.scriptContent || '';
                }
                updatePlaceholderStatus();
                parseFountainContent(); // Re-parse scenes
                pushCurrentStateToUndo(); // Initial state
                projectData.lastSaved = new Date().toISOString();
                showToast(`Loaded project: ${projectData.projectInfo.projectName}`, 'info');
            } else {
                initializeNewProject();
            }
            console.log('Project loaded from storage.');
        } catch (error) {
            console.error('Load error:', error);
            showToast('Failed to load project. Starting new.', 'warning');
            initializeNewProject();
        }
    }
    
    function saveProjectToStorage(auto = false) {
        try {
            isUpdatingFromSync = true; // Prevent input trigger
            projectData.scriptContent = domElements.fountainInput ? domElements.fountainInput.value : '';
            projectData.scenes = projectData.scenes || []; // Ensure array
            projectData.lastSaved = new Date().toISOString();
            
            const storageKey = 'universalFilmProjectToScript_v3';
            localStorage.setItem(storageKey, JSON.stringify(projectData));
            
            if (!auto) {
                showToast('Project saved successfully.', 'success');
            }
            console.log('Project saved to storage.');
        } catch (error) {
            console.error('Save error:', error);
            showToast('Save failed. Check storage quota.', 'error');
        } finally {
            isUpdatingFromSync = false;
        }
    }
    
    function initializeNewProject() {
        projectData = {
            projectInfo: {
                projectName: 'Untitled Script',
                prodName: 'Screenwriter',
                scriptContent: '',
                scenes: []
            },
            lastSaved: new Date().toISOString(),
            version: '3.0'
        };
        if (domElements.fountainInput) {
            domElements.fountainInput.value = '';
            setEditorPlaceholder();
        }
        isPlaceholder = true;
        updateAllViews();
        showToast('New project started.', 'info');
    }
    
    function startAutoSaveTimer() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
        autoSaveInterval = setInterval(() => {
            saveProjectToStorage(true); // Auto flag
        }, 30000); // Every 30 seconds
        console.log('Auto-save timer started.');
    }
    
    // Undo/Redo Stack Management
    function pushCurrentStateToUndo() {
        const currentContent = domElements.fountainInput ? domElements.fountainInput.value : '';
        undoStack.push(JSON.stringify({ content: currentContent, timestamp: Date.now() }));
        if (undoStack.length > historyLimit) {
            undoStack.shift(); // Remove oldest
        }
        redoStack = []; // Clear redo on new action
        console.log('Undo state pushed. Stack size:', undoStack.length);
    }
    
    function performUndo() {
        if (undoStack.length < 2) {
            showToast('Nothing to undo.', 'info');
            return;
        }
        redoStack.push(undoStack.pop());
        const previousState = JSON.parse(undoStack[undoStack.length - 1]);
        if (domElements.fountainInput) {
            domElements.fountainInput.value = previousState.content;
        }
        handleEditorInput(); // Trigger update
        showToast('Undo performed.', 'info');
        triggerHapticFeedback(100);
    }
    
    function performRedo() {
        if (redoStack.length === 0) {
            showToast('Nothing to redo.', 'info');
            return;
        }
        undoStack.push(redoStack.pop());
        const nextState = JSON.parse(redoStack[redoStack.length - 1]);
        if (domElements.fountainInput) {
            domElements.fountainInput.value = nextState.content;
        }
        handleEditorInput(); // Trigger update
        showToast('Redo performed.', 'info');
        triggerHapticFeedback(100);
    }
    
    // ========================================
    // EDITOR INPUT HANDLING - Debounced and Robust
    // ========================================
    function handleEditorInput() {
        if (isUpdatingFromSync) return; // Skip during sync
        updatePlaceholderStatus();
        parseFountainContent();
        updateAllViews();
        pushCurrentStateToUndo();
        saveProjectToStorage(); // Save on change
        console.log('Editor input processed.');
    }
    
    // Debounce Utility Function
    function debounce(callback, delay) {
        return function executedFunction(...args) {
            const later = () => {
                if (!debounceTimeout) debounceTimeout = null;
                return callback(...args);
            };
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(later, delay);
            if (debounceTimeout === null) debounceTimeout = setTimeout(() => debounceTimeout = null, delay);
        };
    }
    
    function handleEditorKeydown(event) {
        // Tab Handling for Indent/Unindent
        if (event.key === 'Tab') {
            event.preventDefault();
            const start = domElements.fountainInput.selectionStart;
            const end = domElements.fountainInput.selectionEnd;
            const text = domElements.fountainInput.value;
            const indent = '    '; // 4 spaces
            
            if (event.shiftKey) {
                // Unindent
                const lines = text.substring(0, end).split('\n');
                const unindented = lines.map(line => {
                    if (line.startsWith(indent)) {
                        return line.substring(indent.length);
                    }
                    return line;
                }).join('\n');
                domElements.fountainInput.value = text.substring(0, start) + unindented + text.substring(end);
                domElements.fountainInput.setSelectionRange(start, end - (lines.length * indent.length - unindented.length));
            } else {
                // Indent
                const indented = text.substring(start, end).split('\n').map(line => indent + line).join('\n');
                domElements.fountainInput.value = text.substring(0, start) + indented + text.substring(end);
                domElements.fountainInput.setSelectionRange(start + indent.length, end + indent.length);
            }
            handleEditorInput();
            return;
        }
        
        // Auto-complete Scene or Character (Basic)
        if (event.key === 'Enter' && event.ctrlKey) {
            insertDefaultSceneHeading();
            event.preventDefault();
        }
        
        // Save on Ctrl+S
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            saveProjectToStorage();
        }
    }
    
    function handlePasteEvent(event) {
        event.preventDefault();
        const pastedText = (event.clipboardData || window.clipboardData).getData('text');
        const start = domElements.fountainInput.selectionStart;
        const end = domElements.fountainInput.selectionEnd;
        domElements.fountainInput.value = domElements.fountainInput.value.substring(0, start) + pastedText + domElements.fountainInput.value.substring(end);
        domElements.fountainInput.setSelectionRange(start + pastedText.length, start + pastedText.length);
        handleEditorInput();
        showToast('Pasted content formatted.', 'info');
    }
    
    function handleEditorFocus() {
        if (isPlaceholder) {
            domElements.fountainInput.value = '';
            isPlaceholder = false;
        }
        domElements.fountainInput.classList.add('focused');
        if (isMobileDevice) {
            // Adjust for keyboard
            document.body.style.paddingBottom = '300px';
        }
    }
    
    function handleEditorBlur() {
        domElements.fountainInput.classList.remove('focused');
        if (domElements.fountainInput.value.trim() === '') {
            setEditorPlaceholder();
            isPlaceholder = true;
        }
        if (isMobileDevice) {
            document.body.style.paddingBottom = '0';
        }
    }
    
    function setEditorPlaceholder() {
        domElements.fountainInput.placeholder = `FADE IN:

INT. SAMPLE LOCATION - DAY

JOHN
    This is a sample line of dialogue.

    More action or description here.

FADE OUT.

Start writing your screenplay in Fountain format!`;
    }
    
    function updatePlaceholderStatus() {
        isPlaceholder = domElements.fountainInput.value.trim() === '';
        if (isPlaceholder) {
            setEditorPlaceholder();
        } else {
            domElements.fountainInput.placeholder = '';
        }
    }
    
    // ========================================
    // FOUNTAIN PARSING - Enhanced from Toscript2, Compatible with Toscript1 Extraction
    // ========================================
    function parseFountainContent() {
        if (!domElements.fountainInput.value.trim()) {
            projectData.scenes = [];
            return;
        }
        
        const lines = domElements.fountainInput.value.split('\n');
        projectData.scenes = [];
        let currentScene = null;
        let currentCharacter = null;
        let sceneIndex = 0;
        
        lines.forEach((line, lineIndex) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                if (currentScene) currentScene.lines.push(''); // Empty line
                return;
            }
            
            const lineType = classifyFountainLine(trimmedLine);
            
            switch (lineType) {
                case 'scene_heading':
                    currentScene = createNewScene(trimmedLine, lineIndex, sceneIndex);
                    projectData.scenes.push(currentScene);
                    currentCharacter = null;
                    sceneIndex++;
                    break;
                case 'character':
                    if (currentScene) {
                        currentCharacter = trimmedLine.toUpperCase();
                        if (!currentScene.characters.includes(currentCharacter)) {
                            currentScene.characters.push(currentCharacter);
                        }
                        currentScene.lines.push(line.replace(/^ */, '        ')); // Indent for character
                    }
                    break;
                case 'dialogue':
                    if (currentScene && currentCharacter) {
                        currentScene.lines.push(line.replace(/^ */, '    ')); // Dialogue indent
                    }
                    break;
                case 'parenthetical':
                    if (currentScene) {
                        currentScene.lines.push(line.replace(/^ */, '    (')); // Parenthetical
                    }
                    break;
                case 'transition':
                    if (currentScene) {
                        currentScene.lines.push(line.toUpperCase().padStart(line.length + 20, ' ')); // Right-align
                    }
                    break;
                case 'action':
                default:
                    if (currentScene) {
                        currentScene.lines.push(line); // No indent for action
                    } else {
                        // Global action before first scene
                        if (!projectData.globalActions) projectData.globalActions = [];
                        projectData.globalActions.push(line);
                    }
                    break;
            }
        });
        
        // Fallback Extraction from Toscript1 for Basic Scene Data
        extractBasicScenesFromText();
        
        console.log(`Parsed ${projectData.scenes.length} scenes.`);
    }
    
    function classifyFountainLine(line) {
        const trimmed = line.trim();
        
        // Scene Heading
        if (sceneHeadingRegex.test(trimmed)) {
            return 'scene_heading';
        }
        
        // Character Name
        if (characterRegex.test(trimmed) && trimmed.length > 1 && !transitionRegex.test(trimmed)) {
            return 'character';
        }
        
        // Parenthetical
        if (parentheticalRegex.test(trimmed)) {
            return 'parenthetical';
        }
        
        // Transition
        if (transitionRegex.test(trimmed)) {
            return 'transition';
        }
        
        // Dialogue (indented or following character)
        if (trimmed && !/^[A-Z\s]+$/.test(trimmed.toUpperCase()) && trimmed.length > 0) {
            return 'dialogue';
        }
        
        // Action (default)
        return 'action';
    }
    
    function createNewScene(heading, lineIndex, sceneId) {
        const match = heading.match(sceneHeadingRegex);
        const type = match ? match[1] || 'INT.' : 'INT.';
        const location = match ? match[2].trim() : 'UNKNOWN LOCATION';
        const time = match ? match[3] : 'DAY';
        
        return {
            id: sceneId,
            heading: heading.toUpperCase(),
            type: type.replace(/\./g, ''),
            location: location,
            time: time,
            index: lineIndex,
            lines: [heading],
            characters: [],
            wordCount: 0,
            estimatedPages: 0
        };
    }
    
    // Toscript1-Compatible Basic Scene Extraction (For Card Summaries)
    function extractBasicScenesFromText() {
        const fullText = domElements.fountainInput.value;
        const sceneMatches = fullText.matchAll(sceneHeadingRegex);
        let sceneCounter = 0;
        
        for (const match of sceneMatches) {
            const startPos = match.index;
            const sceneType = match[1] ? match[1].replace(/\./g, '') : 'INT';
            const location = match[2].trim();
            const time = match[3];
            
            // Find end of scene (next heading or EOF)
            const remainingText = fullText.substring(startPos);
            const nextHeadingMatch = remainingText.match(sceneHeadingRegex);
            const endPos = nextHeadingMatch ? startPos + nextHeadingMatch.index : fullText.length;
            
            const sceneContent = fullText.substring(startPos, endPos).trim();
            
            // Update or create scene
            if (projectData.scenes[sceneCounter]) {
                projectData.scenes[sceneCounter].type = sceneType;
                projectData.scenes[sceneCounter].location = location;
                projectData.scenes[sceneCounter].time = time;
                projectData.scenes[sceneCounter].content = sceneContent;
            } else {
                projectData.scenes.push({
                    id: sceneCounter,
                    type: sceneType,
                    location: location,
                    time: time,
                    content: sceneContent,
                    index: startPos
                });
            }
            sceneCounter++;
        }
        
        // Calculate word counts for each scene
        projectData.scenes.forEach(scene => {
            scene.wordCount = scene.content.split(/\s+/).filter(word => word.length > 0).length;
            scene.estimatedPages = Math.ceil(scene.wordCount / 150); // Rough estimate
        });
    }
    
    // ========================================
    // VIEW MANAGEMENT - Switch and Update
    // ========================================
    function switchView(targetView) {
        // Hide All Views
        if (domElements.writeView) domElements.writeView.style.display = 'none';
        if (domElements.scriptView) domElements.scriptView.style.display = 'none';
        if (domElements.cardView) domElements.cardView.style.display = 'none';
        if (domElements.sceneNavigatorPanel) domElements.sceneNavigatorPanel.style.display = 'none';
        if (domElements.menuPanel) domElements.menuPanel.style.display = 'none';
        
        currentView = targetView;
        
        switch (targetView) {
            case 'write':
                if (domElements.writeView) domElements.writeView.style.display = 'block';
                if (isMobileDevice && domElements.toolbar) domElements.toolbar.style.display = 'flex';
                if (domElements.fountainInput) domElements.fountainInput.focus();
                updateWriteView();
                updateFocusMode();
                break;
            case 'script':
                if (domElements.scriptView) domElements.scriptView.style.display = 'block';
                updateScriptPreviewView();
                break;
            case 'card':
                if (domElements.cardView) domElements.cardView.style.display = 'block';
                if (domElements.sceneNavigatorPanel) domElements.sceneNavigatorPanel.style.display = 'block';
                currentPage = 0; // Reset pagination
                updateCardViewWithPagination(); // Toscript1 Logic
                break;
            default:
                console.warn('Unknown view:', targetView);
                return;
        }
        
        // Update Toolbar and Menu
        if (domElements.toolbar) {
            domElements.toolbar.classList.remove('hidden');
        }
        triggerHapticFeedback(50);
        console.log('Switched to view:', targetView);
    }
    
    function updateAllViews() {
        // Update based on current view
        if (currentView === 'write') updateWriteView();
        else if (currentView === 'script') updateScriptPreviewView();
        else if (currentView === 'card') updateCardViewWithPagination();
        updateSceneNavigator();
        if (domElements.toolbar) updateToolbarState();
    }
    
    function updateWriteView() {
        // Write view is mostly the editor; just ensure focus
        if (domElements.fountainInput && isPlaceholder) {
            setEditorPlaceholder();
        }
        // Adjust font size if changed
        if (domElements.fountainInput) {
            domElements.fountainInput.style.fontSize = `${fontSize}px`;
        }
    }
    
    // ========================================
    // SCRIPT PREVIEW VIEW - Formatted Output (Toscript2 Style)
    // ========================================
    function updateScriptPreviewView() {
        if (!projectData.scenes.length) {
            domElements.screenplayOutput.innerHTML = '<div class="no-content">Write your script to preview.</div>';
            return;
        }
        
        let htmlOutput = '';
        let globalActions = projectData.globalActions || [];
        
        // Global Actions First
        globalActions.forEach(action => {
            if (action.trim()) {
                htmlOutput += `<div class="action-line">${escapeHtml(action)}</div>\n`;
            }
        });
        
        // Scenes
        projectData.scenes.forEach((scene, index) => {
            // Scene Number if Enabled
            if (showSceneNumbers) {
                htmlOutput += `<div class="scene-number">${index + 1}.</div>`;
            }
            
            // Heading
            htmlOutput += `<div class="scene-heading">${escapeHtml(scene.heading)}</div>\n`;
            
            // Scene Lines
            scene.lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) {
                    htmlOutput += '<br>';
                    return;
                }
                
                const lineType = classifyFountainLine(trimmed);
                let className = 'action-line';
                let content = escapeHtml(line);
                
                switch (lineType) {
                    case 'character':
                        className = 'character-line';
                        content = content.toUpperCase();
                        break;
                    case 'dialogue':
                        className = 'dialogue-line';
                        break;
                    case 'parenthetical':
                        className = 'parenthetical-line';
                        content = `(${trimmed.slice(1, -1)})`;
                        break;
                    case 'transition':
                        className = 'transition-line';
                        content = content.toUpperCase();
                        break;
                    case 'scene_heading':
                        className = 'scene-heading';
                        break;
                }
                
                htmlOutput += `<div class="${className}">${content}</div>\n`;
            });
            
            htmlOutput += '<div class="page-break"></div>'; // Visual separator
        });
        
        domElements.screenplayOutput.innerHTML = htmlOutput;
        applyFontSizeToPreview(fontSize);
    }
    
    function applyFontSizeToPreview(size) {
        const lines = domElements.screenplayOutput.querySelectorAll('div[class*="line"], .scene-heading');
        lines.forEach(el => {
            el.style.fontSize = `${size}px`;
            el.style.lineHeight = '1.5';
        });
    }
    
    function toggleSceneNumbers() {
        showSceneNumbers = !showSceneNumbers;
        if (domElements.sceneNumbersBtn) {
            domElements.sceneNumbersBtn.textContent = showSceneNumbers ? 'Hide Numbers' : 'Show Numbers';
        }
        if (currentView === 'script') {
            updateScriptPreviewView();
        }
        localStorage.setItem('showSceneNumbers', showSceneNumbers.toString());
        showToast(`Scene numbers ${showSceneNumbers ? 'shown' : 'hidden'}.`, 'info');
    }
    
    // Utility for HTML Escaping
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ========================================
    // CARD VIEW - Toscript1 Logic (Basic, Non-Editable Cards with Pagination)
    // ========================================
    // This maintains Toscript1's simple approach: Render summary cards, 5 per page, click to jump.
    // No editing, drag-drop, per-card share/delete, or advanced exports here; use Toscript2's exportCards for that.
    function updateCardViewWithPagination() {
        if (!projectData.scenes || projectData.scenes.length === 0) {
            domElements.cardView.innerHTML = '<div class="no-scenes-message">No scenes detected. Add scene headings (INT./EXT.) in the editor.</div>';
            return;
        }
        
        renderCurrentCardPage();
        setupCardPaginationControls();
        updateCardViewStyling();
    }
    
    function renderCurrentCardPage() {
        const startIndex = currentPage * cardsPerPage;
        const endIndex = startIndex + cardsPerPage;
        const currentScenes = projectData.scenes.slice(startIndex, endIndex);
        
        domElements.cardView.innerHTML = ''; // Clear previous
        
        currentScenes.forEach((scene, relativeIndex) => {
            const absoluteIndex = startIndex + relativeIndex;
            const cardElement = createBasicIndexCard(scene, absoluteIndex);
            domElements.cardView.appendChild(cardElement);
        });
        
        // Add Pagination Info
        const totalPages = Math.ceil(projectData.scenes.length / cardsPerPage);
        const pageInfo = document.createElement('div');
        pageInfo.className = 'card-pagination-info';
        pageInfo.innerHTML = `<span>Page ${currentPage + 1} of ${totalPages} (${projectData.scenes.length} total scenes)</span>`;
        domElements.cardView.appendChild(pageInfo);
    }
    
    function createBasicIndexCard(scene, sceneIndex) {
        const card = document.createElement('div');
        card.className = 'index-card basic-card';
        card.style.cursor = 'pointer';
        card.style.border = '1px solid #ddd';
        card.style.padding = '15px';
        card.style.margin = '10px';
        card.style.borderRadius = '8px';
        card.style.backgroundColor = '#f9f9f9';
        card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        
        // Card Content (Toscript1 Style: Header, Summary, Footer)
        const summaryText = generateSceneSummary(scene.content, 150); // Limit to 150 chars
        card.innerHTML = `
            <div class="card-header">
                <h3 class="scene-type">${scene.type} ${scene.location.toUpperCase()} - ${scene.time}</h3>
            </div>
            <div class="card-body">
                <p class="scene-summary">${summaryText}${summaryText.length >= 150 ? '...' : ''}</p>
                <div class="scene-stats">
                    <small>Words: ${scene.wordCount || 0} | Est. Pages: ${scene.estimatedPages || 1}</small>
                </div>
            </div>
            <div class="card-footer">
                <span class="scene-number">Scene ${sceneIndex + 1} of ${projectData.scenes.length}</span>
            </div>
        `;
        
        // Click to Jump to Scene in Editor (Toscript1 Feature)
        card.addEventListener('click', () => {
            jumpToSceneInEditor(sceneIndex);
            triggerHapticFeedback(100);
        });
        
        // Hover Effect
        card.addEventListener('mouseenter', () => card.style.backgroundColor = '#e9e9e9');
        card.addEventListener('mouseleave', () => card.style.backgroundColor = '#f9f9f9');
        
        return card;
    }
    
    function generateSceneSummary(content, maxLength) {
        // Toscript1 Simple Summary: Concat first few non-empty lines
        const lines = content.split('\n').filter(line => line.trim().length > 0).slice(0, 4);
        let summary = lines.join(' ').replace(/\s+/g, ' ').trim();
        if (summary.length > maxLength) {
            summary = summary.substring(0, maxLength);
        }
        return summary;
    }
    
    function jumpToSceneInEditor(sceneId) {
        switchView('write');
        const scene = projectData.scenes[sceneId];
        if (scene && scene.index !== undefined && domElements.fountainInput) {
            domElements.fountainInput.focus();
            const approxPos = Math.max(0, scene.index - 10); // Slight offset
            domElements.fountainInput.setSelectionRange(approxPos, approxPos);
            domElements.fountainInput.scrollTop = domElements.fountainInput.scrollHeight; // Scroll if needed
            showToast(`Jumped to Scene ${sceneId + 1}`, 'info');
        } else {
            showToast('Could not locate scene.', 'warning');
        }
    }
    
    function setupCardPaginationControls() {
        // Remove old controls
        const oldPaginator = domElements.cardView.querySelector('.paginator');
        if (oldPaginator) oldPaginator.remove();
        
        const totalPages = Math.ceil(projectData.scenes.length / cardsPerPage);
        if (totalPages <= 1) return; // No need
        
        const paginator = document.createElement('div');
        paginator.className = 'paginator';
        paginator.style.textAlign = 'center';
        paginator.style.margin = '20px 0';
        paginator.style.padding = '10px';
        
        const prevBtn = document.createElement('button');
        prevBtn.id = 'prev-card-page';
        prevBtn.textContent = 'Previous Page';
        prevBtn.disabled = currentPage === 0;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                renderCurrentCardPage();
                setupCardPaginationControls(); // Re-setup
                triggerHapticFeedback(50);
            }
        });
        
        const nextBtn = document.createElement('button');
        nextBtn.id = 'next-card-page';
        nextBtn.textContent = 'Next Page';
        nextBtn.disabled = currentPage >= totalPages - 1;
        nextBtn.addEventListener('click', () => {
            const maxPage = totalPages - 1;
            if (currentPage < maxPage) {
                currentPage++;
                renderCurrentCardPage();
                setupCardPaginationControls(); // Re-setup
                triggerHapticFeedback(50);
            }
        });
        
        paginator.appendChild(prevBtn);
        paginator.appendChild(document.createTextNode(` Page ${currentPage + 1} of ${totalPages} `));
        paginator.appendChild(nextBtn);
        
        domElements.cardView.appendChild(paginator);
    }
    
    function updateCardViewStyling() {
        // Responsive Styling for Cards
        if (isMobileDevice) {
            const cards = domElements.cardView.querySelectorAll('.index-card');
            cards.forEach(card => {
                card.style.width = '90%';
                card.style.margin = '5px auto';
            });
        }
    }
    
    // ========================================
    // SCENE NAVIGATOR - Toscript2 with Filters (Pro-Enhanced Exports)
    // ========================================
    function updateSceneNavigator() {
        if (!domElements.sceneNavigatorPanel || !projectData.scenes.length) {
            return;
        }
        
        let navigatorHtml = '<div class="navigator-header"><h3>Scene Navigator</h3></div>';
        
        // Filters Section (Always Available)
        navigatorHtml += `
            <div class="navigator-filters">
                <select id="scene-filter-type">
                    <option value="">All Scenes</option>
                    <option value="INT">Interior Only</option>
                    <option value="EXT">Exterior Only</option>
                    <option value="mixed">Mixed Only</option>
                </select>
                <input type="text" id="scene-search-location" placeholder="Search by location...">
                <button id="clear-filters">Clear</button>
                ${isProUser ? '<button id="export-nav-csv">Export CSV (Pro)</button>' : '<button id="export-nav-csv" disabled title="Pro Feature">Export CSV</button>'}
            </div>
        `;
        
        // Scenes List
        navigatorHtml += '<ul class="scenes-list">';
        projectData.scenes.forEach((scene, index) => {
            const charCount = scene.characters ? scene.characters.length : 0;
            navigatorHtml += `
                <li class="navigator-scene ${scene.type.toLowerCase()}" data-index="${index}" data-location="${scene.location.toLowerCase()}">
                    <span class="scene-number">${showSceneNumbers ? (index + 1) + '. ' : ''}</span>
                    <span class="scene-heading">${scene.type} ${scene.location} - ${scene.time}</span>
                    <span class="scene-meta">
                        <small>${charCount} chars | ${scene.wordCount} words</small>
                    </span>
                </li>
            `;
        });
        navigatorHtml += '</ul>';
        
        domElements.sceneNavigatorPanel.innerHTML = navigatorHtml;
        
        // Bind Events to New Elements
        bindNavigatorEvents();
    }
    
    function bindNavigatorEvents() {
        // Filter by Type
        const typeFilter = document.getElementById('scene-filter-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                filterNavigatorScenes(e.target.value, document.getElementById('scene-search-location').value);
            });
        }
        
        // Search by Location
        const searchInput = document.getElementById('scene-search-location');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                filterNavigatorScenes(document.getElementById('scene-filter-type').value, e.target.value);
            }, 300));
        }
        
        // Clear Filters
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (typeFilter) typeFilter.value = '';
                if (searchInput) searchInput.value = '';
                filterNavigatorScenes('', '');
            });
        }
        
        // Scene Clicks
        const sceneItems = domElements.sceneNavigatorPanel.querySelectorAll('.navigator-scene');
        sceneItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                jumpToSceneInEditor(index);
                triggerHapticFeedback(100);
            });
        });
        
        // Pro CSV Export
        const csvBtn = document.getElementById('export-nav-csv');
        if (csvBtn && isProUser) {
            csvBtn.addEventListener('click', exportNavigatorToCsv);
        }
    }
    
    function filterNavigatorScenes(typeFilter, searchTerm) {
        const scenes = domElements.sceneNavigatorPanel.querySelectorAll('.navigator-scene');
        scenes.forEach(scene => {
            let show = true;
            
            // Type Filter
            if (typeFilter && !scene.classList.contains(typeFilter.toLowerCase())) {
                show = false;
            }
            
            // Search Filter
            if (searchTerm && !scene.dataset.location.includes(searchTerm.toLowerCase())) {
                show = false;
            }
            
            scene.style.display = show ? 'list-item' : 'none';
        });
        
        const visibleCount = Array.from(scenes).filter(s => s.style.display !== 'none').length;
        showToast(`${visibleCount} scenes matching filters.`, 'info');
    }
    
    async function exportNavigatorToCsv() {
        if (!isProUser) {
            showToast('Pro feature: Upgrade for CSV export.', 'warning');
            return;
        }
        
        try {
            let csvContent = 'Scene #,Type,Location,Time,Characters,Words,Est. Pages\n';
            projectData.scenes.forEach((scene, index) => {
                const chars = scene.characters ? scene.characters.join('; ') : '';
                csvContent += `"${index + 1}","${scene.type}","${scene.location}","${scene.time}","${chars}","${scene.wordCount}","${scene.estimatedPages}"\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectData.projectInfo.projectName}_scenes.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Scenes exported to CSV.', 'success');
        } catch (error) {
            console.error('CSV export error:', error);
            showToast('Export failed.', 'error');
        }
    }
    
    // ========================================
    // MODALS - Project Info, Title Page, Help, Cloud Config
    // ========================================
    function openProjectInfoModal() {
        if (!domElements.projectModal) return;
        
        // Populate Fields
        if (domElements.projNameInput) domElements.projNameInput.value = projectData.projectInfo.projectName;
        if (domElements.prodNameInput) domElements.prodNameInput.value = projectData.projectInfo.prodName;
        
        // Calculate and Display Stats (Toscript2 Enhanced)
        const stats = calculateDetailedProjectStats();
        if (domElements.statsDisplay) {
            domElements.statsDisplay.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-item">
                        <label>Scenes</label>
                        <span>${stats.sceneCount}</span>
                    </div>
                    <div class="stat-item">
                        <label>Words</label>
                        <span>${stats.wordCount}</span>
                    </div>
                    <div class="stat-item">
                        <label>Pages (Est.)</label>
                        <span>${stats.pageEstimate}</span>
                    </div>
                    <div class="stat-item">
                        <label>Unique Characters</label>
                        <span>${stats.uniqueCharacters}</span>
                    </div>
                    <div class="stat-item">
                        <label>INT Scenes</label>
                        <span>${stats.intScenes}</span>
                    </div>
                    <div class="stat-item">
                        <label>EXT Scenes</label>
                        <span>${stats.extScenes}</span>
                    </div>
                </div>
            `;
        }
        
        domElements.projectModal.style.display = 'flex';
        showToast('Project info opened.', 'info');
    }
    
    function calculateDetailedProjectStats() {
        const content = domElements.fountainInput.value;
        const words = content.split(/\s+/).filter(w => w.length > 0).length;
        const allCharacters = new Set();
        let intCount = 0, extCount = 0;
        
        projectData.scenes.forEach(scene => {
            scene.characters.forEach(char => allCharacters.add(char));
            if (scene.type === 'INT') intCount++;
            if (scene.type === 'EXT') extCount++;
        });
        
        return {
            sceneCount: projectData.scenes.length,
            wordCount: words,
            pageEstimate: Math.ceil(words / 150),
            uniqueCharacters: allCharacters.size,
            intScenes: intCount,
            extScenes: extCount,
            avgSceneWords: projectData.scenes.length ? Math.round(words / projectData.scenes.length) : 0
        };
    }
    
    function saveProjectInfoFromModal() {
        projectData.projectInfo.projectName = domElements.projNameInput ? domElements.projNameInput.value.trim() || 'Untitled' : 'Untitled';
        projectData.projectInfo.prodName = domElements.prodNameInput ? domElements.prodNameInput.value.trim() || 'Author' : 'Author';
        saveProjectToStorage();
        closeAllModals();
        showToast('Project info updated.', 'success');
        // Update title in page if applicable
        document.title = `${projectData.projectInfo.projectName} - Toscript3`;
    }
    
    // Title Page Modal (Pro Feature for Export)
    function openTitlePageModal() {
        if (!isProUser) {
            showToast('Title page editing is a Pro feature.', 'warning');
            return;
        }
        if (!domElements.titlePageModal) return;
        // Populate with project info
        domElements.titlePageModal.style.display = 'flex';
    }
    
    // Help/Info Modal
    function openHelpModal() {
        if (!domElements.helpModal) return;
        // Load help content (assume static HTML or dynamic)
        const helpContent = `
            <h3>Welcome to Toscript3</h3>
            <p><strong>Fountain Syntax:</strong> Use INT. / EXT. for scenes, UPPERCASE for characters, indent dialogue.</p>
            <p><strong>Views:</strong> Write (editor), Script (preview), Card (index cards with summaries).</p>
            <p><strong>Pro Features:</strong> Cloud sync, ad-free, advanced exports.</p>
            <p><strong>Shortcuts:</strong> Ctrl+S save, Ctrl+Z undo, F11 fullscreen.</p>
            <ul>
                <li>Card View: Click cards to jump to scenes (basic pagination).</li>
                <li>Cloud: Google Drive/Dropbox for Pro users only.</li>
                <li>Exports: PDF (text/image), Fountain, Filmproj (JSON).</li>
            </ul>
            <p>For issues, check console or contact support.</p>
        `;
        domElements.helpModal.querySelector('.modal-content').innerHTML = helpContent;
        domElements.helpModal.style.display = 'flex';
    }
    
    // Cloud Config Modal (Pro Only)
    function openCloudConfigModal() {
        if (!isProUser) {
            showToast('Cloud configuration for Pro users.', 'warning');
            return;
        }
        if (!domElements.cloudConfigModal) return;
        // Populate with current settings
        const configHtml = `
            <h3>Cloud Settings</h3>
            <p>Google Drive API Key: <input id="gapi-key" value="${localStorage.getItem('gapiKey') || ''}" placeholder="Enter API Key"></p>
            <p>Client ID: <input id="gapi-clientid" value="${localStorage.getItem('gapiClientId') || ''}" placeholder="Enter Client ID"></p>
            <p>Dropbox Token: <input id="dropbox-token" value="${localStorage.getItem('dropboxToken') || ''}" placeholder="Enter Access Token"></p>
            <p>Drive Folder ID: <input id="gdrive-folder" value="${gdriveFolderId || ''}" placeholder="Optional Folder ID"></p>
            <button id="save-cloud-config">Save Config</button>
            <button id="test-cloud-connection">Test Connection</button>
        `;
        domElements.cloudConfigModal.querySelector('.modal-content').innerHTML = configHtml;
        domElements.cloudConfigModal.style.display = 'flex';
        
        // Bind Save
        document.getElementById('save-cloud-config').addEventListener('click', saveCloudConfig);
        document.getElementById('test-cloud-connection').addEventListener('click', testCloudConnection);
    }
    
    function saveCloudConfig() {
        localStorage.setItem('gapiKey', document.getElementById('gapi-key').value);
        localStorage.setItem('gapiClientId', document.getElementById('gapi-clientid').value);
        localStorage.setItem('dropboxToken', document.getElementById('dropbox-token').value);
        gdriveFolderId = document.getElementById('gdrive-folder').value || null;
        localStorage.setItem('gdriveFolderId', gdriveFolderId);
        closeAllModals();
        setupCloudIntegration(); // Re-setup
        showToast('Cloud config saved.', 'success');
    }
    
    async function testCloudConnection() {
        try {
            showToast('Testing...');
            if (gapi && localStorage.getItem('gapiKey')) {
                // Simple auth test
                const auth = await gapi.auth2.getAuthInstance();
                if (auth.isSignedIn.get()) {
                    showToast('Google Drive connected!', 'success');
                } else {
                    showToast('Sign in required for Google.', 'warning');
                }
            }
            if (dropboxApi && localStorage.getItem('dropboxToken')) {
                const response = await dropboxApi.usersGetCurrentAccount();
                showToast('Dropbox connected!', 'success');
            }
        } catch (error) {
            showToast(`Connection failed: ${error.message}`, 'error');
            console.error('Cloud test error:', error);
        }
    }
    
    // Generic Modal Handlers
    function handleModalOutsideClick(event) {
        if (event.target.classList.contains('modal') || event.target.classList.contains('modal-backdrop')) {
            closeAllModals();
        }
    }
    
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        if (isFocusMode) {
            updateFocusMode();
        }
        console.log('Modals closed.');
    }
    
    // ========================================
    // TOAST NOTIFICATIONS - Dynamic System
    // ========================================
    function showToast(message, type = 'info', duration = 3000) {
        // Remove Existing Toasts
        document.querySelectorAll('.toast-notification').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '10000';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '4px';
        toast.style.color = 'white';
        toast.style.fontSize = '14px';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.maxWidth = '300px';
        toast.style.wordWrap = 'break-word';
        
        // Type Styles
        switch (type) {
            case 'success': toast.style.backgroundColor = '#4CAF50'; break;
            case 'error': toast.style.backgroundColor = '#f44336'; break;
            case 'warning': toast.style.backgroundColor = '#ff9800'; break;
            case 'info': default: toast.style.backgroundColor = '#2196F3'; break;
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate In
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        
        // Animate Out
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, duration);
        
        console.log(`Toast shown: ${message} (${type})`);
    }
    
    // ========================================
    // MOBILE AND MODE HANDLERS - Focus, Fullscreen, Resize
    // ========================================
    function triggerHapticFeedback(duration = 50) {
        if (isMobileDevice && 'vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }
    
    function updateFocusMode() {
        if (!isFocusMode) return;
        
        // Hide Non-Essential UI
        if (domElements.menuPanel) domElements.menuPanel.style.display = 'none';
        if (domElements.sceneNavigatorPanel && currentView !== 'card') domElements.sceneNavigatorPanel.style.display = 'none';
        document.body.classList.add('focus-mode');
        
        // Keep Toolbar Visible on Mobile
        if (isMobileDevice && domElements.toolbar) {
            domElements.toolbar.style.position = 'fixed';
            domElements.toolbar.style.bottom = '0';
            domElements.toolbar.style.left = '0';
            domElements.toolbar.style.right = '0';
            domElements.toolbar.style.zIndex = '9999';
            domElements.toolbar.style.backgroundColor = 'rgba(0,0,0,0.8)';
        }
        
        showToast('Focus mode activated - distractions hidden.', 'info');
    }
    
    function toggleFocusMode() {
        isFocusMode = !isFocusMode;
        if (domElements.focusBtn) {
            domElements.focusBtn.textContent = isFocusMode ? 'Exit Focus' : 'Enter Focus';
        }
        
        document.body.classList.toggle('focus-mode', isFocusMode);
        
        if (isFocusMode) {
            updateFocusMode();
        } else {
            // Restore UI
            if (domElements.menuPanel) domElements.menuPanel.style.display = 'block';
            if (currentView === 'card' && domElements.sceneNavigatorPanel) domElements.sceneNavigatorPanel.style.display = 'block';
            if (isMobileDevice && domElements.toolbar) {
                domElements.toolbar.style.position = '';
                domElements.toolbar.style.bottom = '';
            }
            showToast('Focus mode deactivated.', 'info');
        }
        
        triggerHapticFeedback(100);
        localStorage.setItem('focusMode', isFocusMode.toString());
    }
    
    function toggleFullscreenMode() {
        if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) {
            showToast('Fullscreen not supported.', 'warning');
            return;
        }
        
        if (!isFullscreen) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
            isFullscreen = true;
            if (domElements.fullscreenBtn) domElements.fullscreenBtn.textContent = 'Exit Fullscreen';
            isFocusMode = true; // Auto-enter focus
            toggleFocusMode(); // Chain
            showToast('Entered fullscreen.', 'success');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            isFullscreen = false;
            if (domElements.fullscreenBtn) domElements.fullscreenBtn.textContent = 'Fullscreen';
            showToast('Exited fullscreen.', 'info');
        }
        
        // Listen for fullscreen change
        document.addEventListener('fullscreenchange', () => {
            isFullscreen = !!document.fullscreenElement;
        });
        document.addEventListener('webkitfullscreenchange', () => {
            isFullscreen = !!document.webkitFullscreenElement;
        });
        
        triggerHapticFeedback(150);
    }
    
    function handleWindowResize() {
        // Re-render current view if needed
        if (currentView === 'card') {
            updateCardViewWithPagination();
        }
        // Adjust editor for keyboard on mobile
        if (isMobileDevice && domElements.fountainInput && document.activeElement === domElements.fountainInput) {
            setTimeout(() => {
                domElements.fountainInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
        // Prevent zoom on double-tap (iOS)
        if (isMobileDevice) {
            document.body.style.touchAction = 'manipulation';
        }
    }
    
    function handleOrientationChange() {
        // Delay for rotation complete
        setTimeout(handleWindowResize, 500);
        if (isFocusMode) {
            triggerHapticFeedback(50);
        }
    }
    
    function handleBeforeUnload(event) {
        // Auto-save before leave
        saveProjectToStorage();
        if (cloudEnabled && isProUser) {
            syncToCloudNow();
        }
        // Warn if unsaved changes
        if (hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = 'Unsaved changes will be lost.';
            return 'Unsaved changes will be lost.';
        }
    }
    
    function hasUnsavedChanges() {
        // Simple check: Compare to last saved (implement diff if needed)
        return undoStack.length > 1; // If history has actions
    }
    
    function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            saveProjectToStorage();
        } else {
            // Resume auto-save
            startAutoSaveTimer();
        }
    }
    
    // ========================================
    // QUICK ACTIONS - Insertions and Toggles
    // ========================================
    function insertDefaultSceneHeading() {
        const cursorPos = domElements.fountainInput.selectionStart;
        const currentLine = getCurrentLineText();
        let newHeading = 'INT. NEW LOCATION - DAY';
        
        // Cycle Types if Current is Scene
        if (currentLine.trim().startsWith('INT.')) {
            newHeading = 'EXT. NEW LOCATION - DAY';
        } else if (currentLine.trim().startsWith('EXT.')) {
            newHeading = 'INT./EXT. NEW LOCATION - DAY';
        } else if (currentLine.trim().startsWith('INT./EXT.')) {
            newHeading = 'INT. NEW LOCATION - NIGHT';
        }
        
        // Insert with Sample Content
        const insertText = `\n\n${newHeading}\n\nCHARACTER\n    Sample dialogue here.\n\n`;
        domElements.fountainInput.value = domElements.fountainInput.value.substring(0, cursorPos) + insertText + domElements.fountainInput.value.substring(cursorPos);
        
        // Position Cursor
        const newPos = cursorPos + newHeading.length + 1;
        domElements.fountainInput.setSelectionRange(newPos, newPos);
        domElements.fountainInput.focus();
        
        handleEditorInput();
        triggerHapticFeedback(75);
        showToast('Scene heading inserted.', 'success');
    }
    
    function toggleSelectedTextCase() {
        const start = domElements.fountainInput.selectionStart;
        const end = domElements.fountainInput.selectionEnd;
        if (start === end) {
            showToast('Select text to toggle case.', 'warning');
            return;
        }
        
        const selected = domElements.fountainInput.value.substring(start, end);
        const toggled = selected === selected.toUpperCase() ? selected.toLowerCase() : selected.toUpperCase();
        
        domElements.fountainInput.value = domElements.fountainInput.value.substring(0, start) + toggled + domElements.fountainInput.value.substring(end);
        domElements.fountainInput.setSelectionRange(start, start + toggled.length);
        domElements.fountainInput.focus();
        
        handleEditorInput();
        showToast('Case toggled.', 'info');
    }
    
    function getCurrentLineText() {
        const pos = domElements.fountainInput.selectionStart;
        const textBefore = domElements.fountainInput.value.substring(0, pos);
        const lines = textBefore.split('\n');
        return lines[lines.length - 1];
    }
    
    // ========================================
    // EXPORT FUNCTIONS - PDF, Files, Share (Toscript2 Enhanced)
    // ========================================
    // PDF Export with Text/Image Modes
    async function exportToPdfDocument() {
        if (!domElements.fountainInput.value.trim()) {
            showToast('No content to export.', 'warning');
            return;
        }
        
        showLoadingIndicator(true, 'Generating PDF...');
        
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                throw new Error('jsPDF not loaded.');
            }
            
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const hasNonAscii = /[^\x00-\x7F]/.test(domElements.fountainInput.value); // Detect Unicode
            
            if (!hasNonAscii) {
                // Text-Based PDF (Faster, English/Latin)
                doc.setFont('courier'); // Monospace for script
                doc.setFontSize(12);
                const splitText = doc.splitTextToSize(domElements.fountainInput.value, 180); // Margin-adjusted
                doc.text(splitText, 15, 20);
            } else {
                // Image-Based for Unicode (Use Canvas Render)
                await generateImageBasedPdf(doc);
            }
            
            // Add Title Page if Pro
            if (isProUser) {
                doc.insertPage(0); // Insert before content
                doc.setFontSize(24);
                doc.text(projectData.projectInfo.projectName, 105, 50, { align: 'center' });
                doc.setFontSize(14);
                doc.text(`by ${projectData.projectInfo.prodName}`, 105, 70, { align: 'center' });
                doc.setFontSize(10);
                doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 100, { align: 'center' });
            }
            
            const filename = `${projectData.projectInfo.projectName || 'Script'}_${Date.now()}.pdf`;
            if (AndroidBridge) {
                // Native Save
                const pdfBase64 = doc.output('datauristring').split(',')[1];
                AndroidBridge.savePdfToDownloads(pdfBase64, filename);
                showToast('PDF saved via native.', 'success');
            } else {
                // Web Download
                doc.save(filename);
                showToast('PDF downloaded.', 'success');
            }
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('PDF generation failed: ' + error.message, 'error');
        } finally {
            showLoadingIndicator(false);
        }
    }
    
    async function generateImageBasedPdf(doc) {
        // Render preview to canvas
        await updateScriptPreviewView(); // Ensure fresh render
        const canvas = await html2canvas(domElements.screenplayOutput, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: domElements.screenplayOutput.scrollWidth,
            height: domElements.screenplayOutput.scrollHeight
        });
        
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add first page
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
    }
    
    // File Export (Fountain, TXT, Filmproj)
    function exportToFile(format) {
        if (!domElements.fountainInput.value.trim()) {
            showToast('No content to export.', 'warning');
            return;
        }
        
        let content, mimeType, filename;
        
        switch (format.toLowerCase()) {
            case 'fountain':
            case 'txt':
                content = domElements.fountainInput.value;
                mimeType = 'text/plain';
                filename = `${projectData.projectInfo.projectName}.${format}`;
                break;
            case 'filmproj':
                if (!isProUser) {
                    showToast('Filmproj export for Pro users.', 'warning');
                    return;
                }
                content = JSON.stringify({
                    ...projectData,
                    exportFormat: 'filmproj',
                    exportDate: new Date().toISOString(),
                    scenes: projectData.scenes.map(s => ({ ...s, fullContent: s.lines.join('\n') }))
                }, null, 2);
                mimeType = 'application/json';
                filename = `${projectData.projectInfo.projectName}.filmproj`;
                break;
            default:
                showToast('Unsupported format.', 'error');
                return;
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast(`${format.toUpperCase()} exported.`, 'success');
        
        // Native Handle if Android
        if (AndroidBridge) {
            const reader = new FileReader();
            reader.onload = () => AndroidBridge.saveFileToDownloads(reader.result.split(',')[1], filename, mimeType);
            reader.readAsDataURL(blob);
        }
    }
    
    // Share Script (Web Share API or Clipboard)
    async function shareCurrentScript() {
        if (!domElements.fountainInput.value.trim()) {
            showToast('No script to share.', 'warning');
            return;
        }
        
        const shareData = {
            title: projectData.projectInfo.projectName,
            text: `Check out this screenplay: ${projectData.projectInfo.projectName} by ${projectData.projectInfo.prodName}`,
            url: window.location.href // Or generate share link
        };
        
        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                showToast('Script shared!', 'success');
                if (AndroidBridge) AndroidBridge.onShareSuccess();
            } catch (error) {
                console.log('Share failed:', error);
                fallbackToClipboard();
            }
        } else {
            fallbackToClipboard();
        }
    }
    
    function fallbackToClipboard() {
        const textToCopy = domElements.fountainInput.value.substring(0, 1000) + '\n\n... (full script in app)';
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Script copied to clipboard (preview).', 'info');
        }).catch(() => {
            showToast('Copy failed. Use export.', 'warning');
        });
    }
    
    // Card Export (Toscript2, Gated for Pro, Uses Basic Cards)
    async function exportIndexCards() {
        if (!isProUser) {
            showToast('Card export requires Pro upgrade.', 'warning');
            return;
        }
        
        if (!projectData.scenes.length) {
            showToast('No cards to export.', 'warning');
            return;
        }
        
        showLoadingIndicator(true, 'Preparing card export...');
        
        const exportType = prompt('Export cards as:\n1. Current Page PDF\n2. All Cards PDF (multi-page)\n3. All Cards ZIP PNGs\nEnter 1, 2, or 3:');
        
        try {
            if (exportType === '1') {
                // Current Page PDF
                const tempCanvas = await html2canvas(domElements.cardView, { scale: 1.5 });
                const { jsPDF } = window.jspdf;
                const pdfDoc = new jsPDF();
                const imgData = tempCanvas.toDataURL('image/png');
                pdfDoc.addImage(imgData, 'PNG', 0, 0, 210, 297);
                pdfDoc.save('Current_Cards.pdf');
            } else if (exportType === '2') {
                // All Cards Multi-PDF
                await exportAllCardsToMultiPdf();
            } else if (exportType === '3') {
                // ZIP PNGs
                await exportAllCardsToZip();
            } else {
                showToast('Invalid choice. Export canceled.', 'warning');
                return;
            }
            
            showToast('Cards exported successfully!', 'success');
        } catch (error) {
            console.error('Card export error:', error);
            showToast('Export failed: ' + error.message, 'error');
        } finally {
            showLoadingIndicator(false);
        }
    }
    
    async function exportAllCardsToMultiPdf() {
        const { jsPDF } = window.jspdf;
        let pdfDoc = new jsPDF();
        let pageCount = 1;
        
        for (let pageStart = 0; pageStart < projectData.scenes.length; pageStart += cardsPerPage) {
            const pageScenes = projectData.scenes.slice(pageStart, pageStart + cardsPerPage);
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'relative';
            tempContainer.style.width = '595px'; // A4 pt width
            tempContainer.style.height = 'auto';
            
            pageScenes.forEach(scene => {
                const cardHtml = `
                    <div style="display: inline-block; width: 180px; margin: 10px; vertical-align: top; border: 1px solid #ccc; padding: 10px; font-family: courier;">
                        <h4 style="margin: 0 0 5px 0;">${scene.type} ${scene.location} - ${scene.time}</h4>
                        <p style="margin: 5px 0; font-size: 10px;">${generateSceneSummary(scene.content, 100)}</p>
                        <small>Scene ${scene.id + 1} | ${scene.wordCount} words</small>
                    </div>
                `;
                tempContainer.innerHTML += cardHtml;
            });
            
            document.body.appendChild(tempContainer);
            const canvas = await html2canvas(tempContainer, { scale: 0.5 }); // Scale for A4
            document.body.removeChild(tempContainer);
            
            const imgData = canvas.toDataURL('image/png');
            if (pageStart > 0) pdfDoc.addPage();
            pdfDoc.addImage(imgData, 'PNG', 0, 0, 210, 297);
            pageCount++;
        }
        
        pdfDoc.save('All_Cards.pdf');
    }
    
    async function exportAllCardsToZip() {
        if (typeof JSZip === 'undefined') {
            showToast('JSZip not loaded. Cannot create ZIP.', 'error');
            return;
        }
        
        const zip = new JSZip();
        for (let i = 0; i < projectData.scenes.length; i++) {
            const scene = projectData.scenes[i];
            const tempCard = document.createElement('div');
            tempCard.innerHTML = `
                <div style="width: 200px; height: 300px; border: 1px solid #000; padding: 10px; font-family: courier; background: white;">
                    <h4>${scene.type} ${scene.location} - ${scene.time}</h4>
                    <p>${generateSceneSummary(scene.content, 200)}</p>
                    <small>Scene ${i + 1}</small>
                </div>
            `;
            document.body.appendChild(tempCard);
            
            const canvas = await html2canvas(tempCard, { scale: 2 });
            document.body.removeChild(tempCard);
            
            zip.file(`card_scene_${i + 1}.png`, canvas.toDataURL('image/png').split(',')[1], { base64: true });
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'All_Cards.zip';
        link.click();
        URL.revokeObjectURL(url);
    }
    
    function showLoadingIndicator(show, message = '') {
        if (show) {
            if (!domElements.loadingIndicator) {
                domElements.loadingIndicator = document.createElement('div');
                domElements.loadingIndicator.id = 'loading-indicator';
                domElements.loadingIndicator.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10001; display: flex; align-items: center; justify-content: center;">
                        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                            <div class="spinner"></div>
                            <p>${message}</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(domElements.loadingIndicator);
            }
            if (message) domElements.loadingIndicator.querySelector('p').textContent = message;
        } else if (domElements.loadingIndicator) {
            domElements.loadingIndicator.remove();
        }
    }
    
    // ========================================
    // CLOUD STORAGE - Google Drive and Dropbox (Pro-Only)
    // ========================================
    function setupCloudIntegration() {
        if (!isProUser) {
            console.log('Cloud setup skipped: Not Pro.');
            return;
        }
        
        // Load Google API Script if Not Loaded
        if (typeof gapi === 'undefined' || !gapi.client) {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = initGoogleApi;
            document.head.appendChild(script);
        } else {
            initGoogleApi();
        }
        
        // Dropbox (Assume SDK Loaded)
        if (typeof Dropbox === 'undefined') {
            loadDropboxSdk();
        } else {
            initDropboxApi();
        }
        
        console.log('Cloud integration setup complete.');
    }
    
    function initGoogleApi() {
        const apiKey = localStorage.getItem('gapiKey');
        const clientId = localStorage.getItem('gapiClientId');
        if (!apiKey || !clientId) {
            showToast('Enter Google API credentials in Cloud Settings.', 'warning');
            return;
        }
        
        gapi.load('client:auth2:picker', () => {
            gapi.client.init({
                apiKey: apiKey,
                clientId: clientId,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appfolder'
            }).then(() => {
                gapi.auth2.getAuthInstance().isSignedIn.listen(updateCloudSignInStatus);
                updateCloudSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
                showToast('Google Drive ready.', 'success');
                
                // Start Periodic Sync
                if (cloudSyncInterval) clearInterval(cloudSyncInterval);
                cloudSyncInterval = setInterval(syncToCloudNow, 300000); // 5 min
            }).catch(err => {
                console.error('Google API init error:', err);
                showToast('Google Drive setup failed.', 'error');
            });
        });
    }
    
    function updateCloudSignInStatus(isSignedIn) {
        if (isSignedIn) {
            showToast('Signed in to Google Drive.', 'success');
        } else {
            // Auto-sign if needed
            gapi.auth2.getAuthInstance().signIn();
        }
    }
    
    function initDropboxApi() {
        const token = localStorage.getItem('dropboxToken');
        if (!token) {
            showToast('Enter Dropbox token in settings.', 'warning');
            return;
        }
        try {
            dropboxApi = new Dropbox({ accessToken: token });
            showToast('Dropbox ready.', 'success');
        } catch (err) {
            console.error('Dropbox init error:', err);
            showToast('Dropbox setup failed.', 'error');
        }
    }
    
    function loadDropboxSdk() {
        const script = document.createElement('script');
        script.src = 'https://www.dropbox.com/static/api/sdk/v2/dropbox-sdk.min.js';
        script.onload = initDropboxApi;
        document.head.appendChild(script);
    }
    
    function toggleCloudSyncStatus() {
        if (!isProUser) {
            showToast('Cloud sync is Pro-only.', 'warning');
            return;
        }
        
        cloudEnabled = !cloudEnabled;
        localStorage.setItem('cloudEnabled', cloudEnabled.toString());
        
        if (domElements.cloudSyncBtn) {
            domElements.cloudSyncBtn.textContent = cloudEnabled ? 'Disable Cloud Sync' : 'Enable Cloud Sync';
            domElements.cloudSyncBtn.classList.toggle('active', cloudEnabled);
        }
        
        if (cloudEnabled) {
            setupCloudIntegration();
            syncToCloudNow(); // Immediate sync
            showToast('Cloud sync enabled.', 'success');
        } else {
            if (cloudSyncInterval) {
                clearInterval(cloudSyncInterval);
                cloudSyncInterval = null;
            }
            showToast('Cloud sync disabled.', 'info');
        }
    }
    
    async function syncToCloudNow() {
        if (!cloudEnabled || !isProUser) return;
        
        showToast('Syncing to cloud...', 'info');
        
        try {
            const projectJson = JSON.stringify(projectData);
            let syncSuccess = true;
            
            // Google Drive Sync
            if (gapi && gapi.client.drive && gapi.auth2.getAuthInstance().isSignedIn.get()) {
                try {
                    // Create or Update File
                    const fileMetadata = {
                        name: `${projectData.projectInfo.projectName}.filmproj`,
                        parents: [gdriveFolderId || 'appDataFolder'] // App folder or custom
                    };
                    const form = new FormData();
                    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
                    form.append('media', new Blob([projectJson], { type: 'application/json' }));
                    
                    const response = await gapi.client.request({
                        path: '/upload/drive/v3/files?uploadType=multipart',
                        method: 'POST',
                        params: { uploadType: 'multipart' },
                        body: form
                    });
                    
                    console.log('Drive sync success:', response);
                } catch (driveErr) {
                    console.error('Drive sync error:', driveErr);
                    syncSuccess = false;
                }
            }
            
            // Dropbox Sync
            if (dropboxApi) {
                try {
                    await dropboxApi.filesUpload({
                        path: `/${projectData.projectInfo.projectName}.filmproj`,
                        contents: projectJson,
                        mode: { '.tag': 'overwrite' }
                    });
                    console.log('Dropbox sync success.');
                } catch (dbErr) {
                    console.error('Dropbox sync error:', dbErr);
                    syncSuccess = false;
                }
            }
            
            if (syncSuccess) {
                showToast('Synced to cloud successfully.', 'success');
                projectData.lastSynced = new Date().toISOString();
            } else {
                showToast('Partial sync success. Check settings.', 'warning');
            }
        } catch (error) {
            console.error('Cloud sync error:', error);
            showToast(`Sync failed: ${error.message}. Quota?`, 'error');
            if (error.status === 403 || error.message.includes('quota')) {
                openCloudConfigModal(); // Prompt reconfig
            }
        }
    }
    
    async function openFileFromCloud() {
        if (!isProUser) {
            showToast('Cloud open for Pro users.', 'warning');
            return;
        }
        
        if (!cloudEnabled) {
            showToast('Enable cloud sync first.', 'warning');
            return;
        }
        
        showToast('Opening cloud picker...', 'info');
        
        // Google Picker
        if (gapi && window.google && window.google.picker) {
            const picker = new google.picker.PickerBuilder()
                .addView(new google.picker.DocsView().setIncludeFolders(true).setMimeTypes('application/json,text/plain'))
                .setOAuthToken(gapi.auth.getToken().access_token)
                .setDeveloperKey(localStorage.getElementById('gapiKey'))
                .setCallback(pickerCallback)
                .build();
            picker.setVisible(true);
        } else {
            // Fallback to Manual ID Input or Dropbox
            if (dropboxApi) {
                // Dropbox Chooser (Assume SDK has chooser)
                Dropbox.choose({
                    success: (files) => {
                        files.forEach(file => {
                            dropboxApi.filesDownload({ path: file.path_lower }).then(res => {
                                const loadedData = JSON.parse(res.result.fileBlob);
                                loadProjectFromJson(loadedData);
                                showToast('Loaded from Dropbox.', 'success');
                            });
                        });
                    },
                    cancel: () => showToast('Chooser canceled.', 'info'),
                    linkType: 'direct',
                    multiselect: false,
                    extensions: ['.fountain', '.filmproj']
                });
            } else {
                const fileId = prompt('Enter Google Drive File ID:');
                if (fileId) {
                    try {
                        const response = await gapi.client.drive.files.get({
                            fileId: fileId,
                            alt: 'media'
                        });
                        const loadedData = JSON.parse(response.body);
                        loadProjectFromJson(loadedData);
                        showToast('Loaded from Drive.', 'success');
                    } catch (err) {
                        showToast('Load failed: Invalid ID or auth.', 'error');
                    }
                }
            }
        }
    }
    
    function pickerCallback(data) {
        if (data.action === google.picker.Action.PICKED) {
            const file = data.docs[0];
            gapi.client.drive.files.get({
                fileId: file.id,
                alt: 'media'
            }).then(response => {
                try {
                    const loadedData = JSON.parse(response.body);
                    loadProjectFromJson(loadedData);
                    showToast('Loaded from cloud.', 'success');
                } catch (parseErr) {
                    showToast('Invalid file format.', 'error');
                }
            }).catch(err => {
                showToast('Load error: ' + err.message, 'error');
            });
        }
    }
    
    function loadProjectFromJson(jsonData) {
        projectData = jsonData;
        if (domElements.fountainInput) domElements.fountainInput.value = projectData.scriptContent || '';
        parseFountainContent();
        updateAllViews();
        saveProjectToStorage(); // Backup locally
    }
    
    // ========================================
    // ANDROID BRIDGE INTEGRATION
    // ========================================
    function setupAndroidBridge() {
        if (!AndroidBridge) return;
        
        // Back Button Handling
        AndroidBridge.onBackPressed = handleAndroidBackPress;
        
        // Save Callback
        AndroidBridge.requestSave = () => {
            saveProjectToStorage();
            const jsonStr = JSON.stringify(projectData);
            AndroidBridge.provideSavedJson(btoa(unescape(encodeURIComponent(jsonStr))));
        };
        
        // Load Callback
        AndroidBridge.requestLoad = () => {
            loadProjectFromStorage();
            AndroidBridge.provideLoadedJson(btoa(unescape(encodeURIComponent(JSON.stringify(projectData)))));
        };
        
        // PDF Export Callback
        AndroidBridge.requestPdf = async () => {
            await exportToPdfDocument();
            // Assume PDF is saved natively
        };
        
        // Ad Control (Hide if Pro)
        if (isProUser) {
            AndroidBridge.hideAllAds();
        } else {
            AndroidBridge.showBannerAd();
            AndroidBridge.requestInterstitialAd();
        }
        
        // Pro Purchase Listener (Already in initPro)
        
        console.log('Android bridge setup complete.');
    }
    
    function handleAndroidBackPress() {
        if (isFullscreen) {
            toggleFullscreenMode();
            return true; // Handled
        }
        if (isFocusMode) {
            toggleFocusMode();
            return true;
        }
        if (currentView !== 'write') {
            safeSwitchView('write');
            return true;
        }
        if (document.querySelector('.modal')) {
            closeAllModals();
            return true;
        }
        // Propagate to native
        return false;
    }
    
    // Utility for Base64 <-> Blob
    function dataUrlToBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
    
    // ========================================
    // UTILITY FUNCTIONS - Toolbar, Drag/Drop, Errors
    // ========================================
    function updateToolbarState() {
        // Enable/disable buttons based on state
        if (domElements.undoBtn) domElements.undoBtn.disabled = undoStack.length < 2;
        if (domElements.redoBtn) domElements.redoBtn.disabled = redoStack.length === 0;
        if (domElements.sceneNumbersBtn) domElements.sceneNumbersBtn.textContent = showSceneNumbers ? 'Hide #' : 'Show #';
        if (isProUser) {
            // Show pro icons
            document.querySelectorAll('.pro-only').forEach(el => el.style.opacity = '1');
        }
    }
    
    // Drag/Drop for File Open
    function handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        document.body.classList.add('dragging');
    }
    
    function handleFileDrop(event) {
        event.preventDefault();
        document.body.classList.remove('dragging');
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            loadFileFromDrop(files[0]);
        }
    }
    
    async function loadFileFromDrop(file) {
        if (!file.type.startsWith('text/') && !file.name.endsWith('.fountain') && !file.name.endsWith('.filmproj')) {
            showToast('Unsupported file type.', 'warning');
            return;
        }
        
        const text = await file.text();
        if (file.name.endsWith('.filmproj')) {
            try {
                const jsonData = JSON.parse(text);
                loadProjectFromJson(jsonData);
            } catch (err) {
                showToast('Invalid Filmproj file.', 'error');
            }
        } else {
            // Fountain or TXT
            if (domElements.fountainInput) domElements.fountainInput.value = text;
            projectData.projectInfo.projectName = file.name.replace(/\.(fountain|txt)$/, '');
            handleEditorInput();
        }
        showToast(`Loaded ${file.name}`, 'success');
    }
    
    // Global Keydown Handler
    function handleGlobalKeydown(event) {
        // View Shortcuts
        if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
            switch (event.key.toLowerCase()) {
                case 'w': // Ctrl+W -> Write
                    event.preventDefault();
                    safeSwitchView('write');
                    break;
                case 'p': // Ctrl+P -> Preview/Script
                    event.preventDefault();
                    safeSwitchView('script');
                    break;
                case 'c': // Ctrl+C -> Cards
                    event.preventDefault();
                    safeSwitchView('card');
                    break;
                case 's':
                    event.preventDefault();
                    saveProjectToStorage();
                    break;
                case 'z':
                    event.preventDefault();
                    if (event.shiftKey) performRedo(); else performUndo();
                    break;
                case 'f11':
                    event.preventDefault();
                    toggleFullscreenMode();
                    break;
                case 'h':
                    event.preventDefault();
                    openHelpModal();
                    break;
            }
        }
        
        // Escape Closes Modals/Focus
        if (event.key === 'Escape') {
            closeAllModals();
            if (isFocusMode) toggleFocusMode();
            if (isFullscreen) toggleFullscreenMode();
            if (currentView !== 'write') safeSwitchView('write');
        }
    }
    
    // Error Boundary (Global)
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        showToast('An error occurred. Check console.', 'error');
        if (AndroidBridge) AndroidBridge.reportCrash(event.error.message);
    });
    
    // ========================================
    // START APPLICATION
    // ========================================
    initializeApp();
    
    // Expose Functions for HTML/Bridge/Global Access
    window.Toscript3 = {
        switchView: safeSwitchView,
        exportToPdf: exportToPdfDocument,
        exportCards: exportIndexCards,
        openProjectModal: openProjectInfoModal,
        jumpToScene: jumpToSceneInEditor,
        toggleCloud: toggleCloudSyncStatus,
        openCloud: openFileFromCloud,
        simulatePro: simulateProPurchase,
        undo: performUndo,
        redo: performRedo,
        syncNow: syncToCloudNow
    };
    
    console.log('Toscript3 fully loaded and ready.');
    
    // ========================================
    // End of Toscript3 JS - Total Lines: ~3200 (with comments and expansions)
    // Notes:
    // - This is a complete, self-contained script. Copy-paste into your HTML <script> tag.
    // - Ensure dependencies (jsPDF, html2canvas, JSZip, Google/Dropbox SDKs) are included in <head>.
    // - For Android WebView, define window.Android with methods like onBackPressed, savePdfToDownloads, etc.
    // - Test card view: Basic summaries, pagination, no edits - per Toscript1.
    // - Pro logic: Set localStorage 'toscriptProUser' = 'true' to enable cloud/ads hide.
    // - Cloud: Requires real API keys/tokens in localStorage; handles auth/errors.
    // - Expand further if needed (e.g., more modal HTML, custom CSS integration).
    // ========================================
});
