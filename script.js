document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const fountainInput = document.getElementById('fountain-input');
    const screenplayOutput = document.getElementById('screenplay-output');
    const fileInput = document.getElementById('file-input');
    const menuPanel = document.getElementById('menu-panel');
    const sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    const sceneList = document.getElementById('scene-list');
    
    // Views and Containers
    const writeView = document.getElementById('write-view');
    const scriptView = document.getElementById('script-view');
    const cardView = document.getElementById('card-view'); // Added
    const cardContainer = document.getElementById('card-container'); // Added

    // Buttons
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const openBtn = document.getElementById('open-btn');
    const newBtn = document.getElementById('new-btn');
    const showScriptBtn = document.getElementById('show-script-btn');
    const showWriteBtn = document.getElementById('show-write-btn');
    const cardViewBtn = document.getElementById('card-view-btn'); // Added
    const addCardBtn = document.getElementById('add-card-btn'); // Added
    const backToWriteBtn = document.getElementById('back-to-write-btn'); // Added

    // --- Global State ---
    let projectData = {}; // Central state object
    let currentView = 'write';

    // (Your existing placeholder, undo/redo, tokenizer, and helper functions are great and will be used)
    const placeholderText = `Sample Format...\n\nINT. ROOM – DAY\n...`; // Shortened for brevity
    const history = { /* ... your history object ... */ };

    // --- CORE LOGIC ---

    function saveProjectData() {
        projectData.scriptContent = fountainInput.value === placeholderText ? '' : fountainInput.value;
        localStorage.setItem('toscripTProject_v2', JSON.stringify(projectData));
        console.log("Project Saved.");
    }

    function loadProjectData() {
        const savedData = localStorage.getItem('toscripTProject_v2');
        if (savedData) {
            projectData = JSON.parse(savedData);
        } else {
            projectData = {
                title: 'Untitled',
                author: 'Your Name',
                scriptContent: ''
            };
        }
        fountainInput.value = projectData.scriptContent || '';
        if (!fountainInput.value) setPlaceholder();
        else clearPlaceholder();
        history.add(fountainInput.value);
    }

    function switchView(view) {
        currentView = view;
        [writeView, scriptView, cardView].forEach(v => v.classList.add('hidden'));
        
        const viewMap = {
            'write': writeView,
            'script': scriptView,
            'card': cardView
        };

        if(viewMap[view]) {
            viewMap[view].classList.remove('hidden');
            // Add 'flex' to ensure flexbox layouts work correctly
            if(view !== 'write') viewMap[view].classList.add('flex');
        }

        if (view === 'script') {
            renderPreview(); // Using your existing renderPreview function
        }
        if (view === 'card') {
            renderCardView();
        }
    }

    // --- CARD VIEW LOGIC ---

    function extractScenesFromText(text) {
        if (!text || text.trim() === '' || text === placeholderText) return [];
        
        const lines = text.split('\n');
        const scenes = [];
        let currentScene = null;
        let sceneNumber = 0;
        
        lines.forEach(line => {
            const trimmedLine = line.trim().toUpperCase();
            if (trimmedLine.startsWith('INT.') || trimmedLine.startsWith('EXT.')) {
                if (currentScene) scenes.push(currentScene);
                sceneNumber++;
                currentScene = {
                    number: sceneNumber,
                    heading: line.trim(),
                    content: []
                };
            } else if (currentScene) {
                currentScene.content.push(line);
            }
        });
        if (currentScene) scenes.push(currentScene);
        return scenes;
    }

    function renderCardView() {
        const scenes = extractScenesFromText(fountainInput.value);
        if (scenes.length === 0) {
            cardContainer.innerHTML = `<p class="col-span-full text-center text-gray-500 italic">No scenes found. Add a scene to get started.</p>`;
            return;
        }

        cardContainer.innerHTML = scenes.map(scene => `
            <div class="scene-card" data-scene-number="${scene.number}">
                <div class="card-header">
                    <input type="text" class="card-title" value="${scene.heading}">
                    <span class="card-number">${scene.number}</span>
                </div>
                <textarea class="card-content">${scene.content.join('\n').trim()}</textarea>
                <div class="card-actions">
                    <button class="card-action-btn delete" title="Delete Scene">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function syncCardsToEditor() {
        const cards = Array.from(cardContainer.querySelectorAll('.scene-card'));
        const newScriptText = cards.map(card => {
            const title = card.querySelector('.card-title').value.trim();
            const content = card.querySelector('.card-content').value.trim();
            return `${title}\n${content}`;
        }).join('\n\n');

        if (fountainInput.value !== newScriptText) {
            fountainInput.value = newScriptText;
            history.add(newScriptText);
            saveProjectData();
        }
    }
    
    function setupEventListeners() {
        // --- EVENT LISTENERS from your V2 file ---
        // (New Project, Open, Save Menu, Modals, Toolbar actions, etc.)
        // This ensures all your existing functionality remains.
        
        // --- ADDED/MODIFIED Event Listeners ---
        cardViewBtn.addEventListener('click', () => switchView('card'));
        showWriteBtn.addEventListener('click', () => switchView('write'));
        backToWriteBtn.addEventListener('click', () => switchView('write'));
        showScriptBtn.addEventListener('click', () => switchView('script'));

        addCardBtn.addEventListener('click', () => {
            const newSceneText = `\n\nINT. NEW SCENE - DAY\n`;
            fountainInput.value += newSceneText;
            history.add(fountainInput.value);
            saveProjectData();
            renderCardView();
        });

        // Use event delegation for dynamic cards
        cardContainer.addEventListener('input', syncCardsToEditor);
        cardContainer.addEventListener('click', (e) => {
            if (e.target.closest('.delete')) {
                const cardToDelete = e.target.closest('.scene-card');
                const sceneNumber = parseInt(cardToDelete.dataset.sceneNumber);
                if (confirm(`Are you sure you want to delete scene ${sceneNumber}?`)) {
                    let scenes = extractScenesFromText(fountainInput.value);
                    scenes = scenes.filter(s => s.number !== sceneNumber);
                    
                    const newText = scenes.map(s => `${s.heading}\n${s.content.join('\n')}`).join('\n\n');
                    fountainInput.value = newText.trim();
                    history.add(fountainInput.value);
                    saveProjectData();
                    renderCardView(); // Re-render the cards UI
                }
            }
        });

        // Modify text area input to also save project data
        fountainInput.addEventListener('input', () => {
             clearTimeout(fountainInput.timeout);
             fountainInput.timeout = setTimeout(() => {
                history.add(fountainInput.value);
                saveProjectData();
             }, 300);
        });
        
        // (The rest of your event listeners from V2 would go here)
    }

    function initialize() {
        loadProjectData();
        setupEventListeners();
        // Set the initial view
        writeView.classList.remove('hidden');
        scriptView.classList.add('hidden');
        cardView.classList.add('hidden');
    }

    // --- PASTE THE REST OF YOUR V2 JS HERE ---
    // (placeholder logic, history object, tokenizer, renderPreview, helpers, etc.)
    // Make sure to replace the empty event listener setup above with your full one.

    initialize();
});
