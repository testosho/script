// ========================================
// ToscripT 3.1 - Professional Hybrid Version
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    // ========================================
    // GLOBAL VARIABLES & STATE
    // ========================================
    let projectData = {
        projectInfo: {
            projectName: 'Untitled',
            prodName: 'Author',
            scriptContent: '',
            scenes: []
        }
    };

    // --- Pro Feature State ---
    let isProUser = false; // This will be set by checkProStatus()

    // --- App State ---
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
    let isPlaceholderActive = true;
    let isFocusMode = false;
    let isFullscreen = false;

    // --- Cloud Integration ---
    let gapi = null; // Placeholder for Google API
    let gapiInited = false;
    let isSignedIn = false;
    let autoSyncEnabled = false;
    let autoSyncTimer = null;

    const placeholderText = `TITLE: THE GHOST WRITER
AUTHOR: YOUR NAME

INT. LIBRARY - NIGHT

Rain lashes against the tall arched windows. A single desk lamp illuminates ANNA (30s), staring at a blinking cursor on her laptop.

ANNA
(to herself)
Just one more chapter...

A book falls from a high shelf behind her. She jumps.

ANNA
Hello? Is anyone there?

Silence. She cautiously gets up to investigate.

FADE OUT.`;

    // ========================================
    // DOM ELEMENT CACHING
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
    const splashScreen = document.getElementById('splash-screen');
    const fileInput = document.getElementById('file-input');
    const adBanner = document.getElementById('ad-banner'); // Placeholder for ads

    // Headers
    const mainHeader = document.getElementById('main-header');
    const scriptHeader = document.getElementById('script-header');
    const cardHeader = document.getElementById('card-header');

    // ========================================
    // INITIALIZATION
    // ========================================
    function init() {
        console.log('ToscripT 3.1 Initializing...');

        if (splashScreen) {
            setTimeout(() => {
                splashScreen.style.opacity = '0';
                setTimeout(() => splashScreen.style.display = 'none', 500);
            }, 1500);
        }

        checkProStatus(); // Check if the user has a Pro license
        loadProjectData();
        setupEventListeners();

        if (!fountainInput.value.trim()) {
            setPlaceholder();
        } else {
            clearPlaceholder(false);
        }

        fountainInput.style.fontSize = `${fontSize}px`;
        undoStack.push(fountainInput.value);
        updateUndoRedoButtons();
        updateIndicator('scene-no-indicator', showSceneNumbers);
        updateIndicator('auto-save-indicator', !!autoSaveInterval);

        checkAndroidWebView();
        // initializeGoogleDrive(); // This would be called here

        switchView('write');
        console.log('ToscripT 3.1 Initialized Successfully!');
    }

    // ========================================
    // PRO FEATURES & ADS LOGIC (NEW)
    // ========================================
    function checkProStatus() {
        // In a real app, this might involve a server call or checking a purchase token.
        // For this demo, we'll check localStorage for a simple flag.
        if (localStorage.getItem('toscriptProUser') === 'true') {
            isProUser = true;
            console.log('Pro user status VERIFIED.');
        } else {
            isProUser = false;
            console.log('User is on the Free version.');
        }
        updateUIForProStatus();
    }

    function updateUIForProStatus() {
        const proBadges = document.querySelectorAll('.pro-badge');
        const cloudButtons = document.querySelectorAll('.cloud-btn'); // Add this class to cloud buttons in HTML

        if (isProUser) {
            // Hide ads and "Pro" badges, enable cloud buttons
            if (adBanner) adBanner.style.display = 'none';
            proBadges.forEach(badge => badge.style.display = 'none');
            cloudButtons.forEach(btn => {
                btn.disabled = false;
                btn.title = btn.dataset.title || '';
            });
        } else {
            // Show ads and "Pro" badges, disable cloud buttons
            if (adBanner) adBanner.style.display = 'flex';
            proBadges.forEach(badge => badge.style.display = 'inline-block');
            cloudButtons.forEach(btn => {
                btn.disabled = true;
                btn.dataset.title = btn.title; // Save original title
                btn.title = 'Available for Pro users';
            });
        }
    }

    function showProModal() {
        const modalId = 'pro-modal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        const modalHtml = `
            <div id="${modalId}" class="modal open">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Upgrade to ToscripT Pro</h2>
                        <button class="icon-btn close-modal-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Unlock powerful features with ToscripT Pro:</p>
                        <ul>
                            <li>☁️ **Cloud Sync:** Save and open files from Google Drive & Dropbox.</li>
                            <li>🔄 **Auto-Sync:** Automatically back up your work to the cloud.</li>
                            <li>🚫 **Ad-Free Experience:** Write without any distractions.</li>
                        </ul>
                        <p>Support development and get the best screenwriting experience!</p>
                    </div>
                    <div class="modal-footer">
                        <button id="unlock-pro-btn" class="main-action-btn">Simulate Upgrade</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById(modalId);
        modal.querySelector('.close-modal-btn').onclick = () => modal.remove();
        modal.querySelector('#unlock-pro-btn').onclick = () => {
            unlockProFeatures();
            modal.remove();
        };
    }

    function unlockProFeatures() {
        localStorage.setItem('toscriptProUser', 'true');
        isProUser = true;
        updateUIForProStatus();
        showToast('ToscripT Pro Unlocked! Thank you!');
    }


    // ========================================
    // DATA PERSISTENCE & UNDO/REDO
    // ========================================
    function saveProjectData() {
        if (isPlaceholderActive) return;
        projectData.projectInfo.scriptContent = fountainInput.value;
        localStorage.setItem('toscriptProjectV3.1', JSON.stringify(projectData));
    }

    function loadProjectData() {
        const savedData = localStorage.getItem('toscriptProjectV3.1');
        if (savedData) {
            try {
                projectData = JSON.parse(savedData);
                fountainInput.value = projectData.projectInfo.scriptContent || '';
            } catch (e) {
                console.error('Failed to parse saved data:', e);
            }
        }
    }

    function saveUndoState() {
        const currentContent = fountainInput.value;
        if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== currentContent) {
            undoStack.push(currentContent);
            if (undoStack.length > 50) undoStack.shift();
            redoStack = [];
            updateUndoRedoButtons();
        }
    }

    function undo() {
        if (undoStack.length > 1) {
            redoStack.push(undoStack.pop());
            fountainInput.value = undoStack[undoStack.length - 1];
            handleFountainInput(false);
            updateUndoRedoButtons();
            showToast('Undo');
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            undoStack.push(redoStack.pop());
            fountainInput.value = undoStack[undoStack.length - 1];
            handleFountainInput(false);
            updateUndoRedoButtons();
            showToast('Redo');
        }
    }

    function updateUndoRedoButtons() {
        document.querySelectorAll('#undo-btn-top, #undo-btn-mobile').forEach(btn => btn.disabled = undoStack.length <= 1);
        document.querySelectorAll('#redo-btn-top, #redo-btn-mobile').forEach(btn => btn.disabled = redoStack.length === 0);
    }


    // ========================================
    // PARSING & RENDERING (Logic from ToscripT 2, as it's solid)
    // ========================================
    function updatePreview() {
        if (isPlaceholderActive) {
            screenplayOutput.innerHTML = '<div class="preview-placeholder">Write your script to see the formatted preview.</div>';
            return;
        }
        screenplayOutput.innerHTML = parseFountainToHTML(fountainInput.value);
    }

    function parseFountainToHTML(fountainText) {
        const lines = fountainText.split('\n');
        let html = '';
        let sceneCounter = 1;
        let inDialogue = false;
        let prevElementType = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : null;

            if (trimmedLine === '') {
                html += '<div class="empty-line"></div>';
                inDialogue = false;
                prevElementType = 'empty';
                continue;
            }

            const elementType = getElementType(trimmedLine, nextLine, inDialogue);

            if (elementType === 'scene-heading') {
                if (prevElementType && prevElementType !== 'empty' && prevElementType !== 'title-page') {
                    html += '<div class="empty-line"></div>';
                }
                const sceneNumHtml = showSceneNumbers ? `<span class="scene-number">${sceneCounter++}</span>` : '';
                html += `<div class="scene-heading"><span>${trimmedLine.toUpperCase()}</span>${sceneNumHtml}</div>`;
                inDialogue = false;
            } else if (elementType === 'character') {
                html += `<div class="character">${trimmedLine}</div>`;
                inDialogue = true;
            } else if (elementType === 'dialogue') {
                html += `<div class="dialogue">${trimmedLine}</div>`;
            } else if (elementType === 'parenthetical') {
                html += `<div class="parenthetical">${trimmedLine}</div>`;
            } else if (elementType === 'transition') {
                html += `<div class="transition">${trimmedLine.toUpperCase()}</div>`;
                inDialogue = false;
            } else if (elementType === 'title-page') {
                html += `<div class="title-page-element">${line}</div>`;
                inDialogue = false;
            } else { // Action
                html += `<div class="action">${line}</div>`;
                inDialogue = false;
            }
            prevElementType = elementType;
        }
        return html;
    }

    function getElementType(line, nextLine, inDialogue) {
        if (!line) return 'empty';
        if (/^(TITLE|AUTHOR|CREDIT|SOURCE):/i.test(line)) return 'title-page';

        const upperLine = line.toUpperCase();
        if (upperLine.startsWith('INT.') || upperLine.startsWith('EXT.') || upperLine.startsWith('I/E')) return 'scene-heading';
        if (upperLine.endsWith('TO:') || upperLine === 'FADE OUT.' || upperLine === 'FADE IN') return 'transition';

        // Character: All caps, not a scene heading/transition, and has a next line.
        if (line === upperLine && !upperLine.includes('.') && nextLine) return 'character';
        if (inDialogue && line.startsWith('(') && line.endsWith(')')) return 'parenthetical';
        if (inDialogue) return 'dialogue';
        return 'action';
    }
	
	// ========================================
	    // SCENE EXTRACTION & DATA MODEL
	    // This logic is restored from ToscripT 1 for its reliability in capturing full scene blocks.
	    // ========================================
	    function extractScenesFromText(text) {
	        if (!text || !text.trim() || text === placeholderText) {
	            projectData.projectInfo.scenes = [];
	            return [];
	        }

	        const lines = text.split('\n');
	        const scenes = [];
	        let currentScene = null;
	        let sceneNumber = 0;
	        let currentSceneLines = [];
	        let isFirstSceneFound = false;
	        let headerLines = [];

	        lines.forEach((line) => {
	            const trimmed = line.trim();
	            const isSceneHeading = /^(INT|EXT|I\/E)/i.test(trimmed);

	            if (isSceneHeading) {
	                isFirstSceneFound = true;
	                if (currentScene) {
	                    currentScene.fullText = currentSceneLines.join('\n');
	                    scenes.push(currentScene);
	                }

	                sceneNumber++;
	                const heading = trimmed.toUpperCase();

	                const sceneTypeMatch = heading.match(/^(INT|EXT|I\/E)/i);
	                const timeMatch = heading.match(/-\s*(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|CONTINUOUS|LATER)/i);

	                currentScene = {
	                    number: sceneNumber,
	                    heading: heading,
	                    sceneType: sceneTypeMatch ? sceneTypeMatch[0] : 'INT.',
	                    timeOfDay: timeMatch ? timeMatch[1] : 'DAY',
	                    location: heading.replace(/^(INT|EXT|I\/E)\.?/i, '').replace(/-\s*(DAY|NIGHT|.*)/i, '').trim(),
	                    description: [],
	                    characters: [],
	                    fullText: '' // Will be populated at the end of the scene
	                };
	                currentSceneLines = [line];
	            } else if (currentScene) {
	                currentSceneLines.push(line);
	                const upperLine = trimmed.toUpperCase();
	                // Simple logic to find characters and action lines within the current scene block
	                if (trimmed && trimmed === upperLine && !upperLine.endsWith("TO:") && lines[lines.indexOf(line) + 1]?.trim() !== '') {
	                     if (!currentScene.characters.includes(trimmed)) {
	                        currentScene.characters.push(trimmed);
	                    }
	                } else if(trimmed && !trimmed.startsWith('(')) {
	                    currentScene.description.push(trimmed);
	                }
	            } else if (!isFirstSceneFound) {
	                headerLines.push(line); // Capture anything before the first scene (e.g., Title Page)
	            }
	        });

	        if (currentScene) {
	            currentScene.fullText = currentSceneLines.join('\n');
	            scenes.push(currentScene);
	        }

	        projectData.projectInfo.scenes = scenes;
	        projectData.projectInfo.headerText = headerLines.join('\n'); // Store header text
	        return scenes;
	    }


	    // ========================================
	    // CARD VIEW LOGIC (UI from T2, Syncing from T1)
	    // ========================================
	    function renderEnhancedCardView() {
	        if (!cardContainer) return;

	        const scenes = projectData.projectInfo.scenes;
	        if (scenes.length === 0) {
	            cardContainer.innerHTML = `<div class="card-view-placeholder">No scenes found. Write scenes with INT. or EXT. headings.</div>`;
	            return;
	        }

	        currentPage = Math.min(currentPage, Math.ceil(scenes.length / cardsPerPage) - 1);
	        currentPage = Math.max(0, currentPage);

	        const startIdx = currentPage * cardsPerPage;
	        const scenesToShow = scenes.slice(startIdx, startIdx + cardsPerPage);

	        cardContainer.innerHTML = scenesToShow.map(scene => `
	            <div class="scene-card" data-scene-number="${scene.number}">
	                <div class="scene-card-content">
	                    <div class="card-header">
	                        <div class="card-scene-title" contenteditable="true">${scene.heading}</div>
	                        <input class="card-scene-number" type="text" value="${scene.number}" readonly>
	                    </div>
	                    <div class="card-body">
	                        <textarea class="card-description" placeholder="Action and description...">${scene.description.join('\n')}</textarea>
	                    </div>
	                </div>
	                <div class="card-actions">
	                    <button class="icon-btn share-card-btn" title="Share Scene"><i class="fas fa-share-alt"></i></button>
	                    <button class="icon-btn delete-card-btn" title="Delete Scene"><i class="fas fa-trash"></i></button>
	                </div>
	            </div>
	        `).join('');

	        if (isMobileDevice() && scenes.length > cardsPerPage) {
	            addMobilePagination(scenes.length);
	        }

	        bindCardEditingEvents();
	    }

	    function addMobilePagination(totalScenes) {
	        const totalPages = Math.ceil(totalScenes / cardsPerPage);
	        let paginationHtml = '<div class="mobile-pagination">';
	        for (let i = 0; i < totalPages; i++) {
	            paginationHtml += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>`;
	        }
	        paginationHtml += '</div>';
	        cardContainer.insertAdjacentHTML('beforeend', paginationHtml);

	        document.querySelectorAll('.pagination-btn').forEach(btn => {
	            btn.addEventListener('click', (e) => {
	                currentPage = parseInt(e.target.dataset.page);
	                renderEnhancedCardView();
	            });
	        });
	    }

	    function bindCardEditingEvents() {
	        cardContainer.onclick = function(e) {
	            const card = e.target.closest('.scene-card');
	            if (!card) return;

	            if (e.target.closest('.delete-card-btn')) {
	                const sceneNumber = parseInt(card.dataset.sceneNumber);
	                if(confirm('Are you sure you want to delete this scene from your script?')) {
	                    deleteSceneByNumber(sceneNumber);
	                }
	            } else if (e.target.closest('.share-card-btn')) {
	                const sceneNumber = parseInt(card.dataset.sceneNumber);
	                shareSceneCard(sceneNumber);
	            }
	        };

	        cardContainer.oninput = function(e) {
	             if (e.target.matches('.card-scene-title, .card-description')) {
	                clearTimeout(debounceTimeout);
	                debounceTimeout = setTimeout(syncCardsToEditor, 800);
	            }
	        };
	    }

	    // RELIABLE SYNC LOGIC (Restored from ToscripT 1)
	    function syncCardsToEditor() {
	        if (isUpdatingFromSync || currentView !== 'card') return;

	        isUpdatingFromSync = true;
	        const cardElements = Array.from(cardContainer.querySelectorAll('.scene-card'));
	        let hasChanged = false;

	        // Create a map for quick lookup
	        const sceneMap = new Map(projectData.projectInfo.scenes.map(s => [s.number, s]));

	        cardElements.forEach(card => {
	            const sceneNumber = parseInt(card.dataset.sceneNumber);
	            const scene = sceneMap.get(sceneNumber);
	            if (!scene) return;

	            const newHeading = card.querySelector('.card-scene-title').textContent.trim();
	            const newDescription = card.querySelector('.card-description').value;

	            // This simplistic check doesn't account for dialogue etc., but is a start
	            const newActionText = newDescription.split('\n').join('\n');
	            const oldActionText = scene.description.join('\n');

	            if (scene.heading !== newHeading || oldActionText !== newActionText) {
	                hasChanged = true;
	                // Reconstruct the fullText for this scene
	                const lines = scene.fullText.split('\n');
	                let content = '';
	                let actionIndex = 0;
	                for(let i = 1; i < lines.length; i++) {
	                    const line = lines[i];
	                    const elementType = getElementType(line.trim(), lines[i+1]?.trim(), true);
	                    if(elementType === 'action' || elementType === 'empty') {
	                        // This is a placeholder for more complex reconstruction logic
	                    } else {
	                        content += line + '\n';
	                    }
	                }
	                scene.heading = newHeading;
	                scene.description = newDescription.split('\n');
	                scene.fullText = newHeading + '\n' + newDescription + '\n' + content.trim();
	            }
	        });

	        if (hasChanged) {
	            fountainInput.value = reconstructScriptFromScenes();
	            saveUndoState();
	            saveProjectData();
	            showToast('Cards synced to script');
	        }

	        setTimeout(() => { isUpdatingFromSync = false; }, 100);
	    }

	    function reconstructScriptFromScenes() {
	        const header = projectData.projectInfo.headerText || '';
	        const body = projectData.projectInfo.scenes.map(s => s.fullText).join('\n\n');
	        return (header ? header + '\n\n' : '') + body;
	    }


	    // ========================================
	    // SCENE & CARD MANIPULATION (ToscripT 2 Style, but safer)
	    // ========================================
	    function addNewScene(afterSceneNumber = null) {
	        const newSceneText = "INT. NEW SCENE - DAY\n\nNew scene action.";
	        if (isPlaceholderActive) clearPlaceholder();

	        // Find where to insert the text
	        if (afterSceneNumber && projectData.projectInfo.scenes.length > 0) {
	            const targetScene = projectData.projectInfo.scenes.find(s => s.number === afterSceneNumber);
	            if (targetScene) {
	                const endOfSceneIndex = fountainInput.value.indexOf(targetScene.fullText) + targetScene.fullText.length;
	                fountainInput.value = `${fountainInput.value.substring(0, endOfSceneIndex)}\n\n${newSceneText}${fountainInput.value.substring(endOfSceneIndex)}`;
	            } else {
	                 fountainInput.value += `\n\n${newSceneText}`;
	            }
	        } else {
	            fountainInput.value += `\n\n${newSceneText}`;
	        }

	        handleFountainInput();
	        showToast('New scene added');
	    }

	    function deleteSceneByNumber(sceneNumber) {
	        const scene = projectData.projectInfo.scenes.find(s => s.number === sceneNumber);
	        if (!scene) return;

	        // Use the reliable fullText block for removal
	        const script = fountainInput.value;
	        const sceneStartIndex = script.indexOf(scene.fullText);

	        if (sceneStartIndex !== -1) {
	            const endOfSceneIndex = sceneStartIndex + scene.fullText.length;
	            // Also remove trailing newlines to prevent large gaps
	            const remainingScript = script.substring(endOfSceneIndex);
	            const newScript = script.substring(0, sceneStartIndex) + remainingScript.replace(/^\s*\n*/, '');
	            fountainInput.value = newScript;
	            handleFountainInput();
	            showToast(`Scene ${sceneNumber} deleted`);
	        }
	    }

	    async function shareSceneCard(sceneNumber) {
	        // This function will use the powerful ToscripT 1 image generator
	        const cardElement = document.querySelector(`.scene-card[data-scene-number="${sceneNumber}"]`);
	        if (!cardElement) return;

	        showToast('Generating card image...');
	        const blob = await generateCardImageBlob(cardElement); // Function from Part 3

	        if (!blob) {
	            showToast('Failed to generate image', 'error');
	            return;
	        }

	        const sceneHeading = cardElement.querySelector('.card-scene-title').textContent || 'Scene';
	        const fileName = `Scene-${sceneNumber}.png`;
	        const file = new File([blob], fileName, { type: 'image/png' });

	        if (navigator.share && navigator.canShare({ files: [file] })) {
	            await navigator.share({
	                files: [file],
	                title: sceneHeading,
	                text: `From script: ${projectData.projectInfo.projectName}`
	            }).catch(err => console.log('Share failed:', err));
	        } else {
	            downloadBlob(blob, fileName);
	        }
	    }


	    // ========================================
	    // SCENE NAVIGATOR (Using Sortable.js from T2)
	    // ========================================
	    function updateSceneNavigator() {
	        sceneList.innerHTML = '';
	        const scenes = extractScenesFromText(fountainInput.value);

	        if (scenes.length === 0) {
	            sceneList.innerHTML = '<li>No scenes found.</li>';
	            return;
	        }

	        scenes.forEach((scene, index) => {
	            const li = document.createElement('li');
	            li.dataset.originalIndex = index;
	            li.innerHTML = `<span>${scene.number}. ${scene.heading}</span>`;
	            li.onclick = () => {
	                const sceneStartIndex = fountainInput.value.indexOf(scene.fullText.split('\n')[0]);
	                if (sceneStartIndex !== -1) {
	                    fountainInput.focus();
	                    fountainInput.setSelectionRange(sceneStartIndex, sceneStartIndex);
	                }
	                switchView('write');
	            };
	            sceneList.appendChild(li);
	        });

	        if (typeof Sortable !== 'undefined') {
	            new Sortable(sceneList, {
	                animation: 150,
	                ghostClass: 'sortable-ghost',
	                onEnd: (evt) => {
	                    const newOrderIndices = Array.from(evt.target.children).map(li => parseInt(li.dataset.originalIndex));
	                    reorderScript(newOrderIndices);
	                }
	            });
	        }
	    }

	    function reorderScript(newOrderIndices) {
	        const currentScenes = extractScenesFromText(fountainInput.value);
	        const reorderedScenes = newOrderIndices.map(index => currentScenes[index]);
	        projectData.projectInfo.scenes = reorderedScenes; // Update data model
	        fountainInput.value = reconstructScriptFromScenes(); // Rebuild from data model
	        handleFountainInput();
	        showToast('Scenes reordered');
	    }
		
		// ========================================
		    // EXPORTING SYSTEM (Card Export Logic RESTORED from ToscripT 1)
		    // ========================================

		    function showSaveCardsModal() {
		        // First, remove any existing modal to prevent duplicates
		        const existingModal = document.getElementById('save-cards-modal');
		        if (existingModal) existingModal.remove();

		        const modalHtml = `
		            <div id="save-cards-modal" class="modal open">
		                <div class="modal-content">
		                    <div class="modal-header">
		                        <h2>Save Scene Cards</h2>
		                        <button class="icon-btn close-modal-btn">&times;</button>
		                    </div>
		                    <div class="modal-body">
		                        <p>Choose an export format for your scene cards. PDF exports are great for printing and storyboarding.</p>
		                    </div>
		                    <div class="modal-footer" style="flex-direction: column; gap: 10px;">
		                        <button id="save-visible-cards-btn" class="main-action-btn">📄 Save Visible Cards as PDF</button>
		                        <button id="save-all-cards-btn" class="main-action-btn secondary">📚 Save All Cards as PDF (Batch)</button>
		                        <button id="save-cards-as-txt-btn" class="main-action-btn" style="background: linear-gradient(135deg, #10b981, #059669);">📝 Save All Cards as TXT</button>
		                    </div>
		                </div>
		            </div>
		        `;
		        document.body.insertAdjacentHTML('beforeend', modalHtml);
		        const modal = document.getElementById('save-cards-modal');

		        // Add event listeners for the new modal
		        modal.querySelector('.close-modal-btn').onclick = () => modal.remove();
		        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
		        modal.querySelector('#save-visible-cards-btn').onclick = () => { saveVisibleCardsAsPDF(); modal.remove(); };
		        modal.querySelector('#save-all-cards-btn').onclick = () => { saveAllCardsAsPDF(); modal.remove(); };
		        modal.querySelector('#save-cards-as-txt-btn').onclick = () => { saveAllCardsAsTXT(); modal.remove(); };
		    }

		    // --- Progress Modal Helpers (Restored from T1) ---
		    function showProgressModal(message) {
		        let modal = document.getElementById('progress-modal');
		        if (modal) modal.remove();
		        const modalHTML = `
		            <div id="progress-modal" class="modal open" style="z-index: 10002;">
		                <div class="modal-content" style="max-width: 400px; text-align: center;">
		                    <div class="modal-body">
		                        <div class="spinner"></div>
		                        <p id="progress-message" style="margin-top: 1rem; white-space: pre-wrap;">${message}</p>
		                        <p style="font-size: 0.9rem; color: var(--muted-text-color);">Please wait, this may take a moment...</p>
		                    </div>
		                </div>
		            </div>`;
		        document.body.insertAdjacentHTML('beforeend', modalHTML);
		    }

		    function updateProgressModal(message) {
		        const msgElement = document.getElementById('progress-message');
		        if (msgElement) msgElement.textContent = message;
		    }

		    function hideProgressModal() {
		        const modal = document.getElementById('progress-modal');
		        if (modal) modal.remove();
		    }


		    // --- Card Image Generators (Restored from T1) ---
		    async function generateCardImageBlob(cardElement) {
		        // High-quality generator for desktop using html2canvas
		        if (typeof html2canvas === 'undefined') return null;
		        try {
		            const canvas = await html2canvas(cardElement, {
		                scale: 2,
		                backgroundColor: '#1f2937', // Match card background
		                useCORS: true
		            });
		            return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
		        } catch (error) {
		            console.error('html2canvas failed:', error);
		            return null;
		        }
		    }

		    async function generateSimpleCardBlob(scene) {
		        // Fast, canvas-based generator for mobile (no DOM dependency)
		        const canvas = document.createElement('canvas');
		        const scale = 2; // For higher resolution
		        canvas.width = 480 * scale;
		        canvas.height = 288 * scale;
		        const ctx = canvas.getContext('2d');

		        ctx.scale(scale, scale);
		        ctx.fillStyle = '#ffffff';
		        ctx.fillRect(0, 0, 480, 288);
		        ctx.strokeStyle = '#000000';
		        ctx.lineWidth = 1.5;
		        ctx.strokeRect(0, 0, 480, 288);
        
		        ctx.fillStyle = '#000000';
		        ctx.font = 'bold 14px "Courier Prime", monospace';
		        ctx.fillText(scene.heading.substring(0, 45), 15, 30);
		        ctx.textAlign = 'right';
		        ctx.fillText(scene.number, 465, 30);
		        ctx.textAlign = 'left';
        
		        ctx.beginPath();
		        ctx.moveTo(15, 40);
		        ctx.lineTo(465, 40);
		        ctx.stroke();

		        ctx.font = '15px "Courier Prime", monospace';
		        let y = 65;
		        scene.description.slice(0, 7).forEach(line => {
		            if (y < 260) {
		                ctx.fillText(line.substring(0, 50), 15, y);
		                y += 22;
		            }
		        });

		        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
		        ctx.font = '10px "Inter", sans-serif';
		        ctx.textAlign = 'right';
		        ctx.fillText('ToscripT', 465, 275);

		        return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
		    }

		    // --- Main Card Export Functions (Restored & Adapted from T1) ---
		    async function saveVisibleCardsAsPDF() {
		        if (typeof window.jspdf === 'undefined') return showToast('PDF library not loaded.', 'error');
        
		        const cardsToExport = cardContainer.querySelectorAll('.scene-card');
		        if (cardsToExport.length === 0) return showToast('No cards to export.', 'warning');

		        const isMobile = isMobileDevice();
		        const methodText = isMobile ? '(Fast Mobile Mode)' : '(High Quality Desktop)';
		        showProgressModal(`Generating PDF ${methodText}...`);

		        const { jsPDF } = window.jspdf;
		        const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
		        const cardsPerPage = 6;
		        const cardWidth = 4;
		        const cardHeight = 2.5;
		        const marginX = 0.5;
		        const marginY = 0.5;
		        const spacing = 0.5;

		        for (let i = 0; i < cardsToExport.length; i++) {
		            updateProgressModal(`Processing card ${i + 1} of ${cardsToExport.length}...`);
		            const cardElement = cardsToExport[i];
		            const sceneNumber = parseInt(cardElement.dataset.sceneNumber);
		            const scene = projectData.projectInfo.scenes.find(s => s.number === sceneNumber);

		            const blob = isMobile ? await generateSimpleCardBlob(scene) : await generateCardImageBlob(cardElement);
		            if (!blob) continue;

		            const page = Math.floor(i / cardsPerPage);
		            if (page > 0 && i % cardsPerPage === 0) doc.addPage();

		            const idxOnPage = i % cardsPerPage;
		            const row = Math.floor(idxOnPage / 2);
		            const col = idxOnPage % 2;

		            const x = marginX + col * (cardWidth + spacing);
		            const y = marginY + row * (cardHeight + 0.25);
            
		            const dataUrl = URL.createObjectURL(blob);
		            doc.addImage(dataUrl, 'PNG', x, y, cardWidth, cardHeight);
		            URL.revokeObjectURL(dataUrl);
		            await new Promise(r => setTimeout(r, 50)); // Prevent browser freeze
		        }

		        hideProgressModal();
		        doc.save(`${projectData.projectInfo.projectName}-cards.pdf`);
		        showToast('PDF of visible cards created!');
		    }

		    async function saveAllCardsAsPDF() {
		        if (typeof window.jspdf === 'undefined') return showToast('PDF library not loaded.', 'error');

		        const allScenes = projectData.projectInfo.scenes;
		        if (allScenes.length === 0) return showToast('No scenes to save.', 'warning');

		        const cardsPerFile = 30; // 5 pages * 6 cards per page
		        const totalFiles = Math.ceil(allScenes.length / cardsPerFile);

		        if (!confirm(`This will generate ${totalFiles} PDF file(s) with up to ${cardsPerFile} cards each. Continue?`)) return;

		        showProgressModal(`Preparing to export ${allScenes.length} cards...`);

		        for (let fileNum = 0; fileNum < totalFiles; fileNum++) {
		            const startIdx = fileNum * cardsPerFile;
		            const endIdx = Math.min(startIdx + cardsPerFile, allScenes.length);
		            const scenesChunk = allScenes.slice(startIdx, endIdx);

		            const { jsPDF } = window.jspdf;
		            const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
            
		            for (let i = 0; i < scenesChunk.length; i++) {
		                const scene = scenesChunk[i];
		                updateProgressModal(`File ${fileNum + 1}/${totalFiles}\nProcessing card ${startIdx + i + 1} of ${allScenes.length}...`);

		                const blob = await generateSimpleCardBlob(scene); // Always use fast generator for batch jobs
		                if (!blob) continue;

		                const page = Math.floor(i / 6);
		                if (page > 0 && i % 6 === 0) doc.addPage();

		                const idxOnPage = i % 6;
		                const row = Math.floor(idxOnPage / 2);
		                const col = idxOnPage % 2;

		                const x = 0.5 + col * (4 + 0.5);
		                const y = 0.5 + row * (2.5 + 0.25);
            
		                const dataUrl = URL.createObjectURL(blob);
		                doc.addImage(dataUrl, 'PNG', x, y, 4, 2.5);
		                URL.revokeObjectURL(dataUrl);
		                await new Promise(r => setTimeout(r, 30));
		            }

		            const fileName = `${projectData.projectInfo.projectName}-cards-part${fileNum + 1}.pdf`;
		            doc.save(fileName);
		        }

		        hideProgressModal();
		        showToast(`${totalFiles} PDF file(s) created!`, 'success');
		    }

		    function saveAllCardsAsTXT() {
		        let txtContent = `Project: ${projectData.projectInfo.projectName || 'Untitled'}\n\n`;
		        projectData.projectInfo.scenes.forEach(scene => {
		            txtContent += `==============================\n`;
		            txtContent += `SCENE ${scene.number}: ${scene.heading}\n`;
		            txtContent += `------------------------------\n`;
		            txtContent += `${scene.description.join('\n')}\n\n`;
		        });
		        downloadBlob(new Blob([txtContent], { type: 'text/plain' }), `${projectData.projectInfo.projectName}-cards.txt`);
		    }
    

		    // --- Script Export Functions (From T2) ---
		    function saveAsFountain() {
		        if (isPlaceholderActive) return showToast('Cannot save placeholder text.', 'warning');
		        downloadBlob(new Blob([fountainInput.value], { type: 'text/plain' }), `${projectData.projectInfo.projectName}.fountain`);
		    }

		    async function saveAsPdfUnicode() {
		        if (isPlaceholderActive) return showToast('Cannot save placeholder text.', 'warning');
		        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') return showToast('PDF library not loaded.', 'error');
		        showProgressModal('Generating image-based PDF...');
        
		        try {
		            const canvas = await html2canvas(screenplayOutput, { scale: 2, backgroundColor: '#ffffff' });
		            const imgData = canvas.toDataURL('image/png');
		            const { jsPDF } = window.jspdf;
		            const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
		            const imgProps = pdf.getImageProperties(imgData);
		            const pdfWidth = pdf.internal.pageSize.getWidth();
		            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
		            let heightLeft = pdfHeight;
		            let position = 0;

		            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
		            heightLeft -= pdf.internal.pageSize.getHeight();

		            while (heightLeft > 0) {
		                position = -heightLeft;
		                pdf.addPage();
		                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
		                heightLeft -= pdf.internal.pageSize.getHeight();
		            }
		            pdf.save(`${projectData.projectInfo.projectName}-unicode.pdf`);
		            showToast('Unicode PDF saved!');
		        } catch (error) {
		            console.error('Unicode PDF export failed:', error);
		            showToast('PDF generation failed.', 'error');
		        } finally {
		            hideProgressModal();
		        }
		    }

		    // ========================================
		    // TOOLBAR ACTIONS (From T2)
		    // ========================================
		    function handleAction(action) {
		        clearPlaceholder();
		        const textarea = fountainInput;
		        const start = textarea.selectionStart;
		        const end = textarea.selectionEnd;
		        let selectedText = textarea.value.substring(start, end);

		        let newText = selectedText;
		        switch(action) {
		            case 'scene': newText = cycleItem(selectedText || 'INT. LOCATION - DAY', ['INT.', 'EXT.', 'I/E']); break;
		            case 'time': newText = cycleItem(selectedText || ' - DAY', [' - DAY', ' - NIGHT', ' - CONTINUOUS']); break;
		            case 'caps': newText = newText === newText.toUpperCase() ? newText.toLowerCase() : newText.toUpperCase(); break;
		            case 'parens': newText = `(${selectedText})`; break;
		            case 'transition': newText = cycleItem(selectedText || 'CUT TO:', ['CUT TO:', 'FADE TO:', 'DISSOLVE TO:', 'FADE OUT.']); break;
		        }

		        document.execCommand('insertText', false, newText);
		        handleFountainInput();
		        if (navigator.vibrate) navigator.vibrate(30);
		    }
    
		    function cycleItem(text, items) {
		        const upperText = text.toUpperCase();
		        for (let i = 0; i < items.length; i++) {
		            if (upperText.includes(items[i])) {
		                return items[(i + 1) % items.length];
		            }
		        }
		        return items[0];
		    }
			
			
			// ========================================
			    // MODALS & UI HELPERS
			    // ========================================

			    function openInfoModal() {
			        const modalId = 'info-modal';
			        let modal = document.getElementById(modalId);
			        if (modal) modal.remove();
			        // Simplified content for brevity
			        const modalHtml = `
			            <div id="${modalId}" class="modal open">
			                <div class="modal-content">
			                    <div class="modal-header"><h2>Info & Help</h2><button class="icon-btn close-modal-btn">&times;</button></div>
			                    <div class="modal-body">
			                        <h3>Fountain Basics</h3>
			                        <p><strong>Scene Headings:</strong> Start with INT. or EXT.</p>
			                        <p><strong>Characters:</strong> Write their name in ALL CAPS.</p>
			                        <p><strong>Dialogue:</strong> Place it right under a character's name.</p>
			                        <p>Use the toolbar buttons for quick formatting!</p>
			                    </div>
			                </div>
			            </div>`;
			        document.body.insertAdjacentHTML('beforeend', modalHtml);
			        modal = document.getElementById(modalId);
			        modal.querySelector('.close-modal-btn').onclick = () => modal.remove();
			    }

			    function openAboutModal() {
			        const modalId = 'about-modal';
			        let modal = document.getElementById(modalId);
			        if (modal) modal.remove();
			        const modalHtml = `
			            <div id="${modalId}" class="modal open">
			                <div class="modal-content">
			                    <div class="modal-header"><h2>About ToscripT 3.1</h2><button class="icon-btn close-modal-btn">&times;</button></div>
			                    <div class="modal-body" style="text-align: center;">
			                        <p>Your professional, mobile-first screenwriting studio.</p>
			                        <p><strong>Version:</strong> 3.1 (Android Optimized)</p>
			                        <p>© 2025. All Rights Reserved.</p>
			                    </div>
			                </div>
			            </div>`;
			        document.body.insertAdjacentHTML('beforeend', modalHtml);
			        modal = document.getElementById(modalId);
			        modal.querySelector('.close-modal-btn').onclick = () => modal.remove();
			    }

			    function openProjectInfoModal() {
			        const sceneCount = projectData.projectInfo.scenes.length;
			        const wordCount = isPlaceholderActive ? 0 : fountainInput.value.split(/\s+/).filter(Boolean).length;
			        // Simple page count estimation (1 minute/page, ~120 words/minute)
			        const pageCount = Math.round(wordCount / 120);

			        const modalId = 'project-info-modal';
			        let modal = document.getElementById(modalId);
			        if (modal) modal.remove();
			        const modalHtml = `
			            <div id="${modalId}" class="modal open">
			                <div class="modal-content">
			                    <div class="modal-header"><h2>Project Info</h2><button class="icon-btn close-modal-btn">&times;</button></div>
			                    <div class="modal-body">
			                        <h3>${projectData.projectInfo.projectName}</h3>
			                        <p>by ${projectData.projectInfo.prodName}</p>
			                        <hr>
			                        <p><strong>Scene Count:</strong> ${sceneCount}</p>
			                        <p><strong>Word Count:</strong> ~${wordCount}</p>
			                        <p><strong>Estimated Pages:</strong> ~${pageCount}</p>
			                    </div>
			                </div>
			            </div>`;
			        document.body.insertAdjacentHTML('beforeend', modalHtml);
			        modal = document.getElementById(modalId);
			        modal.querySelector('.close-modal-btn').onclick = () => modal.remove();
			    }

			    function openTitlePageModal() {
			        const modalId = 'title-page-modal';
			        let modal = document.getElementById(modalId);
			        if (modal) modal.remove();
			        const modalHtml = `
			            <div id="${modalId}" class="modal open">
			                <div class="modal-content">
			                    <div class="modal-header"><h2>Title & Author</h2><button class="icon-btn close-modal-btn">&times;</button></div>
			                    <div class="modal-body">
			                        <div class="form-group"><label>Project Name</label><input id="project-name-input" type="text" value="${projectData.projectInfo.projectName}"></div>
			                        <div class="form-group"><label>Author Name</label><input id="author-name-input" type="text" value="${projectData.projectInfo.prodName}"></div>
			                    </div>
			                    <div class="modal-footer"><button id="save-title-info-btn" class="main-action-btn">Save</button></div>
			                </div>
			            </div>`;
			        document.body.insertAdjacentHTML('beforeend', modalHtml);
			        modal = document.getElementById(modalId);
			        modal.querySelector('.close-modal-btn').onclick = () => modal.remove();
			        modal.querySelector('#save-title-info-btn').onclick = () => {
			            projectData.projectInfo.projectName = document.getElementById('project-name-input').value;
			            projectData.projectInfo.prodName = document.getElementById('author-name-input').value;
			            saveProjectData();
			            showToast('Project info updated');
			            modal.remove();
			        };
			    }
    
			    // ========================================
			    // CLOUD INTEGRATION (PRO FEATURE)
			    // ========================================
			    function saveToGoogleDrive() {
			        if (!isProUser) {
			            showProModal();
			            return;
			        }
			        showToast('Google Drive integration is a Pro feature!');
			        // ... Full Google Drive upload logic would go here ...
			        console.log('Attempting to save to Google Drive...');
			    }

			    function openFromGoogleDrive() {
			        if (!isProUser) {
			            showProModal();
			            return;
			        }
			        showToast('Google Drive integration is a Pro feature!');
			        // ... Full Google Drive open/picker logic would go here ...
			        console.log('Attempting to open from Google Drive...');
			    }

			    function saveToDropbox() {
			        if (!isProUser) {
			            showProModal();
			            return;
			        }
			        showToast('Dropbox integration is a Pro feature!');
			        // ... Full Dropbox upload logic would go here ...
			        console.log('Attempting to save to Dropbox...');
			    }
    
			    function openFromDropbox() {
			        if (!isProUser) {
			            showProModal();
			            return;
			        }
			        showToast('Dropbox integration is a Pro feature!');
			        // ... Full Dropbox open/picker logic would go here ...
			        console.log('Attempting to open from Dropbox...');
			    }
    
			    function openCloudSyncModal() {
			        if (!isProUser) {
			            showProModal();
			            return;
			        }
			        // ... Modal for setting up auto-sync would appear here ...
			        showToast('Auto-Sync is a Pro feature!');
			    }


			    // ========================================
			    // ANDROID WEBVIEW BRIDGE
			    // ========================================
			    window.AndroidBridge = {
			        onBackPressed: function() {
			            if (isFocusMode) { exitFocusMode(); return true; }
			            if (menuPanel.classList.contains('open')) { closeMenu(); return true; }
			            if (sceneNavigatorPanel.classList.contains('open')) { closeSceneNavigator(); return true; }
			            if (document.querySelector('.modal.open')) {
			                document.querySelector('.modal.open').remove(); return true;
			            }
			            if (currentView !== 'write') { switchView('write'); return true; }
			            return false; // Let Android handle exit
			        },
			        getScriptContent: () => fountainInput.value,
			        setScriptContent: (content) => {
			            fountainInput.value = content;
			            clearPlaceholder();
			            handleFountainInput();
			        },
			        showToastFromAndroid: (message, type) => showToast(message, type),
			        triggerProUnlock: () => unlockProFeatures(),
			    };


			    // ========================================
			    // FINAL EVENT LISTENERS SETUP
			    // ========================================
			    function setupEventListeners() {
			        // Input Handling
			        fountainInput.addEventListener('focus', () => clearPlaceholder());
			        fountainInput.addEventListener('blur', setPlaceholder);
			        fountainInput.addEventListener('input', () => handleFountainInput());
			        fileInput.addEventListener('change', handleFileOpen);

			        // View Switchers
			        document.getElementById('show-script-btn')?.addEventListener('click', () => switchView('script'));
			        document.getElementById('show-write-btn-header')?.addEventListener('click', () => switchView('write'));
			        document.getElementById('show-write-btn-card-header')?.addEventListener('click', () => switchView('write'));
			        document.getElementById('card-view-btn')?.addEventListener('click', () => switchView('card'));

			        // Panels
			        document.querySelectorAll('#hamburger-btn, #hamburger-btn-script, #hamburger-btn-card').forEach(btn => btn?.addEventListener('click', toggleMenu));
			        document.querySelectorAll('#scene-navigator-btn, #scene-navigator-btn-script').forEach(btn => btn?.addEventListener('click', toggleSceneNavigator));
			        document.getElementById('close-navigator-btn')?.addEventListener('click', closeSceneNavigator);

			        // Header Controls
			        document.getElementById('undo-btn-top')?.addEventListener('click', undo);
			        document.getElementById('redo-btn-top')?.addEventListener('click', redo);
			        document.getElementById('zoom-in-btn')?.addEventListener('click', () => adjustFontSize(2));
			        document.getElementById('zoom-out-btn')?.addEventListener('click', () => adjustFontSize(-2));
        
			        // Fullscreen & Focus
			        document.getElementById('fullscreen-btn-main')?.addEventListener('click', toggleFullscreen);
			        document.getElementById('focus-mode-btn')?.addEventListener('click', toggleFocusMode);
			        document.getElementById('focus-exit-btn')?.addEventListener('click', exitFocusMode);
			        document.addEventListener('fullscreenchange', handleFullscreenChange);
			        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

			        // Menu Items
			        document.getElementById('new-btn')?.addEventListener('click', newProject);
			        document.getElementById('open-btn')?.addEventListener('click', () => fileInput.click());
			        document.getElementById('project-info-btn')?.addEventListener('click', openProjectInfoModal);
			        document.getElementById('title-page-btn')?.addEventListener('click', openTitlePageModal);
			        document.getElementById('save-fountain-btn')?.addEventListener('click', saveAsFountain);
			        document.getElementById('save-pdf-unicode-btn')?.addEventListener('click', saveAsPdfUnicode);
			        document.getElementById('share-btn')?.addEventListener('click', shareScript);
			        document.getElementById('info-btn')?.addEventListener('click', openInfoModal);
			        document.getElementById('about-btn')?.addEventListener('click', openAboutModal);

			        // Pro Feature Buttons
			        document.getElementById('google-drive-save-btn')?.addEventListener('click', saveToGoogleDrive);
			        document.getElementById('google-drive-open-btn')?.addEventListener('click', openFromGoogleDrive);
			        document.getElementById('dropbox-save-btn')?.addEventListener('click', saveToDropbox);
			        document.getElementById('dropbox-open-btn')?.addEventListener('click', openFromDropbox);
			        document.getElementById('cloud-sync-btn')?.addEventListener('click', openCloudSyncModal);
        
			        // Card View Buttons
			        document.getElementById('add-new-card-btn')?.addEventListener('click', () => addNewScene());
			        document.getElementById('save-all-cards-btn')?.addEventListener('click', showSaveCardsModal);

			        // Toolbars
			        document.querySelectorAll('#desktop-side-toolbar .action-btn, #mobile-keyboard-toolbar .keyboard-btn').forEach(btn => {
			            btn.addEventListener('click', () => handleAction(btn.dataset.action));
			        });

			        // Global Handlers
			        document.addEventListener('keydown', handleKeyboardShortcuts);
			        window.addEventListener('beforeunload', (e) => {
			            if (!isPlaceholderActive && fountainInput.value.trim()) {
			                e.preventDefault();
			                e.returnValue = '';
			            }
			        });
			        document.addEventListener('backbutton', (e) => {
			            e.preventDefault();
			            window.AndroidBridge.onBackPressed();
			        }, false);
			    }

			    // ========================================
			    // FINAL HELPER FUNCTIONS & APP START
			    // ========================================
    
			    // Most helpers (showToast, newProject, etc.) are in previous parts.
			    // Ensure all necessary helpers are included in the final combined file.
    
			    function handleKeyboardShortcuts(e) {
			        if (e.ctrlKey || e.metaKey) {
			            switch(e.key.toLowerCase()) {
			                case 's': e.preventDefault(); saveProjectData(); showToast('Saved!'); break;
			                case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); break;
			                case 'y': e.preventDefault(); redo(); break;
			            }
			        }
			        if (e.key === 'Escape' && isFocusMode) exitFocusMode();
			    }
    
			    function toggleFullscreen() {
			        if (!document.fullscreenElement) {
			            document.documentElement.requestFullscreen().catch(err => console.error(err));
			        } else {
			            document.exitFullscreen();
			        }
			    }
    
			    function handleFullscreenChange() {
			        isFullscreen = !!document.fullscreenElement;
			        document.body.classList.toggle('fullscreen-active', isFullscreen);
			        if (!isFullscreen && isFocusMode) exitFocusMode();
			    }
    
			    function toggleFocusMode() {
			        if (isFocusMode) {
			            exitFocusMode();
			        } else {
			            isFocusMode = true;
			            if (!isFullscreen) toggleFullscreen();
			            document.body.classList.add('focus-mode-active');
			            showToast('Focus Mode On');
			        }
			    }

			    function exitFocusMode() {
			        isFocusMode = false;
			        document.body.classList.remove('focus-mode-active');
			        showToast('Focus Mode Off');
			    }

			    // Initialize the application
			    init();

			}); // END DOMContentLoaded
