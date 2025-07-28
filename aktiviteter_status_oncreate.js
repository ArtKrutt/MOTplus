(function() {
    'use strict';

    // Utility: Wait for an element in a given document
    function waitForElementInDoc(selector, doc, callback) {
        const element = doc.querySelector(selector);
        if (element) {
            callback(element);
        } else {
            setTimeout(() => waitForElementInDoc(selector, doc, callback), 100);
        }
    }

    // Emoji toggle logic (same as main script, but parameterized for any document)
    function toggleEmoji(emoji, textField) {
        const currentValue = textField.value;
        const emojiPattern = new RegExp(`^${emoji}(?=\\s|$|[✅⚠️❗])`);
        if (emojiPattern.test(currentValue)) {
            textField.value = currentValue.replace(new RegExp(`^${emoji}\\s?`), '');
        } else {
            textField.value = emoji + (currentValue.startsWith('✅') || currentValue.startsWith('⚠️') || currentValue.startsWith('❗') ? '' : ' ') + currentValue;
        }
        textField.dispatchEvent(new Event('change', { bubbles: true }));
        textField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function createEmojiButton(emoji, textField, doc) {
        const button = doc.createElement('button');
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
        button.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e9e9e9';
        });
        button.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f9f9f9';
        });
        button.addEventListener('click', function() {
            toggleEmoji(emoji, textField);
        });
        return button;
    }

    function addEmojiButtonsToDoc(doc) {
        const label = doc.getElementById('mot_name_label');
        const textField = doc.getElementById('mot_name');
        if (!label || !textField) {
            return;
        }
        if (label.querySelector('.emoji-button-container')) {
            return;
        }
        const buttonContainer = doc.createElement('span');
        buttonContainer.className = 'emoji-button-container';
        buttonContainer.style.marginLeft = '10px';
        const emojis = ['✅', '⚠️', '❗'];
        emojis.forEach(emoji => {
            const button = createEmojiButton(emoji, textField, doc);
            buttonContainer.appendChild(button);
        });
        label.appendChild(buttonContainer);
    }

    // This function sets up a listener for the button that opens the modal.
    function setupModalListener() {
        document.body.addEventListener('click', function(event) {
            // Check if the clicked element is the "Opprett" button for the modal
            const button = event.target.closest('a.action.create-action');
            if (!button || button.title !== 'Opprett') {
                return;
            }

            // Button was clicked, so we start looking for the iframe.
            // We will poll for a few seconds to find it.
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds total

            const findIframeInterval = setInterval(function() {
                const iframe = document.querySelector('.modal.in iframe');
                attempts++;

                if (iframe) {
                    clearInterval(findIframeInterval); // Stop polling

                    // Ensure we only attach our logic once
                    if (iframe.dataset.emojiListenerAttached) {
                        return;
                    }
                    iframe.dataset.emojiListenerAttached = 'true';

                    const onIframeLoad = () => {
                        const iframeDoc = iframe.contentDocument;
                        if (iframeDoc) {
                            waitForElementInDoc('#mot_name_label', iframeDoc, function() {
                                waitForElementInDoc('#mot_name', iframeDoc, function() {
                                    addEmojiButtonsToDoc(iframeDoc);
                                });
                            });
                        }
                    };

                    // The iframe might already be loaded by the time we find it.
                    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                        onIframeLoad();
                    } else {
                        iframe.addEventListener('load', onIframeLoad);
                    }
                } else if (attempts >= maxAttempts) {
                    clearInterval(findIframeInterval); // Stop after timeout
                }
            }, 100);

        }, true); // Use capture phase to ensure our listener runs first
    }


    // Start monitoring when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupModalListener);
    } else {
        setupModalListener();
    }
})(); 