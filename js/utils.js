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
export const generateId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

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
    
    // Reset height to a small value to allow shrinking and correct scrollHeight calc
    textarea.style.height = '1px';
    
    // Set new height based on scrollHeight
    // Adding a small buffer (2px) for borders
    textarea.style.height = (textarea.scrollHeight + 2) + 'px';
};

/**
 * Enable column resizing for a table using "Neighbor Resize" logic.
 * This ensures the table width remains fixed at 100% and the right boundary doesn't shift.
 * Resizing column [i] affects column [i] and [i+1].
 * 
 * @param {HTMLElement} table - The table element
 * @param {Object} store - The application store instance
 */
export const setupColumnResize = (table, store) => {
    if (!table || !table.id) return;

    const tableId = table.id;
    const headers = Array.from(table.querySelectorAll('th'));
    const state = store.getState();
    const savedWidths = state.columnWidths && state.columnWidths[tableId] ? state.columnWidths[tableId] : {};
    const MIN_WIDTH = 40;

    // Apply saved widths initially
    headers.forEach((th, index) => {
        if (savedWidths[index]) {
            th.style.width = savedWidths[index];
        }
    });

    headers.forEach((th, index) => {
        // Don't add handle to the last column
        if (index === headers.length - 1) return;

        // Skip if handle already exists
        if (th.querySelector('.resize-handle')) return;

        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        th.appendChild(handle);

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const startX = e.pageX;
            const currentHeader = th;
            const nextHeader = headers[index + 1];
            
            const startWidthCurrent = currentHeader.offsetWidth;
            const startWidthNext = nextHeader.offsetWidth;
            
            document.body.classList.add('resizing');

            const onMouseMove = (e) => {
                requestAnimationFrame(() => {
                    const currentX = e.pageX;
                    const delta = currentX - startX;
                    
                    // Calculate new widths
                    // If delta > 0 (Right): Current grows, Next shrinks
                    // If delta < 0 (Left): Current shrinks, Next grows
                    
                    let newWidthCurrent = startWidthCurrent + delta;
                    let newWidthNext = startWidthNext - delta;

                    // Enforce minimum widths
                    if (newWidthCurrent < MIN_WIDTH) {
                        newWidthCurrent = MIN_WIDTH;
                        newWidthNext = startWidthNext + (startWidthCurrent - MIN_WIDTH);
                    } else if (newWidthNext < MIN_WIDTH) {
                        newWidthNext = MIN_WIDTH;
                        newWidthCurrent = startWidthCurrent + (startWidthNext - MIN_WIDTH);
                    }

                    // Apply widths
                    currentHeader.style.width = `${newWidthCurrent}px`;
                    nextHeader.style.width = `${newWidthNext}px`;

                    // Trigger auto-expand for all textareas in the table
                    const textareas = table.querySelectorAll('textarea');
                    textareas.forEach(ta => autoExpand(ta));
                });
            };

            const onMouseUp = () => {
                document.body.classList.remove('resizing');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // Save all widths to store
                headers.forEach((h, i) => {
                    store.setColumnWidth(tableId, i, h.style.width);
                });
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
};