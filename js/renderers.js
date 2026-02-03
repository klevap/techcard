import { $, $$ } from './utils.js';
import { t } from './i18n.js';

/**
 * Generic renderer for simple tables (Performance, Stability, Equipment)
 */
export const renderSimpleTable = (tbodyId, data, templateId, keys) => {
    const tbody = $(tbodyId);
    tbody.innerHTML = '';
    data.forEach(item => {
        const tpl = $(templateId).content.cloneNode(true);
        const row = tpl.querySelector('tr');
        row.dataset.id = item.id;
        keys.forEach(key => {
            const el = row.querySelector(`[data-key="${key}"]`);
            if (el) {
                el.value = item[key] || '';
                // Handle print content for textareas in simple tables (like Equipment notes)
                if (el.tagName === 'TEXTAREA') {
                    const printEl = row.querySelector(`[data-key="${key}-print"]`);
                    if(printEl) printEl.textContent = item[key] || '';
                }
            }
        });
        // Set localized tooltip for delete button
        const delBtn = row.querySelector('.delBtn');
        if (delBtn) {
            delBtn.title = t('del');
            delBtn.setAttribute('aria-label', t('del'));
        }
        
        tbody.appendChild(row);
    });
};

export const renderIngredients = (state) => {
    const tbody = $('#formBody');
    tbody.innerHTML = '';
    const batchSize = parseFloat(state.meta.batchSize) || 0;
    
    // Sort by phase for display
    const sortedIngredients = [...state.ingredients].sort((a, b) => (a.phase || '').localeCompare(b.phase || ''));

    let lastPhase = null;
    sortedIngredients.forEach(ing => {
        const currentPhase = (ing.phase || '').toUpperCase();
        if (currentPhase && currentPhase !== lastPhase) {
            const tr = document.createElement('tr');
            tr.className = 'phase-header';
            const td = document.createElement('td');
            
            // DYNAMIC COLSPAN CALCULATION
            // This ensures the phase header spans the correct number of columns
            // regardless of hidden columns or HTML changes.
            const headerCells = document.querySelectorAll('#formTable thead th');
            td.colSpan = headerCells.length || 10; 
            
            td.textContent = `${t('phaseHeader')} ${currentPhase}`;
            tr.appendChild(td);
            tbody.appendChild(tr);
            lastPhase = currentPhase;
        }

        const tpl = $('#ingredientRowTpl').content.cloneNode(true);
        const row = tpl.querySelector('tr');
        row.dataset.id = ing.id;
        ['phase', 'tradeName', 'inciName', 'func', 'supplier', 'notes', 'percent'].forEach(key => {
            const el = row.querySelector(`[data-key="${key}"]`);
            if (el) el.value = ing[key] || '';
            if (el && el.tagName === 'TEXTAREA') {
                const printEl = row.querySelector(`[data-key="${key}-print"]`);
                if(printEl) printEl.textContent = ing[key] || '';
            }
        });
        row.querySelector('.mass-cell').textContent = (batchSize * (parseFloat(ing.percent) || 0) / 100).toFixed(3);
        
        // Set localized tooltip
        const delBtn = row.querySelector('.delBtn');
        if (delBtn) {
            delBtn.title = t('del');
            delBtn.setAttribute('aria-label', t('del'));
        }

        tbody.appendChild(row);
    });
    updateTotals(state);
};

const updateTotals = (state) => {
    const sum = state.ingredients.reduce((acc, ing) => acc + (parseFloat(ing.percent) || 0), 0);
    const sumEl = $('#sumPercent');
    sumEl.textContent = `${sum.toFixed(2)}%`;
    sumEl.className = Math.abs(sum - 100) < 0.01 ? 'ok' : 'bad';
};

export const renderProcess = (state) => {
    const tbody = $('#procBody');
    tbody.innerHTML = '';
    
    // Prepare equipment options map for quick lookup
    const equipmentMap = {};
    state.equipment.forEach(eq => {
        equipmentMap[eq.shortName] = eq;
    });

    state.processSteps.forEach(step => {
        const numParams = step.parameters?.length || 0;
        const rowspan = numParams > 0 ? numParams : 1;

        const stepTpl = $('#procStepRowTpl').content.cloneNode(true);
        const stepRow = stepTpl.querySelector('tr');
        stepRow.dataset.id = step.id;

        const numberCell = stepRow.querySelector('.step-number');
        numberCell.setAttribute('rowspan', rowspan);
        const input = document.createElement('input');
        input.className = 'data-field text-center';
        input.dataset.key = 'number';
        input.style.fontWeight = 'bold';
        input.value = step.number || '';
        numberCell.appendChild(input);

        // Description
        const descCell = stepRow.querySelector('.step-description');
        descCell.querySelector('[data-key="description"]').value = step.description || '';
        descCell.querySelector('[data-key="description-print"]').textContent = step.description || '';
        descCell.setAttribute('rowspan', rowspan);
        
        // Setup Delete Step Button (Now inside description cell)
        const delStepBtn = descCell.querySelector('.step-delete-btn');
        delStepBtn.title = t('del'); // "Delete Step"

        // Equipment - Chips Logic
        const equipCell = stepRow.querySelector('.step-equipment');
        equipCell.setAttribute('rowspan', rowspan);
        
        const chipsContainer = equipCell.querySelector('.chips-container');
        const addSelect = equipCell.querySelector('.equip-add-select');
        const hiddenInput = equipCell.querySelector('input[data-key="equipment"]');
        const printDiv = equipCell.querySelector('[data-key="equipment-print"]');
        
        addSelect.options[0].textContent = t('addEquipPlaceholder');

        const currentEquipString = step.equipment || '';
        hiddenInput.value = currentEquipString;
        printDiv.textContent = currentEquipString;
        
        const selectedIds = currentEquipString ? currentEquipString.split(',').map(s => s.trim()).filter(s => s) : [];

        // Render Chips
        selectedIds.forEach(id => {
            const eqData = equipmentMap[id];
            const label = id; 
            const title = eqData ? `${eqData.shortName} - ${eqData.fullName}` : id;

            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.title = title;
            chip.innerHTML = `
                <span>${label}</span>
                <span class="chip-remove" data-val="${id}">×</span>
            `;
            chipsContainer.appendChild(chip);
        });

        // Populate Add Dropdown (exclude already selected)
        state.equipment.forEach(eq => {
            if (!selectedIds.includes(eq.shortName)) {
                const option = document.createElement('option');
                option.value = eq.shortName;
                option.textContent = `${eq.shortName} ${eq.fullName ? '- ' + eq.fullName : ''}`;
                addSelect.appendChild(option);
            }
        });

        // Parameters Logic
        if (numParams > 0) {
            const firstParam = step.parameters[0];
            
            // Clone the parameter row template
            const paramTpl = $('#procParamRowTpl').content.cloneNode(true);
            const paramRow = paramTpl.querySelector('tr');
            
            // IMPORTANT: Set the row ID to the STEP ID for context
            paramRow.dataset.id = step.id;

            const nameInput = paramRow.querySelector('[data-key="name"]');
            const normInput = paramRow.querySelector('[data-key="norm"]');
            nameInput.value = firstParam.name || '';
            normInput.value = firstParam.norm || '';
            nameInput.dataset.paramId = firstParam.id;
            normInput.dataset.paramId = firstParam.id;
            
            // Setup the delete parameter button for the first row
            const delParamBtn = paramRow.querySelector('.delParamBtn');
            delParamBtn.dataset.paramId = firstParam.id;
            delParamBtn.title = t('del');

            // Add "Add Parameter" button to the first row's action cell
            const actionsTd = paramRow.querySelector('.row-actions');
            actionsTd.style.whiteSpace = 'nowrap';
            
            // Create Add Button (Minimalist Plus)
            const addBtn = document.createElement('button');
            addBtn.className = 'btn icon-btn addParamBtn';
            addBtn.style.color = 'var(--primary-btn-bg)';
            addBtn.textContent = '➕';
            addBtn.title = t('addParam');
            // Insert before the delete param button
            actionsTd.insertBefore(addBtn, delParamBtn);

            // Append the parameter cells to the main step row
            stepRow.append(...Array.from(paramRow.children));
            tbody.appendChild(stepRow);

            // Render subsequent parameters
            for (let i = 1; i < numParams; i++) {
                const param = step.parameters[i];
                const subsequentParamTpl = $('#procParamRowTpl').content.cloneNode(true);
                const subsequentParamRow = subsequentParamTpl.querySelector('tr');
                subsequentParamRow.dataset.id = step.id;
                
                const subNameInput = subsequentParamRow.querySelector('[data-key="name"]');
                subNameInput.value = param.name || '';
                subNameInput.dataset.paramId = param.id;
                
                const subNormInput = subsequentParamRow.querySelector('[data-key="norm"]');
                subNormInput.value = param.norm || '';
                subNormInput.dataset.paramId = param.id;
                
                const subDelBtn = subsequentParamRow.querySelector('.delParamBtn');
                subDelBtn.dataset.paramId = param.id;
                subDelBtn.title = t('del');

                tbody.appendChild(subsequentParamRow);
            }
        } else {
            // No parameters case
            const emptyCells = `
                <td></td><td></td>
                <td class="no-print row-actions">
                    <button class="btn icon-btn addParamBtn" style="color: var(--primary-btn-bg);" title="${t('addParam')}">➕</button>
                </td>
                <td class="print-only"></td>`;
            stepRow.insertAdjacentHTML('beforeend', emptyCells);
            tbody.appendChild(stepRow);
        }
    });
};

export const renderQc = (state) => {
    const container = $('#qcContainer');
    container.innerHTML = '';
    state.qualityControl.forEach(qcBlock => {
        const blockTpl = $('#qcBlockTpl').content.cloneNode(true);
        const blockEl = blockTpl.querySelector('.qc-block');
        blockEl.dataset.id = qcBlock.id;
        blockEl.querySelector('[data-key="name"]').value = qcBlock.name || '';
        
        const delBlockBtn = blockEl.querySelector('.delQcBtn');
        delBlockBtn.title = t('delBlock');
        
        // Fix double icon issue
        const addBtn = blockEl.querySelector('.addQcCheckBtn');
        addBtn.textContent = t('addQcCheck');
        
        ['qcParamName', 'qcStandard', 'qcResult', 'actions'].forEach(key => {
            const th = blockEl.querySelector(`[data-i18n="${key}"]`);
            if (th) th.textContent = t(key);
        });

        const tbody = blockEl.querySelector('tbody');
        
        (qcBlock.checks || []).forEach(check => {
            const checkTpl = $('#qcCheckRowTpl').content.cloneNode(true);
            const checkRow = checkTpl.querySelector('tr');
            checkRow.dataset.id = qcBlock.id;
            checkRow.dataset.checkId = check.id;
            checkRow.querySelector('[data-key="parameter"]').value = check.parameter || '';
            checkRow.querySelector('[data-key="standard"]').value = check.standard || '';
            
            const delBtn = checkRow.querySelector('.delQcCheckBtn');
            delBtn.title = t('del');
            delBtn.setAttribute('aria-label', t('del'));

            tbody.appendChild(checkRow);
        });
        container.appendChild(blockEl);
    });
};

export const renderMeta = (state) => {
    Object.keys(state.meta).forEach(key => {
        const el = $(`#${key}`);
        if (el) el.value = state.meta[key];
    });
    $('#description-print').textContent = state.meta.description || '';
};