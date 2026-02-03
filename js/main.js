import { $, $$, debounce, generateId, autoExpand } from './utils.js';
import { store } from './store.js';
import { setLanguage, t, getCurrentLang } from './i18n.js';
import * as Renderers from './renderers.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- RENDER ORCHESTRATION ---
    const renderAll = () => {
        const state = store.getState();
        Renderers.renderMeta(state);
        Renderers.renderIngredients(state);
        Renderers.renderSimpleTable('#perfBody', state.performanceData, '#perfRowTpl', ['parameter', 'value']);
        Renderers.renderSimpleTable('#stabBody', state.stabilityData, '#stabRowTpl', ['condition', 'result']);
        Renderers.renderSimpleTable('#equipmentBody', state.equipment, '#equipmentRowTpl', ['shortName', 'fullName', 'notes']);
        Renderers.renderProcess(state);
        Renderers.renderQc(state);
        $$('textarea').forEach(autoExpand);
    };

    // Subscribe to store changes
    store.subscribe(() => {
        // We could optimize this to only render changed sections, 
        // but for this scale, full render is acceptable and safer.
        // Note: Input fields losing focus on re-render is a common issue with full re-renders.
        // However, the 'input' event handler updates state but doesn't trigger a full re-render 
        // via store.setState immediately for every keystroke in a way that destroys DOM.
        // The debounced save happens in background.
        // *Correction*: If we re-render on every keystroke, we lose focus. 
        // The store.subscribe should be used for external changes (load, clear).
        // User input updates state silently, and we only re-render if structure changes (add/remove row).
    });

    // Initial Render
    setLanguage(getCurrentLang(), renderAll);

    // --- EVENT HANDLERS ---

    // 1. Global Input Handling (Data Binding)
    document.body.addEventListener('input', (e) => {
        if (!e.target.classList.contains('data-field') && e.target.id !== 'batchSize' && !e.target.closest('.meta-grid')) return;
        
        const state = store.getState();
        const target = e.target;
        const key = target.dataset.key || target.id;
        const value = target.value;

        // Reset example loader
        const exampleLoader = $('#exampleLoader');
        if (exampleLoader.value !== "") exampleLoader.value = "";

        // Meta fields
        if (state.meta.hasOwnProperty(key)) {
            state.meta[key] = value;
            if (key === 'description') $('#description-print').textContent = value;
            if (key === 'batchSize') Renderers.renderIngredients(state); // Re-calc mass
        }

        // Ingredients
        const ingRow = target.closest('#formBody tr[data-id]');
        if (ingRow) {
            const item = state.ingredients.find(i => i.id == ingRow.dataset.id);
            if (item) {
                item[key] = value;
                if (target.tagName === 'TEXTAREA') {
                    const printEl = ingRow.querySelector(`[data-key="${key}-print"]`);
                    if(printEl) printEl.textContent = value;
                }
                if (key === 'percent') {
                    const batchSize = parseFloat(state.meta.batchSize) || 0;
                    ingRow.querySelector('.mass-cell').textContent = (batchSize * (parseFloat(value) || 0) / 100).toFixed(3);
                    // Update totals without full re-render
                    const sum = state.ingredients.reduce((acc, ing) => acc + (parseFloat(ing.percent) || 0), 0);
                    const sumEl = $('#sumPercent');
                    sumEl.textContent = `${sum.toFixed(2)}%`;
                    sumEl.className = Math.abs(sum - 100) < 0.01 ? 'ok' : 'bad';
                }
                // Phase sorting logic handled on blur or specific action, not input, to avoid jumping
            }
        }

        // Simple Tables (Performance, Stability, Equipment)
        const perfRow = target.closest('#perfBody tr[data-id]');
        if (perfRow) state.performanceData.find(i => i.id == perfRow.dataset.id)[key] = value;

        const stabRow = target.closest('#stabBody tr[data-id]');
        if (stabRow) state.stabilityData.find(i => i.id == stabRow.dataset.id)[key] = value;

        const equipRow = target.closest('#equipmentBody tr[data-id]');
        if (equipRow) {
            state.equipment.find(i => i.id == equipRow.dataset.id)[key] = value;
            // If shortName changes, we might need to update process dropdowns, but let's do that on blur/save
        }

        // Process
        const procRow = target.closest('#procBody tr[data-id]');
        if (procRow) {
            const step = state.processSteps.find(s => s.id == procRow.dataset.id);
            if (step) {
                const paramId = target.dataset.paramId;
                if (paramId) {
                    const param = step.parameters.find(p => p.id == paramId);
                    if (param) param[key] = value;
                } else {
                    step[key] = value;
                    if (target.tagName === 'TEXTAREA') {
                        const printEl = procRow.querySelector(`[data-key="${key}-print"]`);
                        if(printEl) printEl.textContent = value;
                    }
                }
            }
        }

        // QC
        const qcBlock = target.closest('.qc-block[data-id]');
        if (qcBlock) {
            const block = state.qualityControl.find(b => b.id == qcBlock.dataset.id);
            if (block) {
                const checkRow = target.closest('tr[data-check-id]');
                if (checkRow) {
                    const check = block.checks.find(c => c.id == checkRow.dataset.checkId);
                    if (check) check[key] = value;
                } else {
                    block[key] = value;
                }
            }
        }

        // Auto expand textareas
        if (target.tagName.toLowerCase() === 'textarea') autoExpand(target);

        // Persist silently
        store.saveToStorage();
    });

    // 2. Click Handling (Buttons, Chips)
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const state = store.getState();
        let shouldRender = false;

        // Add Buttons
        if (target.id === 'addIngredientBtn') { store.addIngredient(); shouldRender = true; }
        if (target.id === 'addPerfBtn') { store.addPerformanceParam(); shouldRender = true; }
        if (target.id === 'addStabBtn') { store.addStabilityTest(); shouldRender = true; }
        if (target.id === 'addEquipmentBtn') { store.addEquipment(); shouldRender = true; }
        if (target.id === 'addProcBtn') { store.addProcessStep(); shouldRender = true; }
        if (target.id === 'addQcBtn') { store.addQcBlock(); shouldRender = true; }

        // Dynamic Add Buttons (Process Params, QC Checks)
        if (target.classList.contains('addParamBtn')) {
            const stepId = target.closest('tr').dataset.id;
            const step = state.processSteps.find(s => s.id == stepId);
            if (step) {
                if (!step.parameters) step.parameters = [];
                step.parameters.push({ id: generateId(), name: '', norm: '' });
                store.saveToStorage();
                shouldRender = true;
            }
        }
        if (target.classList.contains('addQcCheckBtn')) {
            const blockId = target.closest('.qc-block').dataset.id;
            const block = state.qualityControl.find(b => b.id == blockId);
            if (block) {
                if (!block.checks) block.checks = [];
                block.checks.push({ id: generateId(), parameter: '', standard: '' });
                store.saveToStorage();
                shouldRender = true;
            }
        }

        // Delete Buttons
        if (target.classList.contains('delBtn')) {
            if (!confirm(t('confirmDelete'))) return;
            const row = target.closest('tr[data-id]');
            if (row) {
                const id = row.dataset.id;
                if ($('#formBody').contains(row)) store.deleteItem('ingredients', id);
                else if ($('#perfBody').contains(row)) store.deleteItem('performanceData', id);
                else if ($('#stabBody').contains(row)) store.deleteItem('stabilityData', id);
                else if ($('#equipmentBody').contains(row)) store.deleteItem('equipment', id);
                else if ($('#procBody').contains(row)) store.deleteItem('processSteps', id);
                shouldRender = true;
            }
        }
        
        // Delete Sub-items (Process Params, QC Checks, QC Blocks)
        if (target.classList.contains('delParamBtn')) {
            const paramRow = target.closest('tr');
            const stepId = paramRow.dataset.id;
            const paramId = target.dataset.paramId;
            const step = state.processSteps.find(s => s.id == stepId);
            if (step) {
                step.parameters = step.parameters.filter(p => p.id != paramId);
                store.saveToStorage();
                shouldRender = true;
            }
        }
        if (target.classList.contains('delQcBtn')) {
            if (!confirm(t('confirmDeleteBlock'))) return;
            const blockId = target.closest('.qc-block').dataset.id;
            store.deleteItem('qualityControl', blockId);
            shouldRender = true;
        }
        if (target.classList.contains('delQcCheckBtn')) {
            const checkRow = target.closest('tr');
            const blockId = checkRow.dataset.id;
            const checkId = checkRow.dataset.checkId;
            const block = state.qualityControl.find(b => b.id == blockId);
            if (block) {
                block.checks = block.checks.filter(c => c.id != checkId);
                store.saveToStorage();
                shouldRender = true;
            }
        }

        // Equipment Chips Removal
        if (target.classList.contains('chip-remove')) {
            e.stopPropagation();
            const stepRow = target.closest('tr');
            const stepId = stepRow.dataset.id;
            const valToRemove = target.dataset.val;
            const step = state.processSteps.find(s => s.id == stepId);
            if (step) {
                const currentIds = step.equipment ? step.equipment.split(',').map(s => s.trim()) : [];
                step.equipment = currentIds.filter(v => v !== valToRemove).join(', ');
                store.saveToStorage();
                shouldRender = true;
            }
        }

        if (shouldRender) {
            $('#exampleLoader').value = "";
            renderAll();
        }
    });

    // 3. Change Handling (Selects, Equipment Add)
    document.body.addEventListener('change', (e) => {
        const target = e.target;
        
        // Equipment Add Dropdown in Process
        if (target.classList.contains('equip-add-select')) {
            const newVal = target.value;
            if (newVal) {
                const stepRow = target.closest('tr');
                const stepId = stepRow.dataset.id;
                const state = store.getState();
                const step = state.processSteps.find(s => s.id == stepId);
                if (step) {
                    const currentIds = step.equipment ? step.equipment.split(',').map(s => s.trim()).filter(s => s) : [];
                    currentIds.push(newVal);
                    step.equipment = currentIds.join(', ');
                    store.saveToStorage();
                    $('#exampleLoader').value = "";
                    renderAll();
                }
            }
        }

        // Re-sort ingredients on phase change (blur/change)
        if (target.dataset.key === 'phase') {
            const state = store.getState();
            // Just re-render to sort
            renderAll();
        }
    });

    // --- TOOLBAR ACTIONS ---

    $('#printBtn').addEventListener('click', () => {
        const state = store.getState();
        document.body.classList.toggle('print-force-hide-description', !state.meta.description?.trim());
        document.body.classList.toggle('print-force-hide-performance', state.performanceData.length === 0);
        document.body.classList.toggle('print-force-hide-stability', state.stabilityData.length === 0);
        window.print();
        setTimeout(() => {
            document.body.classList.remove('print-force-hide-description', 'print-force-hide-performance', 'print-force-hide-stability');
        }, 100);
    });

    $('#saveBtn').addEventListener('click', () => {
        const state = store.getState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${state.meta.productCode || 'techspec'}_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    $('#loadInput').addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const loaded = JSON.parse(ev.target.result);
                const validatedState = store.normalizeState(loaded);
                store.setState(validatedState);
                $('#exampleLoader').value = "";
                renderAll();
                alert(t('dataLoaded'));
            } catch (err) { alert(t('fileReadError') + err.message); }
        };
        reader.readAsText(file); e.target.value = '';
    });

    $('#clearBtn').addEventListener('click', () => {
        if (confirm(t('confirmClear'))) {
            store.clearStorage();
            $('#exampleLoader').value = "";
            renderAll();
        }
    });

    $('#langRuBtn').addEventListener('click', () => setLanguage('ru', renderAll));
    $('#langEnBtn').addEventListener('click', () => setLanguage('en', renderAll));

    // --- PRINT OPTIONS ---
    const updatePrintClasses = () => {
        document.body.classList.toggle('print-hide-description', !$('#printShowDescription').checked);
        document.body.classList.toggle('print-hide-performance', !$('#printShowPerformance').checked);
        document.body.classList.toggle('print-hide-stability', !$('#printShowStability').checked);
        document.body.classList.toggle('print-hide-function', !$('#printShowFunction').checked);
        document.body.classList.toggle('print-hide-supplier', !$('#printShowSupplier').checked);
        document.body.classList.toggle('print-hide-notes', !$('#printShowNotes').checked);
        
        const namePriority = $('#printNameSelect').value;
        document.body.classList.toggle('print-name-trade', namePriority === 'trade');
        document.body.classList.toggle('print-name-inci', namePriority === 'inci');
    };
    $$('.print-options-compact input, .print-options-compact select').forEach(el => el.addEventListener('change', updatePrintClasses));
    updatePrintClasses();

    // --- EXAMPLES ---
    const exampleLoader = $('#exampleLoader');
    
    async function populateExamples() {
        try {
            const response = await fetch('examples/index.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const examples = await response.json();
            examples.forEach(example => {
                const option = document.createElement('option');
                option.value = example.file;
                option.textContent = example.name;
                exampleLoader.appendChild(option);
            });
        } catch (error) {
            console.error("Failed to load examples:", error);
            exampleLoader.style.display = 'none';
        }
    }

    exampleLoader.addEventListener('change', async (e) => {
        const fileName = e.target.value;
        if (!fileName) return;
        try {
            const response = await fetch(`examples/${fileName}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            if (confirm(t('confirmLoadExample'))) {
                const validatedState = store.normalizeState(data);
                store.setState(validatedState);
                exampleLoader.value = fileName;
                renderAll();
                alert(t('dataLoaded'));
            } else {
                exampleLoader.value = "";
            }
        } catch (error) {
            console.error(`Error loading example '${fileName}':`, error);
            alert(`Failed to load example: ${error.message}`);
            exampleLoader.value = "";
        }
    });

    populateExamples();
});