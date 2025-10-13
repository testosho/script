// ========================================
// ToscripT Professional v3.0 - COMPLETE MERGED VERSION
// ALL Features from Toscript1 + Toscript2
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
    const cardsPerPage = 5;
    let undoStack = [];
    let redoStack = [];
    let isPlaceholder = true;
    let isFocusMode = false;
    let isFullscreen = false;
    
    // Google Drive & Dropbox (from Toscript2)
    let gapi = null;
    let gapiInited = false;
    let isSignedIn = false;
    let autoSyncEnabled = false;
    let autoSyncTimer = null;
    
    // Drag and drop
    let draggedElement = null;
    
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
    
    // Show splash screen
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500);
        }, 2000);
    }
    
    // Initialize the app
    fountainInput.value = placeholderText;
    loadFromLocalStorage();
    
    if (fountainInput.value.trim() === '') {
        fountainInput.value = placeholderText;
        isPlaceholder = true;
    }
    
    updateSceneList();
    
    // Focus on editor
    fountainInput.focus();
    
    // Save initial state
    saveToUndoStack();

    // ========================================
    // ANDROID BRIDGE (from Toscript2)
    // ========================================
    
    function isAndroid() {
        return typeof AndroidBridge !== 'undefined' || /android/i.test(navigator.userAgent);
    }
    
    function setupAndroidBackButton() {
        if (typeof AndroidBridge !== 'undefined') {
            window.handleBackPress = function() {
                if (menuPanel.classList.contains('open')) {
                    toggleMenu();
                    return true;
                }
                if (sceneNavigatorPanel.classList.contains('open')) {
                    toggleSceneNavigator();
                    return true;
                }
                if (currentView !== 'write') {
                    switchView('write');
                    return true;
                }
                return false;
            };
        }
    }
    
    setupAndroidBackButton();
    
    // ========================================
    // EVENT LISTENERS - TOOLBAR
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
    
    addNewCardBtn?.addEventListener('click', () => addNewSceneCard());
    saveAllCardsBtn?.addEventListener('click', showExportOptions);
    exportSceneOrderBtn?.addEventListener('click', exportSceneOrder);
    
    // Pagination buttons
    prevPageBtn?.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            renderEnhancedCardView();
        }
    });
    
    nextPageBtn?.addEventListener('click', () => {
        const totalPages = Math.ceil(projectData.projectInfo.scenes.length / cardsPerPage);
        if (currentPage < totalPages - 1) {
            currentPage++;
            renderEnhancedCardView();
        }
    });
    
    // ========================================
    // EVENT LISTENERS - MENU
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
    
    // Cloud buttons (from Toscript2)
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
    // EVENT LISTENERS - FOUNTAIN INPUT
    // ========================================
    
    fountainInput.addEventListener('focus', () => {
        if (isPlaceholder) {
            fountainInput.value = '';
            isPlaceholder = false;
        }
        if (currentView === 'write' && !isFocusMode) {
            showMobileToolbar();
        }
    });
    
    fountainInput.addEventListener('blur', () => {
        if (fountainInput.value.trim() === '') {
            fountainInput.value = placeholderText;
            isPlaceholder = true;
        }
    });
    
    fountainInput.addEventListener('input', () => {
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
    // EVENT LISTENERS - MODALS
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
        alert('Title page saved!');
    });
    
    // Cloud Sync Modal (from Toscript2)
    document.getElementById('enable-auto-sync-btn')?.addEventListener('click', () => {
        autoSyncEnabled = true;
        startAutoSync();
        alert('Auto-sync enabled! Your project will sync every 5 minutes.');
        closeModal(cloudSyncModal);
    });
    
    document.getElementById('disable-auto-sync-btn')?.addEventListener('click', () => {
        autoSyncEnabled = false;
        stopAutoSync();
        alert('Auto-sync disabled.');
        closeModal(cloudSyncModal);
    });
    
    document.getElementById('sync-now-btn')?.addEventListener('click', () => {
        syncNow();
    });
    
    // ========================================
    // EVENT LISTENERS - SCENE NAVIGATOR
    // ========================================
    
    filterCategorySelect?.addEventListener('change', updateFilterHelp);
    
    document.getElementById('apply-filter-btn')?.addEventListener('click', () => {
        const category = filterCategorySelect.value;
        const value = filterValueInput?.value.trim();
        filterScenes(category, value);
    });
    
    document.getElementById('clear-filter-btn')?.addEventListener('click', () => {
        filterValueInput.value = '';
        updateSceneList();
    });
    
    // ========================================
    // MOBILE KEYBOARD TOOLBAR BUTTONS
    // ========================================
    
    document.getElementById('int-ext-btn')?.addEventListener('click', () => {
        insertOrCycleText(['INT. ', 'EXT. ', 'INT./EXT. ', 'I/E. ']);
    });
    
    document.getElementById('day-night-btn')?.addEventListener('click', () => {
        insertOrCycleText([' - DAY', ' - NIGHT', ' - MORNING', ' - EVENING', ' - AFTERNOON', ' - DAWN', ' - DUSK', ' - CONTINUOUS']);
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
    // CORE FUNCTIONS - VIEW SWITCHING
    // ========================================
    
    function switchView(view) {
        currentView = view;
        
        writeView.style.display = 'none';
        scriptView.style.display = 'none';
        cardView.style.display = 'none';
        
        mainHeader.style.display = 'none';
        scriptHeader.style.display = 'none';
        cardHeader.style.display = 'none';
        
        hideMobileToolbar();
        
        if (view === 'write') {
            writeView.style.display = 'flex';
            mainHeader.style.display = 'flex';
            if (!isFocusMode) {
                desktopSideToolbar.style.display = 'flex';
            }
            fountainInput.focus();
        } else if (view === 'script') {
            scriptView.style.display = 'block';
            scriptHeader.style.display = 'flex';
            desktopSideToolbar.style.display = 'none';
            renderEnhancedScript();
        } else if (view === 'card') {
            cardView.style.display = 'flex';
            cardHeader.style.display = 'flex';
            desktopSideToolbar.style.display = 'none';
            currentPage = 0;
            renderEnhancedCardView();
        }
        
        closeMenu();
        closeSceneNavigator();
    }
    
    // ========================================
    // CORE FUNCTIONS - FOUNTAIN PARSING
    // ========================================
    
    function parseFountain(text) {
        const lines = text.split('\n');
        const tokens = [];
        let inTitlePage = true;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
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
            // Character names (all caps, centered position)
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
    // CORE FUNCTIONS - SCRIPT RENDERING
    // ========================================
    
    function renderEnhancedScript() {
        const scriptContent = isPlaceholder ? '' : fountainInput.value;
        if (!scriptContent.trim()) {
            screenplayOutput.innerHTML = '<p style="text-align:center; color:#666; padding:50px;">No content to display. Start writing in the editor.</p>';
            return;
        }
        
        const tokens = parseFountain(scriptContent);
        let html = '<div class="screenplay-page">';
        let sceneNumber = 1;
        
        tokens.forEach((token, index) => {
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
        screenplayOutput.innerHTML = html;
        screenplayOutput.style.fontSize = `${fontSize}px`;
    }
    
    // ========================================
    // CORE FUNCTIONS - CARD VIEW RENDERING
    // ========================================
    
    function renderEnhancedCardView() {
        updateSceneList();
        
        const scenes = projectData.projectInfo.scenes;
        const totalPages = Math.ceil(scenes.length / cardsPerPage);
        
        if (scenes.length === 0) {
            cardContainer.innerHTML = '<div style="text-align:center; color:#666; padding:50px; grid-column: 1/-1;">No scenes found. Add scene headings (INT./EXT.) to your script.</div>';
            if (prevPageBtn) prevPageBtn.style.display = 'none';
            if (nextPageBtn) nextPageBtn.style.display = 'none';
            if (pageIndicator) pageIndicator.style.display = 'none';
            return;
        }
        
        // Calculate start and end indices
        const startIndex = currentPage * cardsPerPage;
        const endIndex = Math.min(startIndex + cardsPerPage, scenes.length);
        const visibleScenes = scenes.slice(startIndex, endIndex);
        
        let cardsHTML = '';
        
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
        
        // Update pagination controls
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
        
        // Bind card events
        bindCardEditingEvents();
        setupMobileCardActions();
    }
    
    // ========================================
    // CORE FUNCTIONS - CARD EDITING
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
                    cardActions.style.display = 'flex';
                });
                card.addEventListener('mouseleave', () => {
                    cardActions.style.display = 'none';
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
            
            // Add below button
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
    
    function setupMobileCardActions() {
        if (!isMobileDevice()) return;
        
        const cards = document.querySelectorAll('.scene-card');
        
        cards.forEach(card => {
            const cardActions = card.querySelector('.card-actions');
            
            // Tap to reveal/hide actions
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
                if (cardActions.style.display === 'none' || cardActions.style.display === '') {
                    cardActions.style.display = 'flex';
                } else {
                    cardActions.style.display = 'none';
                }
            });
        });
    }
    
    // ========================================
    // CORE FUNCTIONS - CARD OPERATIONS
    // ========================================
    
    function addNewSceneCard(afterIndex = null) {
        const newSceneHeading = 'INT. NEW LOCATION - DAY';
        const newSceneContent = '\n\n' + newSceneHeading + '\n\nAction description goes here.\n\n';
        
        if (afterIndex === null || afterIndex === undefined) {
            // Add at the end
            const currentContent = isPlaceholder ? '' : fountainInput.value;
            fountainInput.value = currentContent + newSceneContent;
        } else {
            // Add after specific scene
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
    }
    
    function deleteCard(index) {
        const scenes = projectData.projectInfo.scenes;
        if (index < 0 || index >= scenes.length) return;
        
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
                alert('Scene copied to clipboard!');
            }).catch(err => {
                alert('Unable to copy to clipboard');
            });
        }
    }
    
    function updateCardInScript(index, field, newValue) {
        const scenes = projectData.projectInfo.scenes;
        if (index < 0 || index >= scenes.length) return;
        
        const lines = fountainInput.value.split('\n');
        let sceneCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[i].trim())) {
                if (sceneCount === index) {
                    if (field === 'heading') {
                        lines[i] = newValue;
                    } else if (field === 'description') {
                        // Update the action lines following the heading
                        let descLines = newValue.split('\n');
                        // Find existing description end
                        let descEnd = i + 1;
                        for (let j = i + 1; j < lines.length; j++) {
                            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[j].trim()) || 
                                lines[j].trim() === lines[j].trim().toUpperCase() && lines[j].trim().length > 0) {
                                descEnd = j;
                                break;
                            }
                            if (j === lines.length - 1) descEnd = j + 1;
                        }
                        // Replace description
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
    // CORE FUNCTIONS - SCENE MANAGEMENT
    // ========================================
    
    function updateSceneList() {
        const scriptContent = isPlaceholder ? '' : fountainInput.value;
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
        const lines = fountainInput.value.split('\n');
        let sceneCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(lines[i].trim())) {
                if (sceneCount === index) {
                    // Calculate character position
                    const beforeText = lines.slice(0, i).join('\n');
                    fountainInput.focus();
                    fountainInput.setSelectionRange(beforeText.length, beforeText.length);
                    switchView('write');
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
        
        // Visual feedback
        if (draggedElement !== this) {
            this.style.borderTop = '2px solid #1a73e8';
        }
        
        return false;
    }
    
    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        // Clear visual feedback
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
        
        // Clear all visual feedback
        const items = document.querySelectorAll('.scene-item');
        items.forEach(item => {
            item.style.borderTop = '';
        });
    }
    
    function reorderScenes(fromIndex, toIndex) {
        const lines = fountainInput.value.split('\n');
        const sceneBlocks = [];
        let currentBlock = [];
        
        // Split content into scene blocks
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
        
        // Reorder
        const movedScene = sceneBlocks.splice(fromIndex, 1)[0];
        sceneBlocks.splice(toIndex, 0, movedScene);
        
        // Rebuild content
        const newContent = sceneBlocks.map(block => block.join('\n')).join('\n');
        fountainInput.value = newContent;
        
        updateSceneList();
        saveToLocalStorage();
        
        if (currentView === 'card') {
            renderEnhancedCardView();
        }
    }
    
    // ========================================
    // FILTER FUNCTIONS
    // ========================================
    
    function updateFilterHelp() {
        const category = filterCategorySelect.value;
        const helpTexts = {
            'type': 'Enter: INT. or EXT.',
            'location': 'Enter location name (e.g., COFFEE SHOP)',
            'time': 'Enter time of day (e.g., DAY, NIGHT)',
            'character': 'Enter character name'
        };
        if (filterHelpText) {
            filterHelpText.textContent = helpTexts[category] || '';
        }
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
    }
    
    // ========================================
    // EXPORT FUNCTIONS - OPTIONS MENU
    // ========================================
    
    function showExportOptions() {
        const options = [
            'Export Visible Cards (Current Page)',
            'Export All Cards as PDF',
            'Export All Cards as TXT',
            'Cancel'
        ];
        
        let choice;
        if (isMobileDevice()) {
            // Simple alert for mobile
            const message = 'Choose export option:\n1. Visible Cards\n2. All Cards PDF\n3. All Cards TXT';
            choice = prompt(message, '1');
            
            if (choice === '1') {
                saveVisibleCardsAsPDF();
            } else if (choice === '2') {
                saveAllCardsAsImages();
            } else if (choice === '3') {
                saveAllCardsAsTXT();
            }
        } else {
            // Better dialog for desktop
            if (confirm('Export visible cards only (current page)?\n\nClick OK for visible cards, Cancel to see all options.')) {
                saveVisibleCardsAsPDF();
            } else {
                const allChoice = prompt('Export all cards:\n1. As PDF\n2. As TXT\n\nEnter 1 or 2:', '1');
                if (allChoice === '1') {
                    saveAllCardsAsImages();
                } else if (allChoice === '2') {
                    saveAllCardsAsTXT();
                }
            }
        }
    }
    
    // ========================================
    // EXPORT FUNCTIONS - VISIBLE CARDS
    // ========================================
    
    function saveVisibleCardsAsPDF() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            alert('No scenes to export!');
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
        alert(`Exported ${visibleScenes.length} cards from page ${currentPage + 1}!`);
    }
    
    function saveVisibleCardsHTML2Canvas(visibleScenes, startIndex) {
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
                    alert(`Exported ${visibleScenes.length} cards from page ${currentPage + 1}!`);
                }
            }).catch(err => {
                console.error('Export error:', err);
                document.body.removeChild(tempCard);
            });
        });
    }
    
    // ========================================
    // EXPORT FUNCTIONS - ALL CARDS
    // ========================================
    
    function saveAllCardsAsImages() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            alert('No scenes to export!');
            return;
        }
        
        if (isMobileDevice()) {
            saveAllCardsAsPDF_Canvas();
        } else {
            saveAllCardsAsPDF_Library();
        }
    }
    
    function saveAllCardsAsPDF_Canvas() {
        const scenes = projectData.projectInfo.scenes;
        const { jsPDF } = window.jspdf;
        
        // Split into batches of 27 cards per PDF
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
        
        alert(`Exported ${scenes.length} cards in ${batches} file(s)!`);
    }
    
    function saveAllCardsAsPDF_Library() {
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
                    alert(`Exported ${scenes.length} cards as PDF!`);
                }
            }).catch(err => {
                console.error('Export error:', err);
                document.body.removeChild(tempCard);
                processed++;
            });
        });
    }
    
    function saveAllCardsAsTXT() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            alert('No scenes to export!');
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
        
        alert(`Exported ${scenes.length} cards as TXT!`);
    }

    // ========================================
    // CANVAS CARD GENERATION
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
    // EXPORT FUNCTIONS - SCENE ORDER
    // ========================================
    
    function exportSceneOrder() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            alert('No scenes to export!');
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
        
        alert('Scene order report exported!');
    }
    
    // ========================================
    // FILE OPERATIONS
    // ========================================
    
    function saveFountain() {
        const content = isPlaceholder ? '' : fountainInput.value;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.projectInfo.projectName}.fountain`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Fountain file saved!');
    }
    
    function savePDF(fontType) {
        alert(`PDF export with ${fontType} fonts - Feature requires jsPDF with font support.\nUse 'Export Cards' for PDF export of scene cards.`);
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
        alert('Project file saved!');
    }
    
    function handleFileOpen(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            
            if (file.name.endsWith('.fountain')) {
                fountainInput.value = content;
                isPlaceholder = false;
                updateSceneList();
                saveToLocalStorage();
                alert('Fountain file loaded!');
            } else if (file.name.endsWith('.filmproj')) {
                try {
                    const data = JSON.parse(content);
                    projectData = data;
                    fountainInput.value = data.projectInfo.scriptContent || '';
                    isPlaceholder = !data.projectInfo.scriptContent;
                    updateSceneList();
                    saveToLocalStorage();
                    alert('Project file loaded!');
                } catch (err) {
                    alert('Invalid .filmproj file!');
                }
            } else {
                alert('Unsupported file type! Use .fountain or .filmproj files.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    }
    
    // ========================================
    // CLOUD SYNC FUNCTIONS (from Toscript2)
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
    }
    
    function stopAutoSync() {
        if (autoSyncTimer) {
            clearInterval(autoSyncTimer);
            autoSyncTimer = null;
        }
    }
    
    function syncNow() {
        console.log('Syncing project...');
        saveToLocalStorage();
        alert('Project synced to local storage!\n\nCloud sync (Google Drive/Dropbox) coming soon.');
    }
    
    function saveToGoogleDrive() {
        alert('Google Drive integration - Coming soon!\n\nFor now, use Save > Fountain or Filmproj format.');
    }
    
    function openFromGoogleDrive() {
        alert('Google Drive integration - Coming soon!\n\nFor now, use Open to load .fountain or .filmproj files.');
    }
    
    function saveToDropbox() {
        alert('Dropbox integration - Coming soon!\n\nFor now, use Save > Fountain or Filmproj format.');
    }
    
    function openFromDropbox() {
        alert('Dropbox integration - Coming soon!\n\nFor now, use Open to load .fountain or .filmproj files.');
    }
    
    // ========================================
    // PROJECT INFO MODAL
    // ========================================
    
    function showProjectInfo() {
        const scenes = projectData.projectInfo.scenes;
        const scriptContent = isPlaceholder ? '' : fountainInput.value;
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
                        💻 Auto-save: ${autoSaveInterval ? 'Enabled (30s)' : 'Disabled'}
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
        menuPanel.classList.toggle('open');
        closeSceneNavigator();
    }
    
    function closeMenu() {
        menuPanel.classList.remove('open');
    }
    
    function toggleSceneNavigator() {
        sceneNavigatorPanel.classList.toggle('open');
        closeMenu();
    }
    
    function closeSceneNavigator() {
        sceneNavigatorPanel.classList.remove('open');
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
    
    function changeFontSize(delta) {
        fontSize = Math.max(12, Math.min(28, fontSize + delta));
        fountainInput.style.fontSize = `${fontSize}px`;
        screenplayOutput.style.fontSize = `${fontSize}px`;
        saveToLocalStorage();
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
    }
    
    function toggleAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
            if (autoSaveBtn) {
                autoSaveBtn.textContent = '☐ Auto-Save (30s)';
            }
        } else {
            autoSaveInterval = setInterval(saveToLocalStorage, 30000);
            if (autoSaveBtn) {
                autoSaveBtn.textContent = '☑ Auto-Save (30s)';
            }
            alert('Auto-save enabled! Your work will be saved every 30 seconds.');
        }
    }
    
    function shareScript() {
        const content = isPlaceholder ? '' : fountainInput.value;
        const shareText = `${projectData.projectInfo.projectName}\nBy ${projectData.projectInfo.prodName}\n\n${content}`;
        
        if (navigator.share) {
            navigator.share({
                title: projectData.projectInfo.projectName,
                text: shareText
            }).catch(err => console.log('Share cancelled'));
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Script copied to clipboard!');
            }).catch(() => {
                alert('Share not supported. Use Save menu to export your script.');
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
        fountainInput.value = placeholderText;
        isPlaceholder = true;
        currentPage = 0;
        undoStack = [];
        redoStack = [];
        updateSceneList();
        saveToLocalStorage();
        closeMenu();
        alert('Project cleared!');
    }
    
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
            isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            isFullscreen = false;
        }
    }
	
    
	    function toggleFocusMode() {
	        isFocusMode = !isFocusMode;
        
	        if (isFocusMode) {
	            mainHeader.style.display = 'none';
	            desktopSideToolbar.style.display = 'none';
	            mobileKeyboardToolbar.style.display = 'none';
	            if (focusExitBtn) focusExitBtn.style.display = 'block';
            
	            // Enter fullscreen
	            if (!isFullscreen) {
	                toggleFullscreen();
	            }
            
	            // Add focus mode styles
	            fountainInput.style.padding = '50px';
	            fountainInput.style.maxWidth = '800px';
	            fountainInput.style.margin = '0 auto';
	        } else {
	            mainHeader.style.display = 'flex';
	            desktopSideToolbar.style.display = 'flex';
	            if (focusExitBtn) focusExitBtn.style.display = 'none';
            
	            // Exit fullscreen
	            if (isFullscreen) {
	                toggleFullscreen();
	            }
            
	            // Remove focus mode styles
	            fountainInput.style.padding = '';
	            fountainInput.style.maxWidth = '';
	            fountainInput.style.margin = '';
	        }
	    }
    
	    function showMobileToolbar() {
	        if (window.innerWidth <= 768 && !isFocusMode && currentView === 'write') {
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
	        const currentContent = fountainInput.value;
        
	        // Don't save if content hasn't changed
	        if (undoStack.length > 0 && undoStack[undoStack.length - 1] === currentContent) {
	            return;
	        }
        
	        undoStack.push(currentContent);
        
	        // Limit stack size
	        if (undoStack.length > 50) {
	            undoStack.shift();
	        }
        
	        // Clear redo stack when new action is performed
	        redoStack = [];
	    }
    
	    function undo() {
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
	        } else {
	            alert('Nothing to undo!');
	        }
	    }
    
	    function redo() {
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
	        } else {
	            alert('Nothing to redo!');
	        }
	    }
    
	    // ========================================
	    // LOCAL STORAGE
	    // ========================================
    
	    function saveToLocalStorage() {
	        try {
	            // Update project data before saving
	            projectData.projectInfo.scriptContent = isPlaceholder ? '' : fountainInput.value;
            
	            // Save project data
	            localStorage.setItem('toscript_project', JSON.stringify(projectData));
            
	            // Save preferences
	            const preferences = {
	                fontSize: fontSize,
	                showSceneNumbers: showSceneNumbers,
	                autoSaveEnabled: !!autoSaveInterval
	            };
	            localStorage.setItem('toscript_preferences', JSON.stringify(preferences));
            
	            console.log('Saved to localStorage');
	        } catch (e) {
	            console.error('Failed to save to localStorage:', e);
            
	            // Handle quota exceeded
	            if (e.name === 'QuotaExceededError') {
	                alert('Storage quota exceeded! Please export your work and clear some data.');
	            }
	        }
	    }
    
	    function loadFromLocalStorage() {
	        try {
	            // Load project data
	            const savedProject = localStorage.getItem('toscript_project');
	            if (savedProject) {
	                projectData = JSON.parse(savedProject);
	                fountainInput.value = projectData.projectInfo.scriptContent || placeholderText;
	                isPlaceholder = !projectData.projectInfo.scriptContent;
	            }
            
	            // Load preferences
	            const savedPreferences = localStorage.getItem('toscript_preferences');
	            if (savedPreferences) {
	                const prefs = JSON.parse(savedPreferences);
	                fontSize = prefs.fontSize || 16;
	                showSceneNumbers = prefs.showSceneNumbers !== false;
                
	                // Apply font size
	                fountainInput.style.fontSize = `${fontSize}px`;
	                screenplayOutput.style.fontSize = `${fontSize}px`;
                
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
	            }
            
	            console.log('Loaded from localStorage');
	        } catch (e) {
	            console.error('Failed to load from localStorage:', e);
	        }
	    }
    
	    // ========================================
	    // KEYBOARD SHORTCUTS
	    // ========================================
    
	    document.addEventListener('keydown', (e) => {
	        // Ctrl/Cmd + S - Save
	        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
	            e.preventDefault();
	            saveToLocalStorage();
	            alert('Project saved to local storage!');
	        }
        
	        // Ctrl/Cmd + Z - Undo
	        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
	            e.preventDefault();
	            undo();
	        }
        
	        // Ctrl/Cmd + Shift + Z - Redo (or Ctrl+Y)
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
	            } else if (menuPanel.classList.contains('open')) {
	                closeMenu();
	            } else if (sceneNavigatorPanel.classList.contains('open')) {
	                closeSceneNavigator();
	            }
	        }
	    });
    
	    // ========================================
	    // WINDOW RESIZE HANDLER
	    // ========================================
    
	    window.addEventListener('resize', () => {
	        // Adjust toolbar visibility on resize
	        if (window.innerWidth > 768) {
	            hideMobileToolbar();
	            if (currentView === 'write' && !isFocusMode) {
	                desktopSideToolbar.style.display = 'flex';
	            }
	        } else {
	            if (currentView === 'write' && !isFocusMode) {
	                desktopSideToolbar.style.display = 'none';
	            }
	        }
	    });
    
	    // ========================================
	    // BEFORE UNLOAD WARNING
	    // ========================================
    
	    window.addEventListener('beforeunload', (e) => {
	        // Save before closing
	        saveToLocalStorage();
        
	        // Warn if there's unsaved content
	        if (!isPlaceholder && fountainInput.value.trim() !== '') {
	            e.preventDefault();
	            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
	            return e.returnValue;
	        }
	    });
    
	    // ========================================
	    // HELPER FUNCTIONS
	    // ========================================
    
	    function escapeHtml(text) {
	        const div = document.createElement('div');
	        div.textContent = text || '';
	        return div.innerHTML;
	    }
    
	    // ========================================
	    // INITIALIZATION COMPLETE
	    // ========================================
    
	    console.log('ToscripT v3.0 initialized successfully!');
	    console.log('Features: Full card system + Cloud sync + Android optimization');
	    console.log('Keyboard shortcuts:');
	    console.log('  Ctrl+S: Save');
	    console.log('  Ctrl+Z: Undo');
	    console.log('  Ctrl+Shift+Z: Redo');
	    console.log('  Ctrl+P: Preview Script');
	    console.log('  Ctrl+K: Card View');
	    console.log('  Ctrl+E: Editor View');
	    console.log('  Ctrl+M: Toggle Menu');
	    console.log('  F11: Fullscreen');
	    console.log('  Escape: Exit focus mode');
    
	}); // End DOMContentLoaded

	// ========================================
	// SERVICE WORKER REGISTRATION (from Toscript2)
	// ========================================

	if ('serviceWorker' in navigator) {
	    window.addEventListener('load', () => {
	        navigator.serviceWorker.register('/sw.js')
	            .then(registration => {
	                console.log('Service Worker registered successfully:', registration.scope);
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
	    // Don't show alert for every error, just log it
	});

	window.addEventListener('unhandledrejection', (e) => {
	    console.error('Unhandled promise rejection:', e.reason);
	});

	// ========================================
	// END OF TOSCRIPT3
	// ========================================
	
