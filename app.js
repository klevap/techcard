document.addEventListener('DOMContentLoaded', () => {
    const $ = sel => document.querySelector(sel);
    const $$ = sel => Array.from(document.querySelectorAll(sel));
    const STORAGE_KEY = "routing_map_draft_v4.3";
    const LANG_KEY = "routing_map_lang";

    // --- I18N - INTERNATIONALIZATION ---
    const translations = {
        ru: {
            pageTitle: "Маршрутная карта v4.3",
            title: "Маршрутная карта",
            print: "🖨️ Печать / PDF", save: "💾 Сохранить JSON", load: "📁 Загрузить JSON", clear: "❌ Очистить форму",
            printNamePriority: "Основное наименование:",
            printTradeName: "Торговое название", printInciName: "INCI",
            printShowBlocks: "Блоки:", printDescription: "Описание", printPerformance: "Эффективность", printStability: "Стабильность",
            printShowColumns: "Колонки:", printFunction: "Функция", printSupplier: "Поставщик", printNotes: "Примечания",
            meta: "Карточка изделия",
            productName: "Наименование продукта", productCode: "Код / Артикул", version: "Версия", date: "Дата документа", author: "Технолог", batchSize: "Размер партии (кг)", description: "Описание продукта",
            formulation: "Рецептура", totalPercent: "Сумма %:",
            phase: "Фаза", tradeName: "Торг. название", inciName: "INCI", func: "Функция", supplier: "Поставщик", notes: "Примечания", percent: "%", mass: "Загрузка, кг", actions: "Действия", actualMass: "Факт, кг",
            addIngredient: "➕ Добавить ингредиент",
            performance: "Данные об эффективности", perfParam: "Параметр", perfValue: "Значение", addPerf: "➕ Добавить параметр",
            stability: "Данные о стабильности", stabCondition: "Условие", stabResult: "Результат", addStab: "➕ Добавить тест",
            equipmentList: "Список оборудования", eqShortName: "ID / Код", eqFullName: "Полное наименование", eqNotes: "Примечания / Функция", addEquipment: "➕ Добавить оборудование",
            process: "Технологический процесс", step: "№", opDescription: "Описание операции", equipment: "Оборудование", paramName: "Параметр процесса", norm: "Норма", actual: "Факт",
            addStep: "➕ Добавить стадию",
            qc: "Контроль качества (ОКК)", addQc: "➕ Добавить блок контроля",
            foot: "Автосохранение включено.",
            del: "Удалить", delBlock: "Удалить блок", addParam: "➕ Параметр", addQcCheck: "➕ Добавить проверку",
            phaseHeader: "Фаза",
            dataLoaded: "Данные успешно загружены!", fileReadError: "Ошибка чтения файла: ",
            confirmDelete: "Вы уверены?", confirmClear: "Вы уверены, что хотите полностью очистить форму? Все несохраненные данные будут потеряны.", confirmDeleteBlock: "Удалить весь блок контроля?",
            qcParamName: "Наименование показателя", qcStandard: "Норматив", qcResult: "Результат",
            loadExample: "-- Загрузить пример --",
            confirmLoadExample: "Вы уверены? Все несохраненные данные в текущей форме будут заменены данными из примера.",
        },
        en: {
            pageTitle: "Technical Specification v4.3",
            title: "Technical Specification",
            print: "🖨️ Print / PDF", save: "💾 Save JSON", load: "📁 Load JSON", clear: "❌ Clear Form",
            printNamePriority: "Primary Name:",
            printTradeName: "Trade Name", printInciName: "INCI",
            printShowBlocks: "Blocks:", printDescription: "Description", printPerformance: "Performance", printStability: "Stability",
            printShowColumns: "Columns:", printFunction: "Function", printSupplier: "Supplier", printNotes: "Notes",
            meta: "Product Information",
            productName: "Product Name", productCode: "Code / SKU", version: "Version", date: "Document Date", author: "Technologist", batchSize: "Batch Size (kg)", description: "Product Description",
            formulation: "Formulation", totalPercent: "Total %:",
            phase: "Phase", tradeName: "Trade Name", inciName: "INCI", func: "Function", supplier: "Supplier", notes: "Notes", percent: "%", mass: "Load, kg", actions: "Actions", actualMass: "Actual, kg",
            addIngredient: "➕ Add Ingredient",
            performance: "Performance Data", perfParam: "Parameter", perfValue: "Value", addPerf: "➕ Add Parameter",
            stability: "Stability Data", stabCondition: "Condition", stabResult: "Result", addStab: "➕ Add Test",
            equipmentList: "Equipment List", eqShortName: "ID / Code", eqFullName: "Full Name", eqNotes: "Notes / Function", addEquipment: "➕ Add Equipment",
            process: "Technological Process", step: "#", opDescription: "Operation Description", equipment: "Equipment", paramName: "Process Parameter", norm: "Standard", actual: "Actual",
            addStep: "➕ Add Step",
            qc: "Quality Control (QC)", addQc: "➕ Add QC Block",
            foot: "Autosave is enabled.",
            del: "Delete", delBlock: "Delete block", addParam: "➕ Parameter", addQcCheck: "➕ Add Check",
            phaseHeader: "Phase",
            dataLoaded: "Data loaded successfully!", fileReadError: "File read error: ",
            confirmDelete: "Are you sure?", confirmClear: "Are you sure you want to clear the entire form? All unsaved data will be lost.", confirmDeleteBlock: "Delete the entire control block?",
            qcParamName: "Parameter Name", qcStandard: "Standard", qcResult: "Result",
            loadExample: "-- Load Example --",
            confirmLoadExample: "Are you sure? All unsaved data in the current form will be replaced with the example data.",
        }
    };
    let currentLang = localStorage.getItem(LANG_KEY) || 'ru';

    const i18n = (key) => translations[currentLang][key] || key;

    const setLanguage = (lang) => {
        currentLang = lang;
        localStorage.setItem(LANG_KEY, lang);
        document.documentElement.lang = lang;
        
        $('#langRuBtn').classList.toggle('active', lang === 'ru');
        $('#langEnBtn').classList.toggle('active', lang === 'en');

        $$('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const translation = i18n(key);
            if (el.tagName === 'OPTION') {
                // Для option нужно обновлять и текст, и label для совместимости
                el.textContent = translation;
                el.label = translation;
            } else {
                el.textContent = translation;
            }
        });
        renderAll();
    };

    // --- HELPER FUNCTIONS ---
    const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func.apply(this, args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    const autoExpand = (textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };

    const getInitialState = () => ({
        meta: { productName: '', productCode: '', docVersion: '1.0', docDate: new Date().toISOString().slice(0,10), author: '', batchSize: 100, description: '' },
        ingredients: [],
        performanceData: [],
        stabilityData: [],
        equipment: [],
        processSteps: [],
        qualityControl: []
    });

    function normalizeState(data) {
        const defaults = getInitialState();
        const normalized = {
            meta: { ...defaults.meta, ...(data.meta || {}) },
            ingredients: Array.isArray(data.ingredients) ? data.ingredients : defaults.ingredients,
            performanceData: Array.isArray(data.performanceData) ? data.performanceData : defaults.performanceData,
            stabilityData: Array.isArray(data.stabilityData) ? data.stabilityData : defaults.stabilityData,
            equipment: Array.isArray(data.equipment) ? data.equipment : defaults.equipment,
            processSteps: Array.isArray(data.processSteps) ? data.processSteps : defaults.processSteps,
            qualityControl: Array.isArray(data.qualityControl) ? data.qualityControl : defaults.qualityControl
        };
        normalized.ingredients.forEach(ing => {
            if (ing.name && !ing.tradeName) {
                ing.tradeName = ing.name;
                delete ing.name;
            }
        });
        return normalized;
    }

    let state = getInitialState();

    // --- RENDER FUNCTIONS ---
    const renderSimpleTable = (tbodyId, data, templateId, keys) => {
        const tbody = $(tbodyId);
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

    const renderIngredients = () => {
        const tbody = $('#formBody');
        tbody.innerHTML = '';
        const batchSize = parseFloat(state.meta.batchSize) || 0;
        
        let lastPhase = null;
        state.ingredients.forEach(ing => {
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
            row.querySelector('.mass-cell').textContent = (batchSize * (parseFloat(ing.percent) || 0) / 100).toFixed(3);
            row.querySelector('.delBtn').textContent = i18n('del');
            tbody.appendChild(row);
        });
        updateTotals();
    };

    const renderProcess = () => {
        const tbody = $('#procBody');
        tbody.innerHTML = '';
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

            ['description', 'equipment'].forEach(key => {
                const cell = stepRow.querySelector(`.step-${key}`);
                cell.querySelector(`[data-key="${key}"]`).value = step[key] || '';
                cell.querySelector(`[data-key="${key}-print"]`).textContent = step[key] || '';
                cell.setAttribute('rowspan', rowspan);
            });

            if (numParams > 0) {
                const firstParam = step.parameters[0];
                const paramTpl = $('#procParamRowTpl').content.cloneNode(true);
                const paramCells = Array.from(paramTpl.querySelector('tr').children);
                paramCells[0].querySelector('input').value = firstParam.name || '';
                paramCells[0].querySelector('input').dataset.paramId = firstParam.id;
                paramCells[1].querySelector('input').value = firstParam.norm || '';
                paramCells[1].querySelector('input').dataset.paramId = firstParam.id;
                paramCells[2].querySelector('button').dataset.paramId = firstParam.id;
                paramCells[2].querySelector('button').textContent = 'X';
                
                const actionsTd = paramCells[2]; 
                actionsTd.style.whiteSpace = 'nowrap';

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

                for (let i = 1; i < numParams; i++) {
                    const param = step.parameters[i];
                    const subsequentParamTpl = $('#procParamRowTpl').content.cloneNode(true);
                    const subsequentParamRow = subsequentParamTpl.querySelector('tr');
                    subsequentParamRow.dataset.id = step.id;
                    subsequentParamRow.querySelector('[data-key="name"]').value = param.name || '';
                    subsequentParamRow.querySelector('[data-key="name"]').dataset.paramId = param.id;
                    subsequentParamRow.querySelector('[data-key="norm"]').value = param.norm || '';
                    subsequentParamRow.querySelector('[data-key="norm"]').dataset.paramId = param.id;
                    const delParamBtn = subsequentParamRow.querySelector('.delParamBtn');
                    delParamBtn.dataset.paramId = param.id;
                    delParamBtn.textContent = 'X';
                    tbody.appendChild(subsequentParamRow);
                }
            } else {
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

    const renderQc = () => {
        const container = $('#qcContainer');
        container.innerHTML = '';
        state.qualityControl.forEach(qcBlock => {
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

    const renderAll = () => {
        renderIngredients();
        renderSimpleTable('#perfBody', state.performanceData, '#perfRowTpl', ['parameter', 'value']);
        renderSimpleTable('#stabBody', state.stabilityData, '#stabRowTpl', ['condition', 'result']);
        renderSimpleTable('#equipmentBody', state.equipment, '#equipmentRowTpl', ['shortName', 'fullName', 'notes']);
        renderProcess();
        renderQc();
        $$('textarea').forEach(autoExpand);
    };

    // --- UTILITY FUNCTIONS ---
    const updateTotals = () => {
        const sum = state.ingredients.reduce((acc, ing) => acc + (parseFloat(ing.percent) || 0), 0);
        const sumEl = $('#sumPercent');
        sumEl.textContent = `${sum.toFixed(2)}%`;
        sumEl.className = Math.abs(sum - 100) < 0.01 ? 'ok' : 'bad';
    };

    // --- DATA HANDLERS ---
    const saveState = () => {
        $$('.card input, .card textarea').forEach(el => {
            const id = el.id;
            if (id && state.meta.hasOwnProperty(id)) {
                state.meta[id] = el.value;
            }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };
    
    const debouncedSave = debounce(saveState, 400);

    const loadState = (data) => {
        state = data;
        Object.keys(state.meta).forEach(key => {
            const el = $(`#${key}`);
            if (el) el.value = state.meta[key];
        });
        $('#description-print').textContent = state.meta.description || '';
        renderAll();
    };

    const handleUpdate = (e) => {
        if (!e.target.classList.contains('data-field')) return;
        const key = e.target.dataset.key;
        const value = e.target.value;

        const findAndSet = (collection, row, key, value) => {
            const item = collection.find(i => i.id == row.dataset.id);
            if (item) item[key] = value;
        };

        const ingRow = e.target.closest('#formBody tr[data-id]');
        if (ingRow) {
            const item = state.ingredients.find(i => i.id == ingRow.dataset.id);
            if (item) {
                item[key] = value;
                if (e.target.tagName === 'TEXTAREA') {
                    e.target.nextElementSibling.textContent = value;
                }
                if (key === 'percent') {
                    const batchSize = parseFloat(state.meta.batchSize) || 0;
                    ingRow.querySelector('.mass-cell').textContent = (batchSize * (parseFloat(value) || 0) / 100).toFixed(3);
                    updateTotals();
                }
                if (key === 'phase') {
                    const activeEl = document.activeElement;
                    const rowId = activeEl.closest('tr')?.dataset.id;
                    const keyName = activeEl.dataset.key;
                    const selectionStart = activeEl.selectionStart;

                    state.ingredients.sort((a, b) => (a.phase || '').localeCompare(b.phase || ''));
                    renderIngredients();

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
        
        const perfRow = e.target.closest('#perfBody tr[data-id]');
        if (perfRow) findAndSet(state.performanceData, perfRow, key, value);

        const stabRow = e.target.closest('#stabBody tr[data-id]');
        if (stabRow) findAndSet(state.stabilityData, stabRow, key, value);

        const equipRow = e.target.closest('#equipmentBody tr[data-id]');
        if (equipRow) findAndSet(state.equipment, equipRow, key, value);

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
                        e.target.nextElementSibling.textContent = value;
                    }
                }
            }
        }

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
    };

    // --- EXAMPLE LOADER ---
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
            console.error("Не удалось загрузить список примеров:", error);
            exampleLoader.style.display = 'none';
        }
    }

    async function loadExample(fileName) {
        if (!fileName) return;
        try {
            const response = await fetch(`examples/${fileName}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            if (confirm(i18n('confirmLoadExample'))) {
                const validatedState = normalizeState(data);
                loadState(validatedState);
                alert(i18n('dataLoaded'));
            }
        } catch (error) {
            console.error(`Ошибка загрузки примера '${fileName}':`, error);
            alert(`Не удалось загрузить пример: ${error.message}`);
        } finally {
            exampleLoader.value = "";
        }
    }

    // --- EVENT LISTENERS ---
    function initialize() {
        populateExamples();
        exampleLoader.addEventListener('change', (e) => loadExample(e.target.value));

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
            saveState();
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
                    const validatedState = normalizeState(loaded);
                    loadState(validatedState); 
                    alert(i18n('dataLoaded'));
                } catch (err) { alert(i18n('fileReadError') + err.message); }
            };
            reader.readAsText(file); e.target.value = '';
        });
        
        $('#clearBtn').addEventListener('click', () => {
            if (confirm(i18n('confirmClear'))) {
                localStorage.removeItem(STORAGE_KEY);
                loadState(getInitialState());
            }
        });

        $('#langRuBtn').addEventListener('click', () => setLanguage('ru'));
        $('#langEnBtn').addEventListener('click', () => setLanguage('en'));

        $('#addIngredientBtn').addEventListener('click', () => {
            state.ingredients.push({ id: generateId(), phase: '', tradeName: '', inciName: '', func: '', supplier: '', notes: '', percent: 0 });
            renderIngredients(); debouncedSave();
        });
        $('#addPerfBtn').addEventListener('click', () => {
            state.performanceData.push({ id: generateId(), parameter: '', value: '' });
            renderSimpleTable('#perfBody', state.performanceData, '#perfRowTpl', ['parameter', 'value']);
            debouncedSave();
        });
        $('#addStabBtn').addEventListener('click', () => {
            state.stabilityData.push({ id: generateId(), condition: '', result: '' });
            renderSimpleTable('#stabBody', state.stabilityData, '#stabRowTpl', ['condition', 'result']);
            debouncedSave();
        });
        $('#addEquipmentBtn').addEventListener('click', () => {
            state.equipment.push({ id: generateId(), shortName: '', fullName: '', notes: '' });
            renderSimpleTable('#equipmentBody', state.equipment, '#equipmentRowTpl', ['shortName', 'fullName', 'notes']);
            debouncedSave();
        });
        $('#addProcBtn').addEventListener('click', () => {
            state.processSteps.push({ id: generateId(), number: '', description: '', equipment: '', parameters: [] });
            renderProcess(); debouncedSave();
        });
        $('#addQcBtn').addEventListener('click', () => {
            state.qualityControl.push({ id: generateId(), name: '', checks: [] });
            renderQc(); debouncedSave();
        });

        document.body.addEventListener('click', (e) => {
            let needsSave = false;
            if (e.target.classList.contains('addParamBtn')) {
                const stepId = e.target.closest('tr').dataset.id;
                const step = state.processSteps.find(s => s.id == stepId);
                if (step) {
                    if (!step.parameters) step.parameters = [];
                    step.parameters.push({ id: generateId(), name: '', norm: '' });
                    renderProcess(); needsSave = true;
                }
            }
            if (e.target.classList.contains('addQcCheckBtn')) {
                const blockId = e.target.closest('.qc-block').dataset.id;
                const block = state.qualityControl.find(b => b.id == blockId);
                if (block) {
                    if (!block.checks) block.checks = [];
                    block.checks.push({ id: generateId(), parameter: '', standard: '' });
                    renderQc(); needsSave = true;
                }
            }
            if (e.target.classList.contains('delBtn')) {
                if (!confirm(i18n('confirmDelete'))) return;
                const row = e.target.closest('tr[data-id]');
                if (!row) return;
                const id = row.dataset.id;
                if ($('#formBody').contains(row)) { state.ingredients = state.ingredients.filter(i => i.id != id); renderIngredients(); needsSave = true; }
                if ($('#perfBody').contains(row)) { state.performanceData = state.performanceData.filter(i => i.id != id); renderSimpleTable('#perfBody', state.performanceData, '#perfRowTpl', ['parameter', 'value']); needsSave = true; }
                if ($('#stabBody').contains(row)) { state.stabilityData = state.stabilityData.filter(i => i.id != id); renderSimpleTable('#stabBody', state.stabilityData, '#stabRowTpl', ['condition', 'result']); needsSave = true; }
                if ($('#equipmentBody').contains(row)) { state.equipment = state.equipment.filter(i => i.id != id); renderSimpleTable('#equipmentBody', state.equipment, '#equipmentRowTpl', ['shortName', 'fullName', 'notes']); needsSave = true; }
                if ($('#procBody').contains(row)) { state.processSteps = state.processSteps.filter(s => s.id != id); renderProcess(); needsSave = true; }
            }
            if (e.target.classList.contains('delParamBtn')) {
                const paramRow = e.target.closest('tr');
                const stepId = paramRow.dataset.id;
                const paramId = e.target.dataset.paramId;
                const step = state.processSteps.find(s => s.id == stepId);
                if (step) {
                    step.parameters = step.parameters.filter(p => p.id != paramId);
                    renderProcess(); needsSave = true;
                }
            }
            if (e.target.classList.contains('delQcBtn')) {
                if (!confirm(i18n('confirmDeleteBlock'))) return;
                const blockId = e.target.closest('.qc-block').dataset.id;
                state.qualityControl = state.qualityControl.filter(b => b.id != blockId);
                renderQc(); needsSave = true;
            }
            if (e.target.classList.contains('delQcCheckBtn')) {
                const checkRow = e.target.closest('tr');
                const blockId = checkRow.dataset.id;
                const checkId = checkRow.dataset.checkId;
                const block = state.qualityControl.find(b => b.id == blockId);
                if (block) {
                    block.checks = block.checks.filter(c => c.id != checkId);
                    renderQc(); needsSave = true;
                }
            }
            if (needsSave) debouncedSave();
        });

        document.body.addEventListener('input', (e) => {
            handleUpdate(e);
            if (e.target.tagName.toLowerCase() === 'textarea') {
                autoExpand(e.target);
                if (e.target.id === 'description') {
                    $('#description-print').textContent = e.target.value;
                }
            }
            debouncedSave();
        });
        $('#batchSize').addEventListener('input', (e) => {
            state.meta.batchSize = e.target.value;
            renderIngredients();
        });

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

        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try { 
                loadState(normalizeState(JSON.parse(savedState))); 
            } 
            catch (e) { console.error('Ошибка загрузки из localStorage:', e); }
        } else {
            $('#docDate').value = new Date().toISOString().slice(0,10);
        }
        setLanguage(currentLang);
        updatePrintClasses();
    }

    initialize();
});