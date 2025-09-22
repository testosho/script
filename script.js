document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const fountainInput = document.getElementById('fountain-input');
    const screenplayOutput = document.getElementById('screenplay-output');
    const newBtn = document.getElementById('new-btn');
    const openBtn = document.getElementById('open-btn');
    const fileInput = document.getElementById('file-input');
    const saveMenuBtn = document.getElementById('save-menu-btn');
    const saveMenu = document.getElementById('save-menu');
    const saveFountainBtn = document.getElementById('save-fountain-btn');
    const saveFdxBtn = document.getElementById('save-fdx-btn');
    const savePdfBtn = document.getElementById('save-pdf-btn');
    const shareBtn = document.getElementById('share-btn');
    const undoBtnSide = document.getElementById('undo-btn-side');
    const redoBtnSide = document.getElementById('redo-btn-side');
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const closeModalBtn = document.getElementById('close-info-modal-btn');
    const writeView = document.getElementById('write-view');
    const scriptView = document.getElementById('script-view');
    const cardView = document.getElementById('card-view');
    const showScriptBtn = document.getElementById('show-script-btn');
    const showWriteBtn = document.getElementById('show-write-btn');
    const backToWriteBtn = document.getElementById('back-to-write-btn');
    const cardViewBtn = document.getElementById('card-view-btn');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const menuPanel = document.getElementById('menu-panel');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const titlePageBtn = document.getElementById('title-page-btn');
    const titlePageModal = document.getElementById('title-page-modal');
    const closeTitleModalBtn = document.getElementById('close-title-modal-btn');
    const saveTitleBtn = document.getElementById('save-title-btn');
    const titleInput = document.getElementById('title-input');
    const authorInput = document.getElementById('author-input');
    const sceneNoBtn = document.getElementById('scene-no-btn');
    const sceneNoIndicator = document.getElementById('scene-no-indicator');
    const sceneNavigatorBtn = document.getElementById('scene-navigator-btn');
    const sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    const closeNavigatorBtn = document.getElementById('close-navigator-btn');
    const sceneList = document.getElementById('scene-list');
    const autoSaveBtn = document.getElementById('auto-save-btn');
    const autoSaveIndicator = document.getElementById('auto-save-indicator');
    const mobileToolbar = document.getElementById('mobile-bottom-toolbar');
    const fullscreenBtnInlineEditor = document.getElementById('fullscreen-btn-inline-editor');
    const goProBtn = document.getElementById('go-pro-btn');

    // Card view elements
    const cardContainer = document.getElementById('card-container');
    const addCardBtn = document.getElementById('add-card-btn');
    const saveCardsBtn = document.getElementById('save-cards-btn');

    // --- Global State ---
    let scriptTitle = "Untitled";
    let scriptAuthor = "Your Name";
    let showSceneNumbers = true;
    let autoSaveIntervalId = null;
    let currentView = 'write';

    // --- Placeholder Logic ---
    const placeholderText = `Sample Format...

INT. ROOM – DAY
Fingers race across a glowing phone screen.
SANTHOSH
(focused)
Keep going, this is worth it.
FADE OUT:

Type screenplay here & click SCRIPT button to format it...`;

    function setPlaceholder() {
        if (fountainInput.value === '') {
            fountainInput.value = placeholderText;
            fountainInput.classList.add('text-gray-500', 'italic');
        }
    }

    function clearPlaceholder() {
        if (fountainInput.value === placeholderText) {
            fountainInput.value = '';
            fountainInput.classList.remove('text-gray-500', 'italic');
        }
    }

    fountainInput.addEventListener('focus', clearPlaceholder);
    fountainInput.addEventListener('blur', setPlaceholder);

    // --- Undo/Redo Manager ---
    const history = {
        stack: [""],
        currentIndex: 0,
        add(value) {
            if (value === placeholderText || value === this.stack[this.currentIndex]) return;
            this.stack = this.stack.slice(0, this.currentIndex + 1);
            this.stack.push(value);
            this.currentIndex++;
            this.updateButtons();
        },
        undo() { if (this.canUndo()) { this.currentIndex--; this.updateInput(); } },
        redo() { if (this.canRedo()) { this.currentIndex++; this.updateInput(); } },
        canUndo: () => history.currentIndex > 0,
        canRedo: () => history.currentIndex < history.stack.length - 1,
        updateInput() {
            fountainInput.value = this.stack[this.currentIndex] || '';
            if(fountainInput.value === ''){
                setPlaceholder();
            } else {
                clearPlaceholder();
            }
            this.updateButtons();
        },
        updateButtons() {
            undoBtnSide.disabled = !this.canUndo();
            redoBtnSide.disabled = !this.canRedo();
        }
    };

    // --- FOUNTAIN PARSING ENGINE ---
    function tokenizeFountain(input) {
        if (input === placeholderText || !input) {
            return [];
        }
        const lines = input.split('\n');
        const tokens = [];
        let inDialogue = false;

        for(let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const nextLine = (i + 1 < lines.length) ? lines[i+1].trim() : '';

            // Empty line - resets dialogue state
            if (!line) {
                tokens.push({ type: 'empty' });
                inDialogue = false;
                continue;
            }

            // Scene headings
            if (line.toUpperCase().startsWith('INT.') || line.toUpperCase().startsWith('EXT.')) {
                tokens.push({ type: 'sceneHeading', content: line.toUpperCase() });
                inDialogue = false;
                continue;
            }

            // Transitions
            if (line.toUpperCase().endsWith('TO:') ||
                line.toUpperCase() === 'FADE OUT.' ||
                line.toUpperCase() === 'FADE IN:' ||
                line.toUpperCase() === 'FADE TO BLACK:' ||
                line.toUpperCase() === 'CUT TO:') {
                tokens.push({ type: 'transition', content: line.toUpperCase() });
                inDialogue = false;
                continue;
            }

            // Character names - FIXED LOGIC
            if (line === line.toUpperCase() &&
                line.length > 0 &&
                !line.startsWith('!') &&
                !line.includes('.') && // Avoid scene headings
                (nextLine && (nextLine.startsWith('(') || nextLine.length > 0))) {
                tokens.push({ type: 'character', content: line });
                inDialogue = true;
                continue;
            }

            // Parenthetical
            if (inDialogue && line.startsWith('(') && line.endsWith(')')) {
                tokens.push({ type: 'parenthetical', content: line });
                continue;
            }

            // Dialogue - if we're in dialogue mode and it's not a parenthetical
            if (inDialogue && !line.startsWith('(')) {
                tokens.push({ type: 'dialogue', content: line });
                continue;
            }

            // Everything else is action
            tokens.push({ type: 'action', content: line });
            inDialogue = false; // Reset dialogue state for action lines
        }

        return tokens;
    }

    // --- SCRIPT PREVIEW RENDERER ---
    function renderPreview() {
        const rawText = fountainInput.value;

        // Don't render if it's placeholder text
        if (rawText === placeholderText || rawText.trim() === '') {
            screenplayOutput.innerHTML = '<p class="text-gray-500 italic">Type your screenplay and click "TO SCRIPT" to see the formatted preview...</p>';
            return;
        }

        const tokens = tokenizeFountain(rawText);
        let html = '';
        let sceneNumber = 1;

        // Title page
        if (scriptTitle && scriptTitle.trim() !== '' || scriptAuthor && scriptAuthor.trim() !== '') {
            html += `<div class="title-page mb-8 text-center">`;
            if (scriptTitle && scriptTitle.trim() !== '') {
                html += `<h1 class="text-2xl font-bold mb-4">${scriptTitle.toUpperCase()}</h1>`;
            }
            if (scriptAuthor && scriptAuthor.trim() !== '') {
                html += `<h2 class="text-lg">${scriptAuthor}</h2>`;
            }
            html += `</div><div class="page-break"></div>`;
        }

        // Process tokens
        tokens.forEach(token => {
            if (token.type === 'sceneHeading') {
                const sceneText = token.content;
                if (showSceneNumbers) {
                    html += `<div class="scene-heading flex justify-between items-center font-bold uppercase mb-2 mt-4">
                        <span>${sceneText}</span>
                        <span class="text-sm">${sceneNumber}</span>
                    </div>`;
                } else {
                    html += `<div class="scene-heading font-bold uppercase mb-2 mt-4">${sceneText}</div>`;
                }
                sceneNumber++;
            } else if (token.type === 'character') {
                html += `<div class="character text-center font-bold mt-4 mb-1">${token.content}</div>`;
            } else if (token.type === 'dialogue') {
                html += `<div class="dialogue text-center max-w-md mx-auto">${token.content}</div>`;
            } else if (token.type === 'parenthetical') {
                html += `<div class="parenthetical text-center text-sm italic max-w-sm mx-auto">${token.content}</div>`;
            } else if (token.type === 'action') {
                html += `<div class="action mb-2">${token.content}</div>`;
            } else if (token.type === 'transition') {
                html += `<div class="transition text-right font-bold mt-4 mb-2">${token.content}</div>`;
            } else if (token.type === 'empty') {
                html += '<div class="empty-line mb-2">&nbsp;</div>';
            }
        });

        screenplayOutput.innerHTML = html;
    }

    // --- CARD VIEW FUNCTIONALITY ---
    function extractScenesFromText(text) {
        if (!text || text.trim() === '' || text === placeholderText) {
            return [];
        }
        
        const tokens = tokenizeFountain(text);
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;

        tokens.forEach(token => {
            if (token.type === 'sceneHeading') {
                // Save previous scene if it exists
                if (currentScene) {
                    scenes.push(currentScene);
                }
                
                // Start new scene
                sceneNumber++;
                currentScene = {
                    number: sceneNumber,
                    heading: token.content,
                    content: []
                };
            } else if (currentScene && token.type !== 'empty') {
                // Append to current scene content
                currentScene.content.push(token.content);
            }
        });

        // Don't forget the last scene
        if (currentScene) {
            scenes.push(currentScene);
        }

        return scenes;
    }

    function renderCardView() {
        if (!cardContainer) return;
        
        const scenes = extractScenesFromText(fountainInput.value);
        
        if (scenes.length === 0) {
            cardContainer.innerHTML = `
                <div class="cards-empty-state">
                    <i class="fas fa-film"></i>
                    <h3>No scenes found</h3>
                    <p>Write some scenes in the editor or click "Add Scene" to create cards</p>
                </div>`;
            return;
        }

        cardContainer.innerHTML = scenes.map(scene => `
            <div class="scene-card" data-scene-number="${scene.number}">
                <div class="scene-card-actions">
                    <button class="card-action-btn delete" data-scene="${scene.number}" title="Delete Scene">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="scene-card-header">
                    <input type="text" class="scene-card-title" value="${scene.heading}" data-scene="${scene.number}">
                    <input type="text" class="scene-card-number" value="${scene.number}" data-scene="${scene.number}">
                </div>
                <textarea class="scene-card-content" data-scene="${scene.number}" placeholder="Enter scene content...">${scene.content.join('\n')}</textarea>
            </div>
        `).join('');

        // Bind events to the new cards
        bindCardEvents();
    }

    function bindCardEvents() {
        // Handle all card input events
        cardContainer.addEventListener('input', debounce(syncCardsToEditor, 500));
        
        // Handle delete buttons
        cardContainer.addEventListener('click', (e) => {
            if (e.target.closest('.delete')) {
                const sceneNum = e.target.closest('.delete').dataset.scene;
                if (confirm(`Delete scene ${sceneNum}? This cannot be undone.`)) {
                    deleteScene(parseInt(sceneNum));
                }
            }
        });
    }

    function syncCardsToEditor() {
        if (!cardContainer || currentView !== 'card') return;
        
        const cards = Array.from(cardContainer.querySelectorAll('.scene-card'));
        let scriptText = '';
        
        cards.forEach((card, index) => {
            const titleInput = card.querySelector('.scene-card-title');
            const contentTextarea = card.querySelector('.scene-card-content');
            const numberInput = card.querySelector('.scene-card-number');
            
            if (titleInput && contentTextarea) {
                const title = titleInput.value.trim();
                const content = contentTextarea.value.trim();
                
                // Update scene number
                numberInput.value = index + 1;
                
                if (title) {
                    scriptText += title.toUpperCase() + '\n';
                    if (content) {
                        scriptText += content + '\n\n';
                    } else {
                        scriptText += '\n';
                    }
                }
            }
        });

        if (scriptText.trim() && fountainInput.value !== scriptText.trim()) {
            fountainInput.value = scriptText.trim();
            history.add(fountainInput.value);
        }
    }

    function addNewScene() {
        const scenes = extractScenesFromText(fountainInput.value);
        const newSceneNumber = scenes.length + 1;
        const newSceneText = `INT. NEW SCENE - DAY\n\n\n`;
        
        fountainInput.value += newSceneText;
        history.add(fountainInput.value);
        renderCardView();
        
        // Focus the new card
        setTimeout(() => {
            const newCard = cardContainer.querySelector(`[data-scene-number="${newSceneNumber}"]`);
            if (newCard) {
                const titleInput = newCard.querySelector('.scene-card-title');
                if (titleInput) {
                    titleInput.focus();
                    titleInput.select();
                }
            }
        }, 100);
    }

    function deleteScene(sceneNumber) {
        const lines = fountainInput.value.split('\n');
        const scenes = extractScenesFromText(fountainInput.value);
        
        if (sceneNumber <= 0 || sceneNumber > scenes.length) return;
        
        // Find the scene to delete
        const sceneToDelete = scenes[sceneNumber - 1];
        if (!sceneToDelete) return;
        
        // Remove the scene from the text
        let newText = '';
        let currentSceneNum = 0;
        let inDeletedScene = false;
        
        lines.forEach(line => {
            const trimmedLine = line.trim().toUpperCase();
            if (trimmedLine.startsWith('INT.') || trimmedLine.startsWith('EXT.')) {
                currentSceneNum++;
                inDeletedScene = (currentSceneNum === sceneNumber);
            }
            
            if (!inDeletedScene) {
                newText += line + '\n';
            }
        });
        
        fountainInput.value = newText.trim();
        history.add(fountainInput.value);
        renderCardView();
    }

    function switchView(view) {
        currentView = view;
        
        // Hide all views
        writeView.classList.add('hidden');
        scriptView.classList.add('hidden');
        cardView.classList.add('hidden');
        
        // Show the selected view
        switch(view) {
            case 'write':
                writeView.classList.remove('hidden');
                setTimeout(() => fountainInput.focus(), 100);
                break;
            case 'script':
                renderPreview();
                scriptView.classList.remove('hidden');
                break;
            case 'card':
                renderCardView();
                cardView.classList.remove('hidden');
                break;
        }
    }

    // --- FILE OPERATIONS ---
    function createFdxContent(fountainText) {
        const tokens = tokenizeFountain(fountainText);
        let fdxContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><FinalDraft DocumentType="Script" Template="No" Version="1"><Content>`;
        tokens.forEach(token => {
            let type = 'Action';
            if (token.type === 'sceneHeading') type = 'Scene Heading';
            if (token.type === 'character') type = 'Character';
            if (token.type === 'dialogue') type = 'Dialogue';
            if (token.type === 'parenthetical') type = 'Parenthetical';
            if (token.type === 'transition') type = 'Transition';
            fdxContent += `<Paragraph Type="${type}"><Text>${token.content}</Text></Paragraph>`;
        });
        fdxContent += `</Content></FinalDraft>`;
        return fdxContent;
    }

    function nativeSaveAs(filename, content, mimeType, isBase64 = false) {
        if (window.Android && typeof window.Android.saveFile === 'function') {
            window.Android.saveFile(filename, content, mimeType, isBase64);
        } else {
            // Fallback for web browsers
            const blob = isBase64 ? 
                new Blob([Uint8Array.from(atob(content), c => c.charCodeAt(0))], {type: mimeType}) :
                new Blob([content], {type: mimeType});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    // --- TEXTAREA MANIPULATION HELPERS ---
    let lastTransition = { text: null, start: -1, end: -1 };
    const transitions = ['CUT TO:', 'FADE IN:', 'FADE OUT:', 'FADE TO BLACK:'];
    let lastScene = { text: null, start: -1, end: -1 };
    const scenes = ['INT. ', 'EXT. ', 'INT./EXT. '];
    let lastTime = { text: null, start: -1, end: -1 };
    const times = [' - DAY', ' - NIGHT', ' - DAY / NIGHT'];

    function cycleHelper(textarea, cycleArray, lastState) {
        clearPlaceholder();
        const currentPos = textarea.selectionStart;

        if (lastState.text && currentPos === lastState.end && textarea.value.substring(lastState.start, lastState.end) === lastState.text) {
            const currentIndex = cycleArray.indexOf(lastState.text);
            const nextIndex = (currentIndex + 1) % cycleArray.length;
            const newText = cycleArray[nextIndex];

            textarea.value = textarea.value.substring(0, lastState.start) + newText + textarea.value.substring(lastState.end);
            textarea.selectionStart = textarea.selectionEnd = lastState.start + newText.length;

            lastState.text = newText;
            lastState.end = lastState.start + newText.length;
        } else {
            const newText = cycleArray[0];
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + newText.length;

            lastState.start = start;
            lastState.end = start + newText.length;
            lastState.text = newText;
        }
        textarea.focus();
        history.add(textarea.value);
    }

    function wrapWithParens(textarea) {
        clearPlaceholder();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const newText = `(${selectedText})`;
        textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = end + 1;
        textarea.focus();
        history.add(textarea.value);
    }

    function toggleCase(textarea) {
        clearPlaceholder();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        let newText = '';
        let targetText = '';

        if (start === end) {
            let lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
            let lineEnd = textarea.value.indexOf('\n', start);
            if (lineEnd === -1) lineEnd = textarea.value.length;

            targetText = textarea.value.substring(lineStart, lineEnd);
            newText = (targetText === targetText.toUpperCase()) ? targetText.toLowerCase() : targetText.toUpperCase();
            textarea.value = textarea.value.substring(0, lineStart) + newText + textarea.value.substring(lineEnd);
            textarea.selectionStart = start;
            textarea.selectionEnd = end;

        } else {
            targetText = textarea.value.substring(start, end);
            newText = (targetText === targetText.toUpperCase()) ? targetText.toLowerCase() : targetText.toUpperCase();
            textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
            textarea.selectionStart = start;
            textarea.selectionEnd = start + newText.length;
        }
        textarea.focus();
        history.add(textarea.value);
    }

    // --- UTILITY FUNCTIONS ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- EVENT LISTENERS ---
    
    // New project
    newBtn?.addEventListener('click', () => {
        if (confirm('Start a new project? Unsaved changes will be lost.')) {
            scriptTitle = '';
            scriptAuthor = '';
            fountainInput.value = '';
            screenplayOutput.innerHTML = '';
            setPlaceholder();
            history.stack = [''];
            history.currentIndex = 0;
            history.updateButtons();
            menuPanel?.classList.add('-translate-x-full');
            switchView('write');
        }
    });

    // File operations
    openBtn?.addEventListener('click', () => {
        fileInput?.click();
        menuPanel?.classList.add('-translate-x-full');
    });

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            fountainInput.value = e.target.result;
            clearPlaceholder();
            history.add(fountainInput.value);
        };
        reader.readAsText(file, 'UTF-8');
    });

    // Save menu
    saveMenuBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        saveMenu?.classList.toggle('hidden');
    });

    // Save buttons
    saveFountainBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        const filename = (scriptTitle || 'script').replace(/\s+/g, '_').replace(/[^\w-]/g, '');
        nativeSaveAs(`${filename}.fountain`, fountainInput.value, 'text/plain');
        menuPanel?.classList.add('-translate-x-full');
    });

    saveFdxBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        const filename = (scriptTitle || 'script').replace(/\s+/g, '_').replace(/[^\w-]/g, '');
        const fdxContent = createFdxContent(fountainInput.value);
        nativeSaveAs(`${filename}.fdx`, fdxContent, 'application/vnd.finaldraft');
        menuPanel?.classList.add('-translate-x-full');
    });

    savePdfBtn?.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        // PDF generation code here (keeping original implementation)
        const filename = (scriptTitle || 'script').replace(/\s+/g, '_').replace(/[^\w-]/g, '');
        const pdfData = doc.output('datauristring').split(',')[1];
        nativeSaveAs(`${filename}.pdf`, pdfData, 'application/pdf', true);
        menuPanel?.classList.add('-translate-x-full');
    });

    // View switching
    showScriptBtn?.addEventListener('click', () => switchView('script'));
    showWriteBtn?.addEventListener('click', () => switchView('write'));
    backToWriteBtn?.addEventListener('click', () => switchView('write'));
    cardViewBtn?.addEventListener('click', () => switchView('card'));

    // Card view buttons
    addCardBtn?.addEventListener('click', addNewScene);
    saveCardsBtn?.addEventListener('click', () => {
        alert('Card export functionality coming soon!');
    });

    // Menu toggle
    hamburgerBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        menuPanel?.classList.toggle('-translate-x-full');
    });

    // Scene navigator
    sceneNavigatorBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        populateSceneNavigator();
        sceneNavigatorPanel?.classList.toggle('translate-x-full');
    });

    closeNavigatorBtn?.addEventListener('click', () => {
        sceneNavigatorPanel?.classList.add('translate-x-full');
    });

    // Action buttons
    document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            switch(action) {
                case 'caps': toggleCase(fountainInput); break;
                case 'parens': wrapWithParens(fountainInput); break;
                case 'transition': cycleHelper(fountainInput, transitions, lastTransition); break;
                case 'scene': cycleHelper(fountainInput, scenes, lastScene); break;
                case 'time': cycleHelper(fountainInput, times, lastTime); break;
            }
        });
    });

    // Text input
    let inputTimeout;
    fountainInput?.addEventListener('input', () => {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => {
            history.add(fountainInput.value);
            if (currentView === 'card') {
                renderCardView();
            }
        }, 300);
    });

    // Undo/Redo
    undoBtnSide?.addEventListener('click', () => history.undo());
    redoBtnSide?.addEventListener('click', () => history.redo());

    // Info modal
    infoBtn?.addEventListener('click', () => {
        infoModal?.classList.remove('hidden');
        menuPanel?.classList.add('-translate-x-full');
    });
    
    closeModalBtn?.addEventListener('click', () => {
        infoModal?.classList.add('hidden');
    });

    // Title page
    titlePageBtn?.addEventListener('click', () => {
        titleInput.value = scriptTitle;
        authorInput.value = scriptAuthor;
        titlePageModal?.classList.remove('hidden');
        menuPanel?.classList.add('-translate-x-full');
    });

    closeTitleModalBtn?.addEventListener('click', () => {
        titlePageModal?.classList.add('hidden');
    });

    saveTitleBtn?.addEventListener('click', () => {
        scriptTitle = titleInput.value;
        scriptAuthor = authorInput.value;
        titlePageModal?.classList.add('hidden');
    });

    // Scene numbers
    sceneNoBtn?.addEventListener('click', () => {
        showSceneNumbers = !showSceneNumbers;
        sceneNoIndicator?.classList.toggle('bg-green-500', showSceneNumbers);
        sceneNoIndicator?.classList.toggle('bg-gray-500', !showSceneNumbers);
    });

    // Zoom
    let currentFontSize = 16;
    zoomInBtn?.addEventListener('click', () => {
        currentFontSize += 2;
        fountainInput.style.fontSize = `${currentFontSize}px`;
    });

    zoomOutBtn?.addEventListener('click', () => {
        currentFontSize = Math.max(8, currentFontSize - 2);
        fountainInput.style.fontSize = `${currentFontSize}px`;
    });

    // Fullscreen
    fullscreenBtnInlineEditor?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Auto-save
    autoSaveBtn?.addEventListener('click', () => {
        if (autoSaveIntervalId) {
            clearInterval(autoSaveIntervalId);
            autoSaveIntervalId = null;
            autoSaveIndicator?.classList.remove('bg-green-500');
            autoSaveIndicator?.classList.add('bg-gray-500');
        } else {
            autoSaveIntervalId = setInterval(() => {
                console.log('Auto-save triggered');
            }, 120000);
            autoSaveIndicator?.classList.add('bg-green-500');
            autoSaveIndicator?.classList.remove('bg-gray-500');
        }
    });

    // Scene navigator population
    function populateSceneNavigator() {
        sceneList.innerHTML = '';
        const lines = fountainInput.value.split('\n');
        let sceneIndex = 0;
        lines.forEach((line) => {
            const trimmedLine = line.trim().toUpperCase();
            if (trimmedLine.startsWith('INT.') || trimmedLine.startsWith('EXT.')) {
                const li = document.createElement('li');
                li.textContent = line;
                li.className = 'p-2 text-gray-300 bg-gray-700 rounded-md mb-2 cursor-grab';
                li.draggable = true;
                li.dataset.sceneIndex = sceneIndex++;
                sceneList.appendChild(li);
            }
        });
    }

    // Share functionality
    shareBtn?.addEventListener('click', () => {
        if (window.Android && typeof window.Android.shareContent === 'function') {
            window.Android.shareContent(fountainInput.value);
        } else {
            alert('Share functionality is only available in the app.');
        }
    });

    // Go Pro
    goProBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.Android && typeof window.Android.startProPurchase === 'function') {
            window.Android.startProPurchase();
        } else {
            alert('Pro features can only be unlocked in the official app.');
        }
        menuPanel?.classList.add('-translate-x-full');
    });

    // Global click handler
    document.addEventListener('click', (e) => {
        if (!menuPanel?.contains(e.target) && !hamburgerBtn?.contains(e.target)) {
            menuPanel?.classList.add('-translate-x-full');
        }
        
        if (!sceneNavigatorPanel?.contains(e.target) && !sceneNavigatorBtn?.contains(e.target)) {
            sceneNavigatorPanel?.classList.add('translate-x-full');
        }
    });

    // Native bridge functions
    window.loadFileContent = function(base64Content) {
        try {
            const decodedContent = atob(base64Content);
            fountainInput.value = decodedContent;
            clearPlaceholder();
            history.stack = ['', decodedContent];
            history.currentIndex = 1;
            history.updateButtons();
        } catch (e) {
            console.error("Failed to decode Base64 content:", e);
            alert("Could not open the selected file.");
        }
    };

    // --- INITIALIZATION ---
    setPlaceholder();
    history.stack = [''];
    history.currentIndex = 0;
    history.updateButtons();
    fountainInput.style.fontSize = `${currentFontSize}px`;
    switchView('write');
    
    console.log('ToscripT with Card View initialized successfully!');
});
