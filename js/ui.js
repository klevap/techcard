import { $, $$, autoExpand } from './utils.js';
import { i18n } from './i18n.js';

/**
 * Renders simple key-value tables (Performance, Stability, Equipment)
 */
export const renderSimpleTable = (tbodyId, data, templateId, keys) => {
    const tbody = $(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach(item => {
        const tpl = $(templateId).content.cloneNode(true);
        const row = tpl.querySelector('tr');
        row.dataset.id = item.id;
        keys.forEach(key => {
            const el = row.querySelector(`[data-key="${key}"]`);
            if (el) el.value = item[key] || '';
        });
        row.querySelector('.delBtn').textContent = i18n('del');
        tbody.appendChild(row);
    });
};

/**
 * Renders the formulation table with phase headers and mass calculations
 */
export const renderIngredients = (ingredients, batchSize) => {
    const tbody = $('#formBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const bSize = parseFloat(batchSize) || 0;
    
    let lastPhase = null;
    ingredients.forEach(ing => {
        const currentPhase = (ing.phase || '').toUpperCase();
        if (currentPhase && currentPhase !== lastPhase) {
            const tr = document.createElement('tr');
            tr.className = 'phase-header';
            const td = document.createElement('td');
            td.colSpan = 10;
            td.textContent = `${i18n('phaseHeader')} ${currentPhase}`;
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
                row.querySelector(`[data-key="${key}-print"]`).textContent = ing[key] || '';
            }
        });
        row.querySelector('.mass-cell').textContent = (bSize * (parseFloat(ing.percent) || 0) / 100).toFixed(3);
        row.querySelector('.delBtn').textContent = i18n('del');
        tbody.appendChild(row);
    });
    updateTotals(ingredients);
};

/**
 * Updates the total percentage indicator
 */
export const updateTotals = (ingredients) => {
    const sum = ingredients.reduce((acc, ing) => acc + (parseFloat(ing.percent) || 0), 0);
    const sumEl = $('#sumPercent');
    if (!sumEl) return;
    sumEl.textContent = `${sum.toFixed(2)}%`;
    sumEl.className = Math.abs(sum - 100) < 0.01 ? 'ok' : 'bad';
};

/**
 * Renders the technological process steps
 */
export const renderProcess = (processSteps) => {
    const tbody = $('#procBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    processSteps.forEach(step => {
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

        ['description', 'equipment'].forEach(key => {
            const cell = stepRow.querySelector(`.step-${key}`);
            cell.querySelector(`[data-key="${key}"]`).value = step[key] || '';
            cell.querySelector(`[data-key="${key}-print"]`).textContent = step[key] || '';
            cell.setAttribute('rowspan', rowspan);
        });

        if (numParams > 0) {
            // Handle the first parameter row which is merged with the step header
            const firstParam = step.parameters[0];
            const paramTpl = $('#procParamRowTpl').content.cloneNode(true);
            const paramCells = Array.from(paramTpl.querySelector('tr').children);
            
            paramCells[0].querySelector('input').value = firstParam.name || '';
            paramCells[0].querySelector('input').dataset.paramId = firstParam.id;
            paramCells[1].querySelector('input').value = firstParam.norm || '';
            paramCells[1].querySelector('input').dataset.paramId = firstParam.id;
            
            const actionsTd = paramCells[2];
            actionsTd.style.whiteSpace = 'nowrap';
            
            const delParamBtn = actionsTd.querySelector('.delParamBtn');
            delParamBtn.dataset.paramId = firstParam.id;
            delParamBtn.textContent = 'X';
            
            const addBtn = document.createElement('button');
            addBtn.className = 'btn primary small addParamBtn';
            addBtn.textContent = `➕ ${i18n('addParam')}`;
            actionsTd.appendChild(addBtn);

            const delStepBtn = document.createElement('button');
            delStepBtn.className = 'btn danger small delBtn';
            delStepBtn.textContent = i18n('del');
            actionsTd.appendChild(delStepBtn);

            stepRow.append(...paramCells);
            tbody.appendChild(stepRow);

            // Handle subsequent parameter rows
            for (let i = 1; i < numParams; i++) {
                const param = step.parameters[i];
                const subTpl = $('#procParamRowTpl').content.cloneNode(true);
                const subRow = subTpl.querySelector('tr');
                subRow.dataset.id = step.id;
                subRow.querySelector('[data-key="name"]').value = param.name || '';
                subRow.querySelector('[data-key="name"]').dataset.paramId = param.id;
                subRow.querySelector('[data-key="norm"]').value = param.norm || '';
                subRow.querySelector('[data-key="norm"]').dataset.paramId = param.id;
                const delBtn = subRow.querySelector('.delParamBtn');
                delBtn.dataset.paramId = param.id;
                delBtn.textContent = 'X';
                tbody.appendChild(subRow);
            }
        } else {
            // Handle step without parameters
            const emptyCells = `
                <td></td><td></td>
                <td class="no-print row-actions">
                    <button class="btn primary small addParamBtn">➕ ${i18n('addParam')}</button>
                    <button class="btn danger small delBtn">${i18n('del')}</button>
                </td>
                <td class="print-only"></td>`;
            stepRow.insertAdjacentHTML('beforeend', emptyCells);
            tbody.appendChild(stepRow);
        }
    });
};

/**
 * Renders Quality Control blocks
 */
export const renderQc = (qualityControl) => {
    const container = $('#qcContainer');
    if (!container) return;
    container.innerHTML = '';
    qualityControl.forEach(qcBlock => {
        const blockTpl = $('#qcBlockTpl').content.cloneNode(true);
        const blockEl = blockTpl.querySelector('.qc-block');
        blockEl.dataset.id = qcBlock.id;
        blockEl.querySelector('[data-key="name"]').value = qcBlock.name || '';
        blockEl.querySelector('.delQcBtn').textContent = i18n('delBlock');
        blockEl.querySelector('.addQcCheckBtn').textContent = `➕ ${i18n('addQcCheck')}`;
        
        ['qcParamName', 'qcStandard', 'qcResult', 'actions'].forEach(key => {
            const th = blockEl.querySelector(`[data-i18n="${key}"]`);
            if (th) th.textContent = i18n(key);
        });

        const tbody = blockEl.querySelector('tbody');
        (qcBlock.checks || []).forEach(check => {
            const checkTpl = $('#qcCheckRowTpl').content.cloneNode(true);
            const checkRow = checkTpl.querySelector('tr');
            checkRow.dataset.id = qcBlock.id;
            checkRow.dataset.checkId = check.id;
            checkRow.querySelector('[data-key="parameter"]').value = check.parameter || '';
            checkRow.querySelector('[data-key="standard"]').value = check.standard || '';
            checkRow.querySelector('.delQcCheckBtn').textContent = 'X';
            tbody.appendChild(checkRow);
        });
        container.appendChild(blockEl);
    });
};

/**
 * Global UI refresh
 */
export const renderAll = (state) => {
    renderIngredients(state.ingredients, state.meta.batchSize);
    renderSimpleTable('#perfBody', state.performanceData, '#perfRowTpl', ['parameter', 'value']);
    renderSimpleTable('#stabBody', state.stabilityData, '#stabRowTpl', ['condition', 'result']);
    renderSimpleTable('#equipmentBody', state.equipment, '#equipmentRowTpl', ['shortName', 'fullName', 'notes']);
    renderProcess(state.processSteps);
    renderQc(state.qualityControl);
    $$('textarea').forEach(autoExpand);
};