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
            if (el) el.value = item[key] || '';
            // Handle print content for textareas in simple tables (like Equipment notes)
            if (el && el.tagName === 'TEXTAREA') {
                const printEl = row.querySelector(`[data-key="${key}-print"]`);
                if(printEl) printEl.textContent = item[key] || '';
            }
        });
        // Set localized tooltip for delete button
        const delBtn = row.querySelector('.delBtn');
        if (delBtn) delBtn.setAttribute('title', t('del'));
        
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
            td.colSpan = 10;
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
        if (delBtn) delBtn.setAttribute('title', t('del'));

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
            const paramTpl = $('#procParamRowTpl').content.cloneNode(true);
            const paramCells = Array.from(paramTpl.querySelector('tr').children);
            
            const nameInput = paramCells[0].querySelector('input');
            nameInput.value = firstParam.name || '';
            nameInput.dataset.paramId = firstParam.id;
            
            const normInput = paramCells[1].querySelector('input');
            normInput.value = firstParam.norm || '';
            normInput.dataset.paramId = firstParam.id;
            
            const actionsTd = paramCells[2]; 
            actionsTd.style.whiteSpace = 'nowrap';
            actionsTd.innerHTML = ''; // Clear template content

            // Add Parameter Button (Icon)
            const addBtn = document.createElement('button');
            addBtn.className = 'btn primary icon-btn addParamBtn';
            addBtn.textContent = '➕';
            addBtn.setAttribute('title', t('addParam'));
            actionsTd.appendChild(addBtn);

            // Delete Step Button (Icon)
            const delStepBtn = document.createElement('button');
            delStepBtn.className = 'btn danger icon-btn delBtn';
            delStepBtn.textContent = '🗑️';
            delStepBtn.setAttribute('title', t('del'));
            actionsTd.appendChild(delStepBtn);

            stepRow.append(...paramCells);
            tbody.appendChild(stepRow);

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
                
                const actionCell = subsequentParamRow.querySelector('.row-actions');
                actionCell.innerHTML = '';
                
                const delSubBtn = document.createElement('button');
                delSubBtn.className = 'btn danger icon-btn delParamBtn';
                delSubBtn.textContent = 'X';
                delSubBtn.dataset.paramId = param.id;
                delSubBtn.setAttribute('title', t('del'));
                actionCell.appendChild(delSubBtn);

                tbody.appendChild(subsequentParamRow);
            }
        } else {
            const emptyCells = `
                <td></td><td></td>
                <td class="no-print row-actions">
                    <button class="btn primary icon-btn addParamBtn" title="${t('addParam')}">➕</button>
                    <button class="btn danger icon-btn delBtn" title="${t('del')}">🗑️</button>
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
        blockEl.querySelector('.delQcBtn').textContent = t('delBlock');
        blockEl.querySelector('.addQcCheckBtn').textContent = `➕ ${t('addQcCheck')}`;
        
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
            delBtn.textContent = '🗑️'; // Icon
            delBtn.setAttribute('title', t('del'));

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