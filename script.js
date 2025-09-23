document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const fountainInput = document.getElementById('fountain-input');
    const screenplayOutput = document.getElementById('screenplay-output');
    const menuPanel = document.getElementById('menu-panel');
    const sceneNavigatorPanel = document.getElementById('scene-navigator-panel');
    const sceneList = document.getElementById('scene-list');
    const fileInput = document.getElementById('file-input');
    const cardContainer = document.getElementById('card-container');
    
    // Views
    const writeView = document.getElementById('write-view');
    const scriptView = document.getElementById('script-view');
    const cardView = document.getElementById('card-view');

    // --- Global State ---
    let projectData = {};
    let currentView = 'write';
    let autoSaveInterval = null;

    const placeholderText = `TITLE: My Awesome Screenplay
AUTHOR: Your Name

INT. COFFEE SHOP - DAY

JANE (30s) types furiously on a laptop. The screenplay of her life.

MARK (30s), a barista, approaches with a knowing smile.

MARK
Another one? You'll single-handedly fund my retirement.

JANE
(not looking up)
It's called dedication, Mark. And a crippling caffeine addiction.

FADE OUT.`;

    // --- CORE APPLICATION LOGIC ---

    function saveProjectData() {
        if (!fountainInput) return;
        projectData.scriptContent = fountainInput.value === placeholderText ? '' : fountainInput.value;
        projectData.scenes = extractScenesFromText(projectData.scriptContent);
        localStorage.setItem('toscripTProject', JSON.stringify(projectData));
        console.log("Project Saved.");
    }

    function loadProjectData() {
        const savedData = localStorage.getItem('toscripTProject');
        if (savedData) {
            projectData = JSON.parse(savedData);
        } else {
            projectData = {
                title: 'Untitled Screenplay',
                author: 'Your Name',
                scriptContent: '',
                scenes: []
            };
        }
        fountainInput.value = projectData.scriptContent || '';
        if (!fountainInput.value) setPlaceholder();
    }
    
    function switchView(view) {
        currentView = view;
        [writeView, scriptView, cardView].forEach(v => v.classList.add('hidden'));

        switch(view) {
            case 'write':
                writeView.classList.remove('hidden');
                fountainInput.focus();
                break;
            case 'script':
                renderScriptPreview();
                scriptView.classList.remove('hidden');
                break;
            case 'card':
                renderCardView();
                cardView.classList.remove('hidden');
                break;
        }
    }

    // --- PARSING & RENDERING ---

    function parseFountain(input) {
        if (!input || !input.trim()) return [];
        const lines = input.split('\n');
        const tokens = [];
        let inDialogue = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const nextLine = (i + 1 < lines.length) ? lines[i+1].trim() : null;
            if (!line) {
                tokens.push({ type: 'empty', text: '' });
                inDialogue = false;
                continue;
            }
            if (line.toUpperCase().startsWith('INT.') || line.toUpperCase().startsWith('EXT.')) {
                tokens.push({ type: 'scene-heading', text: line }); inDialogue = false; continue;
            }
            if (line.toUpperCase().endsWith('TO:') || ['FADE OUT.', 'FADE IN:'].includes(line.toUpperCase())) {
                tokens.push({ type: 'transition', text: line }); inDialogue = false; continue;
            }
            if (line === line.toUpperCase() && nextLine !== null && !line.startsWith('!')) {
                tokens.push({ type: 'character', text: line }); inDialogue = true; continue;
            }
            if (inDialogue && line.startsWith('(') && line.endsWith(')')) {
                tokens.push({ type: 'parenthetical', text: line }); continue;
            }
            if (inDialogue) {
                tokens.push({ type: 'dialogue', text: line }); continue;
            }
            tokens.push({ type: 'action', text: line });
        }
        return tokens;
    }
    
    function extractScenesFromText(text) {
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

    function renderScriptPreview() {
        const titleHTML = `
            <div class="title-page-element">TITLE: ${projectData.title.toUpperCase()}</div>
            <div class="title-page-element">AUTHOR: ${projectData.author}</div>
            <br/><br/>`;
        
        const tokens = parseFountain(fountainInput.value);
        let sceneCount = 0;
        const scriptHtml = tokens.map(token => {
            if (token.type === 'scene-heading') sceneCount++;
            const sceneNumHtml = (token.type === 'scene-heading') ? `<span class="scene-number">${sceneCount}</span>` : '';
            return `<div class="${token.type}">${token.text}${sceneNumHtml}</div>`;
        }).join('');
        
        screenplayOutput.innerHTML = titleHTML + scriptHtml;
    }

    // --- CARD VIEW LOGIC ---

    function renderCardView() {
        const scenes = extractScenesFromText(fountainInput.value);
        if (scenes.length === 0) {
            cardContainer.innerHTML = `<p class="col-span-full text-center text-gray-500">No scenes found. Start writing in the editor!</p>`;
            return;
        }
        cardContainer.innerHTML = scenes.map(scene => `
            <div class="scene-card bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-2" data-scene-number="${scene.number}">
                <div class="card-header flex justify-between items-center pb-2 border-b border-gray-700">
                    <input type="text" class="card-title text-white bg-transparent font-bold w-full focus:outline-none" value="${scene.heading}">
                    <span class="card-number bg-gray-700 text-gray-400 font-bold text-xs px-2 py-1 rounded-md">${scene.number}</span>
                </div>
                <textarea class="card-content bg-gray-800 text-gray-300 h-32 resize-none w-full focus:outline-none">${scene.content.join('\n').trim()}</textarea>
                <button class="delete-card-btn text-red-500 hover:text-red-400 self-end text-xs"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `).join('');
    }
    
    function syncCardsToEditor() {
        const cards = Array.from(cardContainer.querySelectorAll('.scene-card'));
        if (cards.length === 0) return;
        
        let newScriptText = cards.map(card => {
            const title = card.querySelector('.card-title').value;
            const content = card.querySelector('.card-content').value;
            return `${title}\n${content}\n`;
        }).join('\n');
        
        fountainInput.value = newScriptText.trim();
        saveProjectData();
    }

    // --- SCENE NAVIGATOR LOGIC ---

    function populateSceneNavigator() {
        const scenes = extractScenesFromText(fountainInput.value);
        sceneList.innerHTML = scenes.map(scene => 
            `<li class="p-2 bg-gray-700 rounded-md cursor-grab" data-scene-number="${scene.number}">${scene.heading}</li>`
        ).join('');

        if (window.Sortable) {
            new Sortable(sceneList, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'dragging',
            });
        }
    }
    
    function applySceneOrder() {
        const sceneOrder = Array.from(sceneList.children).map(li => parseInt(li.dataset.sceneNumber));
        const currentScenes = extractScenesFromText(fountainInput.value);
        
        const reorderedScenes = sceneOrder.map(num => currentScenes.find(s => s.number === num));
        
        let newScriptText = reorderedScenes.map(scene => {
            if (!scene) return '';
            return `${scene.heading}\n${scene.content.join('\n')}`;
        }).join('\n\n');
        
        fountainInput.value = newScriptText.trim();
        saveProjectData();
        alert("Scene order has been applied to the script.");
        sceneNavigatorPanel.classList.add('translate-x-full');
    }

    // --- EVENT HANDLERS & INITIALIZATION ---

    function setupEventListeners() {
        // View Switching
        document.getElementById('show-script-btn').addEventListener('click', () => switchView('script'));
        document.getElementById('show-write-btn').addEventListener('click', () => switchView('write'));
        document.getElementById('card-view-btn').addEventListener('click', () => switchView('card'));
        document.getElementById('back-to-write-from-card').addEventListener('click', () => switchView('write'));

        // Menu & Panels
        document.getElementById('hamburger-btn').addEventListener('click', () => menuPanel.classList.toggle('-translate-x-full'));
        document.getElementById('scene-navigator-btn').addEventListener('click', () => {
            populateSceneNavigator();
            sceneNavigatorPanel.classList.remove('translate-x-full');
        });
        document.getElementById('close-navigator-btn').addEventListener('click', () => sceneNavigatorPanel.classList.add('translate-x-full'));
        document.getElementById('save-order-btn').addEventListener('click', applySceneOrder);

        // Main Editor Input
        fountainInput.addEventListener('input', () => {
             if (fountainInput.value === placeholderText) clearPlaceholder();
             saveProjectData();
        });
        fountainInput.addEventListener('focus', clearPlaceholder);
        fountainInput.addEventListener('blur', setPlaceholder);

        // Card View Actions
        document.getElementById('add-card-btn').addEventListener('click', () => {
            const newSceneText = `\n\nINT. NEW SCENE - DAY\n\n`;
            fountainInput.value += newSceneText;
            saveProjectData();
            renderCardView();
        });
        document.getElementById('save-cards-btn').addEventListener('click', saveAllCardsAsPdf);
        cardContainer.addEventListener('input', syncCardsToEditor);
        cardContainer.addEventListener('click', e => {
            if (e.target.closest('.delete-card-btn')) {
                const card = e.target.closest('.scene-card');
                const sceneNum = parseInt(card.dataset.sceneNumber);
                if (confirm(`Are you sure you want to delete scene ${sceneNum}?`)) {
                    projectData.scenes = projectData.scenes.filter(s => s.number !== sceneNum);
                    const newText = projectData.scenes.map(s => `${s.heading}\n${s.content.join('\n')}`).join('\n\n');
                    fountainInput.value = newText.trim();
                    saveProjectData();
                    renderCardView();
                }
            }
        });

        // Menu Actions
        document.getElementById('new-btn').addEventListener('click', () => {
            if (confirm("Create a new project? All unsaved data will be lost.")) {
                localStorage.removeItem('toscripTProject');
                initialize();
            }
        });
        document.getElementById('open-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                fountainInput.value = e.target.result;
                clearPlaceholder();
                saveProjectData();
            };
            reader.readAsText(file);
        });

        document.getElementById('save-menu-btn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('save-menu').classList.toggle('hidden');
            e.currentTarget.querySelector('.fa-chevron-right').classList.toggle('rotate-90');
        });
        
        document.getElementById('save-fountain-btn').addEventListener('click', () => {
            const blob = new Blob([fountainInput.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectData.title}.fountain`;
            a.click();
            URL.revokeObjectURL(url);
        });
        
        document.getElementById('save-pdf-btn').addEventListener('click', () => alert("PDF Export coming soon!"));
        document.getElementById('title-page-btn').addEventListener('click', openTitlePageModal);
        document.getElementById('info-btn').addEventListener('click', openInfoModal);
        document.getElementById('auto-save-btn').addEventListener('click', toggleAutoSave);
    }
    
    // --- MODAL & HELPER FUNCTIONS ---

    function setPlaceholder() { if (!fountainInput.value) fountainInput.value = placeholderText; }
    function clearPlaceholder() { if (fountainInput.value === placeholderText) fountainInput.value = ''; }
    
    function createModal(id, title, content) {
        const modalOverlay = document.getElementById(id);
        modalOverlay.classList.remove('hidden', 'opacity-0');
        modalOverlay.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <button class="modal-close-btn absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 class="text-2xl font-bold mb-4 text-white">${title}</h2>
                <div>${content}</div>
            </div>`;
        modalOverlay.querySelector('.modal-close-btn').addEventListener('click', () => modalOverlay.classList.add('hidden'));
    }

    function openTitlePageModal() {
        createModal('title-page-modal', 'Edit Title Page', `
            <div class="space-y-4">
                <div>
                    <label for="title-input" class="block text-sm font-medium text-gray-300">Title</label>
                    <input type="text" id="title-input" class="modal-input" value="${projectData.title}">
                </div>
                <div>
                    <label for="author-input" class="block text-sm font-medium text-gray-300">Author</label>
                    <input type="text" id="author-input" class="modal-input" value="${projectData.author}">
                </div>
            </div>
            <div class="mt-6">
                <button id="save-title-btn" class="bottom-btn primary-btn w-full">Save</button>
            </div>`);
        document.getElementById('save-title-btn').addEventListener('click', () => {
            projectData.title = document.getElementById('title-input').value;
            projectData.author = document.getElementById('author-input').value;
            saveProjectData();
            document.getElementById('title-page-modal').classList.add('hidden');
        });
    }

    function openInfoModal() {
        createModal('info-modal', 'Info & Help', `<p class="text-gray-400">ToscripT is a simple, fast screenwriting tool that uses the Fountain markup syntax. Your work is saved automatically to your browser.</p>`);
    }

    function toggleAutoSave() {
        const indicator = document.getElementById('auto-save-indicator');
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
            indicator.classList.replace('bg-green-500', 'bg-red-500');
            alert('Auto-save disabled.');
        } else {
            autoSaveInterval = setInterval(saveProjectData, 30000); // Save every 30 seconds
            indicator.classList.replace('bg-red-500', 'bg-green-500');
            alert('Auto-save enabled (every 30 seconds).');
        }
    }
    
    async function saveAllCardsAsPdf() {
        if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
            return alert('PDF libraries not yet loaded. Please try again in a moment.');
        }
        alert('Generating PDF of all cards. This may take a moment...');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
        const cards = cardContainer.querySelectorAll('.scene-card');
        
        for (let i = 0; i < cards.length; i++) {
            const canvas = await html2canvas(cards[i], {backgroundColor: '#1f2937'});
            const imgData = canvas.toDataURL('image/png');
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0.5, 0.5, 10, 7.5); // Fit to page with margin
        }
        pdf.save(`${projectData.title}_cards.pdf`);
    }

    // --- INITIALIZE ---
    function initialize() {
        loadProjectData();
        setupEventListeners();
        switchView('write');
        console.log('ToscripT Initialized.');
    }

    initialize();
});
