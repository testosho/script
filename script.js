// ToscripT Professional - Complete Fixed Version

document.addEventListener('DOMContentLoaded', () => {
    // Global variables
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

    // DOM elements
    const fountainInput = document.getElementById('fountain-input');
    const screenplayOutput = document.getElementById('screenplay-output');
    const menuPanel = document.getElementById('menu-panel');
    const sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    const writeView = document.getElementById('write-view');
    const scriptView = document.getElementById('script-view');
    const cardView = document.getElementById('card-view');
    const mainHeader = document.getElementById('main-header');
    const scriptHeader = document.getElementById('script-header');
    const cardHeader = document.getElementById('card-header');
    const mobileToolbar = document.getElementById('mobile-keyboard-toolbar');
    const filterCategorySelect = document.getElementById('filter-category-select');
    const filterValueInput = document.getElementById('filter-value-input');
    const filterHelpText = document.getElementById('filter-help-text');
    const sceneList = document.getElementById('scene-list');
    const fileInput = document.getElementById('file-input');

    const placeholderText = `TITLE: THE CRIMSON DOSSIER
AUTHOR: YOUR NAME

INT. DETECTIVE'S OFFICE - NIGHT

The office is dimly lit with case files scattered everywhere.

DETECTIVE VIKRAM
(40s, weary)
sits behind a cluttered desk, staring at cold coffee.

The door creaks open. MAYA (30s, mysterious) steps out of the shadows.

MAYA
(whispering)
Are you the one they call the Ghost of Bangalore?

VIKRAM
(cautious)
That depends on who's asking.

FADE OUT.`;

    // Enhanced history system
    const history = {
        stack: [],
        currentIndex: 0,
        add(value) {
            if (value !== this.stack[this.currentIndex]) {
                this.stack = this.stack.slice(0, this.currentIndex + 1);
                this.stack.push(value);
                this.currentIndex = this.stack.length - 1;
            }
            this.updateButtons();
        },
        undo() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateInput();
            }
        },
        redo() {
            if (this.currentIndex < this.stack.length - 1) {
                this.currentIndex++;
                this.updateInput();
            }
        },
        updateInput() {
            if (fountainInput) {
                fountainInput.value = this.stack[this.currentIndex];
                if (fountainInput.value && fountainInput.value !== placeholderText) {
                    clearPlaceholder();
                } else {
                    setPlaceholder();
                }
                this.updateButtons();
                saveProjectData();
            }
        },
        updateButtons() {
            const undoBtns = document.querySelectorAll('#undo-btn, #undo-btn-mobile, #undo-btn-top');
            const redoBtns = document.querySelectorAll('#redo-btn, #redo-btn-mobile, #redo-btn-top');
            undoBtns.forEach(btn => { if (btn) btn.disabled = this.currentIndex <= 0; });
            redoBtns.forEach(btn => { if (btn) btn.disabled = this.currentIndex >= this.stack.length - 1; });
        }
    };

    // Mobile Keyboard Detection
    function setupKeyboardDetection() {
        let initialHeight = window.innerHeight;

        function handleKeyboardToggle() {
            const currentHeight = window.innerHeight;
            const heightDiff = initialHeight - currentHeight;
            const keyboardOpen = heightDiff > 150;

            if (keyboardOpen && currentView === 'write' && window.innerWidth < 768) {
                showMobileToolbar();
            } else if (!document.activeElement?.closest('.mobile-keyboard-toolbar')) {
                hideMobileToolbar();
            }
        }

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleKeyboardToggle);
        } else {
            window.addEventListener('resize', handleKeyboardToggle);
        }

        if (fountainInput) {
            fountainInput.addEventListener('focus', () => {
                clearPlaceholder();
                setTimeout(() => {
                    if (currentView === 'write' && window.innerWidth < 768) showMobileToolbar();
                }, 300);
            });

            fountainInput.addEventListener('blur', () => {
                setPlaceholder();
                setTimeout(() => {
                    if (!document.activeElement?.closest('.mobile-keyboard-toolbar')) hideMobileToolbar();
                }, 200);
            });
        }
    }

    function showMobileToolbar() {
        if (mobileToolbar && window.innerWidth < 768) {
            mobileToolbar.classList.add('show');
        }
    }

    function hideMobileToolbar() {
        if (mobileToolbar) {
            mobileToolbar.classList.remove('show');
        }
    }

    // Placeholder functions
    function setPlaceholder() {
        if (fountainInput && (!fountainInput.value || fountainInput.value.trim() === '')) {
            fountainInput.value = placeholderText;
            fountainInput.classList.add('placeholder');
        }
    }

    function clearPlaceholder() {
        if (fountainInput && fountainInput.classList.contains('placeholder')) {
            fountainInput.value = '';
            fountainInput.classList.remove('placeholder');
        }
    }

    function isPlaceholder() {
        return fountainInput && (fountainInput.classList.contains('placeholder') || fountainInput.value === placeholderText);
    }

    // Save/Load functions
    function saveProjectData() {
        if (fountainInput && !isPlaceholder()) {
            projectData.projectInfo.scriptContent = fountainInput.value;
            projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
        }
        localStorage.setItem('universalFilmProjectToScript', JSON.stringify(projectData));
    }

    function loadProjectData() {
        const savedData = localStorage.getItem('universalFilmProjectToScript');
        if (savedData) {
            try {
                projectData = JSON.parse(savedData);
            } catch (e) {
                console.warn('Failed to parse saved data');
                projectData = {
                    projectInfo: {
                        projectName: 'Untitled',
                        prodName: 'Author',
                        scriptContent: '',
                        scenes: []
                    }
                };
            }
        }
        if (fountainInput) {
            if (projectData.projectInfo.scriptContent && projectData.projectInfo.scriptContent.trim()) {
                fountainInput.value = projectData.projectInfo.scriptContent;
                fountainInput.classList.remove('placeholder');
            } else {
                setPlaceholder();
            }
        }
        updateSceneNoIndicator();
        updateAutoSaveIndicator();
    }

	// Helper function to determine element type
function getElementType(line, nextLine, inDialogue) {
    if (!line) return 'empty';
    
    if (/^(TITLE|AUTHOR|CREDIT|SOURCE):/i.test(line)) {
        return 'title-page';
    }
    
    if (line.toUpperCase().startsWith('INT.') || line.toUpperCase().startsWith('EXT.')) {
        return 'scene-heading';
    }
    
    if (line.toUpperCase().endsWith('TO:') || 
        line.toUpperCase() === 'FADE OUT.' || 
        line.toUpperCase() === 'FADE IN:' || 
        line.toUpperCase() === 'FADE TO BLACK:') {
        return 'transition';
    }
    
    if (line === line.toUpperCase() && !line.startsWith('!') && line.length > 0 && nextLine) {
        return 'character';
    }
    
    if (inDialogue && line.startsWith('(')) {
        return 'parenthetical';
    }
    
    if (inDialogue) {
        return 'dialogue';
    }
    
    return 'action';
}

    // Parser Function
    function parseFountain(input) {
        if (!input || !input.trim() || input === placeholderText) {
            return [];
        }
        const lines = input.split('\n');
        const tokens = [];
        let inDialogue = false;

        for(let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const nextLine = (i + 1 < lines.length) ? lines[i+1].trim() : null;

            if (!line) {
                tokens.push({ type: 'empty' });
                inDialogue = false;
                continue;
            }

            if (line.toUpperCase().startsWith('INT.') || line.toUpperCase().startsWith('EXT.')) {
                tokens.push({ type: 'sceneheading', text: line.toUpperCase() });
                inDialogue = false;
                continue;
            }

            if (line.toUpperCase().endsWith('TO:') || line.toUpperCase() === 'FADE OUT.' || line.toUpperCase() === 'FADE IN:' || line.toUpperCase() === 'FADE TO BLACK:') {
                tokens.push({ type: 'transition', text: line.toUpperCase() });
                inDialogue = false;
                continue;
            }

            if (line === line.toUpperCase() && !line.startsWith('!') && line.length > 0 && nextLine) {
                tokens.push({ type: 'character', text: line });
                inDialogue = true;
                continue;
            }

            if (inDialogue && line.startsWith('(')) {
                tokens.push({ type: 'parenthetical', text: line });
                continue;
            }

            if (inDialogue) {
                tokens.push({ type: 'dialogue', text: line });
                continue;
            }

            tokens.push({ type: 'action', text: line });
        }

        return tokens;
    }

        // Scene Extraction
    function extractScenesFromText(text) {
        console.log('=== EXTRACTING SCENES ===');
        if (!text || !text.trim() || text === placeholderText) {
            return [];
        }

        const lines = text.split('\n');
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;
        let currentSceneLines = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            const isSceneHeading = trimmed.toUpperCase().startsWith('INT.') || trimmed.toUpperCase().startsWith('EXT.');

            if (isSceneHeading) {
                if (currentScene) {
                    currentScene.fullText = currentSceneLines.join('\n');
                    scenes.push(currentScene);
                }

                sceneNumber++;
                const heading = trimmed.toUpperCase();
                
                const sceneTypeMatch = heading.match(/(INT\.|EXT\.|INT\.\/EXT\.|EXT\.\/INT\.)/i);
                const sceneType = sceneTypeMatch ? sceneTypeMatch[1] : 'INT.';
                
                const timeMatch = heading.match(/-(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER)/i);
                const timeOfDay = timeMatch ? timeMatch[1] : 'DAY';
                
                let location = heading
                    .replace(/(INT\.|EXT\.|INT\.\/EXT\.|EXT\.\/INT\.)/i, '')
                    .replace(/-(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER)/i, '')
                    .trim();
                
                if (!location) location = 'LOCATION';
                
                currentScene = {
                    number: sceneNumber,
                    heading: heading,
                    sceneType: sceneType,
                    location: location,
                    timeOfDay: timeOfDay,
                    description: [],
                    characters: []
                };
                
                currentSceneLines = [line];
            } else if (currentScene) {
                currentSceneLines.push(line);
                
                const tokens = parseFountain(line);
                tokens.forEach(token => {
                    if (token.type === 'action') {
                        currentScene.description.push(token.text);
                    } else if (token.type === 'character') {
                        const charName = token.text.trim().toUpperCase();
                        if (!currentScene.characters.includes(charName)) {
                            currentScene.characters.push(charName);
                        }
                    }
                });
            }
        });

        if (currentScene) {
            currentScene.fullText = currentSceneLines.join('\n');
            scenes.push(currentScene);
        }
        
        console.log('=== EXTRACTED', scenes.length, 'SCENES ===');
        return scenes;
    }

    // Reconstruct script from reordered scenes
    function reconstructScriptFromScenes() {
        if (!projectData.projectInfo.scenes || projectData.projectInfo.scenes.length === 0) {
            return '';
        }

        let reconstructedText = '';
        projectData.projectInfo.scenes.forEach((scene, index) => {
            if (scene.fullText) {
                reconstructedText += scene.fullText;
                if (index < projectData.projectInfo.scenes.length - 1) {
                    reconstructedText += '\n\n';
                }
            }
        });

        return reconstructedText.trim();
    }

    // Switch View Function
    function switchView(view) {
        console.log(`Switching to view: ${view}`);
        currentView = view;
        
        [writeView, scriptView, cardView].forEach(v => v?.classList.remove('active'));
        [mainHeader, scriptHeader, cardHeader].forEach(h => {
            if (h) h.style.display = 'none';
        });
        hideMobileToolbar();

        if (view === 'script') {
            scriptView?.classList.add('active');
            if (scriptHeader) scriptHeader.style.display = 'flex';
            renderEnhancedScript();
            
        } else if (view === 'card') {
            if (fountainInput && !isPlaceholder()) {
                console.log('Extracting scenes for card view...');
                projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
                console.log('Scenes extracted:', projectData.projectInfo.scenes.length);
            }
            
            cardView?.classList.add('active');
            if (cardHeader) cardHeader.style.display = 'flex';
            currentPage = 0;
            renderEnhancedCardView();
            
            setTimeout(() => {
                bindCardEditingEvents();
            }, 100);
            
        } else {
            writeView?.classList.add('active');
            if (mainHeader) mainHeader.style.display = 'flex';
            
            setTimeout(() => {
                if (fountainInput) {
                    if (!isPlaceholder()) {
                        fountainInput.classList.remove('placeholder');
                    }
                    fountainInput.focus();
                    if (window.innerWidth <= 768 && currentView === 'write') {
                        showMobileToolbar();
                    }
                }
            }, 200);
        }
    }

    // Enhanced Script Rendering
    // Enhanced Script Rendering with Industry Standard Spacing
function renderEnhancedScript() {
    if (!screenplayOutput || !fountainInput) return;

    const text = fountainInput.value;
    if (isPlaceholder()) {
        screenplayOutput.innerHTML = '<div style="text-align: center; padding: 4rem; color: #999;">Write your screenplay to see the preview</div>';
        return;
    }

    const lines = text.split('\n');
    let scriptHtml = '';
    let sceneCount = 0;
    let inDialogue = false;
    let previousElementType = null;
    let lastWasTransition = false;

    for(let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const nextLine = (i + 1 < lines.length) ? lines[i+1].trim() : null;
        const currentElementType = getElementType(line, nextLine, inDialogue);

        if (!line) {
            scriptHtml += '<div class="empty-line"></div>';
            inDialogue = false;
            continue;
        }

        // Add spacing before scene headings
        if (currentElementType === 'scene-heading') {
            // Two blank lines after transition, one blank line after other elements
            if (previousElementType === 'transition') {
                scriptHtml += '<div class="empty-line"></div><div class="empty-line"></div>';
            } else if (previousElementType && previousElementType !== 'empty' && previousElementType !== 'title-page') {
                scriptHtml += '<div class="empty-line"></div>';
            }
            
            sceneCount++;
            if (showSceneNumbers) {
                scriptHtml += `<div class="scene-heading">
                    <span>${line.toUpperCase()}</span>
                    <span class="scene-number">${sceneCount}</span>
                </div>`;
            } else {
                scriptHtml += `<div class="scene-heading">${line.toUpperCase()}</div>`;
            }
            inDialogue = false;
            previousElementType = 'scene-heading';
            lastWasTransition = false;
            continue;
        }

        if (currentElementType === 'title-page') {
            scriptHtml += `<div class="title-page-element">${line}</div>`;
            inDialogue = false;
            previousElementType = 'title-page';
            continue;
        }

        if (currentElementType === 'transition') {
            scriptHtml += `<div class="transition">${line.toUpperCase()}</div>`;
            inDialogue = false;
            previousElementType = 'transition';
            lastWasTransition = true;
            continue;
        }

        if (currentElementType === 'character') {
            scriptHtml += `<div class="character">${line}</div>`;
            inDialogue = true;
            previousElementType = 'character';
            continue;
        }

        if (currentElementType === 'parenthetical') {
            scriptHtml += `<div class="parenthetical">${line}</div>`;
            previousElementType = 'parenthetical';
            continue;
        }

        if (currentElementType === 'dialogue') {
            scriptHtml += `<div class="dialogue">${line}</div>`;
            previousElementType = 'dialogue';
            continue;
        }

        // Action/Description
        scriptHtml += `<div class="action">${line}</div>`;
        previousElementType = 'action';
    }

    screenplayOutput.innerHTML = scriptHtml;
}


    // Enhanced Card View with Mobile Pagination
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
                
                // FIXED: Ensure header stays visible after pagination
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
    
    // FIXED: Always ensure card header is visible after rendering
    if (cardHeader && currentView === 'card') {
        cardHeader.style.display = 'flex';
    }
    
    if (isMobile) {
        setTimeout(() => {
            setupMobileCardActions();
        }, 100);
    }
}


    // Card Editing Functions - UPDATED
   // Card Editing Functions - UPDATED with Header Fix
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
                // Remove from DOM
                card.remove();
                
                // Update scene numbers in projectData
                const allScenes = projectData.projectInfo.scenes;
                const sceneIndex = allScenes.findIndex(s => s.number == sceneId);
                if (sceneIndex !== -1) {
                    allScenes.splice(sceneIndex, 1);
                    // Renumber remaining scenes
                    allScenes.forEach((scene, index) => {
                        scene.number = index + 1;
                    });
                    projectData.projectInfo.scenes = allScenes;
                }
                
                // Re-render to show updated scene numbers
                renderEnhancedCardView();
                bindCardEditingEvents();
                
                // FIXED: Ensure header stays visible after delete
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
            history.add(fountainInput.value);
            saveProjectData();
        }
        
        setTimeout(() => { isUpdatingFromSync = false; }, 100);
    }

    // UPDATED: Add New Scene Card - Insert Below Current
   // UPDATED: Add New Scene Card - Preserves Header
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
    
    // Re-render and ensure header stays visible
    renderEnhancedCardView();
    bindCardEditingEvents();
    
    // FIXED: Ensure card header stays visible
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


    // NEW: Save Cards Modal
    function showSaveCardsModal() {
        let modal = document.getElementById('save-cards-modal');
        
        if (!modal) {
            const modalHtml = `
                <div id="save-cards-modal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Save Scene Cards</h2>
                            <button class="icon-btn close-modal-btn">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>Choose which cards to save as PDF:</p>
                        </div>
                        <div class="modal-footer" style="display: flex; gap: 10px; justify-content: center;">
                            <button id="save-visible-cards-btn" class="main-action-btn">
                                Save Visible Cards
                            </button>
                            <button id="save-all-cards-modal-btn" class="main-action-btn secondary">
                                Save All Cards
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('save-cards-modal');
            
            const saveVisibleBtn = document.getElementById('save-visible-cards-btn');
            const saveAllModalBtn = document.getElementById('save-all-cards-modal-btn');
            const closeBtn = modal.querySelector('.close-modal-btn');
            
            if (saveVisibleBtn) {
                saveVisibleBtn.addEventListener('click', () => {
                    modal.classList.remove('open');
                    saveVisibleCardsAsPDF();
                });
            }
            
            if (saveAllModalBtn) {
                saveAllModalBtn.addEventListener('click', () => {
                    modal.classList.remove('open');
                    saveAllCardsAsImages();
                });
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('open');
                });
            }
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('open');
                }
            });
        }
        
        modal.classList.add('open');
    }
    // NEW: Save Only Visible Cards as PDF
   // OPTIMIZED: Save Only Visible Cards as PDF - Batch Processing
async function saveVisibleCardsAsPDF() {
    console.log('Saving visible cards as PDF...');

    if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        alert('PDF generation library is not loaded. Cannot create PDF.');
        return;
    }

    const visibleCards = document.querySelectorAll('.card-for-export');
    if (visibleCards.length === 0) {
        alert('No visible cards to save.');
        return;
    }

    const visibleSceneNumbers = Array.from(visibleCards).map(card => 
        card.getAttribute('data-scene-number')
    );
    const firstScene = visibleSceneNumbers[0];
    const lastScene = visibleSceneNumbers[visibleSceneNumbers.length - 1];
    
    const projectName = projectData.projectInfo.projectName || 'Untitled';
    const filename = `${projectName}-Scene${firstScene}to${lastScene}.pdf`;

    // Show progress indicator
    showProgressModal(`Generating PDF: 0/${visibleCards.length} cards...`);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const cardWidthMM = 127;
    const cardHeightMM = 76;
    const pageHeightMM = 297;
    const pageWidthMM = 210;
    const topMarginMM = 15;
    const leftMarginMM = (pageWidthMM - cardWidthMM) / 2;
    const gapMM = 15;

    let x = leftMarginMM;
    let y = topMarginMM;

    try {
        // Process cards in batches of 10 to avoid memory issues
        const batchSize = 10;
        const totalCards = visibleCards.length;
        
        for (let i = 0; i < totalCards; i += batchSize) {
            const batch = Array.from(visibleCards).slice(i, Math.min(i + batchSize, totalCards));
            
            for (let j = 0; j < batch.length; j++) {
                const cardIndex = i + j;
                updateProgressModal(`Generating PDF: ${cardIndex + 1}/${totalCards} cards...`);
                
                const blob = await generateCardImageBlob(batch[j]);
                if (!blob) continue;

                const dataUrl = URL.createObjectURL(blob);

                if (y + cardHeightMM > pageHeightMM - topMarginMM) {
                    doc.addPage();
                    y = topMarginMM;
                }

                doc.addImage(dataUrl, 'PNG', x, y, cardWidthMM, cardHeightMM);
                URL.revokeObjectURL(dataUrl);

                y += cardHeightMM + gapMM;
                
                // Small delay to prevent browser freeze
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // Clear memory between batches
            if (i + batchSize < totalCards) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        doc.save(filename);
        hideProgressModal();
        alert(`✅ PDF created successfully!\n${totalCards} cards exported to ${filename}`);
    } catch (error) {
        console.error('Failed to generate PDF', error);
        hideProgressModal();
        alert('❌ An error occurred while creating the PDF. Try reducing the number of cards or refresh the page.');
    }
}

   
   // OPTIMIZED: Save All Cards as PDF - Batch Processing with Progress
// OPTIMIZED: Save All Cards as Multiple PDF Files (9 cards per file = 3 pages)
async function saveAllCardsAsImages() {
    console.log('Generating multiple PDF files for all scene cards...');

    if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        alert('PDF generation library is not loaded. Cannot create PDF.');
        return;
    }

    const allScenes = projectData.projectInfo.scenes;
    if (allScenes.length === 0) {
        alert('No cards to save.');
        return;
    }

    const projectName = projectData.projectInfo.projectName || 'Untitled';
    const cardsPerFile = 27; // 9 pages (3 cards per page)
    const totalFiles = Math.ceil(allScenes.length / cardsPerFile);

    // Confirm with user
const confirmMsg = `This will create ${totalFiles} PDF files with up to 27 cards each (9 pages).\n\n` +
                   `Total scenes: ${allScenes.length}\n` +
                   `Files to be created: ${totalFiles}\n\n` +
                   `Files will be named:\n${projectName}-Part1-Scene1to27.pdf\n${projectName}-Part2-Scene28to54.pdf\netc.\n\n` +
                   `Continue?`;

    
    if (!confirm(confirmMsg)) {
        return;
    }

    showProgressModal(`Preparing to export ${allScenes.length} cards in ${totalFiles} files...`);

    const cardContainer = document.getElementById('card-container');
    if (!cardContainer) {
        hideProgressModal();
        return;
    }

    const originalPage = currentPage;
    
    // Create hidden container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    document.body.appendChild(tempContainer);

    try {
        let successCount = 0;
        let failCount = 0;

        // Split scenes into chunks of 9
        for (let fileIndex = 0; fileIndex < totalFiles; fileIndex++) {
            const startIdx = fileIndex * cardsPerFile;
            const endIdx = Math.min(startIdx + cardsPerFile, allScenes.length);
            const scenesChunk = allScenes.slice(startIdx, endIdx);
            
            const firstScene = startIdx + 1;
            const lastScene = endIdx;
            const partNumber = fileIndex + 1;
            const filename = `${projectName}-Part${partNumber}-Scene${firstScene}to${lastScene}.pdf`;

            updateProgressModal(`Creating file ${partNumber}/${totalFiles}...\n${filename}\n\nProcessing scenes ${firstScene} to ${lastScene}...`);

            // Render this chunk of cards
            tempContainer.innerHTML = scenesChunk.map(scene => `
                <div class="scene-card card-for-export temp-export-card" data-scene-id="${scene.number}" data-scene-number="${scene.number}" style="margin-bottom: 20px;">
                    <div class="scene-card-content">
                        <div class="card-header">
                            <div class="card-scene-title">${scene.heading}</div>
                            <input class="card-scene-number" type="text" value="${scene.number}" maxlength="4">
                        </div>
                        <div class="card-body">
                            <textarea class="card-description">${scene.description.join('\n')}</textarea>
                        </div>
                        <div class="card-watermark">TO SCRIPT</div>
                    </div>
                </div>
            `).join('');

            const cards = tempContainer.querySelectorAll('.temp-export-card');

            // Create PDF for this chunk
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const cardWidthMM = 127;
            const cardHeightMM = 76;
            const pageHeightMM = 297;
            const pageWidthMM = 210;
            const topMarginMM = 15;
            const leftMarginMM = (pageWidthMM - cardWidthMM) / 2;
            const gapMM = 15;

            let x = leftMarginMM;
            let y = topMarginMM;

            try {
                for (let i = 0; i < cards.length; i++) {
                    updateProgressModal(`Creating file ${partNumber}/${totalFiles}...\n${filename}\n\nCard ${i + 1}/${cards.length} (Scene ${startIdx + i + 1})`);

                    const blob = await generateCardImageBlob(cards[i]);
                    if (!blob) continue;

                    const dataUrl = URL.createObjectURL(blob);

                    if (y + cardHeightMM > pageHeightMM - topMarginMM) {
                        doc.addPage();
                        y = topMarginMM;
                    }

                    doc.addImage(dataUrl, 'PNG', x, y, cardWidthMM, cardHeightMM);
                    URL.revokeObjectURL(dataUrl);

                    y += cardHeightMM + gapMM;

                    // Small delay between cards
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Save this PDF file
                doc.save(filename);
                successCount++;
                
                // Delay between files to allow download
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`Failed to create ${filename}`, error);
                failCount++;
            }

            // Clear temp container between files
            tempContainer.innerHTML = '';
            
            // Memory cleanup delay between files
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        hideProgressModal();
        
        // Show summary
        if (successCount === totalFiles) {
            alert(`✅ Success!\n\n${successCount} PDF files created successfully!\n\nTotal scenes exported: ${allScenes.length}\n\nFiles are named:\n${projectName}-Part1-Scene1to9.pdf\n${projectName}-Part2-Scene10to18.pdf\netc.\n\nCheck your Downloads folder!`);
        } else {
            alert(`⚠️ Partial Success\n\n${successCount} of ${totalFiles} files created.\n${failCount} files failed.\n\nCheck your Downloads folder for completed files.`);
        }

    } catch (error) {
        console.error('Failed to generate PDFs', error);
        hideProgressModal();
        alert('❌ An error occurred during export.\n\nPlease try:\n1. Refresh the page\n2. Close other tabs to free memory\n3. Try "Save Visible Cards" instead');
    } finally {
        // Cleanup
        try {
            document.body.removeChild(tempContainer);
        } catch (e) {
            console.warn('Temp container already removed');
        }

        // Restore view
        currentPage = originalPage;
        
        setTimeout(() => {
            renderEnhancedCardView();
            
            setTimeout(() => {
                bindCardEditingEvents();
                
                if (cardHeader && currentView === 'card') {
                    cardHeader.style.display = 'flex';
                }
                
                if (window.innerWidth < 768) {
                    setupMobileCardActions();
                }
                
                console.log('Card view restored after multi-file PDF export');
            }, 100);
        }, 100);
    }
}


	// NEW: Progress Modal Functions
function showProgressModal(message) {
    let progressModal = document.getElementById('progress-modal');
    
    if (!progressModal) {
        const modalHTML = `
            <div id="progress-modal" class="modal open" style="z-index: 9999;">
                <div class="modal-content" style="max-width: 400px; text-align: center;">
                    <div class="modal-body">
                        <div style="margin: 20px 0;">
                            <div style="width: 50px; height: 50px; border: 5px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; margin: 0 auto 20px; animation: spin 1s linear infinite;"></div>
                            <p id="progress-message" style="font-size: 1.1rem; font-weight: 600; color: var(--text-color); white-space: pre-line;">${message}</p>
                            <p style="margin-top: 15px; font-size: 0.9rem; color: var(--muted-text-color);">Please wait, do not close this window...</p>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        progressModal = document.getElementById('progress-modal');
    } else {
        progressModal.classList.add('open');
        document.getElementById('progress-message').textContent = message;
    }
}

function updateProgressModal(message) {
    const progressMessage = document.getElementById('progress-message');
    if (progressMessage) {
        progressMessage.textContent = message;
    }
}

function hideProgressModal() {
    const progressModal = document.getElementById('progress-modal');
    if (progressModal) {
        progressModal.classList.remove('open');
        setTimeout(() => {
            progressModal.remove();
        }, 300);
    }
}

    // Generate Card Image Blob
    async function generateCardImageBlob(cardElement) {
        const sceneNumber = cardElement.querySelector('.card-scene-number')?.value || '1';
        const sceneHeading = cardElement.querySelector('.card-scene-title')?.textContent.trim().toUpperCase() || 'UNTITLED SCENE';
        const description = cardElement.querySelector('.card-description')?.value || '';

        const printableCard = document.createElement('div');
        printableCard.style.cssText = `
            position: absolute;
            left: -9999px;
            width: 480px;
            height: 288px;
            background-color: #ffffff;
            border: 1.5px solid #000000;
            font-family: 'Courier Prime', 'Courier New', monospace;
            color: #000000;
            font-weight: 500;
            padding: 15px;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        `;

        const descriptionSummary = description.split('\n').slice(0, 4).join('<br>');

        printableCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 10px;">
                <span style="font-size: 14px; font-weight: 700;">${sceneHeading}</span>
                <span style="font-size: 14px; font-weight: 700;">${sceneNumber}</span>
            </div>
            <div style="flex-grow: 1; font-size: 15px; line-height: 1.6;">${descriptionSummary}</div>
            <div style="font-size: 10px; text-align: right; opacity: 0.6; margin-top: auto;">ToscripT</div>
        `;

        document.body.appendChild(printableCard);

        return new Promise(async (resolve) => {
            try {
                const canvas = await html2canvas(printableCard, {
                    scale: 3,
                    backgroundColor: '#ffffff'
                });
                canvas.toBlob(blob => {
                    resolve(blob);
                }, 'image/png', 0.95);
            } catch (error) {
                console.error('Card image generation failed', error);
                resolve(null);
            } finally {
                document.body.removeChild(printableCard);
            }
        });
    }

    async function shareSceneCard(sceneId) {
        const cardElement = document.querySelector(`.card-for-export[data-scene-id="${sceneId}"]`);
        if (!cardElement) {
            alert('Could not find the card to share.');
            return;
        }

        const blob = await generateCardImageBlob(cardElement);
        if (!blob) {
            alert('Failed to create card image.');
            return;
        }

        const sceneNumber = cardElement.querySelector('.card-scene-number')?.value || '';
        const sceneHeading = cardElement.querySelector('.card-scene-title')?.textContent || 'Scene';
        const fileName = `Scene${sceneNumber}-${sceneHeading.replace(/[^a-zA-Z0-9]/g, '')}.png`;

        if (navigator.share && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
            const file = new File([blob], fileName, { type: 'image/png' });
            try {
                await navigator.share({
                    files: [file],
                    title: sceneHeading,
                    text: `Scene card from ToscripT: ${sceneHeading}`
                });
            } catch (error) {
                console.log('Share was cancelled or failed', error);
            }
        } else {
            downloadBlob(blob, fileName);
        }
    }

    // Action Button Handler
   // UPDATED: Action Button Handler with Smart Cycling
function handleActionBtn(action) {
    if (!fountainInput) return;
    
    clearPlaceholder();

    const start = fountainInput.selectionStart;
    const end = fountainInput.selectionEnd;
    const text = fountainInput.value;
    const beforeCursor = text.substring(0, start);
    const afterCursor = text.substring(end);
    
    // Get current line
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const lineEnd = text.indexOf('\n', end);
    const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
    const selectedText = text.substring(start, end);

    let newText = '';
    let newCursorPos = start;
    let replaceWholeLine = false;

    if (action === 'scene') {
        // Smart cycling: INT. → EXT. → INT./EXT. → INT.
        if (selectedText) {
            newText = cycleSceneType(selectedText);
        } else if (currentLine.trim().match(/^(INT\.|EXT\.|INT\.\/EXT\.)/i)) {
            // If cursor is on a scene heading line, cycle the whole line
            newText = cycleSceneType(currentLine.trim());
            replaceWholeLine = true;
        } else {
            // Insert INT. at cursor
            newText = 'INT. ';
        }
    } else if (action === 'time') {
        // Smart cycling: - DAY → - NIGHT → - DAY
        if (selectedText) {
            newText = cycleTimeOfDay(selectedText);
        } else if (currentLine.match(/-(DAY|NIGHT)/i)) {
            // If line already has time, cycle it
            newText = cycleTimeOfDay(currentLine);
            replaceWholeLine = true;
        } else {
            // Insert - DAY at cursor
            newText = ' - DAY';
        }
    } else if (action === 'caps') {
        // Toggle CAPS for selected text
        if (selectedText) {
            newText = selectedText === selectedText.toUpperCase() 
                ? selectedText.toLowerCase() 
                : selectedText.toUpperCase();
        } else {
            // No selection, do nothing
            return;
        }
    } else if (action === 'parens') {
        // Add parentheses around selected text or insert empty parens
        if (selectedText) {
            newText = `(${selectedText})`;
        } else {
            newText = '()';
            // Position cursor inside parentheses
            fountainInput.value = beforeCursor + newText + afterCursor;
            fountainInput.setSelectionRange(start + 1, start + 1);
            fountainInput.focus();
            history.add(fountainInput.value);
            saveProjectData();
            return;
        }
    } else if (action === 'transition') {
        // Smart cycling: CUT TO: → FADE IN: → FADE OUT: → FADE TO BLACK: → DISSOLVE TO: → CUT TO:
        if (selectedText) {
            newText = cycleTransition(selectedText);
        } else if (currentLine.trim().match(/(CUT TO:|FADE IN:|FADE OUT:|FADE TO BLACK:|DISSOLVE TO:)/i)) {
            // If line is a transition, cycle it
            newText = cycleTransition(currentLine.trim());
            replaceWholeLine = true;
        } else {
            // Insert CUT TO: at cursor
            newText = 'CUT TO:';
        }
    }

    // Apply changes
    if (replaceWholeLine) {
        fountainInput.value = text.substring(0, lineStart) + newText + text.substring(lineEnd === -1 ? text.length : lineEnd);
        newCursorPos = lineStart + newText.length;
    } else {
        fountainInput.value = beforeCursor + newText + afterCursor;
        newCursorPos = start + newText.length;
    }

    fountainInput.setSelectionRange(newCursorPos, newCursorPos);
    fountainInput.focus();

    history.add(fountainInput.value);
    saveProjectData();
}


// UPDATED: Cycle Scene Type (INT. → EXT. → INT./EXT. → INT.)
function cycleSceneType(text) {
    const trimmed = text.trim().toUpperCase();
    
    if (trimmed.startsWith('INT./EXT.') || trimmed.includes('INT./EXT.')) {
        return text.replace(/INT\.\/EXT\./i, 'INT.');
    } else if (trimmed.startsWith('EXT.') || trimmed.includes('EXT.')) {
        return text.replace(/EXT\./i, 'INT./EXT.');
    } else if (trimmed.startsWith('INT.') || trimmed.includes('INT.')) {
        return text.replace(/INT\./i, 'EXT.');
    } else {
        return 'INT. ' + text;
    }
}

	// UPDATED: Cycle Time of Day (- DAY → - NIGHT → - DAY)
function cycleTimeOfDay(text) {
    const trimmed = text.trim().toUpperCase();
    
    if (trimmed.includes('- NIGHT') || trimmed.includes('-NIGHT')) {
        return text.replace(/\s*-\s*NIGHT/i, ' - DAY');
    } else if (trimmed.includes('- DAY') || trimmed.includes('-DAY')) {
        return text.replace(/\s*-\s*DAY/i, ' - NIGHT');
    } else {
        return text + ' - DAY';
    }
}

	// UPDATED: Cycle Transitions (CUT TO: → FADE IN: → FADE OUT: → FADE TO BLACK: → DISSOLVE TO: → CUT TO:)
function cycleTransition(text) {
    const trimmed = text.trim().toUpperCase();
    
    if (trimmed.includes('CUT TO:')) {
        return text.replace(/CUT TO:/i, 'FADE IN:');
    } else if (trimmed.includes('FADE IN:')) {
        return text.replace(/FADE IN:/i, 'FADE OUT:');
    } else if (trimmed.includes('FADE OUT:')) {
        return text.replace(/FADE OUT:/i, 'FADE TO BLACK:');
    } else if (trimmed.includes('FADE TO BLACK:')) {
        return text.replace(/FADE TO BLACK:/i, 'DISSOLVE TO:');
    } else if (trimmed.includes('DISSOLVE TO:')) {
        return text.replace(/DISSOLVE TO:/i, 'CUT TO:');
    } else {
        return 'CUT TO:';
    }
}
	
	
    // Scene Navigator with Drag & Drop
    function updateSceneNavigator() {
        if (!sceneList) return;

        console.log('=== UPDATING SCENE NAVIGATOR ===');
        sceneList.innerHTML = '';
        
        const lines = fountainInput.value.split('\n');
        let sceneIndex = 0;
        
        lines.forEach((line) => {
            const trimmedLine = line.trim().toUpperCase();
            if (trimmedLine.startsWith('INT.') || trimmedLine.startsWith('EXT.')) {
                const li = document.createElement('li');
                li.textContent = line.trim();
                li.className = 'p-2 text-gray-300 bg-gray-700 rounded-md mb-2 cursor-grab hover:bg-gray-600';
                li.draggable = true;
                li.dataset.sceneIndex = sceneIndex++;
                sceneList.appendChild(li);
            }
        });

        if (sceneList.children.length === 0) {
            sceneList.innerHTML = '<li class="p-2 text-gray-400 text-center">No scenes found</li>';
        }
    }

    let draggedItem = null;

    sceneList.addEventListener('dragstart', e => {
        draggedItem = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    });

    sceneList.addEventListener('dragend', e => {
        e.target.classList.remove('dragging');
    });

    sceneList.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(sceneList, e.clientY);
        if (afterElement == null) {
            sceneList.appendChild(draggedItem);
        } else {
            sceneList.insertBefore(draggedItem, afterElement);
        }
    });

    sceneList.addEventListener('drop', () => {
        reorderScript();
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function reorderScript() {
        console.log('=== REORDERING SCRIPT ===');
        const fullText = fountainInput.value;
        const lines = fullText.split('\n');

        const sceneBlocks = [];
        let nonSceneHeader = [];
        let currentSceneBlock = [];
        let isFirstSceneFound = false;

        lines.forEach(line => {
            const isSceneHeading = line.trim().toUpperCase().startsWith('INT.') || line.trim().toUpperCase().startsWith('EXT.');
            
            if (isSceneHeading) {
                if (!isFirstSceneFound) {
                    isFirstSceneFound = true;
                }
                if (currentSceneBlock.length > 0) {
                    sceneBlocks.push(currentSceneBlock.join('\n'));
                }
                currentSceneBlock = [line];
            } else {
                if (isFirstSceneFound) {
                    currentSceneBlock.push(line);
                } else {
                    nonSceneHeader.push(line);
                }
            }
        });
        
        if (currentSceneBlock.length > 0) {
            sceneBlocks.push(currentSceneBlock.join('\n'));
        }

        const newOrderIndices = [...sceneList.querySelectorAll('li')].map(li => parseInt(li.dataset.sceneIndex));
        const reorderedSceneBlocks = newOrderIndices.map(index => sceneBlocks[index]);

        const headerText = nonSceneHeader.join('\n');
        const newScriptArray = [];

        if (headerText.trim() !== '') {
            newScriptArray.push(headerText);
        }
        newScriptArray.push(...reorderedSceneBlocks);

        fountainInput.value = newScriptArray.join('\n\n');
        history.add(fountainInput.value);
        saveProjectData();
        
        console.log('Script reordered successfully');
    }

    function jumpToScene(sceneNumber) {
        if (!fountainInput) return;

        const lines = fountainInput.value.split('\n');
        let currentScene = 0;
        let targetLine = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.toUpperCase().startsWith('INT.') || line.toUpperCase().startsWith('EXT.')) {
                currentScene++;
                if (currentScene === sceneNumber) {
                    targetLine = i;
                    break;
                }
            }
        }

        const textBeforeTarget = lines.slice(0, targetLine).join('\n');
        fountainInput.setSelectionRange(textBeforeTarget.length, textBeforeTarget.length);
        fountainInput.focus();

        switchView('write');
        if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open');
    }

    function exportSceneOrderAsText() {
        const scenes = projectData.projectInfo.scenes;
        if (scenes.length === 0) {
            alert('No scenes to export');
            return;
        }

        let orderText = `SCENE ORDER - ${projectData.projectInfo.projectName || 'Untitled'}\n`;
        orderText += `Generated: ${new Date().toLocaleString()}\n`;
        orderText += '='.repeat(60) + '\n\n';

        scenes.forEach(scene => {
            orderText += `Scene ${scene.number}: ${scene.heading}\n`;
            orderText += `  Location: ${scene.location}\n`;
            orderText += `  Time: ${scene.timeOfDay}\n`;
            orderText += `  Type: ${scene.sceneType}\n`;
            if (scene.characters.length > 0) {
                orderText += `  Characters: ${scene.characters.join(', ')}\n`;
            }
            orderText += '\n';
        });

        const blob = new Blob([orderText], { type: 'text/plain' });
        downloadBlob(blob, `${projectData.projectInfo.projectName || 'screenplay'}-scene-order.txt`);
    }

    // Mobile Card Actions - Show/Hide on Tap
    function setupMobileCardActions() {
        if (window.innerWidth > 768) return;
        
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;
        
        console.log('Setting up mobile card actions...');
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.scene-card') && !e.target.closest('.card-actions')) {
                document.querySelectorAll('.scene-card.active').forEach(card => {
                    card.classList.remove('active');
                });
            }
        });
        
        cardContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.scene-card');
            
            if (e.target.closest('.card-actions')) {
                return;
            }
            
            if (e.target.closest('.card-scene-title') || 
                e.target.closest('.card-description') || 
                e.target.closest('.card-scene-number')) {
                return;
            }
            
            if (card) {
                e.stopPropagation();
                
                const wasActive = card.classList.contains('active');
                
                document.querySelectorAll('.scene-card.active').forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.classList.remove('active');
                    }
                });
                
                if (wasActive) {
                    card.classList.remove('active');
                } else {
                    card.classList.add('active');
                }
            }
        });
        
        console.log('Mobile card actions setup complete');
    }

    // Filter Functions
    function handleFilterChange() {
        const category = filterCategorySelect?.value;
        
        if (!category || category === 'all') {
            if (filterValueInput) filterValueInput.style.display = 'none';
            if (filterHelpText) filterHelpText.style.display = 'none';
            updateSceneNavigator();
        } else {
            if (filterValueInput) filterValueInput.style.display = 'block';
            if (filterHelpText) filterHelpText.style.display = 'block';
            if (filterValueInput) filterValueInput.value = '';
            if (filterValueInput) filterValueInput.focus();
        }
    }

    function applyFilter() {
        console.log('Apply filter called');
    }

    // Indicator functions
    function updateSceneNoIndicator() {
        const indicator = document.getElementById('scene-no-indicator');
        if (indicator) {
            indicator.className = 'indicator ' + (showSceneNumbers ? 'on' : 'off');
        }
    }

    function updateAutoSaveIndicator() {
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.className = 'indicator ' + (autoSaveInterval ? 'on' : 'off');
        }
    }

    function toggleSceneNumbers() {
        showSceneNumbers = !showSceneNumbers;
        updateSceneNoIndicator();
        if (currentView === 'script') {
            renderEnhancedScript();
        }
    }

    function toggleAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        } else {
            autoSaveInterval = setInterval(() => {
                saveProjectData();
            }, 30000);
        }
        updateAutoSaveIndicator();
    }

    // Zoom functions
    function handleZoomIn() {
        if (fontSize < 24) {
            fontSize += 2;
            if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
        }
    }

    function handleZoomOut() {
        if (fontSize > 12) {
            fontSize -= 2;
            if (fountainInput) fountainInput.style.fontSize = `${fontSize}px`;
        }
    }

    // File operations
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    function saveAsFountain() {
        if (!fountainInput || isPlaceholder()) return;
        const blob = new Blob([fountainInput.value], { type: 'text/plain' });
        downloadBlob(blob, `${projectData.projectInfo.projectName || 'screenplay'}.fountain`);
    }

    function saveAsFilmProj() {
        alert('Export to .filmproj is a PRO feature. Coming soon!');
    }

    async function saveAsPdfEnglish() {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library not loaded. Please refresh the page.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        if (!screenplayOutput) return;

        try {
            await doc.html(screenplayOutput, {
                callback: function(doc) {
                    doc.save(`${projectData.projectInfo.projectName || 'screenplay'}.pdf`);
                },
                x: 10,
                y: 10,
                width: 190,
                windowWidth: 800
            });
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    }

    async function saveAsPdfUnicode() {
        if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
            alert('Required libraries not loaded. Please refresh the page.');
            return;
        }

        const { jsPDF } = window.jspdf;

        if (!screenplayOutput) return;

        try {
            const canvas = await html2canvas(screenplayOutput, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${projectData.projectInfo.projectName || 'screenplay'}-unicode.pdf`);
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    }
    // File opening
    function openFountainFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            const content = e.target.result;
            
            if (file.name.endsWith('.filmproj')) {
                try {
                    const data = JSON.parse(content);
                    projectData = data;
                    if (fountainInput) {
                        fountainInput.value = projectData.projectInfo.scriptContent || '';
                        fountainInput.classList.remove('placeholder');
                    }
                } catch (err) {
                    console.error('Failed to parse .filmproj file');
                    alert('Invalid .filmproj file');
                }
            } else {
                if (fountainInput) {
                    fountainInput.value = content;
                    fountainInput.classList.remove('placeholder');
                }
            }

            history.add(fountainInput.value);
            saveProjectData();
            if (menuPanel) menuPanel.classList.remove('open');
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // Modal functions
    function createModal(id, title, bodyHTML, footerHTML) {
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="icon-btn close-modal-btn">&times;</button>
                </div>
                <div class="modal-body">${bodyHTML}</div>
                ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
            </div>
        `;

        const closeBtn = modal.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('open');
            });
        }

        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.classList.remove('open');
            }
        });
    }

    function openProjectInfoModal() {
        const modal = document.getElementById('project-info-modal');
        if (!modal) return;

        createModal(
            'project-info-modal',
            'Project Info',
            `
                <div class="form-group">
                    <label>Project Name</label>
                    <input type="text" id="project-name-input" value="${projectData.projectInfo.projectName || ''}" placeholder="Untitled">
                </div>
                <div class="form-group">
                    <label>Production Name</label>
                    <input type="text" id="prod-name-input" value="${projectData.projectInfo.prodName || ''}" placeholder="Author">
                </div>
            `,
            '<button id="save-project-info-btn" class="main-action-btn">Save</button>'
        );

        modal.classList.add('open');

        const saveBtn = document.getElementById('save-project-info-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', handleSaveProjectInfo);
        }

        if (menuPanel) menuPanel.classList.remove('open');
    }

    function handleSaveProjectInfo() {
        const projectNameInput = document.getElementById('project-name-input');
        const prodNameInput = document.getElementById('prod-name-input');

        if (projectNameInput) projectData.projectInfo.projectName = projectNameInput.value;
        if (prodNameInput) projectData.projectInfo.prodName = prodNameInput.value;

        saveProjectData();

        const modal = document.getElementById('project-info-modal');
        if (modal) modal.classList.remove('open');
    }

    function openTitlePageModal() {
        const modal = document.getElementById('title-page-modal');
        if (!modal) return;

        createModal(
            'title-page-modal',
            'Title Page',
            `
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="title-input" placeholder="Enter screenplay title">
                </div>
                <div class="form-group">
                    <label>Author</label>
                    <input type="text" id="author-input" placeholder="Written by">
                </div>
                <div class="form-group">
                    <label>Credit</label>
                    <input type="text" id="credit-input" placeholder="e.g., Screenplay by">
                </div>
            `,
            '<button id="save-title-page-btn" class="main-action-btn">Insert Title Page</button>'
        );

        modal.classList.add('open');

        const saveBtn = document.getElementById('save-title-page-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveTitlePage);
        }

        if (menuPanel) menuPanel.classList.remove('open');
    }

    function saveTitlePage() {
        const titleInput = document.getElementById('title-input');
        const authorInput = document.getElementById('author-input');
        const creditInput = document.getElementById('credit-input');

        clearPlaceholder();

        let titlePage = '';
        if (titleInput?.value) titlePage += `TITLE: ${titleInput.value}\n`;
        if (authorInput?.value) titlePage += `AUTHOR: ${authorInput.value}\n`;
        if (creditInput?.value) titlePage += `CREDIT: ${creditInput.value}\n`;

        if (titlePage && fountainInput) {
            fountainInput.value = titlePage + '\n\n' + fountainInput.value;
            history.add(fountainInput.value);
            saveProjectData();
        }

        const modal = document.getElementById('title-page-modal');
        if (modal) modal.classList.remove('open');
    }

    async function shareScript() {
        if (!fountainInput || isPlaceholder()) return;

        const scriptText = fountainInput.value;
        const shareData = {
            title: projectData.projectInfo.projectName || 'Screenplay',
            text: scriptText
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            const blob = new Blob([scriptText], { type: 'text/plain' });
            downloadBlob(blob, `${projectData.projectInfo.projectName || 'screenplay'}.fountain`);
        }

        if (menuPanel) menuPanel.classList.remove('open');
    }

	function openInfoModal() {
	    const modal = document.getElementById('info-modal');
	    if (!modal) return;

	    createModal(
	        'info-modal',
	        '📖 Info & Help',
	        `
	            <div style="max-height: 60vh; overflow-y: auto; padding-right: 10px;">
	                <h3 style="color: var(--primary-color); margin-top: 0;">🎬 Fountain Syntax Guide</h3>
                
	                <p><strong>Scene Headings:</strong> Start with INT. or EXT.</p>
	                <p style="margin-left: 20px; color: var(--muted-text-color);"><code>INT. OFFICE - DAY</code></p>
                
	                <p><strong>Character Names:</strong> All caps on their own line</p>
	                <p style="margin-left: 20px; color: var(--muted-text-color);"><code>JOHN</code></p>
                
	                <p><strong>Dialogue:</strong> Text below character name</p>
                
	                <p><strong>Parentheticals:</strong> In parentheses</p>
	                <p style="margin-left: 20px; color: var(--muted-text-color);"><code>(smiling)</code></p>
                
	                <p><strong>Transitions:</strong> Right-aligned, ends with TO:</p>
	                <p style="margin-left: 20px; color: var(--muted-text-color);"><code>CUT TO:</code></p>
                
	                <p><strong>Action:</strong> Any other text (scene description)</p>
                
	                <hr style="border: 1px solid var(--border-color); margin: 20px 0;">
                
	                <h3 style="color: var(--primary-color);">🎯 App Features</h3>
                
	                <p><strong>📝 Write Mode:</strong></p>
	                <ul style="margin-left: 20px; line-height: 1.8;">
	                    <li><strong>Desktop Toolbar:</strong> INT/EXT, DAY/NIGHT, CAPS, (), Transitions</li>
	                    <li><strong>Mobile Toolbar:</strong> Same buttons appear when keyboard is open</li>
	                    <li><strong>Undo/Redo:</strong> Track all changes</li>
	                    <li><strong>Fullscreen:</strong> Distraction-free writing</li>
	                </ul>
                
	                <p><strong>📄 Script Mode:</strong></p>
	                <ul style="margin-left: 20px; line-height: 1.8;">
	                    <li>Industry-standard formatted preview</li>
	                    <li>Scene numbers toggle</li>
	                    <li>Export as PDF (English/Unicode)</li>
	                </ul>
                
	                <p><strong>🃏 Card Mode:</strong></p>
	                <ul style="margin-left: 20px; line-height: 1.8;">
	                    <li><strong>Desktop:</strong> Grid view with hover actions</li>
	                    <li><strong>Mobile:</strong> 5 cards per page with pagination</li>
	                    <li><strong>Tap card:</strong> Show share/delete/add buttons</li>
	                    <li><strong>+ Button:</strong> Add new scene below current card</li>
	                    <li><strong>Save Button:</strong> Export visible or all cards as PDF</li>
	                </ul>
                
	                <p><strong>🧭 Scene Navigator:</strong></p>
	                <ul style="margin-left: 20px; line-height: 1.8;">
	                    <li>Drag and drop to reorder scenes</li>
	                    <li>Filter by location, time, character</li>
	                    <li>Export scene order as text</li>
	                    <li>Click scene to jump to it in editor</li>
	                </ul>
                
	                <p><strong>💾 File Operations:</strong></p>
	                <ul style="margin-left: 20px; line-height: 1.8;">
	                    <li><strong>New:</strong> Start fresh project</li>
	                    <li><strong>Open:</strong> Import .fountain files</li>
	                    <li><strong>Save:</strong> Export as Fountain or PDF</li>
	                    <li><strong>Auto-Save:</strong> Saves to browser every 30 seconds</li>
	                    <li><strong>Share:</strong> Share script via native share menu</li>
	                </ul>
                
	                <p><strong>⚙️ Settings:</strong></p>
	                <ul style="margin-left: 20px; line-height: 1.8;">
	                    <li><strong>Project Info:</strong> Set project name and author</li>
	                    <li><strong>Title Page:</strong> Add formatted title page</li>
	                    <li><strong>Scene Numbers:</strong> Toggle on/off in preview</li>
	                    <li><strong>Zoom:</strong> Adjust editor font size</li>
	                </ul>
                
	                <hr style="border: 1px solid var(--border-color); margin: 20px 0;">
                
	                <p style="color: var(--muted-text-color); font-size: 0.9rem;">
	                    <strong>💡 Tip:</strong> All data is saved locally in your browser. 
	                    Use "Save" to export important work!
	                </p>
	            </div>
	        `,
	        ''
	    );

	    modal.classList.add('open');
	    if (menuPanel) menuPanel.classList.remove('open');
	}
    
	function openAboutModal() {
	    const modal = document.getElementById('about-modal');
	    if (!modal) return;

	    createModal(
	        'about-modal',
	        'About ToscripT',
	        `
	            <div style="text-align: center; padding: 20px;">
	                <h3 style="color: var(--primary-color); margin-top: 0; font-size: 1.8rem;">🎬 ToscripT </h3>
	                <p style="font-size: 1.1rem; color: var(--muted-text-color);">
	                    A professional screenwriting tool for Android
	                </p>
                
	                <div style="margin: 30px 0; padding: 20px; background: var(--background-color); border-radius: 8px; border: 1px solid var(--border-color);">
	                    <p><strong>Version:</strong> 2.5</p>
	                    <p><strong>Format:</strong> Fountain Markup</p>
	                    <p><strong>Platform:</strong> Android </p>
	                </div>
                
	                <p style="line-height: 1.8; margin: 20px 0;">
	                    Write, preview, and export professional screenplays anywhere. 
	                    Features drag-and-drop scene organization, index card mode, 
	                    and industry-standard PDF export.
	                </p>
                
	                <hr style="border: 1px solid var(--border-color); margin: 30px 0;">
                
	                <p style="font-size: 0.95rem; color: var(--muted-text-color); margin-bottom: 15px;">
	                   with Love for Film Making, Developed by
	                </p>
                
	                <a href="https://thosho.github.io/" 
	                   target="_blank" 
	                   rel="noopener noreferrer"
	                   style="
	                       display: inline-block;
	                       background: linear-gradient(135deg, var(--primary-color), #2563eb);
	                       color: white;
	                       text-decoration: none;
	                       padding: 12px 30px;
	                       border-radius: 8px;
	                       font-weight: bold;
	                       font-size: 1.1rem;
	                       transition: all 0.3s ease;
	                       box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	                   "
	                   onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.5)';"
	                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)';">
	                    @ThoshoTech
	                </a>
                
	                <p style="margin-top: 20px; font-size: 0.85rem; color: var(--muted-text-color);">
	                    © 2025 ThoshoTech. All rights reserved.
	                </p>
	            </div>
	        `,
	        ''
	    );

	    modal.classList.add('open');
	    if (menuPanel) menuPanel.classList.remove('open');
	}
    
    function handleNewProject() {
        if (confirm('Start a new project? Unsaved changes will be lost.')) {
            if (fountainInput) {
                fountainInput.value = '';
                fountainInput.classList.remove('placeholder');
            }
            setPlaceholder();
            projectData = {
                projectInfo: {
                    projectName: 'Untitled',
                    prodName: 'Author',
                    scriptContent: '',
                    scenes: []
                }
            };
            history.stack = [];
            history.currentIndex = 0;
            if (fountainInput) {
                history.add(fountainInput.value);
            }
            saveProjectData();
            
            if (currentView === 'card') {
                switchView('write');
            }
        }
        if (menuPanel) menuPanel.classList.remove('open');
    }

    function handleClearProject() {
        if (confirm('Clear all project data? This cannot be undone.')) {
            localStorage.removeItem('universalFilmProjectToScript');
            if (fountainInput) {
                fountainInput.value = '';
                fountainInput.classList.remove('placeholder');
            }
            setPlaceholder();
            projectData = {
                projectInfo: {
                    projectName: 'Untitled',
                    prodName: 'Author',
                    scriptContent: '',
                    scenes: []
                }
            };
            history.stack = [];
            history.currentIndex = 0;
            if (fountainInput) {
                history.add(fountainInput.value);
            }
            
            if (currentView === 'card') {
                switchView('write');
            }
        }
        if (menuPanel) menuPanel.classList.remove('open');
    }

    // EVENT LISTENERS SETUP
    function setupEventListeners() {
        console.log('Setting up event listeners...');

        window.jumpToScene = jumpToScene;

        if (fountainInput) {
            fountainInput.addEventListener('input', () => {
                if (isUpdatingFromSync) {
                    console.log('Skipping input event - sync in progress');
                    return;
                }
                clearPlaceholder();
                history.add(fountainInput.value);
                saveProjectData();

                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    if (!isPlaceholder()) {
                        projectData.projectInfo.scenes = extractScenesFromText(fountainInput.value);
                        if (currentView === 'card') {
                            renderEnhancedCardView();
                        }
                    }
                }, 500);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', openFountainFile);
        }

        // View switching
        const showScriptBtn = document.getElementById('show-script-btn');
        if (showScriptBtn) {
            showScriptBtn.addEventListener('click', () => switchView('script'));
        }

        const showWriteBtnHeader = document.getElementById('show-write-btn-header');
        if (showWriteBtnHeader) {
            showWriteBtnHeader.addEventListener('click', () => switchView('write'));
        }

        const showWriteBtnCard = document.getElementById('show-write-btn-card-header');
        if (showWriteBtnCard) {
            showWriteBtnCard.addEventListener('click', () => switchView('write'));
        }

        const cardViewBtn = document.getElementById('card-view-btn');
        if (cardViewBtn) {
            cardViewBtn.addEventListener('click', () => switchView('card'));
        }

        // Hamburger menus
        ['hamburger-btn', 'hamburger-btn-script', 'hamburger-btn-card'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    if (menuPanel) menuPanel.classList.toggle('open');
                });
            }
        });

        // Scene navigator
        ['scene-navigator-btn', 'scene-navigator-btn-script'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    updateSceneNavigator();
                    if (sceneNavigatorPanel) sceneNavigatorPanel.classList.add('open');
                });
            }
        });

        const closeNavigatorBtn = document.getElementById('close-navigator-btn');
        if (closeNavigatorBtn) {
            closeNavigatorBtn.addEventListener('click', () => {
                if (sceneNavigatorPanel) sceneNavigatorPanel.classList.remove('open');
            });
        }

        if (filterCategorySelect) {
            filterCategorySelect.addEventListener('change', handleFilterChange);
        }

        if (filterValueInput) {
            filterValueInput.addEventListener('input', applyFilter);
        }

        const exportBtn = document.getElementById('export-scene-order-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportSceneOrderAsText);
        }

        // FIXED: Add new card button (header)
        const addNewCardBtn = document.getElementById('add-new-card-btn');
        if (addNewCardBtn) {
            addNewCardBtn.addEventListener('click', () => addNewSceneCard());
        }

        // FIXED: Save all cards button - now shows modal
        const saveAllCardsBtn = document.getElementById('save-all-cards-btn');
        if (saveAllCardsBtn) {
            saveAllCardsBtn.addEventListener('click', showSaveCardsModal);
        }

        // Menu handlers
        const newBtn = document.getElementById('new-btn');
        if (newBtn) {
            newBtn.addEventListener('click', e => {
                e.preventDefault();
                handleNewProject();
            });
        }

        const openBtn = document.getElementById('open-btn');
        if (openBtn) {
            openBtn.addEventListener('click', e => {
                e.preventDefault();
                if (fileInput) fileInput.click();
            });
        }

        const projectInfoBtn = document.getElementById('project-info-btn');
        if (projectInfoBtn) {
            projectInfoBtn.addEventListener('click', e => {
                e.preventDefault();
                openProjectInfoModal();
            });
        }

        const titlePageBtn = document.getElementById('title-page-btn');
        if (titlePageBtn) {
            titlePageBtn.addEventListener('click', e => {
                e.preventDefault();
                openTitlePageModal();
            });
        }

        const saveMenuBtn = document.getElementById('save-menu-btn');
        if (saveMenuBtn) {
            saveMenuBtn.addEventListener('click', e => {
                e.preventDefault();
                const dropdown = saveMenuBtn.closest('.dropdown-container');
                if (dropdown) dropdown.classList.toggle('open');
            });
        }

        const saveFountainBtn = document.getElementById('save-fountain-btn');
        if (saveFountainBtn) {
            saveFountainBtn.addEventListener('click', e => {
                e.preventDefault();
                saveAsFountain();
                if (menuPanel) menuPanel.classList.remove('open');
            });
        }

        const savePdfEnglishBtn = document.getElementById('save-pdf-english-btn');
        if (savePdfEnglishBtn) {
            savePdfEnglishBtn.addEventListener('click', e => {
                e.preventDefault();
                saveAsPdfEnglish();
                if (menuPanel) menuPanel.classList.remove('open');
            });
        }

        const savePdfUnicodeBtn = document.getElementById('save-pdf-unicode-btn');
        if (savePdfUnicodeBtn) {
            savePdfUnicodeBtn.addEventListener('click', e => {
                e.preventDefault();
                saveAsPdfUnicode();
                if (menuPanel) menuPanel.classList.remove('open');
            });
        }

        const saveFilmprojBtn = document.getElementById('save-filmproj-btn');
        if (saveFilmprojBtn) {
            saveFilmprojBtn.addEventListener('click', e => {
                e.preventDefault();
                saveAsFilmProj();
                if (menuPanel) menuPanel.classList.remove('open');
            });
        }

        const autoSaveBtn = document.getElementById('auto-save-btn');
        if (autoSaveBtn) {
            autoSaveBtn.addEventListener('click', e => {
                e.preventDefault();
                toggleAutoSave();
            });
        }

        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', e => {
                e.preventDefault();
                shareScript();
            });
        }

        const sceneNoBtn = document.getElementById('scene-no-btn');
        if (sceneNoBtn) {
            sceneNoBtn.addEventListener('click', e => {
                e.preventDefault();
                toggleSceneNumbers();
            });
        }

        const clearProjectBtn = document.getElementById('clear-project-btn');
        if (clearProjectBtn) {
            clearProjectBtn.addEventListener('click', e => {
                e.preventDefault();
                handleClearProject();
            });
        }

        const infoBtn = document.getElementById('info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', e => {
                e.preventDefault();
                openInfoModal();
            });
        }

        const aboutBtn = document.getElementById('about-btn');
        if (aboutBtn) {
            aboutBtn.addEventListener('click', e => {
                e.preventDefault();
                openAboutModal();
            });
        }

        const zoomInBtn = document.getElementById('zoom-in-btn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', handleZoomIn);
        }

        const zoomOutBtn = document.getElementById('zoom-out-btn');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', handleZoomOut);
        }

        const undoBtnTop = document.getElementById('undo-btn-top');
        if (undoBtnTop) {
            undoBtnTop.addEventListener('click', () => history.undo());
        }

        const redoBtnTop = document.getElementById('redo-btn-top');
        if (redoBtnTop) {
            redoBtnTop.addEventListener('click', () => history.redo());
        }

        const fullscreenBtnMain = document.getElementById('fullscreen-btn-main');
        if (fullscreenBtnMain) {
            fullscreenBtnMain.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                    document.body.classList.add('fullscreen-active');
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                        document.body.classList.remove('fullscreen-active');
                    }
                }
            });
        }


      // ***** ADD THIS CODE HERE *****
    // Desktop Side Toolbar Buttons
    const desktopActionBtns = document.querySelectorAll('#desktop-side-toolbar .action-btn');
    desktopActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            handleActionBtn(action);
        });
    });

    // Mobile Keyboard Buttons - FIXED
    const mobileKeyboardBtns = document.querySelectorAll('.keyboard-btn');
    mobileKeyboardBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            console.log('Mobile button clicked:', action); // Debug log
            handleActionBtn(action);
        });
    });
    // ***** END OF NEW CODE *****

        document.addEventListener('click', e => {
            if (menuPanel && !e.target.closest('#menu-panel') && !e.target.closest('[id^="hamburger-btn"]')) {
                menuPanel.classList.remove('open');
            }
            if (sceneNavigatorPanel && !e.target.closest('#scene-navigator-panel') && !e.target.closest('[id^="scene-navigator-btn"]')) {
                sceneNavigatorPanel.classList.remove('open');
            }
        });

        console.log('Event listeners setup complete');
    }

    // INITIALIZATION
    function initialize() {
        console.log('Initializing ToscripT...');

        setupEventListeners();
        setupKeyboardDetection();
        loadProjectData();

        if (fountainInput) {
            if (!fountainInput.value || fountainInput.value === placeholderText) {
                setPlaceholder();
            } else {
                fountainInput.classList.remove('placeholder');
            }
            fountainInput.style.fontSize = `${fontSize}px`;
            setTimeout(() => {
                if (currentView === 'write') {
                    fountainInput.focus();
                }
            }, 500);
            history.add(fountainInput.value);
            history.updateButtons();
        }

        if (window.innerWidth < 768) {
            setupMobileCardActions();
        }

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth < 768) {
                    setupMobileCardActions();
                } else {
                    document.querySelectorAll('.scene-card.active').forEach(card => {
                        card.classList.remove('active');
                    });
                }
            }, 200);
        });

        console.log('ToscripT initialized successfully');
    }

    initialize();
});

                          
