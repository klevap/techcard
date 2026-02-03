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
    
    // Reset height to auto to allow shrinking
    textarea.style.height = 'auto';
    
    // Set new height based on scrollHeight
    // Adding a small buffer to prevent scrollbar flickering
    textarea.style.height = (textarea.scrollHeight + 2) + 'px';
};

/**
 * Enable column resizing for a table
 * @param {HTMLElement} table - The table element
 * @param {Object} store - The application store instance
 */
export const setupColumnResize = (table, store) => {
    if (!table || !table.id) return;

    const tableId = table.id;
    const headers = table.querySelectorAll('th');
    const state = store.getState();
    const savedWidths = state.columnWidths && state.columnWidths[tableId] ? state.columnWidths[tableId] : {};

    headers.forEach((th, index) => {
        // Apply saved width if exists
        if (savedWidths[index]) {
            th.style.width = savedWidths[index];
        }

        // Skip if handle already exists
        if (th.querySelector('.resize-handle')) return;

        // Create handle
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        th.appendChild(handle);

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const startX = e.pageX;
            const startWidth = th.offsetWidth;
            
            document.body.classList.add('resizing');

            const onMouseMove = (e) => {
                const newWidth = startWidth + (e.pageX - startX);
                if (newWidth > 30) { // Minimum width
                    th.style.width = `${newWidth}px`;
                }
            };

            const onMouseUp = () => {
                document.body.classList.remove('resizing');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // Save width to store
                store.setColumnWidth(tableId, index, th.style.width);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
};