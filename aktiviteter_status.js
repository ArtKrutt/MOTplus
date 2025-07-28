(function() {
    'use strict';

    // Wait for the page to load completely
    function waitForElement(selector, callback) {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
        } else {
            setTimeout(() => waitForElement(selector, callback), 100);
        }
    }

    // Function to toggle emoji in text field
    function toggleEmoji(emoji, textField) {
        const currentValue = textField.value;
        
        // Check if this specific emoji is already present at the beginning
        const emojiPattern = new RegExp(`^${emoji}(?=\\s|$|[✅⚠️❗])`);
        if (emojiPattern.test(currentValue)) {
            // Remove this specific emoji
            textField.value = currentValue.replace(new RegExp(`^${emoji}\\s?`), '');
        } else {
            // Add the emoji at the beginning
            textField.value = emoji + (currentValue.startsWith('✅') || currentValue.startsWith('⚠️') || currentValue.startsWith('❗') ? '' : ' ') + currentValue;
        }
        
        // Trigger change event in case the form needs to know about the change
        textField.dispatchEvent(new Event('change', { bubbles: true }));
        textField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Function to create emoji button
    function createEmojiButton(emoji, textField) {
        const button = document.createElement('button');
        button.textContent = emoji;
        button.type = 'button';
        button.style.cssText = `
            margin-left: 5px;
            padding: 5px 10px;
            border: 1px solid #ccc;
            background: #f9f9f9;
            border-radius: 3px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.2s;
        `;
        
        // Add hover effect
        button.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e9e9e9';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f9f9f9';
        });
        
        // Add click handler
        button.addEventListener('click', function() {
            toggleEmoji(emoji, textField);
        });
        
        return button;
    }

    // Main function to add the buttons
    function addEmojiButtons() {
        const label = document.getElementById('mot_name_label');
        const textField = document.getElementById('mot_name');
        
        if (!label || !textField) {
            console.log('MOT Emoji Extension: Required elements not found');
            return;
        }
        
        // Check if buttons already exist
        if (label.querySelector('.emoji-button-container')) {
            return;
        }
        
        // Create container for buttons
        const buttonContainer = document.createElement('span');
        buttonContainer.className = 'emoji-button-container';
        buttonContainer.style.marginLeft = '10px';
        
        // Create buttons for each emoji
        const emojis = ['✅', '⚠️', '❗'];
        emojis.forEach(emoji => {
            const button = createEmojiButton(emoji, textField);
            buttonContainer.appendChild(button);
        });
        
        // Add buttons to the label
        label.appendChild(buttonContainer);
        
        console.log('MOT Emoji Extension: Buttons added successfully');
    }

    // Initialize the extension
    function init() {
        // Wait for the label element to be available
        waitForElement('#mot_name_label', function(label) {
            // Also wait for the text field
            waitForElement('#mot_name', function(textField) {
                addEmojiButtons();
            });
        });
    }

    // Run when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also try to run after a short delay in case elements are loaded dynamically
    setTimeout(init, 1000);
    setTimeout(init, 3000);

})();