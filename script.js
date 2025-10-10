// ToscripT Professional - Complete Version with Original Navigator + Mobile Pagination

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
    let currentPage = 0; // For mobile card pagination
    const cardsPerPage = 5; // Mobile: show 5 cards at a time

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

    // Scene Extraction - Only action in cards
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
                
                // Only add action to description for cards
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
        [mainHeader, scriptHeader, cardHeader].forEach(h => h && (h.style.display = 'none'));
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
            currentPage = 0; // Reset to first page
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

        for(let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const nextLine = (i + 1 < lines.length) ? lines[i+1].trim() : null;

            if (!line) {
                scriptHtml += '<div class="empty-line"></div>';
                inDialogue = false;
                continue;
            }

            if (/^(TITLE|AUTHOR|CREDIT|SOURCE):/i.test(line)) {
                scriptHtml += `<div class="title-page-element">${line}</div>`;
                inDialogue = false;
                continue;
            }

            if (line.toUpperCase().startsWith('INT.') || line.toUpperCase().startsWith('EXT.')) {
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
                continue;
            }

            if (line.toUpperCase().endsWith('TO:') || line.toUpperCase() === 'FADE OUT.' || line.toUpperCase() === 'FADE IN:' || line.toUpperCase() === 'FADE TO BLACK:') {
                scriptHtml += `<div class="transition">${line.toUpperCase()}</div>`;
                inDialogue = false;
                continue;
            }

            if (line === line.toUpperCase() && !line.startsWith('!') && line.length > 0 && nextLine) {
                scriptHtml += `<div class="character">${line}</div>`;
                inDialogue = true;
                continue;
            }

            if (inDialogue && line.startsWith('(')) {
                scriptHtml += `<div class="parenthetical">${line}</div>`;
                continue;
            }

            if (inDialogue) {
                scriptHtml += `<div class="dialogue">${line}</div>`;
                continue;
            }

            scriptHtml += `<div class="action">${line}</div>`;
        }

        screenplayOutput.innerHTML = scriptHtml;
    }

    // Enhanced Card View Rendering (UPDATE THIS FUNCTION)
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

        // Mobile: Show only current page of cards (5 at a time)
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

        // Add pagination controls for mobile
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
            
            // Add pagination event listeners
            document.querySelectorAll('.pagination-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    currentPage = parseInt(e.target.dataset.page);
                    renderEnhancedCardView();
                    bindCardEditingEvents();
                    
                    // Re-setup mobile actions after pagination
                    if (window.innerWidth < 768) {
                        setTimeout(() => setupMobileCardActions(), 100);
                    }
                });
            });
        }

        console.log('Cards rendered successfully');
        
        // Setup mobile card actions after rendering
        if (isMobile) {
            setTimeout(() => {
                setupMobileCardActions();
            }, 100);
        }
    }

    // Card Editing Functions
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

            if (e.target.classList.contains('card-description')) {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
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
                    syncCardsToEditor();
                }
            } else if (e.target.closest('.share-card-btn')) {
                const sceneId = e.target.closest('.share-card-btn').getAttribute('data-scene-id');
                shareSceneCard(sceneId);
            } else if (e.target.closest('.add-card-btn-mobile')) {
                addNewSceneCard();
            }
        }

        const textareas = cardContainer.querySelectorAll('.card-description');
        textareas.forEach(textarea => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
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

    function addNewSceneCard() {
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;

        const allScenes = projectData.projectInfo.scenes;
        const newSceneNumber = allScenes.length + 1;

        // Add to data
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
        
        projectData.projectInfo.scenes.push(newScene);
        
        // Re-render to show new card
        renderEnhancedCardView();
        bindCardEditingEvents();
        
        // Scroll to new card
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

    // Original Card Design
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

    // Original Card PDF Export
    async function saveAllCardsAsImages() {
        console.log('Generating PDF for all scene cards...');

        if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
            alert('PDF generation library is not loaded. Cannot create PDF.');
            return;
        }

        const cards = document.querySelectorAll('.card-for-export');
        if (cards.length === 0) {
            alert('No cards to save.');
            return;
        }

        alert(`Preparing to generate a PDF with ${cards.length} cards. This may take a moment...`);

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
            }

            doc.save('ToscripT-AllCards.pdf');
            alert(`PDF created successfully with ${cards.length} cards!`);
        } catch (error) {
            console.error('Failed to generate PDF', error);
            alert('An error occurred while creating the PDF. Please check the console for details.');
        }
    }

    // Action Button Handler
    function handleActionBtn(action) {
        if (!fountainInput) return;
        
        clearPlaceholder();

        const start = fountainInput.selectionStart;
        const end = fountainInput.selectionEnd;
        const text = fountainInput.value;
        const selectedText = text.substring(start, end);

        let newText = text;
        let newCursorPos = start;

        if (action === 'scene') {
            newText = cycleText(selectedText, ['INT.', 'EXT.', 'INT./EXT.', 'EXT./INT.']);
        } else if (action === 'time') {
            newText = cycleText(selectedText, ['DAY', 'NIGHT', 'MORNING', 'EVENING', 'DAWN', 'DUSK', 'CONTINUOUS']);
        } else if (action === 'caps') {
            newText = selectedText === selectedText.toUpperCase() ? selectedText.toLowerCase() : selectedText.toUpperCase();
        } else if (action === 'parens') {
            newText = `(${selectedText})`;
        } else if (action === 'transition') {
            newText = cycleText(selectedText, ['CUT TO:', 'FADE TO:', 'DISSOLVE TO:', 'FADE OUT.', 'FADE IN:']);
        }

        fountainInput.value = text.substring(0, start) + newText + text.substring(end);
        newCursorPos = start + newText.length;
        fountainInput.setSelectionRange(newCursorPos, newCursorPos);
        fountainInput.focus();

        history.add(fountainInput.value);
        saveProjectData();
    }

    function cycleText(text, options) {
        const trimmed = text.trim().toUpperCase();
        const currentIndex = options.findIndex(opt => trimmed.includes(opt));
        if (currentIndex === -1) return options[0];
        return options[(currentIndex + 1) % options.length];
    }

    // PATCHED: Original Scene Navigator from toscript1
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
        // Filter functionality placeholder - implement based on your needs
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

    // Info & About modals
    function openInfoModal() {
        const modal = document.getElementById('info-modal');
        if (!modal) return;

        createModal(
            'info-modal',
            'Info & Help',
            `
                <h3>Fountain Syntax Guide</h3>
                <p><strong>Scene Headings:</strong> Start with INT. or EXT.</p>
                <p>Example: <code>INT. OFFICE - DAY</code></p>
                
                <p><strong>Character Names:</strong> All caps on their own line</p>
                <p>Example: <code>JOHN</code></p>
                
                <p><strong>Dialogue:</strong> Text below character name</p>
                
                <p><strong>Parentheticals:</strong> In parentheses</p>
                <p>Example: <code>(smiling)</code></p>
                
                <p><strong>Transitions:</strong> Right-aligned, ends with TO:</p>
                <p>Example: <code>CUT TO:</code></p>
                
                <p><strong>Action:</strong> Any other text</p>
                
                <p><strong>Mobile:</strong> Swipe through card pages (5 cards at a time). Drag scenes in Scene Navigator to reorder them!</p>
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
                <h3>ToscripT Professional</h3>
                <p>A professional screenwriting tool for mobile and desktop.</p>
                <p><strong>Version:</strong> 2.2</p>
                <p><strong>Format:</strong> Fountain Markup</p>
                <p>Write, preview, and export professional screenplays anywhere.</p>
            `,
            ''
        );

        modal.classList.add('open');
        if (menuPanel) menuPanel.classList.remove('open');
    }

    // New/Clear Project functions
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

        // View switching buttons
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

        // Filter
        if (filterCategorySelect) {
            filterCategorySelect.addEventListener('change', handleFilterChange);
        }

        if (filterValueInput) {
            filterValueInput.addEventListener('input', applyFilter);
        }

        // Export scene order
        const exportBtn = document.getElementById('export-scene-order-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportSceneOrderAsText);
        }

        // Add new card
        const addNewCardBtn = document.getElementById('add-new-card-btn');
        if (addNewCardBtn) {
            addNewCardBtn.addEventListener('click', addNewSceneCard);
        }

        // Save all cards
        const saveAllCardsBtn = document.getElementById('save-all-cards-btn');
        if (saveAllCardsBtn) {
            saveAllCardsBtn.addEventListener('click', saveAllCardsAsImages);
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

        // Toolbar buttons
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

        // Fullscreen button
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

        // Action buttons - Desktop
        const desktopActionBtns = document.querySelectorAll('#desktop-side-toolbar .action-btn');
        desktopActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                handleActionBtn(action);
            });
        });

        // Action buttons - Mobile
        const mobileKeyboardBtns = document.querySelectorAll('.keyboard-btn');
        mobileKeyboardBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                handleActionBtn(action);
            });
        });

        // Global click to close menus
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

    // Mobile card actions - show/hide on tap
// Mobile Card Actions - Show/Hide on Tap
    function setupMobileCardActions() {
        if (window.innerWidth > 768) return;
        
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) return;
        
        console.log('Setting up mobile card actions...');
        
        // Remove active class from all cards when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.scene-card') && !e.target.closest('.card-actions')) {
                document.querySelectorAll('.scene-card.active').forEach(card => {
                    card.classList.remove('active');
                });
            }
        });
        
        // Toggle active class on card click
        cardContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.scene-card');
            
            // Don't toggle if clicking action buttons
            if (e.target.closest('.card-actions')) {
                return;
            }
            
            // Don't toggle if editing title or description
            if (e.target.closest('.card-scene-title') || 
                e.target.closest('.card-description') || 
                e.target.closest('.card-scene-number')) {
                return;
            }
            
            if (card) {
                e.stopPropagation();
                
                const wasActive = card.classList.contains('active');
                
                // Remove active from all other cards
                document.querySelectorAll('.scene-card.active').forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.classList.remove('active');
                    }
                });
                
                // Toggle active on clicked card
                if (wasActive) {
                    card.classList.remove('active');
                } else {
                    card.classList.add('active');
                }
            }
        });
        
        console.log('Mobile card actions setup complete');
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

        // Setup mobile card actions on initialization
        if (window.innerWidth < 768) {
            setupMobileCardActions();
        }

        // Re-setup mobile card actions on window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth < 768) {
                    setupMobileCardActions();
                } else {
                    // Remove active class on desktop
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
