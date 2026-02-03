/**
 * Generates a unique ID for state items
 */
export const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Limits the rate at which a function can fire
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Adjusts textarea height based on content
 */
export const autoExpand = (textarea) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
};

/**
 * Shorthand for querySelector
 */
export const $ = sel => document.querySelector(sel);

/**
 * Shorthand for querySelectorAll (returns Array)
 */
export const $$ = sel => Array.from(document.querySelectorAll(sel));