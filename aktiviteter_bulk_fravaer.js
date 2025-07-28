// ==UserScript==
// @name         Bulk Gyldig Fravær
// @version      1.0
// @description  Bulk absence selector (fravær)
// @author       You
// @match        https://mot.microsoftcrmportals.com/nb-NO/instrumentbord-beboer/beboeraktiviteter/beboeraktivitet/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=microsoftcrmportals.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    if (!location.search.includes('page=3')) {
        return;
    }

    // Suppress all alert dialogs
    window.alert = function(msg) { console.log('[Suppressed alert]', msg); };

    // Key for localStorage
    const STORAGE_KEY = 'bulkFravaerSelectedIds';
    const RUNNING_KEY = 'bulkFravaerRunning';

    // Wait for .view-grid to appear
    function waitForViewGrid() {
        const grid = document.querySelector('.view-grid');
        if (!grid) {
            setTimeout(waitForViewGrid, 500);
            return;
        }
        setupObserver(grid);
        enhanceTableIfPresent();
    }

    // Set up a MutationObserver on .view-grid
    function setupObserver(grid) {
        const observer = new MutationObserver(() => {
            enhanceTableIfPresent();
        });
        observer.observe(grid, { childList: true, subtree: true });
    }

    // Enhance the table if it exists
    function enhanceTableIfPresent() {
        const table = document.querySelector('.view-grid table');
        if (!table) return;
        enhanceTable(table);
    }

    function enhanceTable(table) {
        // Add checkbox header if not present
        const thead = table.querySelector('thead tr');
        if (thead && !thead.querySelector('.bulk-checkbox-header')) {
            const th = document.createElement('th');
            th.style.width = '30px';
            th.className = 'bulk-checkbox-header';
            th.innerHTML = '<input type="checkbox" id="bulk-select-all" title="Velg alle">';
            thead.insertBefore(th, thead.firstChild);
        }

        // Add checkboxes to each person row (with data-id)
        document.querySelectorAll('.view-grid table tr[data-id]').forEach(row => {
            const personId = row.getAttribute('data-id');
            if (!row.querySelector('.bulk-checkbox')) {
                const td = document.createElement('td');
                td.style.textAlign = 'center';
                td.className = 'bulk-checkbox';
                td.innerHTML = '<input type="checkbox" class="bulk-select-person">';
                row.insertBefore(td, row.firstChild);
            }
            // Restore checked state if in localStorage
            const cb = row.querySelector('.bulk-select-person');
            const selectedIds = getSelectedIds();
            if (cb && selectedIds.includes(personId)) {
                cb.checked = true;
            }
        });

        // Add bulk action button if not present
        if (!document.getElementById('bulk-fravaer-btn')) {
            const btn = document.createElement('button');
            btn.id = 'bulk-fravaer-btn';
            btn.textContent = 'Bulk Gyldig fravær';
            btn.style.margin = '10px 0 10px 10px';
            btn.className = 'btn btn-warning';
            table.parentElement.insertBefore(btn, table);
            btn.addEventListener('click', bulkSetFravaer);
        }

        // Select all handler
        const selectAll = document.getElementById('bulk-select-all');
        if (selectAll && !selectAll.hasListener) {
            selectAll.addEventListener('change', function() {
                const checked = this.checked;
                document.querySelectorAll('.view-grid table tr[data-id]').forEach(row => {
                    const cb = row.querySelector('.bulk-select-person');
                    if (cb) cb.checked = checked;
                });
            });
            selectAll.hasListener = true;
        }

        // If a bulk operation is running, continue it
        if (localStorage.getItem(RUNNING_KEY) === '1') {
            continueBulkSetFravaer();
        }
    }

    function getSelectedIds() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }
    function setSelectedIds(ids) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
    function clearSelectedIds() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function bulkSetFravaer() {
        // Gather selected IDs
        const selectedRows = Array.from(document.querySelectorAll('.view-grid table tr[data-id]')).filter(row => {
            const cb = row.querySelector('.bulk-select-person');
            return cb && cb.checked;
        });
        if (selectedRows.length === 0) {
            alert('Ingen personer valgt!');
            return;
        }
        const ids = selectedRows.map(row => row.getAttribute('data-id'));
        setSelectedIds(ids);
        localStorage.setItem(RUNNING_KEY, '1');
        setTimeout(() => continueBulkSetFravaer(), 500); // Add a small delay before starting
    }

    function continueBulkSetFravaer(retryCount = 0) {
        const ids = getSelectedIds();
        if (!ids.length) {
            localStorage.removeItem(RUNNING_KEY);
            alert('Ferdig!');
            return;
        }
        const nextId = ids[0];
        const rows = Array.from(document.querySelectorAll('.view-grid table tr[data-id]'));
        let found = false;
        for (const row of rows) {
            const personId = row.getAttribute('data-id');
            if (nextId === personId) {
                // Find the 'Rediger gyldig fravær' link
                const link = Array.from(row.querySelectorAll('a.workflow-link')).find(a => a.title && a.title.includes('Rediger gyldig fravær'));
                if (link) {
                    // Remove this id from the list for next round
                    setSelectedIds(ids.slice(1));
                    link.click();
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            // Retry up to 120 times (60 seconds total)
            if (retryCount < 120) {
                setTimeout(() => continueBulkSetFravaer(retryCount + 1), 500);
            } else {
                // If not found after retries, skip this id and try next
                setSelectedIds(ids.slice(1));
                setTimeout(() => continueBulkSetFravaer(0), 500);
            }
        }
    }

    // Start the process
    waitForViewGrid();
})(); 