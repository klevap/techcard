import { $, $$, debounce, generateId, autoExpand } from './utils.js';
import { i18n, setLanguage, getCurrentLang } from './i18n.js';
import { getInitialState, normalizeState, saveToLocalStorage, loadFromLocalStorage } from './state.js';
import { fetchExamplesIndex, fetchExampleData } from './api.js';
import * as UI from './ui.js';

let state = getInitialState();

/**
 * Syncs UI inputs from the Meta card to the state object
 */
const syncMetaToState = () => {
    $$('.card input, .card textarea').forEach(el => {
        const id = el.id;
        if (id && state.meta.hasOwnProperty(id)) {
            state.meta[id] = el.value;
        }
    });
};

/**
 * Debounced save to localStorage
 */
const debouncedSave = debounce(() => {
    syncMetaToState();
    saveToLocalStorage(state);
}, 400);

/**
 * Loads a full state into the application and refreshes UI
 */
const applyState = (newState) => {
    state = newState;
    // Fill meta fields
    Object.keys(state.meta).forEach(key => {
        const el = $(`#${key}`);
        if (el) el.value = state.meta[key];
    });
    // Update print-only description
    const descPrint = $('#description-print');
    if (descPrint) descPrint.textContent = state.meta.description || '';
    
    UI.renderAll(state);
};

/**
 * Handles all input changes within dynamic tables
 */
const handleTableUpdate = (e) => {
    if (!e.target.classList.contains('data-field')) return;
    const key = e.target.dataset.key;
    const value = e.target.value;

    // 1. Ingredients Table
    const ingRow = e.target.closest('#formBody tr[data-id]');
    if (ingRow) {
        const item = state.ingredients.find(i => i.id == ingRow.dataset.id);
        if (item) {
            item[key] = value;
            if (e.target.tagName === 'TEXTAREA') {
                const printEl = ingRow.querySelector(`[data-key="${key}-print"]`);
                if (printEl) printEl.textContent = value;
            }
            if (key === 'percent') UI.renderIngredients(state.ingredients, state.meta.batchSize);
            if (key === 'phase') {
                // Save focus state
                const activeEl = document.activeElement;
                const rowId = activeEl.closest('tr')?.dataset.id;
                const keyName = activeEl.dataset.key;
                const selectionStart = activeEl.selectionStart;

                state.ingredients.sort((a, b) => (a.phase || '').localeCompare(b.phase || ''));
                UI.renderIngredients(state.ingredients, state.meta.batchSize);

                // Restore focus
                if (rowId && keyName) {
                    const newEl = document.querySelector(`tr[data-id="${rowId}"] [data-key="${keyName}"]`);
                    if (newEl) {
                        newEl.focus();
                        newEl.setSelectionRange(selectionStart, selectionStart);
                    }
                }
            }
        }
    }
    
    // 2. Simple Key-Value Tables
    const findAndSet = (collection, row) => {
        const item = collection.find(i => i.id == row.dataset.id);
        if (item) item[key] = value;
    };

    const perfRow = e.target.closest('#perfBody tr[data-id]');
    if (perfRow) findAndSet(state.performanceData, perfRow);

    const stabRow = e.target.closest('#stabBody tr[data-id]');
    if (stabRow) findAndSet(state.stabilityData, stabRow);

    const equipRow = e.target.closest('#equipmentBody tr[data-id]');
    if (equipRow) findAndSet(state.equipment, equipRow);

    // 3. Process Steps
    const procRow = e.target.closest('#procBody tr[data-id]');
    if (procRow) {
        const step = state.processSteps.find(s => s.id == procRow.dataset.id);
        if (step) {
            const paramId = e.target.dataset.paramId;
            if (paramId) {
                const param = step.parameters.find(p => p.id == paramId);
                if (param) param[key] = value;
            } else {
                step[key] = value;
                if (e.target.tagName === 'TEXTAREA') {
                    const printEl = procRow.querySelector(`[data-key="${key}-print"]`);
                    if (printEl) printEl.textContent = value;
                }
            }
        }
    }

    // 4. Quality Control Blocks
    const qcBlock = e.target.closest('.qc-block[data-id]');
    if (qcBlock) {
        const block = state.qualityControl.find(b => b.id == qcBlock.dataset.id);
        if (block) {
            const checkRow = e.target.closest('tr[data-check-id]');
            if (checkRow) {
                const check = block.checks.find(c => c.id == checkRow.dataset.checkId);
                if (check) check[key] = value;
            } else {
                block[key] = value;
            }
        }
    }
    debouncedSave();
};

/**
 * Main Application Entry Point
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Load examples
    try {
        const examples = await fetchExamplesIndex();
        const loader = $('#exampleLoader');
        examples.forEach(ex => {
            const opt = document.createElement('option');
            opt.value = ex.file;
            opt.textContent = ex.name;
            loader.appendChild(opt);
        });
        loader.addEventListener('change', async (e) => {
            if (!e.target.value) return;
            if (confirm(i18n('confirmLoadExample'))) {
                const data = await fetchExampleData(e.target.value);
                applyState(normalizeState(data));
            }
            e.target.value = "";
        });
    } catch (e) { console.warn("Examples index could not be loaded", e); }

    // Language switching
    $('#langRuBtn').addEventListener('click', () => setLanguage('ru', () => UI.renderAll(state)));
    $('#langEnBtn').addEventListener('click', () => setLanguage('en', () => UI.renderAll(state)));

    // Toolbar Actions
    $('#printBtn').addEventListener('click', () => {
        document.body.classList.toggle('print-force-hide-description', !state.meta.description?.trim());
        document.body.classList.toggle('print-force-hide-performance', state.performanceData.length === 0);
        document.body.classList.toggle('print-force-hide-stability', state.stabilityData.length === 0);

        window.print();

        setTimeout(() => {
            document.body.classList.remove(
                'print-force-hide-description', 
                'print-force-hide-performance', 
                'print-force-hide-stability'
            );
        }, 100);
    });
    
    $('#saveBtn').addEventListener('click', () => {
        syncMetaToState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${state.meta.productCode || 'techspec'}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    });
    
    $('#loadInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                applyState(normalizeState(JSON.parse(ev.target.result)));
            } catch (err) { alert(i18n('fileReadError') + err.message); }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    $('#clearBtn').addEventListener('click', () => {
        if (confirm(i18n('confirmClear'))) applyState(getInitialState());
    });

    // Section "Add" Buttons
    $('#addIngredientBtn').addEventListener('click', () => {
        state.ingredients.push({ id: generateId(), phase: '', tradeName: '', inciName: '', func: '', supplier: '', notes: '', percent: 0 });
        UI.renderIngredients(state.ingredients, state.meta.batchSize);
        debouncedSave();
    });
    $('#addPerfBtn').addEventListener('click', () => {
        state.performanceData.push({ id: generateId(), parameter: '', value: '' });
        UI.renderSimpleTable('#perfBody', state.performanceData, '#perfRowTpl', ['parameter', 'value']);
        debouncedSave();
    });
    $('#addStabBtn').addEventListener('click', () => {
        state.stabilityData.push({ id: generateId(), condition: '', result: '' });
        UI.renderSimpleTable('#stabBody', state.stabilityData, '#stabRowTpl', ['condition', 'result']);
        debouncedSave();
    });
    $('#addEquipmentBtn').addEventListener('click', () => {
        state.equipment.push({ id: generateId(), shortName: '', fullName: '', notes: '' });
        UI.renderSimpleTable('#equipmentBody', state.equipment, '#equipmentRowTpl', ['shortName', 'fullName', 'notes']);
        debouncedSave();
    });
    $('#addProcBtn').addEventListener('click', () => {
        state.processSteps.push({ id: generateId(), number: '', description: '', equipment: '', parameters: [] });
        UI.renderProcess(state.processSteps);
        debouncedSave();
    });
    $('#addQcBtn').addEventListener('click', () => {
        state.qualityControl.push({ id: generateId(), name: '', checks: [] });
        UI.renderQc(state.qualityControl);
        debouncedSave();
    });

    // Event Delegation
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.classList.contains('delBtn')) {
            if (!confirm(i18n('confirmDelete'))) return;
            const row = target.closest('tr');
            if (!row) return;
            const id = row.dataset.id;
            const tbody = row.parentElement;

            if (tbody.id === 'formBody') state.ingredients = state.ingredients.filter(i => i.id !== id);
            else if (tbody.id === 'perfBody') state.performanceData = state.performanceData.filter(i => i.id !== id);
            else if (tbody.id === 'stabBody') state.stabilityData = state.stabilityData.filter(i => i.id !== id);
            else if (tbody.id === 'equipmentBody') state.equipment = state.equipment.filter(i => i.id !== id);
            else if (tbody.id === 'procBody' || row.classList.contains('param-row') || row.classList.contains('step-header')) {
                state.processSteps = state.processSteps.filter(i => i.id !== id);
            }

            UI.renderAll(state);
            debouncedSave();
        }

        if (target.classList.contains('addParamBtn')) {
            const stepId = target.closest('tr').dataset.id;
            const step = state.processSteps.find(s => s.id == stepId);
            if (step) {
                if (!step.parameters) step.parameters = [];
                step.parameters.push({ id: generateId(), name: '', norm: '' });
                UI.renderProcess(state.processSteps);
                debouncedSave();
            }
        }
        if (target.classList.contains('delParamBtn')) {
            const stepId = target.closest('tr').dataset.id;
            const paramId = target.dataset.paramId;
            const step = state.processSteps.find(s => s.id == stepId);
            if (step) {
                step.parameters = step.parameters.filter(p => p.id != paramId);
                UI.renderProcess(state.processSteps);
                debouncedSave();
            }
        }

        if (target.classList.contains('addQcCheckBtn')) {
            const blockId = target.closest('.qc-block').dataset.id;
            const block = state.qualityControl.find(b => b.id == blockId);
            if (block) {
                if (!block.checks) block.checks = [];
                block.checks.push({ id: generateId(), parameter: '', standard: '' });
                UI.renderQc(state.qualityControl);
                debouncedSave();
            }
        }
        if (target.classList.contains('delQcBtn')) {
            if (!confirm(i18n('confirmDeleteBlock'))) return;
            const blockId = target.closest('.qc-block').dataset.id;
            state.qualityControl = state.qualityControl.filter(b => b.id != blockId);
            UI.renderQc(state.qualityControl);
            debouncedSave();
        }
        if (target.classList.contains('delQcCheckBtn')) {
            const row = target.closest('tr');
            const blockId = row.dataset.id;
            const checkId = row.dataset.checkId;
            const block = state.qualityControl.find(b => b.id == blockId);
            if (block) {
                block.checks = block.checks.filter(c => c.id != checkId);
                UI.renderQc(state.qualityControl);
                debouncedSave();
            }
        }
    });

    // Global Input Listener
    document.body.addEventListener('input', (e) => {
        handleTableUpdate(e);
        if (e.target.tagName === 'TEXTAREA') {
            autoExpand(e.target);
            if (e.target.id === 'description') {
                $('#description-print').textContent = e.target.value;
            }
        }
        
        if (e.target.id === 'batchSize') {
            state.meta.batchSize = e.target.value;
            UI.renderIngredients(state.ingredients, state.meta.batchSize);
        }
        debouncedSave();
    });

    // Print Options
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

    // Initial Load
    const saved = loadFromLocalStorage();
    if (saved) {
        applyState(saved);
    } else {
        $('#docDate').value = new Date().toISOString().slice(0,10);
    }
    
    setLanguage(getCurrentLang(), () => UI.renderAll(state));
    updatePrintClasses();
});