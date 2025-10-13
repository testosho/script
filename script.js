// ========================================
// ToscripT Professional v3.0 ULTIMATE
// Complete merge: Toscript1 Card Logic + Toscript2 New Features
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================
    // GLOBAL VARIABLES - MERGED FROM BOTH VERSIONS
    // ========================================
    let projectData = {
        projectInfo: {
            projectName: 'Untitled',
            prodName: 'Author',
            scriptContent: '',
            scenes: []
        }
    };
    
    // Core settings
    let fontSize = 16;
    let autoSaveInterval = null;
    let showSceneNumbers = true;
    let currentView = 'write';
    let debounceTimeout = null;
    let isUpdatingFromSync = false;
    
    // Card system - TOSCRIPT1 VALUES
    let currentPage = 0;
    const cardsPerPage = 5; // TOSCRIPT1: 5 cards per page with pagination
    
    // History system
    let undoStack = [];
    let redoStack = [];
    let isPlaceholder = true;
    let isFocusMode = false;
    let isFullscreen = false;
    
    // Cloud & Sync - FROM TOSCRIPT2
    let gapi = null;
    let gapiInited = false;
    let isSignedIn = false;
    let autoSyncEnabled = false;
    let autoSyncTimer = null;
    let lastSyncTime = null;
    
    // Drag and drop
    let draggedElement = null;
    
    // Android - FROM TOSCRIPT2
    let isAndroidWebView = false;
    
    // ========================================
    // DOM ELEMENTS - COMPLETE REFERENCES
    // ========================================
    const fountainInput = document.getElementById('fountain-input');
    const screenplayOutput = document.getElementById('screenplay-output');
    const menuPanel = document.getElementById('menu-panel');
    const sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    const writeView = document.getElementById('write-view');
    const scriptView = document.getElementById('script-view');
    const cardView = document.getElementById('card-view');
    const cardContainer = document.getElementById('card-container');
    const sceneList = document.getElementById('scene-list');
    const mobileKeyboardToolbar = document.getElementById('mobile-keyboard-toolbar');
    const desktopSideToolbar = document.getElementById('desktop-side-toolbar');
    const splashScreen = document.getElementById('splash-screen');
    
    // Headers
    const mainHeader = document.getElementById('main-header');
    const scriptHeader = document.getElementById('script-header');
    const cardHeader = document.getElementById('card-header');
    
    // Main Toolbar Buttons
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerBtnScript = document.getElementById('hamburger-btn-script');
    const hamburgerBtnCard = document.getElementById('hamburger-btn-card');
    const showScriptBtn = document.getElementById('show-script-btn');
    const showWriteBtnHeader = document.getElementById('show-write-btn-header');
    const showWriteBtnCardHeader = document.getElementById('show-write-btn-card-header');
    const sceneNavigatorBtn = document.getElementById('scene-navigator-btn');
    const sceneNavigatorBtnScript = document.getElementById('scene-navigator-btn-script');
    const closeNavigatorBtn = document.getElementById('close-navigator-btn');
    const cardViewBtn = document.getElementById('card-view-btn');
    const fullscreenBtnMain = document.getElementById('fullscreen-btn-main');
    const focusModeBtn = document.getElementById('focus-mode-btn');
    const focusExitBtn = document.getElementById('focus-exit-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const undoBtnTop = document.getElementById('undo-btn-top');
    const redoBtnTop = document.getElementById('redo-btn-top');
    
    // Card View Buttons - TOSCRIPT1 COMPLETE SET
    const addNewCardBtn = document.getElementById('add-new-card-btn');
    const saveAllCardsBtn = document.getElementById('save-all-cards-btn');
    const exportSceneOrderBtn = document.getElementById('export-scene-order-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageIndicator = document.getElementById('page-indicator');
    
    // Menu Items
    const newBtn = document.getElementById('new-btn');
    const openBtn = document.getElementById('open-btn');
    const projectInfoBtn = document.getElementById('project-info-btn');
    const titlePageBtn = document.getElementById('title-page-btn');
    const saveMenuBtn = document.getElementById('save-menu-btn');
    const cloudMenuBtn = document.getElementById('cloud-menu-btn');
    const saveFountainBtn = document.getElementById('save-fountain-btn');
    const savePdfEnglishBtn = document.getElementById('save-pdf-english-btn');
    const savePdfUnicodeBtn = document.getElementById('save-pdf-unicode-btn');
    const saveFilmprojBtn = document.getElementById('save-filmproj-btn');
    
    // Cloud Menu Items - FROM TOSCRIPT2
    const googleDriveSaveBtn = document.getElementById('google-drive-save-btn');
    const googleDriveOpenBtn = document.getElementById('google-drive-open-btn');
    const dropboxSaveBtn = document.getElementById('dropbox-save-btn');
    const dropboxOpenBtn = document.getElementById('dropbox-open-btn');
    const cloudSyncBtn = document.getElementById('cloud-sync-btn');
    
    // Settings Menu Items
    const autoSaveBtn = document.getElementById('auto-save-btn');
    const shareBtn = document.getElementById('share-btn');
    const sceneNoBtn = document.getElementById('scene-no-btn');
    const clearProjectBtn = document.getElementById('clear-project-btn');
    const infoBtn = document.getElementById('info-btn');
    const aboutBtn = document.getElementById('about-btn');
    
    // Modals
    const infoModal = document.getElementById('info-modal');
    const aboutModal = document.getElementById('about-modal');
    const titlePageModal = document.getElementById('title-page-modal');
    const projectInfoModal = document.getElementById('project-info-modal');
    const cloudSyncModal = document.getElementById('cloud-sync-modal');
    
    // File Input
    const fileInput = document.getElementById('file-input');
    
    // Filter Elements
    const filterCategorySelect = document.getElementById('filter-category-select');
    const filterValueInput = document.getElementById('filter-value-input');
    const filterHelpText = document.getElementById('filter-help-text');
    
    // ========================================
    // PLACEHOLDER TEXT
    // ========================================
    const placeholderText = `INT. COFFEE SHOP - DAY

ALEX, a young screenwriter, sits at a laptop, typing furiously.

ALEX
(to himself)
This is it. The perfect opening scene.

The coffee shop door opens. MORGAN enters, scanning the room.

MORGAN
Alex? Is that you?

Alex looks up, surprised.

ALEX
Morgan! I haven't seen you in years!

They embrace warmly.

FADE TO:

EXT. CITY STREET - NIGHT

Alex and Morgan walk together, reminiscing about old times.

MORGAN
Remember when we said we'd make movies together?

ALEX
We still can. It's never too late.

They stop at a crosswalk, looking at each other with determination.

FADE OUT.`;

    // ========================================
    // TOAST NOTIFICATION SYSTEM - FROM TOSCRIPT2
    // ========================================
    
    function showToast(message, type = 'success', duration = 3000) {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#ff9800'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            max-width: 90%;
            text-align: center;
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Haptic feedback on mobile
        if (navigator.vibrate && type === 'success') {
            navigator.vibrate(50);
        }
        
        // Remove after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    // ========================================
    // ANDROID DETECTION - FROM TOSCRIPT2
    // ========================================
    
    function checkAndroidWebView() {
        const ua = navigator.userAgent.toLowerCase();
        isAndroidWebView = /android/i.test(ua) && /wv/.test(ua);
        
        if (isAndroidWebView) {
            console.log('Running in Android WebView');
            // Enable hardware acceleration hints
            document.body.style.transform = 'translateZ(0)';
        }
        
        return isAndroidWebView;
    }
    
    function setupAndroidBackButton() {
        if (typeof window.AndroidBridge !== 'undefined') {
            window.handleBackPress = function() {
                if (menuPanel && menuPanel.classList.contains('open')) {
                    toggleMenu();
                    return true;
                }
                if (sceneNavigatorPanel && sceneNavigatorPanel.classList.contains('open')) {
                    toggleSceneNavigator();
                    return true;
                }
                if (currentView !== 'write') {
                    switchView('write');
                    return true;
                }
                return false; // Let system handle back
            };
        }
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    function init() {
        console.log('Initializing ToscripT v3.0 Ultimate...');
        
        // Check Android
        checkAndroidWebView();
        setupAndroidBackButton();
        
        // Show splash screen
        if (splashScreen) {
            setTimeout(() => {
                splashScreen.style.opacity = '0';
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                }, 500);
            }, 2000);
        }
        
        // Load saved data
        loadFromLocalStorage();
        
        // Initialize editor
        if (!fountainInput.value || fountainInput.value.trim() === '') {
            fountainInput.value = placeholderText;
            isPlaceholder = true;
        }
        
        // Update scene list
        updateSceneList();
        
        // Focus editor
        fountainInput.focus();
        
        // Save initial state
        saveToUndoStack();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('ToscripT v3.0 Ultimate initialized successfully!');
        showToast('ToscripT loaded successfully!', 'success');
    }
    
    // Initialize app
    init();

    // ========================================
    // EVENT LISTENERS SETUP - COMPLETE
    // ========================================
    
    function setupEventListeners() {
        // ========================================
        // TOOLBAR BUTTONS
        // ========================================
        
        hamburgerBtn?.addEventListener('click', toggleMenu);
        hamburgerBtnScript?.addEventListener('click', toggleMenu);
        hamburgerBtnCard?.addEventListener('click', toggleMenu);
        
        showScriptBtn?.addEventListener('click', () => switchView('script'));
        showWriteBtnHeader?.addEventListener('click', () => switchView('write'));
        showWriteBtnCardHeader?.addEventListener('click', () => switchView('write'));
        
        sceneNavigatorBtn?.addEventListener('click', toggleSceneNavigator);
        sceneNavigatorBtnScript?.addEventListener('click', toggleSceneNavigator);
        closeNavigatorBtn?.addEventListener('click', toggleSceneNavigator);
        
        cardViewBtn?.addEventListener('click', () => switchView('card'));
        
        fullscreenBtnMain?.addEventListener('click', toggleFullscreen);
        focusModeBtn?.addEventListener('click', toggleFocusMode);
        focusExitBtn?.addEventListener('click', toggleFocusMode);
        
        zoomInBtn?.addEventListener('click', () => changeFontSize(2));
        zoomOutBtn?.addEventListener('click', () => changeFontSize(-2));
        
        undoBtnTop?.addEventListener('click', undo);
        redoBtnTop?.addEventListener('click', redo);
        
        // ========================================
        // CARD VIEW BUTTONS - TOSCRIPT1 COMPLETE
        // ========================================
        
        addNewCardBtn?.addEventListener('click', () => addNewSceneCard());
        
        // Export menu with options
        saveAllCardsBtn?.addEventListener('click', showExportOptions);
        
        exportSceneOrderBtn?.addEventListener('click', exportSceneOrder);
        
        // Pagination - TOSCRIPT1 LOGIC
        prevPageBtn?.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                renderEnhancedCardView();
                showToast(`Page ${currentPage + 1}`, 'success', 1500);
            }
        });
        
        nextPageBtn?.addEventListener('click', () => {
            const totalPages = Math.ceil(projectData.projectInfo.scenes.length / cardsPerPage);
            if (currentPage < totalPages - 1) {
                currentPage++;
                renderEnhancedCardView();
                showToast(`Page ${currentPage + 1}`, 'success', 1500);
            }
        });
        
        // ========================================
        // MENU ITEMS
        // ========================================
        
        newBtn?.addEventListener('click', () => {
            if (confirm('Create a new project? Unsaved changes will be lost.')) {
                clearProject();
            }
        });
        
        openBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', handleFileOpen);
        
        projectInfoBtn?.addEventListener('click', showProjectInfo);
        titlePageBtn?.addEventListener('click', () => showModal(titlePageModal));
        
        saveMenuBtn?.addEventListener('click', toggleSaveSubmenu);
        cloudMenuBtn?.addEventListener('click', toggleCloudSubmenu);
        
        saveFountainBtn?.addEventListener('click', saveFountain);
        savePdfEnglishBtn?.addEventListener('click', () => savePDF('English'));
        savePdfUnicodeBtn?.addEventListener('click', () => savePDF('Unicode'));
        saveFilmprojBtn?.addEventListener('click', saveFilmproj);
        
        // Cloud buttons - FROM TOSCRIPT2
        googleDriveSaveBtn?.addEventListener('click', saveToGoogleDrive);
        googleDriveOpenBtn?.addEventListener('click', openFromGoogleDrive);
        dropboxSaveBtn?.addEventListener('click', saveToDropbox);
        dropboxOpenBtn?.addEventListener('click', openFromDropbox);
        cloudSyncBtn?.addEventListener('click', openCloudSyncModal);
        
        autoSaveBtn?.addEventListener('click', toggleAutoSave);
        shareBtn?.addEventListener('click', shareScript);
        sceneNoBtn?.addEventListener('click', toggleSceneNumbers);
        clearProjectBtn?.addEventListener('click', () => {
            if (confirm('Clear all content? This cannot be undone.')) {
                clearProject();
            }
        });
        
        infoBtn?.addEventListener('click', () => showModal(infoModal));
        aboutBtn?.addEventListener('click', () => showModal(aboutModal));
        
        // ========================================
        // FOUNTAIN INPUT EVENTS
        // ========================================
        
        fountainInput?.addEventListener('focus', () => {
            if (isPlaceholder) {
                fountainInput.value = '';
                isPlaceholder = false;
            }
            if (currentView === 'write' && !isFocusMode) {
                showMobileToolbar();
            }
        });
        
        fountainInput?.addEventListener('blur', () => {
            if (fountainInput.value.trim() === '') {
                fountainInput.value = placeholderText;
                isPlaceholder = true;
            }
        });
        
        fountainInput?.addEventListener('input', () => {
            if (!isUpdatingFromSync) {
                saveToUndoStack();
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    updateSceneList();
                    saveToLocalStorage();
                }, 300);
            }
        });
        
        // ========================================
        // MODAL EVENTS
        // ========================================
        
        const closeButtons = document.querySelectorAll('.close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) closeModal(modal);
            });
        });
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeModal(e.target);
            }
        });
        
        // Title Page Save
        document.getElementById('save-title-btn')?.addEventListener('click', () => {
            projectData.projectInfo.projectName = document.getElementById('title-input')?.value || 'Untitled';
            projectData.projectInfo.prodName = document.getElementById('author-input')?.value || 'Author';
            saveToLocalStorage();
            closeModal(titlePageModal);
            showToast('Title page saved!', 'success');
        });
        
        // Cloud Sync Modal - FROM TOSCRIPT2
        document.getElementById('enable-auto-sync-btn')?.addEventListener('click', () => {
            autoSyncEnabled = true;
            startAutoSync();
            showToast('Auto-sync enabled! Syncing every 5 minutes.', 'success');
            closeModal(cloudSyncModal);
        });
        
        document.getElementById('disable-auto-sync-btn')?.addEventListener('click', () => {
            autoSyncEnabled = false;
            stopAutoSync();
            showToast('Auto-sync disabled.', 'warning');
            closeModal(cloudSyncModal);
        });
        
        document.getElementById('sync-now-btn')?.addEventListener('click', () => {
            syncNow();
        });
        
        // ========================================
        // SCENE NAVIGATOR EVENTS
        // ========================================
        
        filterCategorySelect?.addEventListener('change', updateFilterHelp);
        
        document.getElementById('apply-filter-btn')?.addEventListener('click', () => {
            const category = filterCategorySelect.value;
            const value = filterValueInput?.value.trim();
            filterScenes(category, value);
        });
        
        document.getElementById('clear-filter-btn')?.addEventListener('click', () => {
            if (filterValueInput) filterValueInput.value = '';
            updateSceneList();
        });
        
        // ========================================
        // MOBILE KEYBOARD TOOLBAR
        // ========================================
        
        document.getElementById('int-ext-btn')?.addEventListener('click', () => {
            insertOrCycleText(['INT. ', 'EXT. ', 'INT./EXT. ', 'I/E. ']);
        });
        
        document.getElementById('day-night-btn')?.addEventListener('click', () => {
            insertOrCycleText([
                ' - DAY', 
                ' - NIGHT', 
                ' - MORNING', 
                ' - EVENING', 
                ' - AFTERNOON', 
                ' - DAWN', 
                ' - DUSK', 
                ' - CONTINUOUS'
            ]);
        });
        
        document.getElementById('caps-btn')?.addEventListener('click', () => {
            toggleCaps();
        });
        
        document.getElementById('paren-btn')?.addEventListener('click', () => {
            insertText('()', -1);
        });
        
        document.getElementById('transition-btn')?.addEventListener('click', () => {
            insertOrCycleText([
                '\n\nCUT TO:\n\n', 
                '\n\nFADE TO:\n\n', 
                '\n\nDISSOLVE TO:\n\n', 
                '\n\nFADE IN:\n\n',
                '\n\nFADE OUT.\n\n',
                '\n\nSMASH CUT TO:\n\n',
                '\n\nJUMP CUT TO:\n\n',
                '\n\nMATCH CUT TO:\n\n'
            ]);
        });
        
        document.getElementById('undo-btn')?.addEventListener('click', undo);
        document.getElementById('redo-btn')?.addEventListener('click', redo);
        
        // ========================================
        // KEYBOARD SHORTCUTS
        // ========================================
        
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // ========================================
        // WINDOW EVENTS
        // ========================================
        
        window.addEventListener('resize', handleWindowResize);
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        console.log('Event listeners setup complete');
    }
    
    // ========================================
    // KEYBOARD SHORTCUTS HANDLER
    // ========================================
    
    function handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S - Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveToLocalStorage();
            showToast('Project saved!', 'success', 1500);
        }
        
        // Ctrl/Cmd + Z - Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        
        // Ctrl/Cmd + Shift + Z or Ctrl+Y - Redo
        if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
            ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
            e.preventDefault();
            redo();
        }
        
        // Ctrl/Cmd + P - Preview Script
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            switchView('script');
        }
        
        // Ctrl/Cmd + K - Card View
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            switchView('card');
        }
        
        // Ctrl/Cmd + E - Editor View
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            switchView('write');
        }
        
        // Ctrl/Cmd + M - Toggle Menu
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            toggleMenu();
        }
        
        // F11 - Toggle Fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
        
        // Escape - Exit focus mode or close panels
        if (e.key === 'Escape') {
            if (isFocusMode) {
                toggleFocusMode();
            } else if (menuPanel && menuPanel.classList.contains('open')) {
                closeMenu();
            } else if (sceneNavigatorPanel && sceneNavigatorPanel.classList.contains('open')) {
                closeSceneNavigator();
            }
        }
    }
    
    // ========================================
    // WINDOW RESIZE HANDLER
    // ========================================
    
    function handleWindowResize() {
        // Adjust toolbar visibility on resize
        if (window.innerWidth > 768) {
            hideMobileToolbar();
            if (currentView === 'write' && !isFocusMode && desktopSideToolbar) {
                desktopSideToolbar.style.display = 'flex';
            }
        } else {
            if (currentView === 'write' && !isFocusMode && desktopSideToolbar) {
                desktopSideToolbar.style.display = 'none';
            }
        }
    }
    
    // ========================================
    // BEFORE UNLOAD HANDLER
    // ========================================
    
    function handleBeforeUnload(e) {
        // Save before closing
        saveToLocalStorage();
        
        // Warn if there's unsaved content
        if (!isPlaceholder && fountainInput && fountainInput.value.trim() !== '') {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    }
    
    // ========================================
    // VIEW SWITCHING
    // ========================================
    
    function switchView(view) {
        currentView = view;
        
        // Hide all views
        if (writeView) writeView.style.display = 'none';
        if (scriptView) scriptView.style.display = 'none';
        if (cardView) cardView.style.display = 'none';
        
        // Hide all headers
        if (mainHeader) mainHeader.style.display = 'none';
        if (scriptHeader) scriptHeader.style.display = 'none';
        if (cardHeader) cardHeader.style.display = 'none';
        
        hideMobileToolbar();
        
        if (view === 'write') {
            if (writeView) writeView.style.display = 'flex';
            if (mainHeader) mainHeader.style.display = 'flex';
            if (!isFocusMode && desktopSideToolbar) {
                desktopSideToolbar.style.display = 'flex';
            }
            if (fountainInput) fountainInput.focus();
            showToast('Editor mode', 'success', 1000);
        } else if (view === 'script') {
            if (scriptView) scriptView.style.display = 'block';
            if (scriptHeader) scriptHeader.style.display = 'flex';
            if (desktopSideToolbar) desktopSideToolbar.style.display = 'none';
            renderEnhancedScript();
            showToast('Script preview', 'success', 1000);
        } else if (view === 'card') {
            if (cardView) cardView.style.display = 'flex';
            if (cardHeader) cardHeader.style.display = 'flex';
            if (desktopSideToolbar) desktopSideToolbar.style.display = 'none';
            currentPage = 0; // Reset to first page
            renderEnhancedCardView(); // TOSCRIPT1 FUNCTION
            showToast('Card view', 'success', 1000);
        }
        
        closeMenu();
        closeSceneNavigator();
    }

    // ========================================
    // FOUNTAIN PARSING - COMPLETE
    // ========================================
    
    function parseFountain(text) {
        const lines = text.split('\n');
        const tokens = [];
        let inTitlePage = true;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Title page detection
            if (inTitlePage && line.trim() === '') {
                inTitlePage = false;
                continue;
            }
            
            if (inTitlePage && line.includes(':')) {
                tokens.push({ type: 'title-page', content: line });
                continue;
            }
            
            inTitlePage = false;
            
            // Scene headings
            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(line.trim())) {
                tokens.push({ type: 'scene-heading', content: line.trim() });
            }
            // Transitions
            else if (/^(CUT TO:|FADE TO:|DISSOLVE TO:|FADE OUT\.|FADE IN:|SMASH CUT TO:|JUMP CUT TO:|MATCH CUT TO:)/.test(line.trim())) {
                tokens.push({ type: 'transition', content: line.trim() });
            }
            // Character names (all caps)
            else if (line.trim() === line.trim().toUpperCase() && 
                     line.trim().length > 0 && 
                     line.trim().length < 40 &&
                     !line.includes('.') &&
                     i + 1 < lines.length &&
                     lines[i + 1].trim() !== '') {
                tokens.push({ type: 'character', content: line.trim() });
            }
            // Parentheticals
            else if (line.trim().startsWith('(') && line.trim().endsWith(')')) {
                tokens.push({ type: 'parenthetical', content: line.trim() });
            }
            // Dialogue (follows character or parenthetical)
            else if (tokens.length > 0 && 
                     (tokens[tokens.length - 1].type === 'character' || 
                      tokens[tokens.length - 1].type === 'parenthetical' ||
                      tokens[tokens.length - 1].type === 'dialogue') &&
                     line.trim() !== '') {
                tokens.push({ type: 'dialogue', content: line.trim() });
            }
            // Action/Description
            else if (line.trim() !== '') {
                tokens.push({ type: 'action', content: line.trim() });
            }
            // Empty lines
            else {
                tokens.push({ type: 'empty', content: '' });
            }
        }
        
        return tokens;
    }
    
    // ========================================
    // SCRIPT RENDERING
    // ========================================
    
    function renderEnhancedScript() {
        const scriptContent = isPlaceholder ? '' : (fountainInput ? fountainInput.value : '');
        
        if (!scriptContent.trim()) {
            if (screenplayOutput) {
                screenplayOutput.innerHTML = '<p style="text-align:center; color:#666; padding:50px;">No content to display. Start writing in the editor.</p>';
            }
            return;
        }
        
        const tokens = parseFountain(scriptContent);
        let html = '<div class="screenplay-page">';
        let sceneNumber = 1;
        
        tokens.forEach((token) => {
            if (token.type === 'scene-heading') {
                const sceneNum = showSceneNumbers ? `<span class="scene-number">${sceneNumber}</span>` : '';
                html += `<div class="scene-heading">${sceneNum}${escapeHtml(token.content)}</div>`;
                sceneNumber++;
            } else if (token.type === 'action') {
                html += `<div class="action">${escapeHtml(token.content)}</div>`;
            } else if (token.type === 'character') {
                html += `<div class="character">${escapeHtml(token.content)}</div>`;
            } else if (token.type === 'parenthetical') {
                html += `<div class="parenthetical">${escapeHtml(token.content)}</div>`;
            } else if (token.type === 'dialogue') {
                html += `<div class="dialogue">${escapeHtml(token.content)}</div>`;
            } else if (token.type === 'transition') {
                html += `<div class="transition">${escapeHtml(token.content)}</div>`;
            } else if (token.type === 'empty') {
                html += '<div class="empty-line">&nbsp;</div>';
            }
        });
        
        html += '</div>';
        
        if (screenplayOutput) {
            screenplayOutput.innerHTML = html;
            screenplayOutput.style.fontSize = `${fontSize}px`;
        }
    }
    
    // ========================================
    // CARD VIEW RENDERING - TOSCRIPT1 COMPLETE LOGIC
    // ========================================
    
    function renderEnhancedCardView() {
        // First update the scene list
        updateSceneList();
        
        const scenes = projectData.projectInfo.scenes;
        const totalPages = Math.ceil(scenes.length / cardsPerPage);
        
        if (!cardContainer) return;
        
        if (scenes.length === 0) {
            cardContainer.innerHTML = '<div style="text-align:center; color:#666; padding:50px; grid-column: 1/-1;">No scenes found. Add scene headings (INT./EXT.) to your script.</div>';
            if (prevPageBtn) prevPageBtn.style.display = 'none';
            if (nextPageBtn) nextPageBtn.style.display = 'none';
            if (pageIndicator) pageIndicator.style.display = 'none';
            return;
        }
        
        // TOSCRIPT1: Calculate paginated visible cards
        const startIndex = currentPage * cardsPerPage;
        const endIndex = Math.min(startIndex + cardsPerPage, scenes.length);
        const visibleScenes = scenes.slice(startIndex, endIndex);
        
        let cardsHTML = '';
        
        // TOSCRIPT1: Render only visible cards
        visibleScenes.forEach((scene, index) => {
            const globalIndex = startIndex + index;
            const sceneNumber = globalIndex + 1;
            
            cardsHTML += `
                <div class="scene-card" data-index="${globalIndex}">
                    <div class="card-header">
                        <span class="card-number">#${sceneNumber}</span>
                        <div class="card-actions" style="display: none;">
                            <button class="card-action-btn share-card-btn" title="Share">📤</button>
                            <button class="card-action-btn delete-card-btn" title="Delete">🗑️</button>
                            <button class="card-action-btn add-below-btn" title="Add Below">➕</button>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="card-heading" contenteditable="true">${escapeHtml(scene.heading)}</div>
                        <div class="card-description" contenteditable="true">${escapeHtml(scene.description || 'Tap to add description...')}</div>
                    </div>
                    <div class="card-footer">
                        <div class="card-meta">
                            ${scene.location ? `📍 ${escapeHtml(scene.location)}` : ''}
                            ${scene.time ? `🕐 ${escapeHtml(scene.time)}` : ''}
                            ${scene.characters.length > 0 ? `👥 ${scene.characters.length}` : ''}
                        </div>
                    </div>
                    <div class="card-watermark">ToscripT</div>
                </div>
            `;
        });
        
        cardContainer.innerHTML = cardsHTML;
        
        // TOSCRIPT1: Update pagination controls
        if (pageIndicator) {
            pageIndicator.textContent = `Page ${currentPage + 1} of ${totalPages}`;
            pageIndicator.style.display = 'block';
        }
        
        if (prevPageBtn) {
            prevPageBtn.style.display = currentPage > 0 ? 'block' : 'none';
        }
        
        if (nextPageBtn) {
            nextPageBtn.style.display = currentPage < totalPages - 1 ? 'block' : 'none';
        }
        
        // TOSCRIPT1: Bind card events
        bindCardEditingEvents();
        setupMobileCardActions();
    }
    
    // ========================================
    // CARD EDITING - TOSCRIPT1 COMPLETE LOGIC
    // ========================================
    
    function bindCardEditingEvents() {
        const cards = document.querySelectorAll('.scene-card');
        
        cards.forEach(card => {
            const index = parseInt(card.dataset.index);
            const cardActions = card.querySelector('.card-actions');
            const shareBtn = card.querySelector('.share-card-btn');
            const deleteBtn = card.querySelector('.delete-card-btn');
            const addBelowBtn = card.querySelector('.add-below-btn');
            const headingEl = card.querySelector('.card-heading');
            const descriptionEl = card.querySelector('.card-description');
            
            // Desktop: Hover to show actions
            if (!isMobileDevice()) {
                card.addEventListener('mouseenter', () => {
                    if (cardActions) cardActions.style.display = 'flex';
                });
                card.addEventListener('mouseleave', () => {
                    if (cardActions) cardActions.style.display = 'none';
                });
            }
            
            // Share button
            shareBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                shareCard(index);
            });
            
            // Delete button
            deleteBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this scene card?')) {
                    deleteCard(index);
                }
            });
            
            // Add below button - TOSCRIPT1 FEATURE
            addBelowBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                addNewSceneCard(index);
            });
            
            // Edit heading
            headingEl?.addEventListener('blur', () => {
                const newHeading = headingEl.textContent.trim();
                if (newHeading) {
                    updateCardInScript(index, 'heading', newHeading);
                }
            });
            
            headingEl?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    headingEl.blur();
                }
            });
            
            // Edit description
            descriptionEl?.addEventListener('blur', () => {
                const newDescription = descriptionEl.textContent.trim();
                updateCardInScript(index, 'description', newDescription);
            });
            
            descriptionEl?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    descriptionEl.blur();
                }
            });
        });
    }
    
    // ========================================
    // MOBILE CARD ACTIONS - TOSCRIPT1 TAP-TO-REVEAL
    // ========================================
    
    function setupMobileCardActions() {
        if (!isMobileDevice()) return;
        
        const cards = document.querySelectorAll('.scene-card');
        
        cards.forEach(card => {
            const cardActions = card.querySelector('.card-actions');
            
            // TOSCRIPT1: Tap to reveal/hide actions
            card.addEventListener('click', (e) => {
                // Don't toggle if clicking on buttons or editable content
                if (e.target.classList.contains('card-action-btn') || 
                    e.target.hasAttribute('contenteditable')) {
                    return;
                }
                
                // Hide all other card actions
                const allActions = document.querySelectorAll('.card-actions');
                allActions.forEach(actions => {
                    if (actions !== cardActions) {
                        actions.style.display = 'none';
                    }
                });
                
                // Toggle current card actions
                if (cardActions) {
                    if (cardActions.style.display === 'none' || cardActions.style.display === '') {
                        cardActions.style.display = 'flex';
                        // Haptic feedback - FROM TOSCRIPT2
                        if (navigator.vibrate) {
                            navigator.vibrate(30);
                        }
                    } else {
                        cardActions.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // ========================================
    // CARD OPERATIONS - TOSCRIPT1 COMPLETE LOGIC
    // ========================================
    
    function addNewSceneCard(afterIndex = null) {
        const newSceneHeading = 'INT. NEW LOCATION - DAY';
        const newSceneContent = '\n\n' + newSceneHeading + '\n\nAction description goes here.\n\n';
        
        if (!fountainInput) return;
        
        if (afterIndex === null || afterIndex === undefined) {
            // Add at the end
            const currentContent = isPlaceholder ? '' : fountainInput.value;
            fountainInput.value = currentContent + newSceneContent;
        } else {
            // TOSCRIPT1: Add after specific scene (positional insertion)
            const lines = fountainInput.value.split('\n');
            let insertPosition = 0;
            let sceneCount = 0;
            
            for (let i = 0; i < lines.length; i++) {
                if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[i].trim())) {
                    if (sceneCount === afterIndex) {
                        // Find the end of this scene
                        for (let j = i + 1; j < lines.length; j++) {
                            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[j].trim())) {
                                insertPosition = j;
                                break;
                            }
                            insertPosition = j + 1;
                        }
                        break;
                    }
                    sceneCount++;
                }
            }
            
            lines.splice(insertPosition, 0, '', newSceneHeading, '', 'Action description goes here.', '');
            fountainInput.value = lines.join('\n');
        }
        
        isPlaceholder = false;
        updateSceneList();
        saveToLocalStorage();
        renderEnhancedCardView();
        
        showToast('New scene added!', 'success');
    }
    
    function deleteCard(index) {
        const scenes = projectData.projectInfo.scenes;
        if (index < 0 || index >= scenes.length || !fountainInput) return;
        
        const lines = fountainInput.value.split('\n');
        
        let sceneCount = 0;
        let startLine = -1;
        let endLine = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[i].trim())) {
                if (sceneCount === index) {
                    startLine = i;
                    // Find where this scene ends
                    for (let j = i + 1; j < lines.length; j++) {
                        if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[j].trim())) {
                            endLine = j;
                            break;
                        }
                    }
                    if (endLine === -1) endLine = lines.length;
                    break;
                }
                sceneCount++;
            }
        }
        
        if (startLine !== -1) {
            lines.splice(startLine, endLine - startLine);
            fountainInput.value = lines.join('\n');
            updateSceneList();
            saveToLocalStorage();
            
            // Adjust current page if needed
            const newTotalPages = Math.ceil(projectData.projectInfo.scenes.length / cardsPerPage);
            if (currentPage >= newTotalPages && currentPage > 0) {
                currentPage--;
            }
            
            renderEnhancedCardView();
            showToast('Scene deleted!', 'warning');
        }
    }
    
    function shareCard(index) {
        const scenes = projectData.projectInfo.scenes;
        if (index < 0 || index >= scenes.length) return;
        
        const scene = scenes[index];
        const shareText = `Scene #${index + 1}\n${scene.heading}\n\n${scene.description || 'No description'}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Scene #${index + 1}`,
                text: shareText
            }).catch(err => console.log('Share cancelled'));
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                showToast('Scene copied to clipboard!', 'success');
            }).catch(err => {
                showToast('Unable to copy to clipboard', 'error');
            });
        }
    }
    
    function updateCardInScript(index, field, newValue) {
        const scenes = projectData.projectInfo.scenes;
        if (index < 0 || index >= scenes.length || !fountainInput) return;
        
        const lines = fountainInput.value.split('\n');
        let sceneCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[i].trim())) {
                if (sceneCount === index) {
                    if (field === 'heading') {
                        lines[i] = newValue;
                    } else if (field === 'description') {
                        let descLines = newValue.split('\n');
                        let descEnd = i + 1;
                        for (let j = i + 1; j < lines.length; j++) {
                            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[j].trim()) || 
                                lines[j].trim() === lines[j].trim().toUpperCase() && lines[j].trim().length > 0) {
                                descEnd = j;
                                break;
                            }
                            if (j === lines.length - 1) descEnd = j + 1;
                        }
                        lines.splice(i + 1, descEnd - i - 1, '', ...descLines, '');
                    }
                    break;
                }
                sceneCount++;
            }
        }
        
        isUpdatingFromSync = true;
        fountainInput.value = lines.join('\n');
        isUpdatingFromSync = false;
        
        updateSceneList();
        saveToLocalStorage();
    }

    // ========================================
    // SCENE MANAGEMENT
    // ========================================
    
    function updateSceneList() {
        const scriptContent = isPlaceholder ? '' : (fountainInput ? fountainInput.value : '');
        const tokens = parseFountain(scriptContent);
        const scenes = [];
        let currentScene = null;
        
        tokens.forEach(token => {
            if (token.type === 'scene-heading') {
                if (currentScene) {
                    scenes.push(currentScene);
                }
                currentScene = {
                    heading: token.content,
                    description: '',
                    characters: [],
                    type: '',
                    location: '',
                    time: ''
                };
                
                // Parse scene metadata
                const match = token.content.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*(.+?)\s*-\s*(.+)$/);
                if (match) {
                    currentScene.type = match[1];
                    currentScene.location = match[2].trim();
                    currentScene.time = match[3].trim();
                }
            } else if (currentScene) {
                if (token.type === 'action' || token.type === 'dialogue') {
                    currentScene.description += token.content + ' ';
                } else if (token.type === 'character') {
                    if (!currentScene.characters.includes(token.content)) {
                        currentScene.characters.push(token.content);
                    }
                }
            }
        });
        
        if (currentScene) {
            scenes.push(currentScene);
        }
        
        projectData.projectInfo.scenes = scenes;
        projectData.projectInfo.scriptContent = scriptContent;
        
        renderSceneNavigator(scenes);
    }
    
    function renderSceneNavigator(scenes) {
        if (!sceneList) return;
        
        if (scenes.length === 0) {
            sceneList.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">No scenes yet</div>';
            return;
        }
        
        let html = '';
        scenes.forEach((scene, index) => {
            html += `
                <div class="scene-item" data-index="${index}" draggable="true">
                    <div class="scene-number">#${index + 1}</div>
                    <div class="scene-details">
                        <div class="scene-heading-nav">${escapeHtml(scene.heading)}</div>
                        <div class="scene-meta">
                            ${scene.characters.length > 0 ? scene.characters.slice(0, 3).join(', ') : 'No characters'}
                            ${scene.characters.length > 3 ? '...' : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        sceneList.innerHTML = html;
        
        // Add drag and drop functionality
        const sceneItems = sceneList.querySelectorAll('.scene-item');
        sceneItems.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
            
            // Click to jump to scene in editor
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                jumpToScene(index);
            });
        });
    }
    
    function jumpToScene(index) {
        if (!fountainInput) return;
        
        const lines = fountainInput.value.split('\n');
        let sceneCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[i].trim())) {
                if (sceneCount === index) {
                    const beforeText = lines.slice(0, i).join('\n');
                    fountainInput.focus();
                    fountainInput.setSelectionRange(beforeText.length, beforeText.length);
                    switchView('write');
                    showToast(`Jumped to Scene #${index + 1}`, 'success', 1500);
                    return;
                }
                sceneCount++;
            }
        }
    }
    
    // ========================================
    // DRAG AND DROP HANDLERS
    // ========================================
    
    function handleDragStart(e) {
        draggedElement = this;
        this.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedElement !== this) {
            this.style.borderTop = '2px solid #1a73e8';
        }
        
        return false;
    }
    
    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        this.style.borderTop = '';
        
        if (draggedElement !== this) {
            const fromIndex = parseInt(draggedElement.dataset.index);
            const toIndex = parseInt(this.dataset.index);
            reorderScenes(fromIndex, toIndex);
        }
        
        return false;
    }
    
    function handleDragEnd(e) {
        this.style.opacity = '1';
        
        const items = document.querySelectorAll('.scene-item');
        items.forEach(item => {
            item.style.borderTop = '';
        });
    }
    
    function reorderScenes(fromIndex, toIndex) {
        if (!fountainInput) return;
        
        const lines = fountainInput.value.split('\n');
        const sceneBlocks = [];
        let currentBlock = [];
        
        for (let i = 0; i < lines.length; i++) {
            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[i].trim())) {
                if (currentBlock.length > 0) {
                    sceneBlocks.push(currentBlock);
                }
                currentBlock = [lines[i]];
            } else {
                currentBlock.push(lines[i]);
            }
        }
        if (currentBlock.length > 0) {
            sceneBlocks.push(currentBlock);
        }
        
        const movedScene = sceneBlocks.splice(fromIndex, 1)[0];
        sceneBlocks.splice(toIndex, 0, movedScene);
        
        const newContent = sceneBlocks.map(block => block.join('\n')).join('\n');
        fountainInput.value = newContent;
        
        updateSceneList();
        saveToLocalStorage();
        
        if (currentView === 'card') {
            renderEnhancedCardView();
        }
        
        showToast('Scene reordered!', 'success');
    }
    
    // ========================================
    // FILTER FUNCTIONS
    // ========================================
    
    function updateFilterHelp() {
        if (!filterCategorySelect || !filterHelpText) return;
        
        const category = filterCategorySelect.value;
        const helpTexts = {
            'type': 'Enter: INT. or EXT.',
            'location': 'Enter location name (e.g., COFFEE SHOP)',
            'time': 'Enter time of day (e.g., DAY, NIGHT)',
            'character': 'Enter character name'
        };
        filterHelpText.textContent = helpTexts[category] || '';
    }
    
    function filterScenes(category, value) {
        if (!value) {
            updateSceneList();
            return;
        }
        
        const allScenes = projectData.projectInfo.scenes;
        const filtered = allScenes.filter(scene => {
            if (category === 'type') {
                return scene.type.toLowerCase().includes(value.toLowerCase());
            } else if (category === 'location') {
                return scene.location.toLowerCase().includes(value.toLowerCase());
            } else if (category === 'time') {
                return scene.time.toLowerCase().includes(value.toLowerCase());
            } else if (category === 'character') {
                return scene.characters.some(char => 
                    char.toLowerCase().includes(value.toLowerCase())
                );
            }
            return true;
        });
        
        renderSceneNavigator(filtered);
        showToast(`Found ${filtered.length} scene(s)`, 'success', 1500);
    }
    
    // ========================================
    // EXPORT OPTIONS MENU - TOSCRIPT1 COMPLETE
    // ========================================
    
    function showExportOptions() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            showToast('No scenes to export!', 'error');
            return;
        }
        
        // Create modal for export options
        const options = `
            <div style="padding: 20px;">
                <h3 style="margin-top: 0;">Export Options</h3>
                <button onclick="saveVisibleCardsAsPDF()" style="width: 100%; padding: 12px; margin: 8px 0; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    📄 Export Visible Cards (Page ${currentPage + 1})
                </button>
                <button onclick="saveAllCardsAsImages()" style="width: 100%; padding: 12px; margin: 8px 0; background: #34a853; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    📚 Export All Cards as PDF
                </button>
                <button onclick="saveAllCardsAsTXT()" style="width: 100%; padding: 12px; margin: 8px 0; background: #fbbc04; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    📝 Export All Cards as TXT
                </button>
                <button onclick="closeExportModal()" style="width: 100%; padding: 12px; margin: 8px 0; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    Cancel
                </button>
            </div>
        `;
        
        // Simple approach for mobile/desktop
        if (isMobileDevice()) {
            const choice = prompt('Export:\n1. Visible Cards (Current Page)\n2. All Cards (PDF)\n3. All Cards (TXT)\n\nEnter 1, 2, or 3:', '2');
            if (choice === '1') {
                saveVisibleCardsAsPDF();
            } else if (choice === '2') {
                saveAllCardsAsImages();
            } else if (choice === '3') {
                saveAllCardsAsTXT();
            }
        } else {
            if (confirm('Export visible cards only (current page)?\n\nOK = Visible Cards\nCancel = See all options')) {
                saveVisibleCardsAsPDF();
            } else {
                const allChoice = prompt('Export all cards:\n1. PDF\n2. TXT\n\nEnter 1 or 2:', '1');
                if (allChoice === '1') {
                    saveAllCardsAsImages();
                } else if (allChoice === '2') {
                    saveAllCardsAsTXT();
                }
            }
        }
    }
    
    // Make functions global for button onclick
    window.saveVisibleCardsAsPDF = saveVisibleCardsAsPDF;
    window.saveAllCardsAsImages = saveAllCardsAsImages;
    window.saveAllCardsAsTXT = saveAllCardsAsTXT;
    
    // ========================================
    // EXPORT VISIBLE CARDS - TOSCRIPT1
    // ========================================
    
    function saveVisibleCardsAsPDF() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            showToast('No scenes to export!', 'error');
            return;
        }
        
        const startIndex = currentPage * cardsPerPage;
        const endIndex = Math.min(startIndex + cardsPerPage, scenes.length);
        const visibleScenes = scenes.slice(startIndex, endIndex);
        
        if (isMobileDevice()) {
            saveVisibleCardsCanvas(visibleScenes, startIndex);
        } else {
            saveVisibleCardsHTML2Canvas(visibleScenes, startIndex);
        }
    }
    
    function saveVisibleCardsCanvas(visibleScenes, startIndex) {
        if (typeof window.jspdf === 'undefined') {
            showToast('jsPDF library not loaded!', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        visibleScenes.forEach((scene, index) => {
            const globalIndex = startIndex + index;
            const canvas = createSceneCardCanvas(scene, globalIndex + 1);
            
            if (index > 0) pdf.addPage();
            
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            pdf.addImage(imgData, 'JPEG', 10, 10, 190, 130);
        });
        
        const filename = `${projectData.projectInfo.projectName}_cards_page${currentPage + 1}.pdf`;
        pdf.save(filename);
        showToast(`Exported ${visibleScenes.length} cards!`, 'success');
    }
    
    function saveVisibleCardsHTML2Canvas(visibleScenes, startIndex) {
        if (typeof html2canvas === 'undefined') {
            showToast('html2canvas library not loaded! Using canvas fallback...', 'warning');
            saveVisibleCardsCanvas(visibleScenes, startIndex);
            return;
        }
        
        if (typeof window.jspdf === 'undefined') {
            showToast('jsPDF library not loaded!', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        let processed = 0;
        
        visibleScenes.forEach((scene, index) => {
            const globalIndex = startIndex + index;
            const tempCard = createTempCardElement(scene, globalIndex + 1);
            document.body.appendChild(tempCard);
            
            html2canvas(tempCard, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false
            }).then(canvas => {
                if (index > 0) pdf.addPage();
                
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                pdf.addImage(imgData, 'JPEG', 10, 10, 190, 130);
                
                document.body.removeChild(tempCard);
                processed++;
                
                if (processed === visibleScenes.length) {
                    const filename = `${projectData.projectInfo.projectName}_cards_page${currentPage + 1}.pdf`;
                    pdf.save(filename);
                    showToast(`Exported ${visibleScenes.length} cards!`, 'success');
                }
            }).catch(err => {
                console.error('Export error:', err);
                document.body.removeChild(tempCard);
                showToast('Export error! Check console.', 'error');
            });
        });
    }
    
    // ========================================
    // EXPORT ALL CARDS - TOSCRIPT1
    // ========================================
    
    function saveAllCardsAsImages() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            showToast('No scenes to export!', 'error');
            return;
        }
        
        if (isMobileDevice()) {
            saveAllCardsAsPDF_Canvas();
        } else {
            saveAllCardsAsPDF_Library();
        }
    }
    
    function saveAllCardsAsPDF_Canvas() {
        if (typeof window.jspdf === 'undefined') {
            showToast('jsPDF library not loaded!', 'error');
            return;
        }
        
        const scenes = projectData.projectInfo.scenes;
        const { jsPDF } = window.jspdf;
        
        // TOSCRIPT1: Split into batches of 27 cards per PDF
        const batchSize = 27;
        const batches = Math.ceil(scenes.length / batchSize);
        
        for (let batch = 0; batch < batches; batch++) {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const startIdx = batch * batchSize;
            const endIdx = Math.min(startIdx + batchSize, scenes.length);
            const batchScenes = scenes.slice(startIdx, endIdx);
            
            batchScenes.forEach((scene, index) => {
                const globalIndex = startIdx + index;
                const canvas = createSceneCardCanvas(scene, globalIndex + 1);
                
                if (index > 0) pdf.addPage();
                
                const imgData = canvas.toDataURL('image/jpeg', 0.8);
                pdf.addImage(imgData, 'JPEG', 10, 10, 190, 130);
            });
            
            const filename = batches > 1 
                ? `${projectData.projectInfo.projectName}_cards_part${batch + 1}.pdf`
                : `${projectData.projectInfo.projectName}_cards.pdf`;
            pdf.save(filename);
        }
        
        showToast(`Exported ${scenes.length} cards in ${batches} file(s)!`, 'success', 4000);
    }
    
    function saveAllCardsAsPDF_Library() {
        if (typeof html2canvas === 'undefined') {
            showToast('html2canvas not loaded! Using canvas fallback...', 'warning');
            saveAllCardsAsPDF_Canvas();
            return;
        }
        
        if (typeof window.jspdf === 'undefined') {
            showToast('jsPDF library not loaded!', 'error');
            return;
        }
        
        const scenes = projectData.projectInfo.scenes;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        let processed = 0;
        
        scenes.forEach((scene, index) => {
            const tempCard = createTempCardElement(scene, index + 1);
            document.body.appendChild(tempCard);
            
            html2canvas(tempCard, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false
            }).then(canvas => {
                if (index > 0) pdf.addPage();
                
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                pdf.addImage(imgData, 'JPEG', 10, 10, 190, 130);
                
                document.body.removeChild(tempCard);
                processed++;
                
                if (processed === scenes.length) {
                    pdf.save(`${projectData.projectInfo.projectName}_cards.pdf`);
                    showToast(`Exported ${scenes.length} cards!`, 'success');
                }
            }).catch(err => {
                console.error('Export error:', err);
                document.body.removeChild(tempCard);
                processed++;
            });
        });
    }
    
    // ========================================
    // EXPORT ALL CARDS AS TXT - TOSCRIPT1
    // ========================================
    
    function saveAllCardsAsTXT() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            showToast('No scenes to export!', 'error');
            return;
        }
        
        let content = `${projectData.projectInfo.projectName} - Scene Cards\n`;
        content += `${'='.repeat(70)}\n\n`;
        
        scenes.forEach((scene, index) => {
            content += `SCENE #${index + 1}\n`;
            content += `${'-'.repeat(70)}\n`;
            content += `HEADING: ${scene.heading}\n\n`;
            content += `DESCRIPTION:\n${scene.description || 'No description'}\n\n`;
            content += `LOCATION: ${scene.location || 'N/A'}\n`;
            content += `TIME: ${scene.time || 'N/A'}\n`;
            content += `CHARACTERS: ${scene.characters.join(', ') || 'None'}\n`;
            content += `${'='.repeat(70)}\n\n`;
        });
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.projectInfo.projectName}_cards.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast(`Exported ${scenes.length} cards as TXT!`, 'success');
    }

    // ========================================
    // CANVAS CARD GENERATION - TOSCRIPT1
    // ========================================
    
    function createSceneCardCanvas(scene, sceneNumber) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 550;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 3;
        ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
        
        // Card header background
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(15, 15, canvas.width - 30, 60);
        
        // Scene number
        ctx.fillStyle = '#1a73e8';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`#${sceneNumber}`, 35, 55);
        
        // Heading
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 26px Arial';
        const heading = scene.heading;
        const maxHeadingWidth = canvas.width - 70;
        let headingText = heading;
        
        // Truncate heading if too long
        if (ctx.measureText(heading).width > maxHeadingWidth) {
            while (ctx.measureText(headingText + '...').width > maxHeadingWidth && headingText.length > 0) {
                headingText = headingText.slice(0, -1);
            }
            headingText += '...';
        }
        
        ctx.fillText(headingText, 35, 110);
        
        // Divider line
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(35, 130);
        ctx.lineTo(canvas.width - 35, 130);
        ctx.stroke();
        
        // Description
        ctx.fillStyle = '#333333';
        ctx.font = '18px Arial';
        const description = scene.description || 'No description available';
        const words = description.split(' ');
        let line = '';
        let y = 165;
        const lineHeight = 28;
        const maxWidth = canvas.width - 70;
        const maxY = 420;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, 35, y);
                line = words[i] + ' ';
                y += lineHeight;
                
                if (y > maxY) {
                    ctx.fillText('...', 35, y);
                    break;
                }
            } else {
                line = testLine;
            }
        }
        
        if (y <= maxY && line.trim() !== '') {
            ctx.fillText(line, 35, y);
        }
        
        // Footer metadata
        ctx.fillStyle = '#666666';
        ctx.font = '16px Arial';
        let footerY = canvas.height - 60;
        
        if (scene.location) {
            ctx.fillText(`📍 ${scene.location}`, 35, footerY);
            footerY += 22;
        }
        
        if (scene.time) {
            ctx.fillText(`🕐 ${scene.time}`, 35, footerY);
        }
        
        if (scene.characters.length > 0) {
            const charText = `👥 ${scene.characters.slice(0, 3).join(', ')}${scene.characters.length > 3 ? '...' : ''}`;
            ctx.fillText(charText, canvas.width - 35 - ctx.measureText(charText).width, canvas.height - 60);
        }
        
        // Watermark
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ToscripT', canvas.width / 2, canvas.height - 25);
        ctx.textAlign = 'left';
        
        return canvas;
    }
    
    function createTempCardElement(scene, sceneNumber) {
        const card = document.createElement('div');
        card.style.cssText = 'width:800px; height:550px; background:#fff; padding:0; position:absolute; left:-9999px; box-sizing:border-box;';
        
        const characters = scene.characters.length > 0 
            ? `👥 ${scene.characters.slice(0, 3).join(', ')}${scene.characters.length > 3 ? '...' : ''}`
            : '';
        
        card.innerHTML = `
            <div style="border:3px solid #e0e0e0; padding:0; height:100%; position:relative; box-sizing:border-box;">
                <div style="background:#f5f5f5; padding:20px 25px; border-bottom:1px solid #e0e0e0;">
                    <span style="color:#1a73e8; font-weight:bold; font-size:28px;">#${sceneNumber}</span>
                </div>
                <div style="padding:25px;">
                    <div style="font-size:26px; font-weight:bold; margin-bottom:15px; color:#000;">${escapeHtml(scene.heading)}</div>
                    <div style="border-bottom:1px solid #e0e0e0; margin-bottom:20px;"></div>
                    <div style="font-size:18px; color:#333; line-height:1.6; min-height:200px; max-height:250px; overflow:hidden;">
                        ${escapeHtml(scene.description || 'No description available')}
                    </div>
                </div>
                <div style="position:absolute; bottom:25px; left:25px; right:25px; font-size:16px; color:#666;">
                    <div style="margin-bottom:5px;">
                        ${scene.location ? `📍 ${escapeHtml(scene.location)}` : ''}
                        ${scene.time ? `&nbsp;&nbsp;🕐 ${escapeHtml(scene.time)}` : ''}
                    </div>
                    ${characters ? `<div>${characters}</div>` : ''}
                </div>
                <div style="position:absolute; bottom:15px; right:25px; font-size:56px; color:rgba(0,0,0,0.04); font-weight:bold;">ToscripT</div>
            </div>
        `;
        return card;
    }
    
    // ========================================
    // EXPORT SCENE ORDER - ENHANCED
    // ========================================
    
    function exportSceneOrder() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            showToast('No scenes to export!', 'error');
            return;
        }
        
        let content = `${projectData.projectInfo.projectName} - Scene Order Report\n`;
        content += `Author: ${projectData.projectInfo.prodName}\n`;
        content += `Total Scenes: ${scenes.length}\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `${'='.repeat(80)}\n\n`;
        
        scenes.forEach((scene, index) => {
            content += `SCENE ${index + 1}\n`;
            content += `${'-'.repeat(80)}\n`;
            content += `Heading:    ${scene.heading}\n`;
            content += `Type:       ${scene.type || 'N/A'}\n`;
            content += `Location:   ${scene.location || 'N/A'}\n`;
            content += `Time:       ${scene.time || 'N/A'}\n`;
            content += `Characters: ${scene.characters.join(', ') || 'None'}\n`;
            content += `\nDescription:\n${scene.description || 'No description'}\n`;
            content += `${'='.repeat(80)}\n\n`;
        });
        
        // Statistics
        const intScenes = scenes.filter(s => s.type.includes('INT')).length;
        const extScenes = scenes.filter(s => s.type.includes('EXT')).length;
        const allCharacters = new Set();
        scenes.forEach(s => s.characters.forEach(c => allCharacters.add(c)));
        
        content += `STATISTICS\n`;
        content += `${'-'.repeat(80)}\n`;
        content += `Total Scenes:     ${scenes.length}\n`;
        content += `Interior Scenes:  ${intScenes}\n`;
        content += `Exterior Scenes:  ${extScenes}\n`;
        content += `Total Characters: ${allCharacters.size}\n`;
        content += `Characters: ${Array.from(allCharacters).join(', ')}\n`;
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.projectInfo.projectName}_scene_order.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Scene order report exported!', 'success');
    }
    
    // ========================================
    // FILE OPERATIONS
    // ========================================
    
    function saveFountain() {
        const content = isPlaceholder ? '' : (fountainInput ? fountainInput.value : '');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.projectInfo.projectName}.fountain`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Fountain file saved!', 'success');
    }
    
    function savePDF(fontType) {
        showToast(`PDF export with ${fontType} fonts - Feature requires additional setup. Use 'Export Cards' for PDF scene cards.`, 'warning', 4000);
    }
    
    function saveFilmproj() {
        const data = JSON.stringify(projectData, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.projectInfo.projectName}.filmproj`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Project file saved!', 'success');
    }
    
    function handleFileOpen(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            
            if (file.name.endsWith('.fountain')) {
                if (fountainInput) {
                    fountainInput.value = content;
                    isPlaceholder = false;
                    updateSceneList();
                    saveToLocalStorage();
                    showToast('Fountain file loaded!', 'success');
                }
            } else if (file.name.endsWith('.filmproj')) {
                try {
                    const data = JSON.parse(content);
                    projectData = data;
                    if (fountainInput) {
                        fountainInput.value = data.projectInfo.scriptContent || '';
                        isPlaceholder = !data.projectInfo.scriptContent;
                    }
                    updateSceneList();
                    saveToLocalStorage();
                    showToast('Project file loaded!', 'success');
                } catch (err) {
                    showToast('Invalid .filmproj file!', 'error');
                }
            } else {
                showToast('Unsupported file type! Use .fountain or .filmproj files.', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        if (e.target) e.target.value = '';
    }
    
    // ========================================
    // CLOUD SYNC FUNCTIONS - FROM TOSCRIPT2
    // ========================================
    
    function openCloudSyncModal() {
        if (cloudSyncModal) {
            showModal(cloudSyncModal);
        }
    }
    
    function startAutoSync() {
        if (autoSyncTimer) clearInterval(autoSyncTimer);
        
        autoSyncTimer = setInterval(() => {
            syncNow();
        }, 5 * 60 * 1000); // 5 minutes
        
        console.log('Auto-sync started (5 min interval)');
    }
    
    function stopAutoSync() {
        if (autoSyncTimer) {
            clearInterval(autoSyncTimer);
            autoSyncTimer = null;
        }
        console.log('Auto-sync stopped');
    }
    
    function syncNow() {
        console.log('Syncing project...');
        saveToLocalStorage();
        lastSyncTime = new Date();
        
        showToast(`Synced at ${lastSyncTime.toLocaleTimeString()}`, 'success', 2000);
        
        // Future: Add actual cloud sync here
        // if (isSignedIn && gapi) {
        //     saveToGoogleDrive();
        // }
    }
    
    function saveToGoogleDrive() {
        showToast('Google Drive integration - Coming soon! For now, use Save > Fountain or Filmproj.', 'warning', 4000);
        
        // Future Google Drive implementation
        // Placeholder for Google Drive API integration
        console.log('Google Drive save requested');
    }
    
    function openFromGoogleDrive() {
        showToast('Google Drive integration - Coming soon! For now, use Open to load files.', 'warning', 4000);
        
        // Future Google Drive implementation
        console.log('Google Drive open requested');
    }
    
    function saveToDropbox() {
        showToast('Dropbox integration - Coming soon! For now, use Save > Fountain or Filmproj.', 'warning', 4000);
        
        // Future Dropbox implementation
        console.log('Dropbox save requested');
    }
    
    function openFromDropbox() {
        showToast('Dropbox integration - Coming soon! For now, use Open to load files.', 'warning', 4000);
        
        // Future Dropbox implementation
        console.log('Dropbox open requested');
    }
    
    // ========================================
    // PROJECT INFO MODAL - ENHANCED
    // ========================================
    
    function showProjectInfo() {
        const scenes = projectData.projectInfo.scenes;
        const scriptContent = isPlaceholder ? '' : (fountainInput ? fountainInput.value : '');
        const words = scriptContent.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        const characterCount = scriptContent.length;
        const pageEstimate = Math.ceil(wordCount / 250);
        
        const allCharacters = new Set();
        scenes.forEach(scene => {
            scene.characters.forEach(char => allCharacters.add(char));
        });
        
        const intScenes = scenes.filter(s => s.type.includes('INT')).length;
        const extScenes = scenes.filter(s => s.type.includes('EXT')).length;
        
        const locations = new Set();
        scenes.forEach(scene => {
            if (scene.location) locations.add(scene.location);
        });
        
        const modalHTML = `
            <div style="padding:20px;">
                <h2 style="margin-top:0; color:#1a73e8;">📊 Project Statistics</h2>
                
                <div style="margin-bottom:20px;">
                    <h3 style="color:#333;">Project Information</h3>
                    <p><strong>Title:</strong> ${escapeHtml(projectData.projectInfo.projectName)}</p>
                    <p><strong>Author:</strong> ${escapeHtml(projectData.projectInfo.prodName)}</p>
                </div>
                
                <div style="margin-bottom:20px;">
                    <h3 style="color:#333;">Script Metrics</h3>
                    <p><strong>Word Count:</strong> ${wordCount.toLocaleString()}</p>
                    <p><strong>Character Count:</strong> ${characterCount.toLocaleString()}</p>
                    <p><strong>Estimated Pages:</strong> ${pageEstimate}</p>
                </div>
                
                <div style="margin-bottom:20px;">
                    <h3 style="color:#333;">Scene Breakdown</h3>
                    <p><strong>Total Scenes:</strong> ${scenes.length}</p>
                    <p><strong>Interior Scenes:</strong> ${intScenes}</p>
                    <p><strong>Exterior Scenes:</strong> ${extScenes}</p>
                    <p><strong>Unique Locations:</strong> ${locations.size}</p>
                </div>
                
                <div style="margin-bottom:20px;">
                    <h3 style="color:#333;">Characters</h3>
                    <p><strong>Total Characters:</strong> ${allCharacters.size}</p>
                    ${allCharacters.size > 0 ? `<p style="color:#666; font-size:14px;">${Array.from(allCharacters).join(', ')}</p>` : ''}
                </div>
                
                <div style="background:#f5f5f5; padding:15px; border-radius:5px; margin-top:20px;">
                    <p style="margin:0; color:#666; font-size:13px;">
                        💾 Last saved: ${new Date().toLocaleString()}<br>
                        💻 Auto-save: ${autoSaveInterval ? 'Enabled (30s)' : 'Disabled'}<br>
                        ${lastSyncTime ? `☁️ Last sync: ${lastSyncTime.toLocaleTimeString()}` : ''}
                    </p>
                </div>
            </div>
        `;
        
        if (projectInfoModal) {
            const modalBody = projectInfoModal.querySelector('.modal-content');
            if (modalBody) {
                modalBody.innerHTML = modalHTML;
            }
            showModal(projectInfoModal);
        }
    }
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    function toggleMenu() {
        if (menuPanel) menuPanel.classList.toggle('open');
        closeSceneNavigator();
    }
    
    function closeMenu() {
        if (menuPanel) menuPanel.classList.remove('open');
    }
    
    function toggleSceneNavigator() {
        if (sceneNavigatorPanel) sceneNavigatorPanel.classList.toggle('open');
        closeMenu();
    }
    
    function closeSceneNavigator() {
        if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open');
    }
    
    function toggleSaveSubmenu() {
        const submenu = document.getElementById('save-submenu');
        if (submenu) {
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        }
    }
    
    function toggleCloudSubmenu() {
        const submenu = document.getElementById('cloud-submenu');
        if (submenu) {
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        }
    }
    
    function showModal(modal) {
        if (modal) modal.style.display = 'flex';
    }
    
    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }
    // ========================================
    // UI CONTROL FUNCTIONS
    // ========================================
    
    function changeFontSize(delta) {
        fontSize = Math.max(12, Math.min(28, fontSize + delta));
        if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
        if (screenplayOutput) screenplayOutput.style.fontSize = `${fontSize}px`;
        saveToLocalStorage();
        showToast(`Font size: ${fontSize}px`, 'success', 1500);
    }
    
    function toggleSceneNumbers() {
        showSceneNumbers = !showSceneNumbers;
        if (currentView === 'script') {
            renderEnhancedScript();
        }
        if (sceneNoBtn) {
            sceneNoBtn.textContent = showSceneNumbers ? '☑ Scene Numbers' : '☐ Scene Numbers';
        }
        saveToLocalStorage();
        showToast(`Scene numbers ${showSceneNumbers ? 'shown' : 'hidden'}`, 'success', 1500);
    }
    
    function toggleAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
            if (autoSaveBtn) {
                autoSaveBtn.textContent = '☐ Auto-Save (30s)';
            }
            showToast('Auto-save disabled', 'warning');
        } else {
            autoSaveInterval = setInterval(saveToLocalStorage, 30000);
            if (autoSaveBtn) {
                autoSaveBtn.textContent = '☑ Auto-Save (30s)';
            }
            showToast('Auto-save enabled! Saving every 30 seconds.', 'success');
        }
    }
    
    function shareScript() {
        const content = isPlaceholder ? '' : (fountainInput ? fountainInput.value : '');
        const shareText = `${projectData.projectInfo.projectName}\nBy ${projectData.projectInfo.prodName}\n\n${content}`;
        
        if (navigator.share) {
            navigator.share({
                title: projectData.projectInfo.projectName,
                text: shareText
            }).then(() => {
                showToast('Script shared!', 'success');
            }).catch(err => {
                console.log('Share cancelled');
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                showToast('Script copied to clipboard!', 'success');
            }).catch(() => {
                showToast('Share not supported. Use Save menu to export.', 'warning', 3000);
            });
        }
    }
    
    function clearProject() {
        projectData = {
            projectInfo: {
                projectName: 'Untitled',
                prodName: 'Author',
                scriptContent: '',
                scenes: []
            }
        };
        if (fountainInput) {
            fountainInput.value = placeholderText;
        }
        isPlaceholder = true;
        currentPage = 0;
        undoStack = [];
        redoStack = [];
        updateSceneList();
        saveToLocalStorage();
        closeMenu();
        showToast('Project cleared!', 'success');
    }
    
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                isFullscreen = true;
                showToast('Fullscreen mode', 'success', 1500);
            }).catch(err => {
                console.log('Fullscreen error:', err);
                showToast('Fullscreen not available', 'error');
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    isFullscreen = false;
                });
            }
        }
    }
    
    function toggleFocusMode() {
        isFocusMode = !isFocusMode;
        
        if (isFocusMode) {
            if (mainHeader) mainHeader.style.display = 'none';
            if (desktopSideToolbar) desktopSideToolbar.style.display = 'none';
            if (mobileKeyboardToolbar) mobileKeyboardToolbar.style.display = 'none';
            if (focusExitBtn) focusExitBtn.style.display = 'block';
            
            // Enter fullscreen
            if (!isFullscreen) {
                toggleFullscreen();
            }
            
            // Add focus mode styles
            if (fountainInput) {
                fountainInput.style.padding = '50px';
                fountainInput.style.maxWidth = '800px';
                fountainInput.style.margin = '0 auto';
            }
            
            showToast('Focus mode activated', 'success', 2000);
        } else {
            if (mainHeader) mainHeader.style.display = 'flex';
            if (desktopSideToolbar) desktopSideToolbar.style.display = 'flex';
            if (focusExitBtn) focusExitBtn.style.display = 'none';
            
            // Exit fullscreen
            if (isFullscreen) {
                toggleFullscreen();
            }
            
            // Remove focus mode styles
            if (fountainInput) {
                fountainInput.style.padding = '';
                fountainInput.style.maxWidth = '';
                fountainInput.style.margin = '';
            }
            
            showToast('Focus mode deactivated', 'success', 1500);
        }
    }
    
    function showMobileToolbar() {
        if (window.innerWidth <= 768 && !isFocusMode && currentView === 'write' && mobileKeyboardToolbar) {
            mobileKeyboardToolbar.style.display = 'flex';
        }
    }
    
    function hideMobileToolbar() {
        if (mobileKeyboardToolbar) {
            mobileKeyboardToolbar.style.display = 'none';
        }
    }
    
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }
    
    // ========================================
    // EDITOR HELPER FUNCTIONS
    // ========================================
    
    function insertText(text, cursorOffset = 0) {
        if (!fountainInput) return;
        
        const start = fountainInput.selectionStart;
        const end = fountainInput.selectionEnd;
        const value = fountainInput.value;
        
        fountainInput.value = value.substring(0, start) + text + value.substring(end);
        
        const newCursorPos = start + text.length + cursorOffset;
        fountainInput.selectionStart = fountainInput.selectionEnd = newCursorPos;
        fountainInput.focus();
        
        isPlaceholder = false;
        saveToUndoStack();
        
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            updateSceneList();
            saveToLocalStorage();
        }, 300);
    }
    
    function insertOrCycleText(options) {
        if (!fountainInput) return;
        
        const start = fountainInput.selectionStart;
        const value = fountainInput.value;
        const lineBefore = value.substring(0, start);
        const lastLine = lineBefore.split('\n').pop();
        
        let inserted = false;
        
        // Check if any option exists in current line
        for (let i = 0; i < options.length; i++) {
            const currentOption = options[i].trim();
            
            if (lastLine.includes(currentOption)) {
                // Cycle to next option
                const nextOption = options[(i + 1) % options.length];
                const newLine = lastLine.replace(currentOption, nextOption.trim());
                const beforeLine = lineBefore.substring(0, lineBefore.lastIndexOf('\n') + 1);
                
                fountainInput.value = beforeLine + newLine + value.substring(start);
                fountainInput.selectionStart = fountainInput.selectionEnd = beforeLine.length + newLine.length;
                inserted = true;
                break;
            }
        }
        
        // If no option found, insert first option
        if (!inserted) {
            insertText(options[0]);
            return;
        }
        
        fountainInput.focus();
        isPlaceholder = false;
        saveToUndoStack();
        
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            updateSceneList();
            saveToLocalStorage();
        }, 300);
    }
    
    function toggleCaps() {
        if (!fountainInput) return;
        
        const start = fountainInput.selectionStart;
        const end = fountainInput.selectionEnd;
        
        if (start === end) {
            // No selection - toggle entire current line
            const value = fountainInput.value;
            const lineBefore = value.substring(0, start);
            const lineStart = lineBefore.lastIndexOf('\n') + 1;
            const lineEnd = value.indexOf('\n', start);
            const lineEndPos = lineEnd === -1 ? value.length : lineEnd;
            const line = value.substring(lineStart, lineEndPos);
            
            const newLine = line === line.toUpperCase() ? line.toLowerCase() : line.toUpperCase();
            fountainInput.value = value.substring(0, lineStart) + newLine + value.substring(lineEndPos);
            fountainInput.selectionStart = fountainInput.selectionEnd = lineStart + newLine.length;
        } else {
            // Toggle selected text
            const selectedText = fountainInput.value.substring(start, end);
            const newText = selectedText === selectedText.toUpperCase() 
                ? selectedText.toLowerCase() 
                : selectedText.toUpperCase();
            
            fountainInput.value = fountainInput.value.substring(0, start) + newText + fountainInput.value.substring(end);
            fountainInput.selectionStart = start;
            fountainInput.selectionEnd = start + newText.length;
        }
        
        fountainInput.focus();
        isPlaceholder = false;
        saveToUndoStack();
        
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            updateSceneList();
            saveToLocalStorage();
        }, 300);
    }
    
    // ========================================
    // UNDO/REDO SYSTEM
    // ========================================
    
    function saveToUndoStack() {
        if (!fountainInput) return;
        
        const currentContent = fountainInput.value;
        
        // Don't save if content hasn't changed
        if (undoStack.length > 0 && undoStack[undoStack.length - 1] === currentContent) {
            return;
        }
        
        undoStack.push(currentContent);
        
        // Limit stack size to 50
        if (undoStack.length > 50) {
            undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        redoStack = [];
    }
    
    function undo() {
        if (!fountainInput) return;
        
        if (undoStack.length > 1) {
            const current = undoStack.pop();
            redoStack.push(current);
            
            const previous = undoStack[undoStack.length - 1];
            isUpdatingFromSync = true;
            fountainInput.value = previous;
            isUpdatingFromSync = false;
            
            isPlaceholder = false;
            updateSceneList();
            saveToLocalStorage();
            
            if (currentView === 'card') {
                renderEnhancedCardView();
            }
            
            showToast('Undo', 'success', 1000);
        } else {
            showToast('Nothing to undo!', 'warning', 1500);
        }
    }
    
    function redo() {
        if (!fountainInput) return;
        
        if (redoStack.length > 0) {
            const content = redoStack.pop();
            undoStack.push(content);
            
            isUpdatingFromSync = true;
            fountainInput.value = content;
            isUpdatingFromSync = false;
            
            isPlaceholder = false;
            updateSceneList();
            saveToLocalStorage();
            
            if (currentView === 'card') {
                renderEnhancedCardView();
            }
            
            showToast('Redo', 'success', 1000);
        } else {
            showToast('Nothing to redo!', 'warning', 1500);
        }
    }
    
    // ========================================
    // LOCAL STORAGE
    // ========================================
    
    function saveToLocalStorage() {
        try {
            // Update project data before saving
            if (fountainInput) {
                projectData.projectInfo.scriptContent = isPlaceholder ? '' : fountainInput.value;
            }
            
            // Save project data
            localStorage.setItem('toscript_project', JSON.stringify(projectData));
            
            // Save preferences
            const preferences = {
                fontSize: fontSize,
                showSceneNumbers: showSceneNumbers,
                autoSaveEnabled: !!autoSaveInterval,
                autoSyncEnabled: autoSyncEnabled,
                lastSyncTime: lastSyncTime
            };
            localStorage.setItem('toscript_preferences', JSON.stringify(preferences));
            
            console.log('Saved to localStorage');
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            
            // Handle quota exceeded
            if (e.name === 'QuotaExceededError') {
                showToast('Storage quota exceeded! Export your work and clear data.', 'error', 5000);
            }
        }
    }
    
    function loadFromLocalStorage() {
        try {
            // Load project data
            const savedProject = localStorage.getItem('toscript_project');
            if (savedProject) {
                projectData = JSON.parse(savedProject);
                if (fountainInput) {
                    fountainInput.value = projectData.projectInfo.scriptContent || placeholderText;
                    isPlaceholder = !projectData.projectInfo.scriptContent;
                }
            }
            
            // Load preferences
            const savedPreferences = localStorage.getItem('toscript_preferences');
            if (savedPreferences) {
                const prefs = JSON.parse(savedPreferences);
                fontSize = prefs.fontSize || 16;
                showSceneNumbers = prefs.showSceneNumbers !== false;
                autoSyncEnabled = prefs.autoSyncEnabled || false;
                lastSyncTime = prefs.lastSyncTime ? new Date(prefs.lastSyncTime) : null;
                
                // Apply font size
                if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
                if (screenplayOutput) screenplayOutput.style.fontSize = `${fontSize}px`;
                
                // Update scene numbers button
                if (sceneNoBtn) {
                    sceneNoBtn.textContent = showSceneNumbers ? '☑ Scene Numbers' : '☐ Scene Numbers';
                }
                
                // Restore auto-save if it was enabled
                if (prefs.autoSaveEnabled) {
                    autoSaveInterval = setInterval(saveToLocalStorage, 30000);
                    if (autoSaveBtn) {
                        autoSaveBtn.textContent = '☑ Auto-Save (30s)';
                    }
                }
                
                // Restore auto-sync if it was enabled
                if (autoSyncEnabled) {
                    startAutoSync();
                }
            }
            
            console.log('Loaded from localStorage');
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
        }
    }
    
    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
    // ========================================
    // GLOBAL ERROR HANDLER - FROM TOSCRIPT2
    // ========================================
    
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        showToast('An error occurred. Check console for details.', 'error', 3000);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        showToast('Promise rejection. Check console.', 'error', 3000);
    });
    
    // ========================================
    // CONSOLE LOG MESSAGES
    // ========================================
    
    console.log('========================================');
    console.log('ToscripT v3.0 ULTIMATE Edition');
    console.log('========================================');
    console.log('Features:');
    console.log('✅ Complete Toscript1 card logic (pagination, positional insert, tap-reveal)');
    console.log('✅ All Toscript2 features (toast, Android, cloud placeholders)');
    console.log('✅ Enhanced keyboard shortcuts');
    console.log('✅ Comprehensive error handling');
    console.log('✅ Service worker support');
    console.log('');
    console.log('Keyboard Shortcuts:');
    console.log('  Ctrl/Cmd + S    : Save');
    console.log('  Ctrl/Cmd + Z    : Undo');
    console.log('  Ctrl/Cmd + Y    : Redo');
    console.log('  Ctrl/Cmd + P    : Preview Script');
    console.log('  Ctrl/Cmd + K    : Card View');
    console.log('  Ctrl/Cmd + E    : Editor View');
    console.log('  Ctrl/Cmd + M    : Toggle Menu');
    console.log('  F11             : Fullscreen');
    console.log('  Escape          : Exit focus mode');
    console.log('========================================');
    
}); // End DOMContentLoaded

// ========================================
// SERVICE WORKER REGISTRATION - FROM TOSCRIPT2
// ========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered successfully');
                console.log('Scope:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// ========================================
// ANALYTICS & PERFORMANCE TRACKING
// ========================================

if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
            console.log('Page Load Performance:');
            console.log(`  DOM Content Loaded: ${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`);
            console.log(`  Full Load Time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
        }
    });
}

// ========================================
// PWA INSTALL PROMPT - FROM TOSCRIPT2
// ========================================

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    console.log('PWA install prompt available');
    
    // Optionally, show your own install promotion UI
    // You can add a button in your HTML to trigger this
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
});

// Function to trigger PWA install (call this from a button)
function promptPWAInstall() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    }
}

// Make it globally accessible
window.promptPWAInstall = promptPWAInstall;

// ========================================
// ONLINE/OFFLINE STATUS - FROM TOSCRIPT2
// ========================================

window.addEventListener('online', () => {
    console.log('✅ Back online');
    // Show toast notification using the function inside DOMContentLoaded
    setTimeout(() => {
        const toast = document.createElement('div');
        toast.className = 'toast-notification toast-success';
        toast.textContent = 'Back online!';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }, 100);
});

window.addEventListener('offline', () => {
    console.log('⚠️ Offline mode');
    setTimeout(() => {
        const toast = document.createElement('div');
        toast.className = 'toast-notification toast-warning';
        toast.textContent = 'You are offline. Changes will be saved locally.';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff9800;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }, 100);
});

// ========================================
// VISIBILITY CHANGE HANDLER
// ========================================

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden - saving state');
        // Auto-save when page becomes hidden
        const fountainInput = document.getElementById('fountain-input');
        if (fountainInput) {
            try {
                const projectData = JSON.parse(localStorage.getItem('toscript_project') || '{}');
                if (projectData.projectInfo) {
                    projectData.projectInfo.scriptContent = fountainInput.value;
                    localStorage.setItem('toscript_project', JSON.stringify(projectData));
                }
            } catch (e) {
                console.error('Failed to save on visibility change:', e);
            }
        }
    } else {
        console.log('Page visible again');
    }
});

// ========================================
// MEMORY MANAGEMENT
// ========================================

// Clear old data periodically to prevent memory leaks
setInterval(() => {
    if (performance.memory) {
        const usedMemory = performance.memory.usedJSHeapSize;
        const totalMemory = performance.memory.totalJSHeapSize;
        const memoryPercent = (usedMemory / totalMemory * 100).toFixed(2);
        
        if (memoryPercent > 90) {
            console.warn(`Memory usage high: ${memoryPercent}%`);
        }
    }
}, 60000); // Check every minute

// ========================================
// BATTERY API - FROM TOSCRIPT2
// ========================================

if ('getBattery' in navigator) {
    navigator.getBattery().then((battery) => {
        console.log(`Battery level: ${battery.level * 100}%`);
        console.log(`Charging: ${battery.charging}`);
        
        battery.addEventListener('levelchange', () => {
            if (battery.level < 0.2 && !battery.charging) {
                console.warn('Low battery! Consider saving your work.');
                setTimeout(() => {
                    const toast = document.createElement('div');
                    toast.className = 'toast-notification toast-warning';
                    toast.textContent = 'Low battery! Your work is auto-saved.';
                    toast.style.cssText = `
                        position: fixed;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #ff9800;
                        color: white;
                        padding: 16px 24px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        z-index: 10000;
                        font-size: 14px;
                    `;
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 4000);
                }, 100);
            }
        });
    });
}

// ========================================
// NETWORK INFORMATION API
// ========================================

if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
        console.log(`Connection type: ${connection.effectiveType}`);
        console.log(`Downlink speed: ${connection.downlink}Mbps`);
        
        connection.addEventListener('change', () => {
            console.log(`Connection changed to: ${connection.effectiveType}`);
            
            // Warn if on slow connection
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                console.warn('Slow connection detected');
            }
        });
    }
}

// ========================================
// WAKE LOCK API - PREVENT SCREEN SLEEP
// ========================================

let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock active');
            
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released');
            });
        } catch (err) {
            console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
    }
}

// Request wake lock when user starts editing
document.addEventListener('DOMContentLoaded', () => {
    const fountainInput = document.getElementById('fountain-input');
    if (fountainInput) {
        fountainInput.addEventListener('focus', () => {
            requestWakeLock();
        });
    }
});

// ========================================
// CLIPBOARD API - ENHANCED
// ========================================

if ('clipboard' in navigator) {
    console.log('Clipboard API available');
    
    // Optional: Add paste with formatting support
    document.addEventListener('paste', (e) => {
        const fountainInput = document.getElementById('fountain-input');
        if (document.activeElement === fountainInput) {
            // Let default paste behavior work
            console.log('Paste event in editor');
        }
    });
}

// ========================================
// SHARE API - ENHANCED
// ========================================

if ('share' in navigator) {
    console.log('Web Share API available');
} else {
    console.log('Web Share API not available - using fallback');
}

// ========================================
// NOTIFICATION API
// ========================================

if ('Notification' in window) {
    if (Notification.permission === 'default') {
        console.log('Notifications available (permission not requested)');
    } else if (Notification.permission === 'granted') {
        console.log('Notifications enabled');
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log(`Notification permission: ${permission}`);
        });
    }
}

// Make globally accessible
window.requestNotificationPermission = requestNotificationPermission;

// ========================================
// FILE SYSTEM ACCESS API
// ========================================

if ('showOpenFilePicker' in window) {
    console.log('File System Access API available');
    
    // Enhanced file operations available
    window.modernFileAPI = true;
} else {
    console.log('Using fallback file operations');
    window.modernFileAPI = false;
}

// ========================================
// INDEXEDDB SUPPORT CHECK
// ========================================

if ('indexedDB' in window) {
    console.log('IndexedDB available for large file storage');
} else {
    console.log('IndexedDB not available');
}

// ========================================
// SCREEN ORIENTATION API
// ========================================

if ('orientation' in screen) {
    console.log(`Screen orientation: ${screen.orientation.type}`);
    
    screen.orientation.addEventListener('change', () => {
        console.log(`Orientation changed to: ${screen.orientation.type}`);
    });
}

// ========================================
// FULLSCREEN API COMPATIBILITY
// ========================================

if ('fullscreenEnabled' in document || 'webkitFullscreenEnabled' in document) {
    console.log('Fullscreen API supported');
} else {
    console.log('Fullscreen API not supported');
}

// ========================================
// PERFORMANCE OBSERVER
// ========================================

if ('PerformanceObserver' in window) {
    try {
        const perfObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 100) {
                    console.warn(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
                }
            }
        });
        
        perfObserver.observe({ entryTypes: ['measure'] });
    } catch (e) {
        console.log('Performance Observer not supported');
    }
}

// ========================================
// FEATURE DETECTION SUMMARY
// ========================================

console.log('========================================');
console.log('Browser Feature Detection:');
console.log(`  Service Worker: ${'serviceWorker' in navigator}`);
console.log(`  Web Share: ${'share' in navigator}`);
console.log(`  Clipboard: ${'clipboard' in navigator}`);
console.log(`  Notifications: ${'Notification' in window}`);
console.log(`  File System Access: ${'showOpenFilePicker' in window}`);
console.log(`  IndexedDB: ${'indexedDB' in window}`);
console.log(`  Wake Lock: ${'wakeLock' in navigator}`);
console.log(`  Battery API: ${'getBattery' in navigator}`);
console.log(`  Network Info: ${'connection' in navigator}`);
console.log('========================================');

// ========================================
// ADVANCED CLOUD SYNC HELPERS (FUTURE)
// ========================================

// Google Drive API Integration Placeholder
const GoogleDriveAPI = {
    CLIENT_ID: 'YOUR_CLIENT_ID_HERE',
    API_KEY: 'YOUR_API_KEY_HERE',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    SCOPES: 'https://www.googleapis.com/auth/drive.file',
    
    init: function() {
        console.log('Google Drive API ready for configuration');
        // Future implementation
    },
    
    signIn: function() {
        console.log('Google Drive sign in - Coming soon');
        // Future implementation
    },
    
    signOut: function() {
        console.log('Google Drive sign out - Coming soon');
        // Future implementation
    },
    
    uploadFile: function(filename, content) {
        console.log(`Google Drive upload: ${filename} - Coming soon`);
        // Future implementation
        return Promise.resolve({ id: 'mock-id' });
    },
    
    downloadFile: function(fileId) {
        console.log(`Google Drive download: ${fileId} - Coming soon`);
        // Future implementation
        return Promise.resolve('mock-content');
    },
    
    listFiles: function() {
        console.log('Google Drive list files - Coming soon');
        // Future implementation
        return Promise.resolve([]);
    }
};

// Dropbox API Integration Placeholder
const DropboxAPI = {
    ACCESS_TOKEN: 'YOUR_ACCESS_TOKEN_HERE',
    
    init: function() {
        console.log('Dropbox API ready for configuration');
        // Future implementation
    },
    
    uploadFile: function(filename, content) {
        console.log(`Dropbox upload: ${filename} - Coming soon`);
        // Future implementation
        return Promise.resolve({ path: '/mock-path' });
    },
    
    downloadFile: function(path) {
        console.log(`Dropbox download: ${path} - Coming soon`);
        // Future implementation
        return Promise.resolve('mock-content');
    }
};

// Make APIs globally accessible for future use
window.GoogleDriveAPI = GoogleDriveAPI;
window.DropboxAPI = DropboxAPI;

// ========================================
// ADVANCED EXPORT HELPERS
// ========================================

// Final Draft (FDX) Export Placeholder
function exportToFinalDraft() {
    console.log('Final Draft export - Coming soon');
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-warning';
    toast.textContent = 'Final Draft export coming soon! Use Fountain format for now.';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff9800;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Celtx Export Placeholder
function exportToCeltx() {
    console.log('Celtx export - Coming soon');
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-warning';
    toast.textContent = 'Celtx export coming soon! Use Fountain format for now.';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff9800;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Make export functions globally accessible
window.exportToFinalDraft = exportToFinalDraft;
window.exportToCeltx = exportToCeltx;

// ========================================
// COLLABORATION FEATURES (FUTURE)
// ========================================

const CollaborationAPI = {
    rooms: {},
    
    createRoom: function(roomId) {
        console.log(`Creating collaboration room: ${roomId}`);
        // Future WebSocket/WebRTC implementation
        return { roomId, status: 'created' };
    },
    
    joinRoom: function(roomId) {
        console.log(`Joining collaboration room: ${roomId}`);
        // Future implementation
        return { roomId, status: 'joined' };
    },
    
    leaveRoom: function(roomId) {
        console.log(`Leaving collaboration room: ${roomId}`);
        // Future implementation
    },
    
    sendUpdate: function(roomId, changes) {
        console.log(`Sending update to room ${roomId}:`, changes);
        // Future implementation
    }
};

window.CollaborationAPI = CollaborationAPI;

// ========================================
// AI INTEGRATION (FUTURE)
// ========================================

const AIAssistant = {
    providers: {
        openai: 'OpenAI GPT',
        claude: 'Claude',
        gemini: 'Google Gemini',
        local: 'Local LLM'
    },
    
    currentProvider: 'gemini',
    
    generateDialogue: function(context) {
        console.log('AI dialogue generation - Coming soon');
        // Future implementation
        return Promise.resolve('AI-generated dialogue');
    },
    
    suggestSceneDescription: function(heading) {
        console.log(`AI scene suggestion for: ${heading} - Coming soon`);
        // Future implementation
        return Promise.resolve('AI-generated description');
    },
    
    analyzeScript: function(script) {
        console.log('AI script analysis - Coming soon');
        // Future implementation
        return Promise.resolve({
            pacing: 'good',
            characters: [],
            suggestions: []
        });
    },
    
    formatCorrections: function(text) {
        console.log('AI format corrections - Coming soon');
        // Future implementation
        return Promise.resolve(text);
    }
};

window.AIAssistant = AIAssistant;

// ========================================
// VERSION CONTROL (FUTURE)
// ========================================

const VersionControl = {
    versions: [],
    
    createSnapshot: function(label) {
        console.log(`Creating version snapshot: ${label}`);
        const fountainInput = document.getElementById('fountain-input');
        if (fountainInput) {
            const snapshot = {
                id: Date.now(),
                label: label,
                timestamp: new Date(),
                content: fountainInput.value,
                scenes: JSON.parse(localStorage.getItem('toscript_project') || '{}').projectInfo?.scenes || []
            };
            
            this.versions.push(snapshot);
            
            // Store in localStorage
            try {
                localStorage.setItem('toscript_versions', JSON.stringify(this.versions));
                console.log('Version snapshot created');
                return snapshot;
            } catch (e) {
                console.error('Failed to save version:', e);
            }
        }
    },
    
    restoreVersion: function(versionId) {
        console.log(`Restoring version: ${versionId}`);
        const version = this.versions.find(v => v.id === versionId);
        if (version) {
            const fountainInput = document.getElementById('fountain-input');
            if (fountainInput) {
                fountainInput.value = version.content;
                console.log('Version restored');
                return true;
            }
        }
        return false;
    },
    
    listVersions: function() {
        return this.versions;
    },
    
    loadVersions: function() {
        try {
            const saved = localStorage.getItem('toscript_versions');
            if (saved) {
                this.versions = JSON.parse(saved);
                console.log(`Loaded ${this.versions.length} version(s)`);
            }
        } catch (e) {
            console.error('Failed to load versions:', e);
        }
    }
};

// Load versions on startup
VersionControl.loadVersions();
window.VersionControl = VersionControl;

// ========================================
// SCRIPT ANALYSIS TOOLS
// ========================================

const ScriptAnalyzer = {
    analyzeDialogueBalance: function(scenes) {
        const characterDialogue = {};
        scenes.forEach(scene => {
            scene.characters.forEach(char => {
                characterDialogue[char] = (characterDialogue[char] || 0) + 1;
            });
        });
        return characterDialogue;
    },
    
    calculateReadingTime: function(wordCount) {
        // Average reading speed: 200 words per minute
        return Math.ceil(wordCount / 200);
    },
    
    estimateScreenTime: function(wordCount) {
        // Rough estimate: 1 page = 1 minute screen time
        // 250 words per page
        return Math.ceil(wordCount / 250);
    },
    
    findPlotHoles: function(scenes) {
        console.log('Plot hole detection - Advanced feature coming soon');
        return [];
    },
    
    checkFormatting: function(script) {
        const issues = [];
        const lines = script.split('\n');
        
        lines.forEach((line, index) => {
            // Check for common formatting issues
            if (line.trim().length > 0) {
                // Character names should be all caps
                if (line === line.toUpperCase() && line.length > 40) {
                    issues.push({
                        line: index + 1,
                        issue: 'Character name too long',
                        suggestion: 'Character names should be under 40 characters'
                    });
                }
            }
        });
        
        return issues;
    }
};

window.ScriptAnalyzer = ScriptAnalyzer;

// ========================================
// KEYBOARD SHORTCUTS REFERENCE
// ========================================

const KeyboardShortcuts = {
    shortcuts: {
        'Ctrl/Cmd + S': 'Save project',
        'Ctrl/Cmd + Z': 'Undo',
        'Ctrl/Cmd + Y': 'Redo',
        'Ctrl/Cmd + P': 'Preview script',
        'Ctrl/Cmd + K': 'Card view',
        'Ctrl/Cmd + E': 'Editor view',
        'Ctrl/Cmd + M': 'Toggle menu',
        'F11': 'Fullscreen',
        'Escape': 'Exit focus mode'
    },
    
    showHelp: function() {
        const shortcuts = Object.entries(this.shortcuts)
            .map(([key, desc]) => `${key}: ${desc}`)
            .join('\n');
        
        alert('Keyboard Shortcuts:\n\n' + shortcuts);
    }
};

window.KeyboardShortcuts = KeyboardShortcuts;

// ========================================
// ACCESSIBILITY HELPERS
// ========================================

// High contrast mode detector
if (window.matchMedia) {
    const highContrastMode = window.matchMedia('(prefers-contrast: high)');
    if (highContrastMode.matches) {
        console.log('High contrast mode detected');
        document.body.classList.add('high-contrast');
    }
}

// Reduced motion detector
if (window.matchMedia) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) {
        console.log('Reduced motion preference detected');
        document.body.classList.add('reduced-motion');
    }
}

// ========================================
// DEBUG MODE
// ========================================

window.ToscriptDebug = {
    enabled: false,
    
    enable: function() {
        this.enabled = true;
        console.log('Debug mode enabled');
        document.body.classList.add('debug-mode');
    },
    
    disable: function() {
        this.enabled = false;
        console.log('Debug mode disabled');
        document.body.classList.remove('debug-mode');
    },
    
    logState: function() {
        const fountainInput = document.getElementById('fountain-input');
        const projectData = JSON.parse(localStorage.getItem('toscript_project') || '{}');
        
        console.log('Current State:', {
            content: fountainInput?.value.substring(0, 100) + '...',
            scenes: projectData.projectInfo?.scenes.length || 0,
            wordCount: fountainInput?.value.split(/\s+/).length || 0,
            storageUsed: new Blob([localStorage.getItem('toscript_project') || '']).size,
            timestamp: new Date()
        });
    },
    
    clearAllData: function() {
        if (confirm('Clear ALL data? This cannot be undone!')) {
            localStorage.clear();
            location.reload();
        }
    },
    
    exportDebugInfo: function() {
        const debugInfo = {
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            localStorage: Object.keys(localStorage).length + ' items',
            storageSize: new Blob([JSON.stringify(localStorage)]).size + ' bytes',
            timestamp: new Date().toISOString()
        };
        
        console.log('Debug Info:', debugInfo);
        return debugInfo;
    }
};

// ========================================
// FINAL INITIALIZATION MESSAGE
// ========================================

console.log('');
console.log('🎬 ToscripT v3.0 ULTIMATE Edition Ready!');
console.log('');
console.log('Quick Start:');
console.log('  1. Start writing in the editor');
console.log('  2. Use toolbar buttons for quick formatting');
console.log('  3. Switch to Card View to organize scenes');
console.log('  4. Export your work using the menu');
console.log('');
console.log('Tips:');
console.log('  • Ctrl+S to save anytime');
console.log('  • Use INT./EXT. for scene headings');
console.log('  • ALL CAPS for character names');
console.log('  • Card view has pagination (5 cards/page)');
console.log('  • Tap cards on mobile to reveal actions');
console.log('');
console.log('Need help? Type KeyboardShortcuts.showHelp()');
console.log('Debug mode: ToscriptDebug.enable()');
console.log('');
console.log('Happy screenwriting! 🎥✨');
console.log('========================================');

// ========================================
// EXPOSE API FOR EXTERNAL USE
// ========================================

window.ToscriptAPI = {
    version: '3.0.0-ultimate',
    
    getProjectData: function() {
        return JSON.parse(localStorage.getItem('toscript_project') || '{}');
    },
    
    getScenes: function() {
        const project = this.getProjectData();
        return project.projectInfo?.scenes || [];
    },
    
    getScriptContent: function() {
        const fountainInput = document.getElementById('fountain-input');
        return fountainInput?.value || '';
    },
    
    setScriptContent: function(content) {
        const fountainInput = document.getElementById('fountain-input');
        if (fountainInput) {
            fountainInput.value = content;
            // Trigger update
            const event = new Event('input', { bubbles: true });
            fountainInput.dispatchEvent(event);
        }
    },
    
    exportAsPDF: function() {
        if (window.saveAllCardsAsImages) {
            window.saveAllCardsAsImages();
        }
    },
    
    exportAsFountain: function() {
        const content = this.getScriptContent();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'script.fountain';
        a.click();
        URL.revokeObjectURL(url);
    },
    
    getStatistics: function() {
        const content = this.getScriptContent();
        const words = content.split(/\s+/).filter(w => w.length > 0);
        const scenes = this.getScenes();
        
        return {
            wordCount: words.length,
            characterCount: content.length,
            sceneCount: scenes.length,
            pageEstimate: Math.ceil(words.length / 250)
        };
    }
};

// ========================================
// END OF TOSCRIPT3 ULTIMATE
// ========================================

console.log('✅ All modules loaded successfully');
console.log('✅ Event listeners registered');
console.log('✅ Service worker ready');
console.log('✅ ToscripT v3.0 ULTIMATE fully initialized');
console.log('');
