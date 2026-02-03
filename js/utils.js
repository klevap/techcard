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
 * Enable column resizing for a table with cascading behavior
 * Keeps total table width constant.
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
        // Don't add handle to the last column as resizing it doesn't make sense 
        // in a fixed-width context without affecting the right boundary
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
            // Capture current widths of all columns in pixels
            const startWidths = headers.map(h => h.offsetWidth);
            
            document.body.classList.add('resizing');

            const onMouseMove = (e) => {
                requestAnimationFrame(() => {
                    const currentX = e.pageX;
                    const delta = currentX - startX;
                    
                    // We are resizing the boundary between column [index] and [index+1]
                    // If delta > 0 (Right): Col [index] grows, Col [index+1...] shrinks
                    // If delta < 0 (Left): Col [index...] shrinks, Col [index+1] grows

                    const newWidths = [...startWidths];

                    if (delta > 0) {
                        // Moving Right
                        // 1. Grow the left column (index)
                        newWidths[index] = startWidths[index] + delta;
                        
                        // 2. Shrink right columns (cascade)
                        let remainingDelta = delta;
                        for (let i = index + 1; i < headers.length; i++) {
                            const available = startWidths[i] - MIN_WIDTH;
                            const shrinkAmount = Math.min(available, remainingDelta);
                            
                            newWidths[i] = startWidths[i] - shrinkAmount;
                            remainingDelta -= shrinkAmount;
                            
                            if (remainingDelta <= 0) break;
                        }
                        
                        // If we couldn't distribute the full delta (hit right edge limits), 
                        // we must limit the growth of the left column to match what was actually shrunk
                        const actualShrunk = delta - remainingDelta;
                        newWidths[index] = startWidths[index] + actualShrunk;

                    } else {
                        // Moving Left (delta is negative)
                        const absDelta = Math.abs(delta);
                        
                        // 1. Grow the right column (index + 1)
                        newWidths[index + 1] = startWidths[index + 1] + absDelta;

                        // 2. Shrink left columns (cascade backwards)
                        let remainingDelta = absDelta;
                        for (let i = index; i >= 0; i--) {
                            const available = startWidths[i] - MIN_WIDTH;
                            const shrinkAmount = Math.min(available, remainingDelta);
                            
                            newWidths[i] = startWidths[i] - shrinkAmount;
                            remainingDelta -= shrinkAmount;
                            
                            if (remainingDelta <= 0) break;
                        }

                        // If we couldn't distribute the full delta (hit left edge limits),
                        // limit the growth of the right column
                        const actualShrunk = absDelta - remainingDelta;
                        newWidths[index + 1] = startWidths[index + 1] + actualShrunk;
                    }

                    // Apply new widths
                    headers.forEach((h, i) => {
                        h.style.width = `${newWidths[i]}px`;
                    });

                    // Trigger auto-expand for all textareas in the table
                    // This fixes the issue where text doesn't reflow/resize during column drag
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