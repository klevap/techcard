/**
 * Select a single DOM element
 */
export const $ = (sel, parent = document) => parent.querySelector(sel);

/**
 * Select multiple DOM elements as an Array
 */
export const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

/**
 * Generate a unique ID for data items
 */
export const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Debounce function to limit execution rate
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func.apply(this, args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Auto-expand textarea height based on content
 */
export const autoExpand = (textarea) => {
    if (!textarea || textarea.tagName !== 'TEXTAREA') return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
};