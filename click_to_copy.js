(function () {
    'use strict';

    // Function to copy text to clipboard using modern API
    async function copyToClipboard(text) {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            // Fallback to older method
            return fallbackCopyToClipboard(text);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            return fallbackCopyToClipboard(text);
        }
    }

    // Fallback clipboard method for older browsers
    function fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.top = '-1000px';
            textArea.style.left = '-1000px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (err) {
            console.error('Fallback copy failed:', err);
            return false;
        }
    }

    // Function to show the toast at the cursor position
    function showToast(message, event, success = true) {
        const toast = document.createElement('div');
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed',
            top: `${event.clientY}px`,
            left: `${event.clientX}px`,
            background: success ? 'rgba(0, 128, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.2s ease-in-out',
            pointerEvents: 'none',
            fontFamily: 'Arial, sans-serif',
            whiteSpace: 'nowrap'
        });

        document.body.appendChild(toast);

        // Fade in
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 0);

        // Fade out and remove after 750ms
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 200);
        }, 500);
    }

    // Handle click events with clipboard copy
    async function handleClick(element, event) {
        const text = element.textContent ? element.textContent.trim() : element.value;
        if (!text) {
            showToast('Nothing to copy!', event, false);
            return;
        }

        const success = await copyToClipboard(text);
        if (success) {
            console.log('Copied to clipboard:', text);
            showToast('Copied!', event, true);
        } else {
            console.error('Failed to copy:', text);
            showToast('Copy failed!', event, false);
        }
    }

    // Attach event listeners to elements
    function attachListeners() {
        // Target div with specific data-name
        const targetDiv = document.querySelector('div[data-name="personopplysninger_beboer"]');
        if (targetDiv) {
            const inputs = targetDiv.querySelectorAll('input');
            inputs.forEach(input => {
                if (!input.dataset.clipboardListenerAdded) {
                    input.addEventListener('click', (event) => {
                        event.preventDefault();
                        handleClick(input, event);
                    });
                    input.dataset.clipboardListenerAdded = 'true';
                }
            });
        }

        // Page title element
        const pageTitle = document.querySelector('#pageTitle');
        if (pageTitle && !pageTitle.dataset.clipboardListenerAdded) {
            pageTitle.addEventListener('click', (event) => {
                event.preventDefault();
                handleClick(pageTitle, event);
            });
            pageTitle.dataset.clipboardListenerAdded = 'true';
        }

        // Table cells with specific data attributes
        const tableCells = document.querySelectorAll([
            'td[data-attribute="mot_age"]',
            'td[data-attribute="mot_dufnumber"]', 
            'td[data-attribute="mot_idnumber"]',
            'td[data-attribute="mot_placementgroup"]',
            'td[data-attribute="mot_economygroup"]',
            'td[data-attribute="firstname"]',
            'td[data-attribute="lastname"]'
        ].join(', '));

        tableCells.forEach(cell => {
            if (!cell.dataset.clipboardListenerAdded) {
                cell.addEventListener('click', (event) => {
                    event.preventDefault();
                    handleClick(cell, event);
                });
                cell.dataset.clipboardListenerAdded = 'true';
                
                // Add visual hover effect
                cell.style.cursor = 'pointer';
                cell.title = 'Click to copy';
            }
        });
    }

    // Optimized mutation observer with debouncing
    let observerTimeout;
    const observer = new MutationObserver((mutations) => {
        // Only process if there are actual element additions
        const hasNewElements = mutations.some(mutation => 
            mutation.type === 'childList' && mutation.addedNodes.length > 0
        );
        
        if (hasNewElements) {
            // Debounce the attachListeners call
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                attachListeners();
            }, 100);
        }
    });

    // Initialize the extension
    function init() {
        // Initial attachment
        attachListeners();
        
        // Start observing for dynamic content
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        console.log('Clipboard Copy Extension initialized');
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also initialize after a short delay for dynamic content
    setTimeout(init, 1000);

    // Cleanup function (good practice)
    window.addEventListener('beforeunload', () => {
        observer.disconnect();
    });

})();