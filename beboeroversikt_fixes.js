(function() {
    'use strict';

    // Function to apply padding to col-md-12 elements
    function applyPadding() {
        const elements = document.querySelectorAll('.col-md-12');
        elements.forEach(element => {
            if (!element.dataset.paddingApplied) {
                element.style.padding = '0.5%';
                element.dataset.paddingApplied = 'true';
            }
        });
    }

    // Function to remove columns from table
    function removeTableColumns() {
        const table = document.querySelector('table');
        if (!table || table.dataset.columnsRemoved) return;
        
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 9 && cells[7]) {
                cells[7].remove();
            }
        });
        
        // Mark table as processed
        table.dataset.columnsRemoved = 'true';
        console.log('UI Enhancement: Table column 8 removed');
    }

    // Function to apply all UI enhancements
    function applyEnhancements() {
        applyPadding();
        removeTableColumns();
    }

    // Optimized mutation observer with debouncing
    let observerTimeout;
    const observer = new MutationObserver((mutations) => {
        // Check if there are new elements added
        const hasNewElements = mutations.some(mutation => 
            mutation.type === 'childList' && mutation.addedNodes.length > 0
        );
        
        if (hasNewElements) {
            // Debounce the enhancements
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                applyEnhancements();
            }, 100);
        }
    });

    // Initialize the script
    function init() {
        // Apply initial enhancements
        applyEnhancements();
        
        // Start observing for dynamic content
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        console.log('UI Enhancement Script initialized');
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also initialize after a short delay for dynamic content
    setTimeout(init, 500);

    // Cleanup function
    window.addEventListener('beforeunload', () => {
        observer.disconnect();
    });

})();