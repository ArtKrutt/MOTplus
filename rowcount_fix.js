(function() {
    'use strict';

    // Flag to track if updateRowCount has already been called
    let updateRowCountCalled = false;

    // Store the original updateRowCount function
    let originalUpdateRowCount = null;

    // Function to intercept and modify updateRowCount
    function interceptUpdateRowCount() {
        // Check if updateRowCount exists
        if (typeof window.updateRowCount === 'function') {
            // Store original function if not already stored
            if (!originalUpdateRowCount) {
                originalUpdateRowCount = window.updateRowCount;
            }

            // Replace with our controlled version
            window.updateRowCount = function() {
                console.log('updateRowCount intercepted');
                
                // Only run if not already called
                if (!updateRowCountCalled) {
                    console.log('Running updateRowCount (first time)');
                    updateRowCountCalled = true;
                    return originalUpdateRowCount.apply(this, arguments);
                } else {
                    console.log('updateRowCount skipped (already called)');
                    return;
                }
            };
            
            console.log('updateRowCount function intercepted successfully');
        }
    }

    // Function to reset the flag when needed (e.g., when table content actually changes)
    function resetUpdateRowCountFlag() {
        updateRowCountCalled = false;
        console.log('updateRowCount flag reset');
    }

    // Alternative approach: Intercept LocateTable function
    function interceptLocateTable() {
        // Check if LocateTable exists
        if (typeof window.LocateTable === 'function') {
            const originalLocateTable = window.LocateTable;
            let locateTableRunning = false;

            window.LocateTable = function() {
                console.log('LocateTable intercepted');
                
                // Prevent multiple simultaneous executions
                if (locateTableRunning) {
                    console.log('LocateTable already running, skipping duplicate call');
                    return;
                }
                
                locateTableRunning = true;
                
                // Reset the flag when starting a new table search
                resetUpdateRowCountFlag();
                
                // Call original function
                const result = originalLocateTable.apply(this, arguments);
                
                // Reset running flag after a delay
                setTimeout(() => {
                    locateTableRunning = false;
                }, 1000);
                
                return result;
            };
            
            console.log('LocateTable function intercepted successfully');
        }
    }

    // Function to monitor for sort clicks and reset flag
    function monitorSortClicks() {
        // Use event delegation to catch sort clicks
        document.addEventListener('click', function(event) {
            if (event.target.matches('.sort-enabled') || event.target.closest('.sort-enabled')) {
                console.log('Sort click detected, resetting updateRowCount flag');
                // Reset flag when sort is clicked (new data is coming)
                setTimeout(() => {
                    resetUpdateRowCountFlag();
                }, 100);
            }
        });
    }

    // Observer to detect table changes and reset flag accordingly
    function observeTableChanges() {
        const observer = new MutationObserver((mutations) => {
            let shouldReset = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if table rows were added/removed
                    const addedNodes = Array.from(mutation.addedNodes);
                    const removedNodes = Array.from(mutation.removedNodes);
                    
                    const hasTableChanges = [...addedNodes, ...removedNodes].some(node => {
                        return node.nodeType === Node.ELEMENT_NODE && 
                               (node.matches('tr[data-id]') || node.querySelector('tr[data-id]'));
                    });
                    
                    if (hasTableChanges) {
                        shouldReset = true;
                    }
                }
            });
            
            if (shouldReset) {
                console.log('Table structure changed, resetting updateRowCount flag');
                resetUpdateRowCountFlag();
            }
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize the script
    function init() {
        // Method 1: Intercept updateRowCount directly
        interceptUpdateRowCount();
        
        // Method 2: Intercept LocateTable to prevent duplicate calls
        interceptLocateTable();
        
        // Method 3: Monitor for sort clicks
        monitorSortClicks();
        
        // Method 4: Observe table changes
        observeTableChanges();
        
        console.log('Duplicate updateRowCount prevention script initialized');
    }

    // Wait for the page scripts to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Give the page scripts time to load
            setTimeout(init, 500);
        });
    } else {
        setTimeout(init, 500);
    }

    // Also try multiple times to catch the functions when they're defined
    let attempts = 0;
    const maxAttempts = 20;
    
    function attemptIntercept() {
        if (attempts >= maxAttempts) {
            console.log('Max attempts reached for function interception');
            return;
        }
        
        attempts++;
        
        if (typeof window.updateRowCount === 'function' && typeof window.LocateTable === 'function') {
            init();
        } else {
            console.log(`Attempt ${attempts}: Functions not ready yet, retrying...`);
            setTimeout(attemptIntercept, 250);
        }
    }
    
    attemptIntercept();

})();