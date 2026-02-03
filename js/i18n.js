import { $, $$ } from './utils.js';

const LANG_KEY = "routing_map_lang";

const translations = {
    ru: {
        pageTitle: "Маршрутная карта v4.3",
        title: "Маршрутная карта",
        print: "🖨️ Печать / PDF", save: "💾 Сохранить JSON", load: "📁 Загрузить JSON", clear: "❌ Очистить форму",
        printNamePriority: "Основное наименование:",
        printTradeName: "Торговое название", printInciName: "INCI",
        printShowBlocks: "Блоки:", printDescription: "Описание", printPerformance: "Тех. параметры", printStability: "Стабильность",
        printShowColumns: "Колонки:", printFunction: "Функция", printSupplier: "Поставщик", printNotes: "Примечания",
        meta: "Карточка изделия",
        productName: "Наименование продукта", productCode: "Код / Артикул", version: "Версия", date: "Дата документа", author: "Технолог", batchSize: "Размер партии (кг)", description: "Описание продукта",
        formulation: "Рецептура", totalPercent: "Сумма %:",
        phase: "Фаза", tradeName: "Торг. название", inciName: "INCI", func: "Функция", supplier: "Поставщик", notes: "Примечания", percent: "%", mass: "Загрузка, кг", actions: "Действия", actualMass: "Факт, кг",
        addIngredient: "➕ Добавить ингредиент",
        performance: "Технические параметры", perfParam: "Параметр", perfValue: "Значение", addPerf: "➕ Добавить параметр",
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
        addEquipPlaceholder: "➕ Добавить..."
    },
    en: {
        pageTitle: "Technical Specification v4.3",
        title: "Technical Specification",
        print: "🖨️ Print / PDF", save: "💾 Save JSON", load: "📁 Load JSON", clear: "❌ Clear Form",
        printNamePriority: "Primary Name:",
        printTradeName: "Trade Name", printInciName: "INCI",
        printShowBlocks: "Blocks:", printDescription: "Description", printPerformance: "Tech. Params", printStability: "Stability",
        printShowColumns: "Columns:", printFunction: "Function", printSupplier: "Supplier", printNotes: "Notes",
        meta: "Product Information",
        productName: "Product Name", productCode: "Code / SKU", version: "Version", date: "Document Date", author: "Technologist", batchSize: "Batch Size (kg)", description: "Product Description",
        formulation: "Formulation", totalPercent: "Total %:",
        phase: "Phase", tradeName: "Trade Name", inciName: "INCI", func: "Function", supplier: "Supplier", notes: "Notes", percent: "%", mass: "Load, kg", actions: "Actions", actualMass: "Actual, kg",
        addIngredient: "➕ Add Ingredient",
        performance: "Technical Parameters", perfParam: "Parameter", perfValue: "Value", addPerf: "➕ Add Parameter",
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
        addEquipPlaceholder: "➕ Add..."
    }
};

let currentLang = localStorage.getItem(LANG_KEY) || 'ru';

/**
 * Get translation for a key
 */
export const t = (key) => translations[currentLang][key] || key;

/**
 * Set language and update UI
 * @param {string} lang - 'ru' or 'en'
 * @param {Function} callback - Function to call after language change (usually renderAll)
 */
export const setLanguage = (lang, callback) => {
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    
    $('#langRuBtn').classList.toggle('active', lang === 'ru');
    $('#langEnBtn').classList.toggle('active', lang === 'en');

    $$('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        // Skip actions header as we removed text
        if (key === 'actions') return;
        
        const translation = t(key);
        if (el.tagName === 'OPTION') {
            el.textContent = translation;
            el.label = translation;
        } else {
            el.textContent = translation;
        }
    });
    
    if (callback) callback();
};

export const getCurrentLang = () => currentLang;