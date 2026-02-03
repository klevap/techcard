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
    textarea.style.height = '1px';
    textarea.style.height = (textarea.scrollHeight + 2) + 'px';
};

/**
 * Enable column resizing for a table using COLGROUP.
 * This is the robust way to handle tables with colspan rows (like Formulation).
 * 
 * Logic:
 * 1. Manipulates <col> widths instead of <th> widths.
 * 2. Ignores hidden columns (like .print-only).
 * 3. The LAST VISIBLE column is left with 'auto' width to fill the table (100%).
 * 4. Resizing affects Current Column and Next Visible Column.
 * 
 * @param {HTMLElement} table - The table element
 * @param {Object} store - The application store instance
 */
export const setupColumnResize = (table, store) => {
    if (!table || !table.id) return;

    const tableId = table.id;
    const colgroup = table.querySelector('colgroup');
    if (!colgroup) return; // Should not happen with new HTML

    const cols = Array.from(colgroup.querySelectorAll('col'));
    const headers = Array.from(table.querySelectorAll('thead th'));
    
    // Map visible headers to their corresponding <col> elements
    // We filter headers by visibility, but we need to keep track of their original index
    // to target the correct <col>.
    const visibleColumns = [];
    headers.forEach((th, index) => {
        if (getComputedStyle(th).display !== 'none') {
            visibleColumns.push({
                header: th,
                col: cols[index],
                index: index
            });
        }
    });

    const state = store.getState();
    const savedWidths = state.columnWidths && state.columnWidths[tableId] ? state.columnWidths[tableId] : {};
    const MIN_WIDTH = 50;

    // Apply saved widths
    // IMPORTANT: Skip the last visible column to ensure it remains fluid (fills gap)
    visibleColumns.forEach((item, i) => {
        if (i === visibleColumns.length - 1) {
            item.col.style.width = ''; // Force auto
        } else if (savedWidths[item.index]) {
            item.col.style.width = savedWidths[item.index];
        }
    });

    // Add Resize Handles to Headers
    visibleColumns.forEach((item, i) => {
        // Don't add handle to the last visible column
        if (i === visibleColumns.length - 1) return;

        const th = item.header;
        
        // Skip if handle already exists
        if (th.querySelector('.resize-handle')) return;

        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        th.appendChild(handle);

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const startX = e.pageX;
            
            const currentCol = item.col;
            // The next visible column might not be the immediate next index if some are hidden
            const nextCol = visibleColumns[i + 1].col; 
            
            // We need pixel widths. Since <col> might not have offsetWidth, 
            // we use the corresponding header's width as a proxy for the start value.
            const startWidthCurrent = item.header.offsetWidth;
            const startWidthNext = visibleColumns[i + 1].header.offsetWidth;
            
            document.body.classList.add('resizing');

            const onMouseMove = (e) => {
                requestAnimationFrame(() => {
                    const delta = e.pageX - startX;
                    
                    // Logic:
                    // Current gets +delta
                    // Next gets -delta
                    // We must constrain delta so neither goes below MIN_WIDTH
                    
                    // Max we can grow current = Next width - MIN
                    const maxGrow = startWidthNext - MIN_WIDTH;
                    // Max we can shrink current = Current width - MIN
                    const maxShrink = startWidthCurrent - MIN_WIDTH;

                    let constrainedDelta = delta;
                    if (constrainedDelta > maxGrow) constrainedDelta = maxGrow;
                    if (constrainedDelta < -maxShrink) constrainedDelta = -maxShrink;

                    currentCol.style.width = `${startWidthCurrent + constrainedDelta}px`;
                    
                    // Only set explicit width on Next if it is NOT the last visible column.
                    // If Next IS the last visible column, we leave it as 'auto' (implicit)
                    // so it absorbs the change naturally.
                    if (i + 1 !== visibleColumns.length - 1) {
                        nextCol.style.width = `${startWidthNext - constrainedDelta}px`;
                    }

                    // Trigger auto-expand for textareas
                    const textareas = table.querySelectorAll('textarea');
                    textareas.forEach(ta => autoExpand(ta));
                });
            };

            const onMouseUp = () => {
                document.body.classList.remove('resizing');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // Save widths
                visibleColumns.forEach((vc, idx) => {
                    // Don't save width for the last visible column
                    if (idx === visibleColumns.length - 1) {
                        store.setColumnWidth(tableId, vc.index, '');
                    } else {
                        store.setColumnWidth(tableId, vc.index, vc.col.style.width);
                    }
                });
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
};