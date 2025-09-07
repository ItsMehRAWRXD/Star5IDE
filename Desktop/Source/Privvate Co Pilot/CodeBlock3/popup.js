// Private AI Co Pilot - Popup Script
// Handles the user interface interactions

class AICoPilot {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loading = document.getElementById('loading');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.closeSettings = document.getElementById('closeSettings');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKey = document.getElementById('saveApiKey');
        this.apiKeyStatus = document.getElementById('apiKeyStatus');

        this.initializeEventListeners();
        this.loadApiKey();
        this.autoResizeTextarea();
    }

    initializeEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key (but allow Shift+Enter for new lines)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());

        // Settings panel
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.closeSettings.addEventListener('click', () => this.hideSettings());
        this.saveApiKey.addEventListener('click', () => this.saveApiKeyToStorage());

        // Listen for responses from background script
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'aiResponse') {
                this.handleAIResponse(request);
            }
        });
    }

    autoResizeTextarea() {
        const textarea = this.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input and show loading
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.setLoading(true);

        try {
            // Send message to background script
            const response = await browser.runtime.sendMessage({
                action: 'chatMessage',
                message: message
            });

            this.handleAIResponse(response);
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('Sorry, there was an error processing your request.', 'assistant', true);
        } finally {
            this.setLoading(false);
        }
    }

    handleAIResponse(response) {
        if (response.error) {
            this.addMessage(response.response, 'assistant', true);
            if (response.error === 'No API key configured') {
                this.showSettings();
            }
        } else {
            this.addMessage(response.response, 'assistant');
        }
    }

    addMessage(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        if (isError) {
            contentDiv.style.background = '#fed7d7';
            contentDiv.style.color = '#c53030';
            contentDiv.style.border = '1px solid #feb2b2';
        }
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        this.chatContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    setLoading(loading) {
        this.loading.classList.toggle('active', loading);
        this.sendButton.disabled = loading;
    }

    showSettings() {
        this.settingsPanel.classList.add('active');
        this.loadApiKey();
    }

    hideSettings() {
        this.settingsPanel.classList.remove('active');
    }

    async loadApiKey() {
        try {
            const response = await browser.runtime.sendMessage({
                action: 'getApiKey'
            });
            this.apiKeyInput.value = response.apiKey || '';
        } catch (error) {
            console.error('Error loading API key:', error);
        }
    }

    async saveApiKeyToStorage() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showApiKeyStatus('Please enter an API key', 'error');
            return;
        }

        try {
            await browser.runtime.sendMessage({
                action: 'saveApiKey',
                apiKey: apiKey
            });
            
            this.showApiKeyStatus('API key saved successfully!', 'success');
            setTimeout(() => this.hideSettings(), 1500);
        } catch (error) {
            console.error('Error saving API key:', error);
            this.showApiKeyStatus('Error saving API key', 'error');
        }
    }

    showApiKeyStatus(message, type) {
        this.apiKeyStatus.innerHTML = `<div class="error-message" style="background: ${type === 'success' ? '#c6f6d5' : '#fed7d7'}; color: ${type === 'success' ? '#22543d' : '#c53030'};">${message}</div>`;
        
        setTimeout(() => {
            this.apiKeyStatus.innerHTML = '';
        }, 3000);
    }
}

// Initialize the AI Co Pilot when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new AICoPilot();
});
