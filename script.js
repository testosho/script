// ========================================
// ToscripT Professional - Complete Android Optimized Version
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================
    // GLOBAL VARIABLES
    // ========================================
    let projectData = {
        projectInfo: {
            projectName: 'Untitled',
            prodName: 'Author',
            scriptContent: '',
            scenes: []
        }
    };
    
    let fontSize = 16;
    let autoSaveInterval = null;
    let showSceneNumbers = true;
    let currentView = 'write';
    let debounceTimeout = null;
    let isUpdatingFromSync = false;
    let currentPage = 0;
    const cardsPerPage = 10; // Reduced for better mobile performance
    let undoStack = [];
    let redoStack = [];
    let isPlaceholder = true;
    let isFocusMode = false;
    let isFullscreen = false;
    
    // Google Drive & Dropbox
    let gapi = null;
    let gapiInited = false;
    let isSignedIn = false;
    let autoSyncEnabled = false;
    let autoSyncTimer = null;
    
    // ========================================
    // DOM ELEMENTS
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
    
    // Buttons
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
    const addNewCardBtn = document.getElementById('add-new-card-btn');
    const saveAllCardsBtn = document.getElementById('save-all-cards-btn');
    const exportSceneOrderBtn = document.getElementById('export-scene-order-btn');
    
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
    const googleDriveSaveBtn = document.getElementById('google-drive-save-btn');
    const googleDriveOpenBtn = document.getElementById('google-drive-open-btn');
    const dropboxSaveBtn = document.getElementById('dropbox-save-btn');
    const dropboxOpenBtn = document.getElementById('dropbox-open-btn');
    const cloudSyncBtn = document.getElementById('cloud-sync-btn');
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
    // INITIALIZATION
    // ========================================
    function init() {
        console.log('ToscripT initializing...');
        
        // Hide splash screen after 1.5 seconds
        setTimeout(() => {
            if (splashScreen) {
                splashScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
                setTimeout(() => {
                    document.body.classList.add('loaded');
                }, 500);
            }
        }, 1500);
        
        // Load saved data
        loadFromLocalStorage();
        
        // Set placeholder if empty
        if (!fountainInput.value.trim() || fountainInput.value === placeholderText) {
            fountainInput.value = placeholderText;
            fountainInput.classList.add('placeholder');
            isPlaceholder = true;
        } else {
            isPlaceholder = false;
        }
        
        // Initialize UI
        updatePreview();
        extractAndDisplayScenes();
        syncCardsWithScript();
        updateUndoRedoButtons();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Initialize Google Drive API
        initializeGoogleDrive();
        
        // Check for Android WebView
        checkAndroidWebView();
        
        // Show mobile keyboard toolbar on mobile
        if (isMobileDevice()) {
            showMobileToolbar();
        }
        
        console.log('ToscripT initialized successfully!');
    }
    
    // ========================================
    // ANDROID WEBVIEW DETECTION
    // ========================================
    function checkAndroidWebView() {
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isWebView = /wv/.test(navigator.userAgent);
        
        if (isAndroid && isWebView) {
            console.log('Running in Android WebView');
            document.body.classList.add('android-webview');
            
            // Enable hardware acceleration hint
            document.body.style.transform = 'translateZ(0)';
            
            // Add Android back button handler
            if (window.Android && window.Android.onBackPressed) {
                console.log('Android interface detected');
            }
        }
    }
    
    // ========================================
    // MOBILE DEVICE DETECTION
    // ========================================
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }
    
    // ========================================
    // MOBILE KEYBOARD TOOLBAR MANAGEMENT
    // ========================================
    function showMobileToolbar() {
        if (mobileKeyboardToolbar && currentView === 'write') {
            mobileKeyboardToolbar.classList.add('show');
        }
    }
    
    function hideMobileToolbar() {
        if (mobileKeyboardToolbar) {
            mobileKeyboardToolbar.classList.remove('show');
        }
    }
    
    // ========================================
    // LOCAL STORAGE FUNCTIONS
    // ========================================
    function saveToLocalStorage() {
        if (isPlaceholder) {
            console.log('Skipping save: placeholder text active');
            return;
        }
        
        try {
            projectData.projectInfo.scriptContent = fountainInput.value;
            localStorage.setItem('toscriptProject', JSON.stringify(projectData));
            console.log('Project saved to localStorage');
            showToast('Project saved');
        } catch (e) {
            console.error('localStorage save error:', e);
            if (e.name === 'QuotaExceededError') {
                showToast('Storage quota exceeded! Please export your script.', 'error');
            } else {
                showToast('Failed to save project', 'error');
            }
        }
    }
    
    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('toscriptProject');
            if (saved) {
                projectData = JSON.parse(saved);
                fountainInput.value = projectData.projectInfo.scriptContent || '';
                console.log('Project loaded from localStorage');
            }
        } catch (e) {
            console.error('localStorage load error:', e);
            showToast('Failed to load saved project', 'error');
        }
    }
    
    function clearLocalStorage() {
        try {
            localStorage.removeItem('toscriptProject');
            console.log('localStorage cleared');
        } catch (e) {
            console.error('localStorage clear error:', e);
        }
    }

    // ========================================
    // EVENT LISTENERS INITIALIZATION
    // ========================================
    function initializeEventListeners() {
        
        // Hamburger Menu Toggles
        hamburgerBtn?.addEventListener('click', () => toggleMenu());
        hamburgerBtnScript?.addEventListener('click', () => toggleMenu());
        hamburgerBtnCard?.addEventListener('click', () => toggleMenu());
        
        // View Switching
        showScriptBtn?.addEventListener('click', () => switchView('script'));
        showWriteBtnHeader?.addEventListener('click', () => switchView('write'));
        showWriteBtnCardHeader?.addEventListener('click', () => switchView('write'));
        cardViewBtn?.addEventListener('click', () => switchView('card'));
        
        // Scene Navigator
        sceneNavigatorBtn?.addEventListener('click', () => toggleSceneNavigator());
        sceneNavigatorBtnScript?.addEventListener('click', () => toggleSceneNavigator());
        closeNavigatorBtn?.addEventListener('click', () => toggleSceneNavigator());
        
        // Fullscreen & Focus Mode
        fullscreenBtnMain?.addEventListener('click', () => toggleFullscreen());
        focusModeBtn?.addEventListener('click', () => toggleFocusMode());
        focusExitBtn?.addEventListener('click', () => exitFocusMode());
        
        // Zoom Controls
        zoomInBtn?.addEventListener('click', () => adjustFontSize(2));
        zoomOutBtn?.addEventListener('click', () => adjustFontSize(-2));
        
        // Undo/Redo
        undoBtnTop?.addEventListener('click', () => undo());
        redoBtnTop?.addEventListener('click', () => redo());
        
        // Card View Buttons
        addNewCardBtn?.addEventListener('click', () => addNewCard());
        saveAllCardsBtn?.addEventListener('click', () => saveAllCardsAsImages());
        exportSceneOrderBtn?.addEventListener('click', () => exportSceneOrder());
        
        // Menu Items
        newBtn?.addEventListener('click', (e) => { e.preventDefault(); newProject(); });
        openBtn?.addEventListener('click', (e) => { e.preventDefault(); openProject(); });
        projectInfoBtn?.addEventListener('click', (e) => { e.preventDefault(); openProjectInfoModal(); });
        titlePageBtn?.addEventListener('click', (e) => { e.preventDefault(); openTitlePageModal(); });
        saveMenuBtn?.addEventListener('click', (e) => { e.preventDefault(); toggleDropdown('save-menu'); });
        cloudMenuBtn?.addEventListener('click', (e) => { e.preventDefault(); toggleDropdown('cloud-menu'); });
        saveFountainBtn?.addEventListener('click', (e) => { e.preventDefault(); saveFountainFile(); });
        savePdfEnglishBtn?.addEventListener('click', (e) => { e.preventDefault(); savePdfEnglish(); });
        savePdfUnicodeBtn?.addEventListener('click', (e) => { e.preventDefault(); savePdfUnicode(); });
        saveFilmprojBtn?.addEventListener('click', (e) => { e.preventDefault(); saveFilmproj(); });
        
        // Cloud Storage
        googleDriveSaveBtn?.addEventListener('click', (e) => { e.preventDefault(); saveToGoogleDrive(); });
        googleDriveOpenBtn?.addEventListener('click', (e) => { e.preventDefault(); openFromGoogleDrive(); });
        dropboxSaveBtn?.addEventListener('click', (e) => { e.preventDefault(); saveToDropbox(); });
        dropboxOpenBtn?.addEventListener('click', (e) => { e.preventDefault(); openFromDropbox(); });
        cloudSyncBtn?.addEventListener('click', (e) => { e.preventDefault(); openCloudSyncModal(); });
        
        autoSaveBtn?.addEventListener('click', (e) => { e.preventDefault(); toggleAutoSave(); });
        shareBtn?.addEventListener('click', (e) => { e.preventDefault(); shareScript(); });
        sceneNoBtn?.addEventListener('click', (e) => { e.preventDefault(); toggleSceneNumbers(); });
        clearProjectBtn?.addEventListener('click', (e) => { e.preventDefault(); clearProject(); });
        infoBtn?.addEventListener('click', (e) => { e.preventDefault(); openInfoModal(); });
        aboutBtn?.addEventListener('click', (e) => { e.preventDefault(); openAboutModal(); });
        
        // Fountain Input Events
        fountainInput?.addEventListener('focus', handleFountainFocus);
        fountainInput?.addEventListener('blur', handleFountainBlur);
        fountainInput?.addEventListener('input', handleFountainInput);
        
        // Desktop Toolbar Buttons
        const desktopActionBtns = desktopSideToolbar?.querySelectorAll('.action-btn');
        desktopActionBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                if (action) handleAction(action);
            });
        });
        
        // Mobile Keyboard Toolbar Buttons
        const mobileKeyboardBtns = mobileKeyboardToolbar?.querySelectorAll('.keyboard-btn');
        mobileKeyboardBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                if (action) handleAction(action);
            });
        });
        
        // Filter Events
        filterCategorySelect?.addEventListener('change', handleFilterCategoryChange);
        filterValueInput?.addEventListener('input', handleFilterValueInput);
        
        // File Input
        fileInput?.addEventListener('change', handleFileSelect);
        
        // Close panels on outside click
		document.addEventListener('click', (e) => {
		    if (menuPanel?.classList.contains('open') && 
		        !menuPanel.contains(e.target) && 
		        !hamburgerBtn?.contains(e.target) &&
		        !hamburgerBtnScript?.contains(e.target) &&
		        !hamburgerBtnCard?.contains(e.target)) {
		        closeMenu();
		    }
    
		    if (sceneNavigatorPanel?.classList.contains('open') && 
		        !sceneNavigatorPanel.contains(e.target) && 
		        !sceneNavigatorBtn?.contains(e.target) &&
		        !sceneNavigatorBtnScript?.contains(e.target)) {
		        closeSceneNavigator();
		    }
		});
        
        // Fullscreen change detection
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Window resize for mobile toolbar
        window.addEventListener('resize', handleWindowResize);
        
        // Prevent accidental refresh
        window.addEventListener('beforeunload', (e) => {
            if (!isPlaceholder && fountainInput.value.trim()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }
    
    // ========================================
    // VIEW MANAGEMENT
    // ========================================
	// Switch View Function - FIXED WITH SCENE EXTRACTION
	function switchView(view) {
	    console.log(`Switching to view: ${view}`);
	    currentView = view;
    
	    // Hide all views and headers first
	    [writeView, scriptView, cardView].forEach(v => v?.classList.remove('active'));
	    [mainHeader, scriptHeader, cardHeader].forEach(h => {
	        if (h) h.style.display = 'none';
	    });
	    hideMobileToolbar();

	    // Check if in fullscreen mode
	    const isFullscreen = document.fullscreenElement || document.body.classList.contains('fullscreen-active');

	    if (view === 'script') {
	        scriptView?.classList.add('active');
	        if (scriptHeader && !isFullscreen) {
	            scriptHeader.style.display = 'flex';
	        }
	        updatePreview(); // Use updatePreview instead of renderEnhancedScript
        
	    } else if (view === 'card') {
	        // CRITICAL FIX: Extract scenes BEFORE rendering cards
	        if (fountainInput && !isPlaceholder) {
	            console.log('Extracting scenes for card view...');
	            projectData.projectInfo.scenes = extractAndDisplayScenes(); // This extracts scenes
	            console.log('Scenes extracted:', projectData.projectInfo.scenes.length);
	        }
        
	        cardView?.classList.add('active');
        
	        // Show card header unless in fullscreen
	        if (cardHeader) {
	            if (isFullscreen) {
	                cardHeader.style.display = 'none';
	            } else {
	                cardHeader.style.display = 'flex';
	            }
	        }
        
	        currentPage = 0;
	        renderEnhancedCardView();
        
	        setTimeout(() => {
	            bindCardEditingEvents();
            
	            // Ensure header stays visible after render
	            if (cardHeader && !isFullscreen) {
	                cardHeader.style.display = 'flex';
	            }
	        }, 100);
        
	    } else {
	        // Write mode
	        writeView?.classList.add('active');
	        if (mainHeader && !isFullscreen) {
	            mainHeader.style.display = 'flex';
	        }
        
	        setTimeout(() => {
	            if (fountainInput) {
	                if (!isPlaceholder) {
	                    fountainInput.classList.remove('placeholder');
	                }
	                fountainInput.focus();
                
	                // Always show toolbar in write mode on mobile
	                if (window.innerWidth <= 768) {
	                    showMobileToolbar();
	                }
	            }
	        }, 200);
	    }
	}
    
	// Helper: Check if placeholder
	function isPlaceholder() {
	    return isPlaceholderActive || (fountainInput && fountainInput.value === placeholderText);
	}
	
    
    // ========================================
    // MENU MANAGEMENT
    // ========================================
    function toggleMenu() {
        menuPanel?.classList.toggle('open');
    }
    
    function closeMenu() {
        menuPanel?.classList.remove('open');
    }
    
    function toggleSceneNavigator() {
        sceneNavigatorPanel?.classList.toggle('open');
        if (sceneNavigatorPanel?.classList.contains('open')) {
            extractAndDisplayScenes();
        }
    }
    
    function closeSceneNavigator() {
        sceneNavigatorPanel?.classList.remove('open');
    }
    
    function toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        const container = dropdown?.closest('.dropdown-container');
        container?.classList.toggle('open');
    }
    
    // ========================================
    // FULLSCREEN MANAGEMENT
    // ========================================
    function toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && !document.msFullscreenElement) {
            enterFullscreen();
        } else {
            exitFullscreen();
        }
    }
    
    function enterFullscreen() {
        const elem = document.documentElement;
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }
    
    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    
    function handleFullscreenChange() {
        const isNowFullscreen = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement;
        
        if (isNowFullscreen) {
            document.body.classList.add('fullscreen-active');
            isFullscreen = true;
            if (isMobileDevice()) showMobileToolbar();
        } else {
            document.body.classList.remove('fullscreen-active');
            isFullscreen = false;
            if (isFocusMode) exitFocusMode();
        }
    }
    
    // ========================================
    // FOCUS MODE (Enhanced)
    // ========================================
    function toggleFocusMode() {
        if (isFocusMode) {
            exitFocusMode();
        } else {
            enterFocusMode();
        }
    }
    
    function enterFocusMode() {
        if (!isFullscreen) {
            enterFullscreen();
            setTimeout(() => {
                activateFocusMode();
            }, 300);
        } else {
            activateFocusMode();
        }
    }
    
    function activateFocusMode() {
        isFocusMode = true;
        document.body.classList.add('focus-mode-active');
        showMobileToolbar();
        focusExitBtn.style.display = 'flex';
        
        // Give haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        showToast('Focus Mode Activated');
        console.log('Focus Mode: ON');
    }
    
    function exitFocusMode() {
        isFocusMode = false;
        document.body.classList.remove('focus-mode-active');
        focusExitBtn.style.display = 'none';
        
        if (isMobileDevice() && currentView === 'write') {
            showMobileToolbar();
        } else {
            hideMobileToolbar();
        }
        
        // Give haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        showToast('Focus Mode Deactivated');
        console.log('Focus Mode: OFF');
    }
    
    // ========================================
    // WINDOW RESIZE HANDLER
    // ========================================
    function handleWindowResize() {
        if (isMobileDevice() && currentView === 'write' && !isFocusMode) {
            showMobileToolbar();
        }
    }

    // ========================================
    // FOUNTAIN INPUT HANDLERS
    // ========================================
    function handleFountainFocus() {
        if (isPlaceholder) {
            fountainInput.value = '';
            fountainInput.classList.remove('placeholder');
            isPlaceholder = false;
        }
    }
    
    function handleFountainBlur() {
        if (!fountainInput.value.trim()) {
            fountainInput.value = placeholderText;
            fountainInput.classList.add('placeholder');
            isPlaceholder = true;
        }
    }
    
    function handleFountainInput() {
        if (isPlaceholder) return;
        
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            saveUndoState();
            updatePreview();
            extractAndDisplayScenes();
            
            if (!isUpdatingFromSync) {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    syncCardsWithScript();
                }, 800);
            }
            
            saveToLocalStorage();
        }, 1000);
    }
    
    // ========================================
    // UNDO/REDO SYSTEM
    // ========================================
    function saveUndoState() {
        if (isPlaceholder) return;
        
        const currentContent = fountainInput.value;
        
        if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== currentContent) {
            undoStack.push(currentContent);
            
            if (undoStack.length > 50) {
                undoStack.shift();
            }
            
            redoStack = [];
            updateUndoRedoButtons();
        }
    }
    
    function undo() {
        if (undoStack.length > 1) {
            const currentState = undoStack.pop();
            redoStack.push(currentState);
            
            const previousState = undoStack[undoStack.length - 1];
            fountainInput.value = previousState;
            
            updatePreview();
            extractAndDisplayScenes();
            syncCardsWithScript();
            saveToLocalStorage();
            updateUndoRedoButtons();
            
            showToast('Undo');
        }
    }
    
    function redo() {
        if (redoStack.length > 0) {
            const nextState = redoStack.pop();
            undoStack.push(nextState);
            
            fountainInput.value = nextState;
            
            updatePreview();
            extractAndDisplayScenes();
            syncCardsWithScript();
            saveToLocalStorage();
            updateUndoRedoButtons();
            
            showToast('Redo');
        }
    }
    
    function updateUndoRedoButtons() {
        if (undoBtnTop) {
            undoBtnTop.disabled = undoStack.length <= 1;
        }
        if (redoBtnTop) {
            redoBtnTop.disabled = redoStack.length === 0;
        }
    }
    
    // ========================================
    // TOOLBAR ACTIONS
    // ========================================
    function handleAction(action) {
        const textarea = fountainInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);
        
        let newText = '';
        let newCursorPos = start;
        
        switch(action) {
            case 'scene':
                newText = cycleSceneHeading(selectedText);
                break;
            case 'time':
                newText = cycleTimeOfDay(selectedText);
                break;
            case 'caps':
                newText = toggleCase(selectedText);
                break;
            case 'parens':
                newText = addParentheses(selectedText);
                break;
            case 'transition':
                newText = cycleTransition(selectedText);
                break;
            default:
                return;
        }
        
        textarea.value = beforeText + newText + afterText;
        newCursorPos = start + newText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
        
        // Trigger input event
        handleFountainInput();
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    }
    
    function cycleSceneHeading(text) {
        const scenes = ['INT.', 'EXT.', 'INT./EXT.', 'EXT./INT.'];
        
        for (let i = 0; i < scenes.length; i++) {
            if (text.toUpperCase().startsWith(scenes[i])) {
                const nextScene = scenes[(i + 1) % scenes.length];
                return text.replace(new RegExp('^' + scenes[i], 'i'), nextScene);
            }
        }
        
        return 'INT. ' + text;
    }
    
    function cycleTimeOfDay(text) {
        const times = ['DAY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING', 'DUSK', 'DAWN', 'CONTINUOUS'];
        
        for (let i = 0; i < times.length; i++) {
            if (text.toUpperCase().includes(times[i])) {
                const nextTime = times[(i + 1) % times.length];
                return text.replace(new RegExp(times[i], 'gi'), nextTime);
            }
        }
        
        return text + ' - DAY';
    }
    
    function toggleCase(text) {
        if (text === text.toUpperCase()) {
            return text.toLowerCase();
        } else {
            return text.toUpperCase();
        }
    }
    
    function addParentheses(text) {
        if (text.startsWith('(') && text.endsWith(')')) {
            return text.slice(1, -1);
        } else {
            return '(' + text + ')';
        }
    }
    
    function cycleTransition(text) {
        const transitions = ['CUT TO:', 'FADE TO:', 'DISSOLVE TO:', 'FADE OUT.', 'FADE IN:', 'SMASH CUT TO:'];
        
        for (let i = 0; i < transitions.length; i++) {
            if (text.toUpperCase().includes(transitions[i])) {
                return transitions[(i + 1) % transitions.length];
            }
        }
        
        return 'CUT TO:';
    }
    
    // ========================================
    // FONT SIZE ADJUSTMENT
    // ========================================
    function adjustFontSize(delta) {
        fontSize += delta;
        fontSize = Math.max(12, Math.min(24, fontSize));
        fountainInput.style.fontSize = fontSize + 'px';
        saveToLocalStorage();
        showToast(`Font Size: ${fontSize}px`);
    }
    
    // ========================================
    // KEYBOARD SHORTCUTS
    // ========================================
    function handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveToLocalStorage();
            showToast('Project Saved');
        }
        
        // Ctrl/Cmd + Z: Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        
        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
        if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
            e.preventDefault();
            redo();
        }
        
        // Ctrl/Cmd + P: Preview
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            switchView('script');
        }
        
        // Ctrl/Cmd + K: Card View
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            switchView('card');
        }
        
        // Ctrl/Cmd + E: Write View
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            switchView('write');
        }
        
        // F11: Fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
        
        // Escape: Exit Focus Mode or Close Panels
        if (e.key === 'Escape') {
            if (isFocusMode) {
                exitFocusMode();
            } else if (menuPanel?.classList.contains('open')) {
                closeMenu();
            } else if (sceneNavigatorPanel?.classList.contains('open')) {
                closeSceneNavigator();
            }
        }
    }
    
    // ========================================
    // AUTO-SAVE MANAGEMENT
    // ========================================
    function toggleAutoSave() {
        const indicator = document.getElementById('auto-save-indicator');
        
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
            indicator?.classList.remove('on');
            indicator?.classList.add('off');
            showToast('Auto-Save OFF');
        } else {
            autoSaveInterval = setInterval(() => {
                if (!isPlaceholder) {
                    saveToLocalStorage();
                }
            }, 60000); // Every 60 seconds
            indicator?.classList.remove('off');
            indicator?.classList.add('on');
            showToast('Auto-Save ON');
        }
    }
    
    // ========================================
    // SCENE NUMBER TOGGLE
    // ========================================
    function toggleSceneNumbers() {
        showSceneNumbers = !showSceneNumbers;
        const indicator = document.getElementById('scene-no-indicator');
        
        if (showSceneNumbers) {
            indicator?.classList.remove('off');
            indicator?.classList.add('on');
            showToast('Scene Numbers ON');
        } else {
            indicator?.classList.remove('on');
            indicator?.classList.add('off');
            showToast('Scene Numbers OFF');
        }
        
        updatePreview();
        saveToLocalStorage();
    }
	
    // ========================================
    // SCREENPLAY PREVIEW (Fountain Parsing)
    // ========================================
    function updatePreview() {
        if (isPlaceholder) return;
        
        const fountainText = fountainInput.value;
        screenplayOutput.innerHTML = '';
        
        const lines = fountainText.split('\n');
        let sceneCounter = 1;
        let insideDialogue = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            if (trimmedLine === '') {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-line';
                screenplayOutput.appendChild(emptyDiv);
                insideDialogue = false;
                continue;
            }
            
            const element = classifyLine(line, trimmedLine, i, lines);
            
            if (element.className === 'scene-heading') {
                if (showSceneNumbers) {
                    const sceneDiv = document.createElement('div');
                    sceneDiv.className = 'scene-heading';
                    
                    const sceneText = document.createElement('span');
                    sceneText.textContent = element.text;
                    
                    const sceneNum = document.createElement('span');
                    sceneNum.className = 'scene-number';
                    sceneNum.textContent = sceneCounter;
                    
                    sceneDiv.appendChild(sceneText);
                    sceneDiv.appendChild(sceneNum);
                    screenplayOutput.appendChild(sceneDiv);
                    
                    sceneCounter++;
                } else {
                    const sceneDiv = document.createElement('div');
                    sceneDiv.className = 'scene-heading';
                    sceneDiv.textContent = element.text;
                    screenplayOutput.appendChild(sceneDiv);
                    sceneCounter++;
                }
                insideDialogue = false;
            } else if (element.className === 'character') {
                const charDiv = document.createElement('div');
                charDiv.className = 'character';
                charDiv.textContent = element.text;
                screenplayOutput.appendChild(charDiv);
                insideDialogue = true;
            } else if (element.className === 'dialogue') {
                const dialogueDiv = document.createElement('div');
                dialogueDiv.className = 'dialogue';
                dialogueDiv.textContent = element.text;
                screenplayOutput.appendChild(dialogueDiv);
            } else if (element.className === 'parenthetical') {
                const parenDiv = document.createElement('div');
                parenDiv.className = 'parenthetical';
                parenDiv.textContent = element.text;
                screenplayOutput.appendChild(parenDiv);
            } else if (element.className === 'transition') {
                const transDiv = document.createElement('div');
                transDiv.className = 'transition';
                transDiv.textContent = element.text;
                screenplayOutput.appendChild(transDiv);
                insideDialogue = false;
            } else if (element.className === 'action') {
                const actionDiv = document.createElement('div');
                actionDiv.className = 'action';
                actionDiv.textContent = element.text;
                screenplayOutput.appendChild(actionDiv);
                insideDialogue = false;
            } else if (element.className === 'title-page-element') {
                const titleDiv = document.createElement('div');
                titleDiv.className = 'title-page-element';
                titleDiv.textContent = element.text;
                screenplayOutput.appendChild(titleDiv);
            }
        }
    }
    
    function classifyLine(line, trimmedLine, index, lines) {
        // Scene Heading
        if (/^(INT|EXT|INT\.\/EXT|EXT\.\/INT|I\/E)[\.\s]/i.test(trimmedLine)) {
            return { className: 'scene-heading', text: trimmedLine.toUpperCase() };
        }
        
        // Transition (all caps ending with TO:)
        if (/^[A-Z\s]+TO:$/.test(trimmedLine) || /^FADE (OUT|IN)\.?$/.test(trimmedLine)) {
            return { className: 'transition', text: trimmedLine };
        }
        
        // Character Name (all caps, potentially with extension)
        if (/^[A-Z\s]+(\(.*\))?$/.test(trimmedLine) && 
            trimmedLine.length < 40 && 
            index < lines.length - 1 && 
            lines[index + 1].trim() !== '') {
            
            const nextLine = lines[index + 1].trim();
            if (!nextLine.startsWith('(') && !/^[A-Z\s]+TO:$/.test(nextLine)) {
                return { className: 'character', text: trimmedLine };
            }
        }
        
        // Parenthetical
        if (/^\(.*\)$/.test(trimmedLine)) {
            return { className: 'parenthetical', text: trimmedLine };
        }
        
        // Dialogue (follows character or parenthetical)
        if (index > 0) {
            const prevLine = lines[index - 1].trim();
            const prevClassified = classifyLine(lines[index - 1], prevLine, index - 1, lines);
            
            if (prevClassified.className === 'character' || prevClassified.className === 'parenthetical') {
                return { className: 'dialogue', text: trimmedLine };
            }
            
            // Continue dialogue if previous was dialogue
            if (prevClassified.className === 'dialogue' && index > 1) {
                const prevPrevLine = lines[index - 2].trim();
                const prevPrevClassified = classifyLine(lines[index - 2], prevPrevLine, index - 2, lines);
                if (prevPrevClassified.className === 'character') {
                    return { className: 'dialogue', text: trimmedLine };
                }
            }
        }
        
        // Title Page Elements
        if (trimmedLine.startsWith('Title:') || trimmedLine.startsWith('Author:') || 
            trimmedLine.startsWith('Draft:') || trimmedLine.startsWith('Contact:')) {
            return { className: 'title-page-element', text: trimmedLine };
        }
        
        // Default: Action
        return { className: 'action', text: trimmedLine };
    }
    
    // ========================================
    // SCENE EXTRACTION & DISPLAY
    // ========================================
    function extractAndDisplayScenes() {
        if (isPlaceholder) return;
        
        const fountainText = fountainInput.value;
        const lines = fountainText.split('\n');
        const scenes = [];
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (/^(INT|EXT|INT\.\/EXT|EXT\.\/INT|I\/E)[\.\s]/i.test(trimmedLine)) {
                const sceneMatch = trimmedLine.match(/^(INT|EXT|INT\.\/EXT|EXT\.\/INT|I\/E)[\.\s]+(.*?)\s*-\s*(.*)$/i);
                
                let sceneType = 'INT.';
                let sceneSetting = trimmedLine;
                let timeOfDay = 'DAY';
                
                if (sceneMatch) {
                    sceneType = sceneMatch[1].toUpperCase();
                    sceneSetting = sceneMatch[2].trim();
                    timeOfDay = sceneMatch[3].trim().toUpperCase();
                }
                
                scenes.push({
                    text: trimmedLine,
                    lineIndex: index,
                    sceneType: sceneType,
                    sceneSetting: sceneSetting,
                    timeOfDay: timeOfDay,
                    cast: extractCastFromScene(lines, index)
                });
            }
        });
        
        projectData.projectInfo.scenes = scenes;
        displayScenes(scenes);
    }
    
    function extractCastFromScene(lines, startIndex) {
        const cast = [];
        let i = startIndex + 1;
        
        while (i < lines.length) {
            const line = lines[i].trim();
            
            // Stop at next scene heading
            if (/^(INT|EXT|INT\.\/EXT|EXT\.\/INT|I\/E)[\.\s]/i.test(line)) {
                break;
            }
            
            // Check if it's a character name
            if (/^[A-Z\s]+(\(.*\))?$/.test(line) && line.length < 40) {
                const charName = line.replace(/\(.*\)/, '').trim();
                if (!cast.includes(charName) && charName) {
                    cast.push(charName);
                }
            }
            
            i++;
        }
        
        return cast;
    }
    
    function displayScenes(scenes) {
        sceneList.innerHTML = '';
        
        if (scenes.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.textContent = 'No scenes found';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.color = 'var(--muted-text-color)';
            emptyMsg.style.cursor = 'default';
            sceneList.appendChild(emptyMsg);
            return;
        }
        
        scenes.forEach((scene, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-scene-index', index);
            li.setAttribute('data-line-index', scene.lineIndex);
            
            const header = document.createElement('div');
            header.className = 'scene-item-header';
            
            const sceneNum = document.createElement('span');
            sceneNum.textContent = `Scene ${index + 1}`;
            
            const timeLabel = document.createElement('span');
            timeLabel.className = 'scene-time';
            timeLabel.textContent = scene.timeOfDay;
            
            header.appendChild(sceneNum);
            header.appendChild(timeLabel);
            
            const sceneText = document.createElement('div');
            sceneText.textContent = scene.text;
            sceneText.style.marginTop = '0.3rem';
            sceneText.style.fontSize = '0.85rem';
            
            li.appendChild(header);
            li.appendChild(sceneText);
            
            li.addEventListener('click', () => {
                jumpToLine(scene.lineIndex);
                closeSceneNavigator();
            });
            
            sceneList.appendChild(li);
        });
        
        initializeSortable();
    }
    
    function jumpToLine(lineIndex) {
        const lines = fountainInput.value.split('\n');
        let charPosition = 0;
        
        for (let i = 0; i < lineIndex; i++) {
            charPosition += lines[i].length + 1;
        }
        
        fountainInput.focus();
        fountainInput.setSelectionRange(charPosition, charPosition);
        fountainInput.scrollTop = fountainInput.scrollHeight * (lineIndex / lines.length);
        
        switchView('write');
    }
    
    // ========================================
    // SCENE REORDERING (Sortable.js)
    // ========================================
    function initializeSortable() {
        if (typeof Sortable !== 'undefined' && sceneList) {
            new Sortable(sceneList, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'dragging',
                handle: 'li',
                onEnd: function(evt) {
                    reorderScenes(evt.oldIndex, evt.newIndex);
                }
            });
        }
    }
    
    function reorderScenes(oldIndex, newIndex) {
        if (oldIndex === newIndex) return;
        
        const scenes = projectData.projectInfo.scenes;
        const movedScene = scenes[oldIndex];
        scenes.splice(oldIndex, 1);
        scenes.splice(newIndex, 0, movedScene);
        
        rebuildScriptFromScenes(scenes);
        showToast('Scene reordered');
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    function rebuildScriptFromScenes(scenes) {
        const lines = fountainInput.value.split('\n');
        const newLines = [];
        const sceneBlocks = [];
        
        scenes.forEach(scene => {
            let startLine = scene.lineIndex;
            let endLine = startLine;
            
            for (let i = startLine + 1; i < lines.length; i++) {
                if (/^(INT|EXT|INT\.\/EXT|EXT\.\/INT|I\/E)[\.\s]/i.test(lines[i].trim())) {
                    break;
                }
                endLine = i;
            }
            
            sceneBlocks.push(lines.slice(startLine, endLine + 1));
        });
        
        sceneBlocks.forEach((block, index) => {
            newLines.push(...block);
            if (index < sceneBlocks.length - 1) {
                newLines.push('');
            }
        });
        
        isUpdatingFromSync = true;
        fountainInput.value = newLines.join('\n');
        isUpdatingFromSync = false;
        
        updatePreview();
        extractAndDisplayScenes();
        syncCardsWithScript();
        saveToLocalStorage();
    }
    
    function exportSceneOrder() {
        const scenes = projectData.projectInfo.scenes;
        
        if (scenes.length === 0) {
            showToast('No scenes to export', 'error');
            return;
        }
        
        let csvContent = 'Scene Number,Scene Heading,Type,Setting,Time of Day,Characters\n';
        
        scenes.forEach((scene, index) => {
            const characters = scene.cast.join('; ');
            csvContent += `${index + 1},"${scene.text}","${scene.sceneType}","${scene.sceneSetting}","${scene.timeOfDay}","${characters}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.projectInfo.projectName}_scene_order.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Scene order exported');
    }
	
   // ========================================
   // CARD VIEW - ORIGINAL WORKING VERSION
   // ========================================

   // Enhanced Card View with Mobile Pagination
   function renderEnhancedCardView() {
       const cardContainer = document.getElementById('card-container');
       console.log('=== RENDERING CARD VIEW ===');
    
       if (!cardContainer) {
           console.error('Card container not found');
           return;
       }

       const scenes = projectData.projectInfo.scenes;
       console.log('Scenes to render:', scenes.length);
       const isMobile = window.innerWidth < 768;

       if (scenes.length === 0) {
           cardContainer.innerHTML = `
               <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--muted-text-color);">
                   <i class="fas fa-film" style="font-size: 4rem; margin-bottom: 2rem; opacity: 0.3;"></i>
                   <h3>No scenes found</h3>
                   <p>Write some scenes in the editor with INT. or EXT. headings</p>
                   <p style="font-size: 0.9rem; margin-top: 1rem;">Example: INT. OFFICE - DAY</p>
               </div>`;
           return;
       }

       let scenesToShow = scenes;
       if (isMobile) {
           const startIdx = currentPage * cardsPerPage;
           const endIdx = startIdx + cardsPerPage;
           scenesToShow = scenes.slice(startIdx, endIdx);
       }

       cardContainer.innerHTML = scenesToShow.map(scene => `
           <div class="scene-card card-for-export" data-scene-id="${scene.number}" data-scene-number="${scene.number}">
               <div class="scene-card-content">
                   <div class="card-header">
                       <div class="card-scene-title" contenteditable="true" data-placeholder="Enter scene heading...">${scene.heading}</div>
                       <input class="card-scene-number" type="text" value="${scene.number}" maxlength="4" data-scene-id="${scene.number}">
                   </div>
                   <div class="card-body">
                       <textarea class="card-description" placeholder="Enter scene description (action only)..." data-scene-id="${scene.number}">${scene.description.join('\n')}</textarea>
                   </div>
                   <div class="card-watermark">TO SCRIPT</div>
               </div>
               <div class="card-actions">
                   <button class="icon-btn share-card-btn" title="Share Scene" data-scene-id="${scene.number}">
                       <i class="fas fa-share-alt"></i>
                   </button>
                   <button class="icon-btn delete-card-btn" title="Delete Scene" data-scene-id="${scene.number}">
                       <i class="fas fa-trash"></i>
                   </button>
                   ${isMobile ? `<button class="icon-btn add-card-btn-mobile" title="Add New Scene" data-scene-id="${scene.number}">
                       <i class="fas fa-plus"></i>
                   </button>` : ''}
               </div>
           </div>
       `).join('');

       if (isMobile && scenes.length > cardsPerPage) {
           const totalPages = Math.ceil(scenes.length / cardsPerPage);
           let paginationHtml = '<div class="mobile-pagination">';
        
           for (let i = 0; i < totalPages; i++) {
               const startNum = i * cardsPerPage + 1;
               const endNum = Math.min((i + 1) * cardsPerPage, scenes.length);
               const isActive = i === currentPage;
               paginationHtml += `
                   <button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}">
                       ${startNum}-${endNum}
                   </button>
               `;
           }
        
           paginationHtml += '</div>';
           cardContainer.insertAdjacentHTML('beforeend', paginationHtml);
        
           document.querySelectorAll('.pagination-btn').forEach(btn => {
               btn.addEventListener('click', (e) => {
                   currentPage = parseInt(e.target.dataset.page);
                   renderEnhancedCardView();
                   bindCardEditingEvents();
                
                   if (cardHeader && currentView === 'card') {
                       cardHeader.style.display = 'flex';
                   }
                
                   if (window.innerWidth < 768) {
                       setTimeout(() => setupMobileCardActions(), 100);
                   }
               });
           });
       }

       console.log('Cards rendered successfully');
    
       if (cardHeader && currentView === 'card') {
           cardHeader.style.display = 'flex';
       }
    
       if (isMobile) {
           setTimeout(() => {
               setupMobileCardActions();
           }, 100);
       }
   }

   // Bind Card Editing Events
   function bindCardEditingEvents() {
       const cardContainer = document.getElementById('card-container');
       if (!cardContainer) return;

       cardContainer.removeEventListener('input', handleCardInput);
       cardContainer.removeEventListener('blur', handleCardBlur, true);
       cardContainer.removeEventListener('click', handleCardClick);

       cardContainer.addEventListener('input', handleCardInput);
       cardContainer.addEventListener('blur', handleCardBlur, true);
       cardContainer.addEventListener('click', handleCardClick);

       function handleCardInput(e) {
           if (e.target.classList.contains('card-scene-title') || 
               e.target.classList.contains('card-description') || 
               e.target.classList.contains('card-scene-number')) {
               clearTimeout(handleCardInput.timeout);
               handleCardInput.timeout = setTimeout(() => {
                   syncCardsToEditor();
               }, 800);
           }
       }

       function handleCardBlur(e) {
           if (e.target.classList.contains('card-scene-title') || 
               e.target.classList.contains('card-description') || 
               e.target.classList.contains('card-scene-number')) {
               syncCardsToEditor();
           }
       }

       function handleCardClick(e) {
           if (e.target.closest('.delete-card-btn')) {
               const sceneId = e.target.closest('.delete-card-btn').getAttribute('data-scene-id');
               const card = cardContainer.querySelector(`.scene-card[data-scene-id="${sceneId}"]`);
               if (card && confirm('Delete this scene card?')) {
                   card.remove();
                
                   const allScenes = projectData.projectInfo.scenes;
                   const sceneIndex = allScenes.findIndex(s => s.number == sceneId);
                   if (sceneIndex !== -1) {
                       allScenes.splice(sceneIndex, 1);
                       allScenes.forEach((scene, index) => {
                           scene.number = index + 1;
                       });
                       projectData.projectInfo.scenes = allScenes;
                   }
                
                   renderEnhancedCardView();
                   bindCardEditingEvents();
                
                   if (cardHeader && currentView === 'card') {
                       cardHeader.style.display = 'flex';
                   }
                
                   syncCardsToEditor();
               }
           } else if (e.target.closest('.share-card-btn')) {
               const sceneId = e.target.closest('.share-card-btn').getAttribute('data-scene-id');
               shareSceneCard(sceneId);
           } else if (e.target.closest('.add-card-btn-mobile')) {
               const sceneId = e.target.closest('.add-card-btn-mobile').getAttribute('data-scene-id');
               addNewSceneCard(sceneId);
           }
       }
   }

   // Sync Cards to Editor
   function syncCardsToEditor() {
       const cardContainer = document.getElementById('card-container');
       if (!cardContainer || !fountainInput) return;

       isUpdatingFromSync = true;
    
       let scriptText = '';
       const cards = Array.from(cardContainer.querySelectorAll('.scene-card'));
    
       cards.forEach((card, index) => {
           const titleElement = card.querySelector('.card-scene-title');
           const descriptionElement = card.querySelector('.card-description');
           let title = titleElement ? titleElement.textContent.trim() : '';
           let description = descriptionElement ? descriptionElement.value.trim() : '';

           if (title && !title.match(/(INT\.|EXT\.|INT\.\/EXT\.|EXT\.\/INT\.)/i)) {
               title = 'INT. ' + title.toUpperCase();
           } else {
               title = title.toUpperCase();
           }

           const numberElement = card.querySelector('.card-scene-number');
           if (numberElement) {
               numberElement.value = index + 1;
           }

           scriptText += title + '\n';
           if (description) {
               scriptText += description + '\n\n';
           }
       });

       const trimmedScript = scriptText.trim();
       if (trimmedScript !== fountainInput.value.trim() && trimmedScript !== '') {
           fountainInput.value = trimmedScript;
           fountainInput.classList.remove('placeholder');
           saveToLocalStorage();
       }
    
       setTimeout(() => { isUpdatingFromSync = false; }, 100);
   }
   
   // ========================================
   // MISSING CARD VIEW FUNCTIONS - ADD THESE
   // ========================================

   // Wrapper function for syncCardsToEditor
   function syncCardsWithScript() {
       renderEnhancedCardView();
       bindCardEditingEvents();
   }

   // Wrapper for addNewSceneCard
   function addNewCard() {
       addNewSceneCard(null);
   }

   // Share individual scene card
   function shareSceneCard(sceneId) {
       const scene = projectData.projectInfo.scenes.find(s => s.number == sceneId);
       if (!scene) return;
    
       const shareText = `Scene ${sceneId}: ${scene.heading}\n\n${scene.description.join('\n')}`;
    
       if (navigator.share) {
           navigator.share({
               title: `Scene ${sceneId}`,
               text: shareText
           }).then(() => {
               showToast('Card shared');
           }).catch(() => {
               navigator.clipboard.writeText(shareText).then(() => {
                   showToast('Card copied to clipboard');
               });
           });
       } else {
           navigator.clipboard.writeText(shareText).then(() => {
               showToast('Card copied to clipboard');
           });
       }
   }

   // Setup mobile card actions
   function setupMobileCardActions() {
       const cards = document.querySelectorAll('.scene-card');
       cards.forEach(card => {
           card.addEventListener('touchstart', () => {
               card.classList.add('active');
           });
        
           card.addEventListener('touchend', () => {
               setTimeout(() => {
                   card.classList.remove('active');
               }, 300);
           });
       });
   }
   

   // Add New Scene Card
   function addNewSceneCard(afterSceneId = null) {
       const cardContainer = document.getElementById('card-container');
       if (!cardContainer) return;

       const allScenes = projectData.projectInfo.scenes;
       const newSceneNumber = allScenes.length + 1;

       const newScene = {
           number: newSceneNumber,
           heading: 'INT. NEW SCENE - DAY',
           sceneType: 'INT.',
           location: 'NEW SCENE',
           timeOfDay: 'DAY',
           description: [],
           characters: [],
           fullText: 'INT. NEW SCENE - DAY\n'
       };
    
       if (afterSceneId) {
           const insertIndex = allScenes.findIndex(s => s.number == afterSceneId);
           if (insertIndex !== -1) {
               allScenes.splice(insertIndex + 1, 0, newScene);
               allScenes.forEach((scene, index) => {
                   scene.number = index + 1;
               });
           } else {
               allScenes.push(newScene);
           }
       } else {
           allScenes.push(newScene);
       }
    
       projectData.projectInfo.scenes = allScenes;
    
       renderEnhancedCardView();
       bindCardEditingEvents();
    
       if (cardHeader && currentView === 'card') {
           cardHeader.style.display = 'flex';
       }
    
       setTimeout(() => {
           const newCard = cardContainer.querySelector(`.scene-card[data-scene-number="${newSceneNumber}"]`);
           if (newCard) {
               newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
               const titleElement = newCard.querySelector('.card-scene-title');
               if (titleElement) titleElement.focus();
           }
       }, 100);

       syncCardsToEditor();
   }
   
    // ========================================
    // SAVE ALL CARDS AS PDF (Optimized for Mobile)
    // ========================================
    function saveAllCardsAsImages() {
        const cards = Array.from(document.querySelectorAll('.scene-card'));
        
        if (cards.length === 0) {
            showToast('No cards to save', 'error');
            return;
        }
        
        showToast('Preparing cards for export...');
        
        // Show watermarks for export
        cards.forEach(card => {
            const watermark = card.querySelector('.card-watermark');
            if (watermark) {
                watermark.style.opacity = '0.3';
                watermark.style.visibility = 'visible';
            }
        });
        
        // Use different method based on device
        if (isMobileDevice()) {
            saveCardsAsImagesCanvas(cards);
        } else {
            saveCardsAsImagesPDF(cards);
        }
    }
    
    async function saveCardsAsImagesCanvas(cards) {
        try {
            const zip = new JSZip();
            const cardsPerFile = 18; // 6 pages x 3 cards per page
            let fileIndex = 1;
            
            for (let i = 0; i < cards.length; i += cardsPerFile) {
                const batch = cards.slice(i, i + cardsPerFile);
                
                for (let j = 0; j < batch.length; j++) {
                    const card = batch[j];
                    const blob = await generateSimpleCardBlob(card);
                    const cardNumber = i + j + 1;
                    zip.file(`scene_card_${cardNumber}.png`, blob);
                }
                
                showToast(`Processing ${Math.min(i + cardsPerFile, cards.length)}/${cards.length} cards...`);
            }
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectData.projectInfo.projectName}_scene_cards.zip`;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast('Cards exported successfully!');
            
            // Hide watermarks after export
            cards.forEach(card => {
                const watermark = card.querySelector('.card-watermark');
                if (watermark) {
                    watermark.style.opacity = '0';
                    watermark.style.visibility = 'hidden';
                }
            });
            
        } catch (error) {
            console.error('Export error:', error);
            showToast('Export failed', 'error');
        }
    }
    
    async function generateSimpleCardBlob(card) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = 2;
        
        canvas.width = 600 * scale;
        canvas.height = 1000 * scale;
        
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(10 * scale, 10 * scale, (canvas.width - 20 * scale), (canvas.height - 20 * scale));
        
        ctx.fillStyle = '#f3f4f6';
        ctx.font = `bold ${28 * scale}px "Courier New", monospace`;
        
        const title = card.querySelector('.card-scene-title');
        const description = card.querySelector('.card-description');
        const sceneNumber = card.querySelector('.card-scene-number');
        
        const titleText = title ? title.textContent : 'Scene';
        const descText = description ? description.value : '';
        const numText = sceneNumber ? sceneNumber.value : '1';
        
        ctx.fillText(numText, 30 * scale, 50 * scale);
        
        const titleWords = titleText.split(' ');
        let line = '';
        let y = 100 * scale;
        
        titleWords.forEach(word => {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > (canvas.width - 60 * scale)) {
                ctx.fillText(line, 30 * scale, y);
                line = word + ' ';
                y += 40 * scale;
            } else {
                line = testLine;
            }
        });
        ctx.fillText(line, 30 * scale, y);
        
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(30 * scale, (y + 20 * scale));
        ctx.lineTo((canvas.width - 30 * scale), (y + 20 * scale));
        ctx.stroke();
        
        ctx.font = `${22 * scale}px "Courier New", monospace`;
        const descLines = descText.split('\n');
        y += 60 * scale;
        
        descLines.forEach(descLine => {
            const words = descLine.split(' ');
            let descLineText = '';
            
            words.forEach(word => {
                const testLine = descLineText + word + ' ';
                if (ctx.measureText(testLine).width > (canvas.width - 60 * scale)) {
                    ctx.fillText(descLineText, 30 * scale, y);
                    descLineText = word + ' ';
                    y += 32 * scale;
                } else {
                    descLineText = testLine;
                }
            });
            
            if (descLineText) {
                ctx.fillText(descLineText, 30 * scale, y);
                y += 32 * scale;
            }
        });
        
        ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
        ctx.font = `${16 * scale}px "Inter", sans-serif`;
        ctx.fillText('ToscripT', 30 * scale, (canvas.height - 20 * scale));
        
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });
    }
    
    async function saveCardsAsImagesPDF(cards) {
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            showToast('PDF library not loaded', 'error');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'in', 'letter');
            
            const cardWidth = 3;
            const cardHeight = 5;
            const cardsPerRow = 2;
            const cardsPerColumn = 2;
            const marginLeft = 1;
            const marginTop = 0.5;
            const spacing = 0.5;
            
            let cardIndex = 0;
            
            for (const card of cards) {
                const canvas = await html2canvas(card, {
                    scale: 2,
                    backgroundColor: '#1f2937',
                    logging: false
                });
                
                const imgData = canvas.toDataURL('image/png');
                
                const row = Math.floor((cardIndex % (cardsPerRow * cardsPerColumn)) / cardsPerRow);
                const col = cardIndex % cardsPerRow;
                
                const x = marginLeft + col * (cardWidth + spacing);
                const y = marginTop + row * (cardHeight + spacing);
                
                pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
                
                cardIndex++;
                
                if (cardIndex % (cardsPerRow * cardsPerColumn) === 0 && cardIndex < cards.length) {
                    pdf.addPage();
                }
                
                showToast(`Processing ${cardIndex}/${cards.length} cards...`);
            }
            
            pdf.save(`${projectData.projectInfo.projectName}_scene_cards.pdf`);
            showToast('Cards exported as PDF!');
            
            // Hide watermarks
            cards.forEach(card => {
                const watermark = card.querySelector('.card-watermark');
                if (watermark) {
                    watermark.style.opacity = '0';
                    watermark.style.visibility = 'hidden';
                }
            });
            
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('PDF export failed', 'error');
        }
    }
	
    // ========================================
    // FILE OPERATIONS - SAVE AS
    // ========================================
    function saveFountainFile() {
        if (isPlaceholder) {
            showToast('Cannot save placeholder text', 'error');
            return;
        }
        
        const content = fountainInput.value;
        const filename = `${projectData.projectInfo.projectName}.fountain`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Fountain file saved');
        closeMenu();
    }
    
    function savePdfEnglish() {
        if (typeof jspdf === 'undefined') {
            showToast('PDF library not loaded', 'error');
            return;
        }
        
        if (isPlaceholder) {
            showToast('Cannot save placeholder text', 'error');
            return;
        }
        
        showToast('Generating PDF...');
        
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'in', 'letter');
            
            pdf.setFont('courier');
            pdf.setFontSize(12);
            
            const lines = fountainInput.value.split('\n');
            const pageHeight = 11;
            const marginTop = 1;
            const marginLeft = 1.5;
            const lineHeight = 0.17;
            let y = marginTop;
            
            lines.forEach(line => {
                const trimmed = line.trim();
                
                if (y > pageHeight - 1) {
                    pdf.addPage();
                    y = marginTop;
                }
                
                if (trimmed === '') {
                    y += lineHeight;
                    return;
                }
                
                const element = classifyLine(line, trimmed, 0, lines);
                
                if (element.className === 'scene-heading') {
                    pdf.setFont('courier', 'bold');
                    pdf.text(trimmed.toUpperCase(), marginLeft, y);
                    y += lineHeight * 2;
                } else if (element.className === 'character') {
                    pdf.setFont('courier', 'normal');
                    pdf.text(trimmed, marginLeft + 2.37, y);
                    y += lineHeight;
                } else if (element.className === 'dialogue') {
                    pdf.setFont('courier', 'normal');
                    const dialogueLines = pdf.splitTextToSize(trimmed, 3.5);
                    dialogueLines.forEach(dialogueLine => {
                        if (y > pageHeight - 1) {
                            pdf.addPage();
                            y = marginTop;
                        }
                        pdf.text(dialogueLine, marginLeft + 1.5, y);
                        y += lineHeight;
                    });
                } else if (element.className === 'parenthetical') {
                    pdf.setFont('courier', 'normal');
                    pdf.text(trimmed, marginLeft + 1.8, y);
                    y += lineHeight;
                } else if (element.className === 'transition') {
                    pdf.setFont('courier', 'bold');
                    const transWidth = pdf.getTextWidth(trimmed);
                    pdf.text(trimmed, 8.5 - 1 - transWidth, y);
                    y += lineHeight * 2;
                } else {
                    pdf.setFont('courier', 'normal');
                    const actionLines = pdf.splitTextToSize(trimmed, 6);
                    actionLines.forEach(actionLine => {
                        if (y > pageHeight - 1) {
                            pdf.addPage();
                            y = marginTop;
                        }
                        pdf.text(actionLine, marginLeft, y);
                        y += lineHeight;
                    });
                    y += lineHeight;
                }
            });
            
            pdf.save(`${projectData.projectInfo.projectName}.pdf`);
            showToast('PDF saved successfully!');
            closeMenu();
            
        } catch (error) {
            console.error('PDF generation error:', error);
            showToast('PDF generation failed', 'error');
        }
    }
    
    function savePdfUnicode() {
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            showToast('PDF library not loaded', 'error');
            return;
        }
        
        if (isPlaceholder) {
            showToast('Cannot save placeholder text', 'error');
            return;
        }
        
        showToast('Generating Unicode PDF (this may take a moment)...');
        
        setTimeout(async () => {
            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'in', 'letter');
                
                const canvas = await html2canvas(screenplayOutput, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 8.5;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                let heightLeft = imgHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= 11;
                
                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= 11;
                }
                
                pdf.save(`${projectData.projectInfo.projectName}_unicode.pdf`);
                showToast('Unicode PDF saved successfully!');
                closeMenu();
                
            } catch (error) {
                console.error('Unicode PDF error:', error);
                showToast('Unicode PDF generation failed', 'error');
            }
        }, 100);
    }
    
    function saveFilmproj() {
        if (isPlaceholder) {
            showToast('Cannot save placeholder text', 'error');
            return;
        }
        
        const filmprojData = {
            version: '1.0',
            projectName: projectData.projectInfo.projectName,
            author: projectData.projectInfo.prodName,
            created: new Date().toISOString(),
            script: fountainInput.value,
            scenes: projectData.projectInfo.scenes.map(scene => ({
                sceneNumber: scene.text,
                location: scene.sceneSetting,
                intExt: scene.sceneType,
                dayNight: scene.timeOfDay,
                description: scene.description || '',
                cast: scene.cast,
                props: [],
                wardrobe: [],
                specialFX: [],
                notes: ''
            }))
        };
        
        const content = JSON.stringify(filmprojData, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.projectInfo.projectName}.filmproj`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('.filmproj file saved');
        closeMenu();
    }
    
    // ========================================
    // FILE OPERATIONS - OPEN
    // ========================================
    function openProject() {
        fileInput.click();
    }
    
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const content = event.target.result;
                
                if (file.name.endsWith('.fountain') || file.name.endsWith('.txt')) {
                    fountainInput.value = content;
                    isPlaceholder = false;
                    fountainInput.classList.remove('placeholder');
                    
                    projectData.projectInfo.projectName = file.name.replace(/\.(fountain|txt)$/, '');
                    
                } else if (file.name.endsWith('.filmproj')) {
                    const filmprojData = JSON.parse(content);
                    
                    projectData.projectInfo.projectName = filmprojData.projectName || 'Untitled';
                    projectData.projectInfo.prodName = filmprojData.author || 'Author';
                    
                    fountainInput.value = filmprojData.script || '';
                    isPlaceholder = false;
                    fountainInput.classList.remove('placeholder');
                    
                    if (filmprojData.scenes) {
                        projectData.projectInfo.scenes = filmprojData.scenes.map(scene => ({
                            text: scene.sceneNumber || '',
                            sceneType: scene.intExt || 'INT.',
                            sceneSetting: scene.location || '',
                            timeOfDay: scene.dayNight || 'DAY',
                            description: scene.description || '',
                            cast: scene.cast || [],
                            lineIndex: 0
                        }));
                    }
                }
                
                updatePreview();
                extractAndDisplayScenes();
                syncCardsWithScript();
                saveToLocalStorage();
                
                showToast(`Opened: ${file.name}`);
                closeMenu();
                
            } catch (error) {
                console.error('File open error:', error);
                showToast('Failed to open file', 'error');
            }
        };
        
        reader.readAsText(file);
        fileInput.value = '';
    }
    
    // ========================================
    // PROJECT MANAGEMENT
    // ========================================
    function newProject() {
        if (!isPlaceholder && fountainInput.value.trim()) {
            if (!confirm('Start a new project? Current work will be cleared (unless saved).')) {
                return;
            }
        }
        
        projectData = {
            projectInfo: {
                projectName: 'Untitled',
                prodName: 'Author',
                scriptContent: '',
                scenes: []
            }
        };
        
        fountainInput.value = placeholderText;
        fountainInput.classList.add('placeholder');
        isPlaceholder = true;
        
        clearLocalStorage();
        updatePreview();
        extractAndDisplayScenes();
        cardContainer.innerHTML = '';
        
        undoStack = [];
        redoStack = [];
        updateUndoRedoButtons();
        
        showToast('New project started');
        closeMenu();
    }
    
    function clearProject() {
        if (!confirm('Clear the entire project? This cannot be undone.')) {
            return;
        }
        
        projectData = {
            projectInfo: {
                projectName: 'Untitled',
                prodName: 'Author',
                scriptContent: '',
                scenes: []
            }
        };
        
        fountainInput.value = placeholderText;
        fountainInput.classList.add('placeholder');
        isPlaceholder = true;
        
        clearLocalStorage();
        updatePreview();
        extractAndDisplayScenes();
        cardContainer.innerHTML = '';
        
        undoStack = [];
        redoStack = [];
        updateUndoRedoButtons();
        
        showToast('Project cleared');
        closeMenu();
    }
    
    function shareScript() {
        if (isPlaceholder) {
            showToast('Cannot share placeholder text', 'error');
            return;
        }
        
        const shareText = fountainInput.value;
        
        if (navigator.share) {
            navigator.share({
                title: projectData.projectInfo.projectName,
                text: shareText
            }).then(() => {
                showToast('Script shared');
            }).catch((err) => {
                console.log('Share cancelled or failed:', err);
                fallbackShare(shareText);
            });
        } else {
            fallbackShare(shareText);
        }
        
        closeMenu();
    }
    
    function fallbackShare(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Script copied to clipboard');
        }).catch(() => {
            showToast('Failed to copy script', 'error');
        });
    }
	
    // ========================================
    // MODALS
    // ========================================
    function openInfoModal() {
        infoModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Info & Help</h2>
                    <button class="icon-btn" onclick="this.closest('.modal').classList.remove('open')">&times;</button>
                </div>
                <div class="modal-body">
                    <h3>Getting Started</h3>
                    <p>ToscripT uses the <strong>Fountain</strong> screenplay format. It's a simple, plain-text format that automatically converts to professional screenplay formatting.</p>
                    
                    <h3>Basic Fountain Syntax</h3>
                    <ul>
                        <li><strong>Scene Headings:</strong> Start with INT. or EXT.<br>
                        <code>INT. COFFEE SHOP - DAY</code></li>
                        
                        <li><strong>Character Names:</strong> All caps on their own line<br>
                        <code>ALEX</code></li>
                        
                        <li><strong>Dialogue:</strong> Text below character name<br>
                        <code>This is dialogue.</code></li>
                        
                        <li><strong>Parentheticals:</strong> Wrapped in parentheses<br>
                        <code>(whispering)</code></li>
                        
                        <li><strong>Action:</strong> Regular text (not all caps)<br>
                        <code>Alex walks into the room.</code></li>
                        
                        <li><strong>Transitions:</strong> All caps ending with TO:<br>
                        <code>CUT TO:</code> or <code>FADE OUT.</code></li>
                    </ul>
                    
                    <h3>Keyboard Shortcuts</h3>
                    <ul>
                        <li><strong>Ctrl/Cmd + S:</strong> Save Project</li>
                        <li><strong>Ctrl/Cmd + Z:</strong> Undo</li>
                        <li><strong>Ctrl/Cmd + Shift + Z:</strong> Redo</li>
                        <li><strong>Ctrl/Cmd + P:</strong> Preview Script</li>
                        <li><strong>Ctrl/Cmd + K:</strong> Card View</li>
                        <li><strong>Ctrl/Cmd + E:</strong> Write View</li>
                        <li><strong>F11:</strong> Fullscreen</li>
                        <li><strong>Escape:</strong> Exit Focus Mode / Close Panels</li>
                    </ul>
                    
                    <h3>Toolbar Buttons</h3>
                    <ul>
                        <li><strong>I/E:</strong> Cycle INT./EXT. scene headings</li>
                        <li><strong>D/N:</strong> Cycle DAY/NIGHT time of day</li>
                        <li><strong>Aa:</strong> Toggle UPPERCASE/lowercase</li>
                        <li><strong>():</strong> Add/remove parentheses</li>
                        <li><strong>TO:</strong> Cycle transitions (CUT TO:, FADE TO:, etc.)</li>
                    </ul>
                    
                    <h3>Focus Mode</h3>
                    <p>Enter fullscreen mode, then click the <strong>Focus</strong> button to hide all UI elements except the essential writing toolbar. Perfect for distraction-free writing!</p>
                    
                    <h3>Card View</h3>
                    <p>Visualize your screenplay as index cards. Drag and drop to reorder scenes, add notes, and export cards as printable PDFs.</p>
                    
                    <h3>Cloud Storage</h3>
                    <p>Save your scripts to Google Drive or Dropbox for backup and sync across devices. Enable auto-sync for automatic backups every 5 minutes.</p>
                    
                    <h3>Export Options</h3>
                    <ul>
                        <li><strong>.fountain:</strong> Plain text format (editable)</li>
                        <li><strong>.pdf (Selectable):</strong> Standard PDF with selectable text</li>
                        <li><strong>.pdf (Unicode):</strong> Image-based PDF for non-English scripts</li>
                        <li><strong>.filmproj:</strong> For use with production planning apps</li>
                    </ul>
                    
                    <h3>Tips</h3>
                    <ul>
                        <li>Use auto-save to prevent losing your work</li>
                        <li>Enable scene numbers for easier navigation</li>
                        <li>Use the Scene Navigator to filter and jump to scenes</li>
                        <li>Export scene order as CSV for production scheduling</li>
                        <li>Share individual scene cards for collaboration</li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button class="main-action-btn" onclick="this.closest('.modal').classList.remove('open')">Got It</button>
                </div>
            </div>
        `;
        
        infoModal.classList.add('open');
        closeMenu();
    }
    
    function openAboutModal() {
        aboutModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>About ToscripT</h2>
                    <button class="icon-btn" onclick="this.closest('.modal').classList.remove('open')">&times;</button>
                </div>
                <div class="modal-body">
                    <h3>ToscripT Professional</h3>
                    <p><strong>Version:</strong> 2.0 (Android Optimized)</p>
                    <p><strong>Release Date:</strong> October 2025</p>
                    
                    <h3>About</h3>
                    <p>ToscripT is a professional screenwriting application designed for mobile and tablet devices. It uses the industry-standard Fountain format to create properly formatted screenplays.</p>
                    
                    <h3>Features</h3>
                    <ul>
                        <li>✅ Fountain format support</li>
                        <li>✅ Industry-standard screenplay formatting</li>
                        <li>✅ Real-time preview</li>
                        <li>✅ Scene card visualization</li>
                        <li>✅ Drag & drop scene reordering</li>
                        <li>✅ Multiple export formats (Fountain, PDF, .filmproj)</li>
                        <li>✅ Cloud storage integration (Google Drive, Dropbox)</li>
                        <li>✅ Auto-save & local storage</li>
                        <li>✅ Focus mode for distraction-free writing</li>
                        <li>✅ Mobile keyboard toolbar</li>
                        <li>✅ Scene filtering & navigation</li>
                        <li>✅ Undo/Redo support</li>
                        <li>✅ Share & collaboration features</li>
                    </ul>
                    
                    <h3>Technology</h3>
                    <p>Built with modern web technologies for fast, responsive performance on all devices:</p>
                    <ul>
                        <li>Fountain.js - Screenplay parser</li>
                        <li>jsPDF - PDF generation</li>
                        <li>html2canvas - Image rendering</li>
                        <li>Sortable.js - Drag & drop</li>
                        <li>Google Drive API - Cloud storage</li>
                        <li>Dropbox API - Cloud storage</li>
                    </ul>
                    
                    <h3>Privacy</h3>
                    <p>Your scripts are stored locally on your device. Cloud storage is optional and uses secure OAuth authentication. We never have access to your content.</p>
                    
                    <h3>Support</h3>
                    <p>For support, feature requests, or bug reports, please visit our website or contact support.</p>
                    
                    <h3>Credits</h3>
                    <p>Developed with ❤️ for screenwriters everywhere.</p>
                    <p><strong>Special Thanks:</strong> The Fountain community, open-source contributors, and all the writers who shared feedback.</p>
                    
                    <p style="text-align: center; margin-top: 2rem; color: var(--muted-text-color);">
                        <small>© 2025 ToscripT. All rights reserved.</small>
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="main-action-btn" onclick="this.closest('.modal').classList.remove('open')">Close</button>
                </div>
            </div>
        `;
        
        aboutModal.classList.add('open');
        closeMenu();
    }
    
    function openTitlePageModal() {
        const currentTitle = projectData.projectInfo.projectName || 'Untitled';
        const currentAuthor = projectData.projectInfo.prodName || 'Author';
        
        titlePageModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Title Page</h2>
                    <button class="icon-btn" onclick="this.closest('.modal').classList.remove('open')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="title-input">Title</label>
                        <input type="text" id="title-input" value="${currentTitle}" placeholder="Enter script title">
                    </div>
                    <div class="form-group">
                        <label for="author-input">Written By</label>
                        <input type="text" id="author-input" value="${currentAuthor}" placeholder="Enter author name">
                    </div>
                    <div class="form-group">
                        <label for="contact-input">Contact (Optional)</label>
                        <input type="text" id="contact-input" placeholder="Email or phone">
                    </div>
                    <div class="form-group">
                        <label for="draft-input">Draft (Optional)</label>
                        <input type="text" id="draft-input" placeholder="e.g., First Draft, Revision 2">
                    </div>
                    <p style="color: var(--muted-text-color); font-size: 0.9rem; margin-top: 1rem;">
                        Note: Title page information will be included in PDF exports.
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="main-action-btn secondary" onclick="this.closest('.modal').classList.remove('open')">Cancel</button>
                    <button class="main-action-btn" onclick="saveTitlePage()">Save</button>
                </div>
            </div>
        `;
        
        titlePageModal.classList.add('open');
        closeMenu();
    }
    
    function saveTitlePage() {
        const titleInput = document.getElementById('title-input');
        const authorInput = document.getElementById('author-input');
        
        if (titleInput) {
            projectData.projectInfo.projectName = titleInput.value || 'Untitled';
        }
        
        if (authorInput) {
            projectData.projectInfo.prodName = authorInput.value || 'Author';
        }
        
        saveToLocalStorage();
        titlePageModal.classList.remove('open');
        showToast('Title page updated');
    }
    
    function openProjectInfoModal() {
        const currentTitle = projectData.projectInfo.projectName || 'Untitled';
        const currentAuthor = projectData.projectInfo.prodName || 'Author';
        const sceneCount = projectData.projectInfo.scenes.length;
        const wordCount = fountainInput.value.split(/\s+/).filter(word => word.length > 0).length;
        const pageCount = Math.ceil(sceneCount / 8) || 1;
        
        projectInfoModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Project Info</h2>
                    <button class="icon-btn" onclick="this.closest('.modal').classList.remove('open')">&times;</button>
                </div>
                <div class="modal-body">
                    <h3>Project Details</h3>
                    <div class="form-group">
                        <label>Project Name</label>
                        <p><strong>${currentTitle}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>Author</label>
                        <p><strong>${currentAuthor}</strong></p>
                    </div>
                    
                    <h3 style="margin-top: 1.5rem;">Statistics</h3>
                    <div class="form-group">
                        <label>Total Scenes</label>
                        <p><strong>${sceneCount}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>Word Count</label>
                        <p><strong>${wordCount.toLocaleString()}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>Estimated Pages</label>
                        <p><strong>${pageCount}</strong></p>
                    </div>
                    
                    <h3 style="margin-top: 1.5rem;">Scene Breakdown</h3>
                    <div class="form-group">
                        <label>Interior Scenes</label>
                        <p><strong>${projectData.projectInfo.scenes.filter(s => s.sceneType.includes('INT')).length}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>Exterior Scenes</label>
                        <p><strong>${projectData.projectInfo.scenes.filter(s => s.sceneType.includes('EXT')).length}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>Day Scenes</label>
                        <p><strong>${projectData.projectInfo.scenes.filter(s => s.timeOfDay.includes('DAY')).length}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>Night Scenes</label>
                        <p><strong>${projectData.projectInfo.scenes.filter(s => s.timeOfDay.includes('NIGHT')).length}</strong></p>
                    </div>
                    
                    <p style="color: var(--muted-text-color); font-size: 0.9rem; margin-top: 1.5rem;">
                        Last saved: ${new Date().toLocaleString()}
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="main-action-btn" onclick="this.closest('.modal').classList.remove('open')">Close</button>
                </div>
            </div>
        `;
        
        projectInfoModal.classList.add('open');
        closeMenu();
    }
    
    // ========================================
    // SCENE FILTERING
    // ========================================
    function handleFilterCategoryChange() {
        const category = filterCategorySelect.value;
        
        if (category === 'all') {
            filterValueInput.style.display = 'none';
            filterHelpText.style.display = 'none';
            displayScenes(projectData.projectInfo.scenes);
        } else {
            filterValueInput.style.display = 'block';
            filterHelpText.style.display = 'block';
            filterValueInput.value = '';
            filterValueInput.focus();
        }
    }
    
    function handleFilterValueInput() {
        const category = filterCategorySelect.value;
        const filterValue = filterValueInput.value.toLowerCase().trim();
        
        if (!filterValue) {
            displayScenes(projectData.projectInfo.scenes);
            return;
        }
        
        const filtered = projectData.projectInfo.scenes.filter(scene => {
            switch(category) {
                case 'sceneSetting':
                    return scene.sceneSetting.toLowerCase().includes(filterValue);
                case 'sceneType':
                    return scene.sceneType.toLowerCase().includes(filterValue);
                case 'cast':
                    return scene.cast.some(char => char.toLowerCase().includes(filterValue));
                case 'timeOfDay':
                    return scene.timeOfDay.toLowerCase().includes(filterValue);
                default:
                    return true;
            }
        });
        
        displayScenes(filtered);
    }
	
    // ========================================
    // GOOGLE DRIVE INTEGRATION
    // ========================================
    const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
    const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
    const GOOGLE_DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
    const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file';
    
    function initializeGoogleDrive() {
        if (typeof gapi === 'undefined') {
            console.log('Google API not loaded');
            return;
        }
        
        gapi.load('client:auth2', initGoogleClient);
    }
    
    function initGoogleClient() {
        gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: GOOGLE_CLIENT_ID,
            discoveryDocs: GOOGLE_DISCOVERY_DOCS,
            scope: GOOGLE_SCOPES
        }).then(() => {
            gapiInited = true;
            
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            
            console.log('Google Drive initialized');
        }).catch(error => {
            console.error('Google Drive init error:', error);
        });
    }
    
    function updateSigninStatus(signedIn) {
        isSignedIn = signedIn;
        
        if (signedIn) {
            console.log('Signed in to Google Drive');
        } else {
            console.log('Not signed in to Google Drive');
        }
    }
    
    function saveToGoogleDrive() {
        if (!gapiInited) {
            showToast('Google Drive not initialized', 'error');
            return;
        }
        
        if (isPlaceholder) {
            showToast('Cannot save placeholder text', 'error');
            return;
        }
        
        const authInstance = gapi.auth2.getAuthInstance();
        
        if (!authInstance.isSignedIn.get()) {
            authInstance.signIn().then(() => {
                uploadToGoogleDrive();
            }).catch(error => {
                console.error('Google Sign-in error:', error);
                showToast('Google Sign-in failed', 'error');
            });
        } else {
            uploadToGoogleDrive();
        }
        
        closeMenu();
    }
    
    function uploadToGoogleDrive() {
        showToast('Uploading to Google Drive...');
        
        const content = fountainInput.value;
        const filename = `${projectData.projectInfo.projectName}.fountain`;
        
        const file = new Blob([content], { type: 'text/plain' });
        const metadata = {
            name: filename,
            mimeType: 'text/plain'
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);
        
        fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
            body: form
        }).then(response => response.json()).then(data => {
            console.log('Google Drive upload success:', data);
            showToast('Saved to Google Drive!');
        }).catch(error => {
            console.error('Google Drive upload error:', error);
            showToast('Failed to save to Google Drive', 'error');
        });
    }
    
    function openFromGoogleDrive() {
        if (!gapiInited) {
            showToast('Google Drive not initialized', 'error');
            return;
        }
        
        const authInstance = gapi.auth2.getAuthInstance();
        
        if (!authInstance.isSignedIn.get()) {
            authInstance.signIn().then(() => {
                pickFromGoogleDrive();
            }).catch(error => {
                console.error('Google Sign-in error:', error);
                showToast('Google Sign-in failed', 'error');
            });
        } else {
            pickFromGoogleDrive();
        }
        
        closeMenu();
    }
    
    function pickFromGoogleDrive() {
        showToast('Opening Google Drive picker...');
        
        gapi.client.drive.files.list({
            pageSize: 10,
            fields: 'files(id, name)',
            q: "mimeType='text/plain' and name contains '.fountain'"
        }).then(response => {
            const files = response.result.files;
            
            if (files && files.length > 0) {
                showGoogleDriveFilePicker(files);
            } else {
                showToast('No Fountain files found in Google Drive', 'error');
            }
        }).catch(error => {
            console.error('Google Drive list error:', error);
            showToast('Failed to list files', 'error');
        });
    }
    
    function showGoogleDriveFilePicker(files) {
        let pickerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Open from Google Drive</h2>
                    <button class="icon-btn" onclick="this.closest('.modal').classList.remove('open')">&times;</button>
                </div>
                <div class="modal-body">
                    <h3>Select a file to open:</h3>
                    <ul style="list-style: none; padding: 0;">
        `;
        
        files.forEach(file => {
            pickerHTML += `
                <li style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 0.5rem; cursor: pointer;"
                    onclick="downloadFromGoogleDrive('${file.id}', '${file.name}')">
                    <i class="fas fa-file-alt" style="margin-right: 0.5rem;"></i>
                    ${file.name}
                </li>
            `;
        });
        
        pickerHTML += `
                    </ul>
                </div>
                <div class="modal-footer">
                    <button class="main-action-btn" onclick="this.closest('.modal').classList.remove('open')">Cancel</button>
                </div>
            </div>
        `;
        
        const modal = document.getElementById('cloud-sync-modal');
        modal.innerHTML = pickerHTML;
        modal.classList.add('open');
    }
    
    function downloadFromGoogleDrive(fileId, fileName) {
        showToast('Downloading from Google Drive...');
        
        gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        }).then(response => {
            fountainInput.value = response.body;
            isPlaceholder = false;
            fountainInput.classList.remove('placeholder');
            
            projectData.projectInfo.projectName = fileName.replace('.fountain', '');
            
            updatePreview();
            extractAndDisplayScenes();
            syncCardsWithScript();
            saveToLocalStorage();
            
            showToast(`Opened: ${fileName}`);
            
            const modal = document.getElementById('cloud-sync-modal');
            modal.classList.remove('open');
            
        }).catch(error => {
            console.error('Google Drive download error:', error);
            showToast('Failed to download file', 'error');
        });
    }
    
    // ========================================
    // DROPBOX INTEGRATION
    // ========================================
    function saveToDropbox() {
        if (typeof Dropbox === 'undefined') {
            showToast('Dropbox not initialized', 'error');
            return;
        }
        
        if (isPlaceholder) {
            showToast('Cannot save placeholder text', 'error');
            return;
        }
        
        showToast('Opening Dropbox...');
        
        const content = fountainInput.value;
        const filename = `${projectData.projectInfo.projectName}.fountain`;
        
        Dropbox.save({
            files: [{
                url: URL.createObjectURL(new Blob([content], { type: 'text/plain' })),
                filename: filename
            }],
            success: function() {
                showToast('Saved to Dropbox!');
            },
            error: function(error) {
                console.error('Dropbox save error:', error);
                showToast('Failed to save to Dropbox', 'error');
            }
        });
        
        closeMenu();
    }
    
    function openFromDropbox() {
        if (typeof Dropbox === 'undefined') {
            showToast('Dropbox not initialized', 'error');
            return;
        }
        
        showToast('Opening Dropbox chooser...');
        
        Dropbox.choose({
            extensions: ['.fountain', '.txt'],
            multiselect: false,
            success: function(files) {
                if (files && files.length > 0) {
                    const file = files[0];
                    
                    fetch(file.link).then(response => response.text()).then(content => {
                        fountainInput.value = content;
                        isPlaceholder = false;
                        fountainInput.classList.remove('placeholder');
                        
                        projectData.projectInfo.projectName = file.name.replace(/\.(fountain|txt)$/, '');
                        
                        updatePreview();
                        extractAndDisplayScenes();
                        syncCardsWithScript();
                        saveToLocalStorage();
                        
                        showToast(`Opened: ${file.name}`);
                    }).catch(error => {
                        console.error('Dropbox download error:', error);
                        showToast('Failed to download file', 'error');
                    });
                }
            },
            cancel: function() {
                console.log('Dropbox chooser cancelled');
            },
            error: function(error) {
                console.error('Dropbox chooser error:', error);
                showToast('Failed to open Dropbox chooser', 'error');
            }
        });
        
        closeMenu();
    }
    
    // ========================================
    // AUTO-SYNC SETTINGS MODAL
    // ========================================
    function openCloudSyncModal() {
        const syncStatus = autoSyncEnabled ? 'Enabled' : 'Disabled';
        
        cloudSyncModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Cloud Auto-Sync</h2>
                    <button class="icon-btn" onclick="this.closest('.modal').classList.remove('open')">&times;</button>
                </div>
                <div class="modal-body">
                    <h3>Auto-Sync Settings</h3>
                    <p>Automatically backup your script to cloud storage every 5 minutes when connected to WiFi.</p>
                    
                    <div class="form-group">
                        <label>Current Status</label>
                        <p><strong>${syncStatus}</strong></p>
                    </div>
                    
                    <div class="form-group">
                        <label for="sync-provider-select">Cloud Provider</label>
                        <select id="sync-provider-select">
                            <option value="none">None</option>
                            <option value="google-drive">Google Drive</option>
                            <option value="dropbox">Dropbox</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="sync-interval-select">Sync Interval</label>
                        <select id="sync-interval-select">
                            <option value="300000">5 minutes</option>
                            <option value="600000">10 minutes</option>
                            <option value="900000">15 minutes</option>
                            <option value="1800000">30 minutes</option>
                        </select>
                    </div>
                    
                    <p style="color: var(--warning-color); font-size: 0.9rem; margin-top: 1rem;">
                        ⚠️ Note: Auto-sync requires you to be signed in to your chosen cloud provider and may consume mobile data if not on WiFi.
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="main-action-btn secondary" onclick="this.closest('.modal').classList.remove('open')">Cancel</button>
                    <button class="main-action-btn" onclick="toggleAutoSync()">
                        ${autoSyncEnabled ? 'Disable' : 'Enable'} Auto-Sync
                    </button>
                </div>
            </div>
        `;
        
        cloudSyncModal.classList.add('open');
        closeMenu();
    }
    
    function toggleAutoSync() {
        if (autoSyncEnabled) {
            // Disable auto-sync
            if (autoSyncTimer) {
                clearInterval(autoSyncTimer);
                autoSyncTimer = null;
            }
            autoSyncEnabled = false;
            showToast('Auto-Sync Disabled');
        } else {
            // Enable auto-sync
            const provider = document.getElementById('sync-provider-select')?.value;
            const interval = parseInt(document.getElementById('sync-interval-select')?.value) || 300000;
            
            if (provider === 'none') {
                showToast('Please select a cloud provider', 'error');
                return;
            }
            
            autoSyncEnabled = true;
            
            autoSyncTimer = setInterval(() => {
                if (!isPlaceholder && fountainInput.value.trim()) {
                    if (provider === 'google-drive') {
                        uploadToGoogleDrive();
                    } else if (provider === 'dropbox') {
                        saveToDropbox();
                    }
                }
            }, interval);
            
            showToast(`Auto-Sync Enabled (${provider})`);
        }
        
        cloudSyncModal.classList.remove('open');
    }
    
    // ========================================
    // TOAST NOTIFICATION SYSTEM
    // ========================================
    function showToast(message, type = 'success') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        
        if (type === 'error') {
            toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        } else if (type === 'warning') {
            toast.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        } else {
            toast.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        }
        
        toast.style.position = 'fixed';
        toast.style.bottom = '100px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.color = 'white';
        toast.style.fontWeight = '600';
        toast.style.fontSize = '14px';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        toast.style.zIndex = '10001';
        toast.style.maxWidth = '90%';
        toast.style.textAlign = 'center';
        toast.style.animation = 'slideUpFade 0.3s ease-out';
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDownFade 0.3s ease-out';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    // Add toast animations to document
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideUpFade {
                from {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
            }
            @keyframes slideDownFade {
                from {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // ANDROID WEBVIEW BRIDGE
    // ========================================
    window.AndroidBridge = {
        // Called from Android when back button is pressed
        onBackPressed: function() {
            if (isFocusMode) {
                exitFocusMode();
                return true;
            } else if (menuPanel?.classList.contains('open')) {
                closeMenu();
                return true;
            } else if (sceneNavigatorPanel?.classList.contains('open')) {
                closeSceneNavigator();
                return true;
            } else if (document.querySelector('.modal.open')) {
                document.querySelectorAll('.modal.open').forEach(modal => {
                    modal.classList.remove('open');
                });
                return true;
            } else if (currentView !== 'write') {
                switchView('write');
                return true;
            }
            return false; // Let Android handle back (exit app)
        },
        
        // Save current script
        saveScript: function() {
            saveToLocalStorage();
            return 'Saved';
        },
        
        // Get current script content
        getScriptContent: function() {
            return fountainInput.value;
        },
        
        // Set script content
        setScriptContent: function(content) {
            fountainInput.value = content;
            isPlaceholder = false;
            fountainInput.classList.remove('placeholder');
            updatePreview();
            extractAndDisplayScenes();
            syncCardsWithScript();
            saveToLocalStorage();
        },
        
        // Get project info
        getProjectInfo: function() {
            return JSON.stringify(projectData);
        },
        
        // Show toast from Android
        showToast: function(message, type) {
            showToast(message, type);
        },
        
        // Export as PDF (returns base64)
        exportPdfBase64: function() {
            return new Promise((resolve) => {
                if (typeof jspdf === 'undefined') {
                    resolve(null);
                    return;
                }
                
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'in', 'letter');
                pdf.setFont('courier');
                pdf.setFontSize(12);
                
                const lines = fountainInput.value.split('\n');
                const pageHeight = 11;
                const marginTop = 1;
                const marginLeft = 1.5;
                const lineHeight = 0.17;
                let y = marginTop;
                
                lines.forEach(line => {
                    const trimmed = line.trim();
                    
                    if (y > pageHeight - 1) {
                        pdf.addPage();
                        y = marginTop;
                    }
                    
                    if (trimmed === '') {
                        y += lineHeight;
                        return;
                    }
                    
                    pdf.text(trimmed, marginLeft, y);
                    y += lineHeight;
                });
                
                const pdfBase64 = pdf.output('datauristring').split(',')[1];
                resolve(pdfBase64);
            });
        }
    };
    
    // Expose to Android WebView
    if (window.Android) {
        console.log('Android interface connected');
    }
    
    // Handle Android back button
    document.addEventListener('backbutton', function(e) {
        e.preventDefault();
        if (window.AndroidBridge.onBackPressed()) {
            // Handled by JavaScript
        } else {
            // Let Android handle (exit app)
            if (window.Android && window.Android.exitApp) {
                window.Android.exitApp();
            }
        }
    }, false);
    
    // ========================================
    // WINDOW UTILITY FUNCTIONS
    // ========================================
    
    // Make key functions available globally for inline onclick handlers
    window.saveTitlePage = saveTitlePage;
    window.downloadFromGoogleDrive = downloadFromGoogleDrive;
    window.toggleAutoSync = toggleAutoSync;
    
    // ========================================
    // INITIALIZE APP ON DOM READY
    // ========================================
    init();
    
}); // END DOMContentLoaded

// ========================================
// SERVICE WORKER (for offline support)
// ========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// ========================================
// GLOBAL ERROR HANDLER
// ========================================
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    // Ignore common harmless errors
    if (e.error && e.error.message) {
        const msg = e.error.message.toLowerCase();
        if (msg.includes('script error') || 
            msg.includes('failed to fetch') ||
            msg.includes('load failed') ||
            msg.includes('network error')) {
            return; // Don't show error dialog
        }
    }
    
    // Only show critical errors
    if (e.error && e.error.stack && !e.error.message.includes('ResizeObserver')) {
        console.error('Critical error detected:', e.error);
        // Optional: show error only in development
        // Remove this entire section for production
    }
});

// ========================================
// PREVENT CONTEXT MENU ON LONG PRESS (Android)
// ========================================
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
    }
});

// ========================================
// CONSOLE INFO
// ========================================
console.log('%cToscripT Professional', 'font-size: 24px; font-weight: bold; color: #3b82f6;');
console.log('%cVersion 2.0 - Android Optimized', 'font-size: 14px; color: #9ca3af;');
console.log('%c\nApp initialized successfully!', 'color: #22c55e; font-weight: bold;');
console.log('\nAvailable methods:');
console.log('- AndroidBridge.onBackPressed()');
console.log('- AndroidBridge.saveScript()');
console.log('- AndroidBridge.getScriptContent()');
console.log('- AndroidBridge.setScriptContent(content)');
console.log('- AndroidBridge.getProjectInfo()');
console.log('- AndroidBridge.showToast(message, type)');
console.log('- AndroidBridge.exportPdfBase64()');
