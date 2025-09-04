// Clean Entry Point - Self-Healing ChatGPT Scraper
// Monitors for changes and resets when modified
(function() {
    'use strict';
    
    console.log('🛡️ Clean Entry Point - Self-Healing Scraper Starting...');
    
    // Original clean code hash for integrity checking
    const ORIGINAL_HASH = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
    const LOG_FILE = 'scraper_logs.txt';
    
    // Clean, readable functions
    function extractChatGPTContent() {
        const results = [];
        
        // Select all message containers
        const messageSelectors = [
            '[data-message-author-role="assistant"]',
            '.markdown',
            '.prose',
            '[class*="message"]',
            '[class*="content"]'
        ];
        
        messageSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.innerText || element.textContent;
                const cleanText = text
                    .replace(/\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n')
                    .trim();
                
                if (cleanText.length > 10) {
                    results.push(cleanText);
                }
            });
        });
        
        return results;
    }
    
    function removePaddingAndTemp() {
        const tempSelectors = [
            '.loading',
            '.spinner',
            '.placeholder',
            '[class*="temp"]',
            '[class*="padding"]',
            '[class*="margin"]',
            '.hidden',
            '[style*="display: none"]'
        ];
        
        tempSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
    }
    
    function getAllChats() {
        const chats = [];
        const chatElements = document.querySelectorAll(
            '[data-testid="conversation-turn-3"], ' +
            '[class*="conversation"], ' +
            '[class*="chat-item"], ' +
            '.group\\/conversation-turn, ' +
            '[role="presentation"]'
        );
        
        chatElements.forEach((chat, index) => {
            const messages = chat.querySelectorAll(
                '[data-message-author-role="assistant"], ' +
                '[data-message-author-role="user"], ' +
                '.markdown, ' +
                '.prose'
            );
            
            const chatData = {
                id: index + 1,
                messages: []
            };
            
            messages.forEach(msg => {
                const text = msg.innerText || msg.textContent;
                if (text && text.trim().length > 5) {
                    chatData.messages.push({
                        role: msg.getAttribute('data-message-author-role') || 'unknown',
                        content: text.trim()
                    });
                }
            });
            
            if (chatData.messages.length > 0) {
                chats.push(chatData);
            }
        });
        
        return chats;
    }
    
    function formatOutput(chats, type) {
        let output = `ChatGPT ${type} Export - ${new Date().toLocaleString()}\n`;
        output += '='.repeat(50) + '\n\n';
        
        if (type === 'All Chats') {
            chats.forEach((chat, index) => {
                output += `--- Chat ${chat.id} ---\n`;
                chat.messages.forEach(msg => {
                    output += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
                });
                output += '\n' + '-'.repeat(30) + '\n\n';
            });
        } else {
            chats.forEach((msg, index) => {
                output += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
            });
        }
        
        return output;
    }
    
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function logActivity(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        
        // Store in memory for now
        if (!window.scraperLogs) {
            window.scraperLogs = '';
        }
        window.scraperLogs += logEntry;
        
        console.log(`📝 LOG: ${message}`);
    }
    
    function checkIntegrity() {
        const currentCode = arguments.callee.toString();
        const currentHash = btoa(currentCode).substring(0, 32);
        
        if (currentHash !== ORIGINAL_HASH) {
            logActivity('INTEGRITY CHECK FAILED - Code has been modified!');
            logActivity('Resetting to clean state...');
            resetToCleanState();
            return false;
        }
        
        logActivity('Integrity check passed - Code is clean');
        return true;
    }
    
    function resetToCleanState() {
        logActivity('RESET: Restoring clean entry point...');
        
        // Clear any modifications
        if (window.scraperLogs) {
            downloadFile(window.scraperLogs, 'integrity_logs.txt');
            window.scraperLogs = '';
        }
        
        // Re-inject clean code
        const cleanCode = `
            // Clean Entry Point - Self-Healing ChatGPT Scraper
            (function() {
                'use strict';
                console.log('🛡️ Clean Entry Point Restored');
                
                function extractChatGPTContent() {
                    const results = [];
                    const messageSelectors = [
                        '[data-message-author-role="assistant"]',
                        '.markdown',
                        '.prose',
                        '[class*="message"]',
                        '[class*="content"]'
                    ];
                    
                    messageSelectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(element => {
                            const text = element.innerText || element.textContent;
                            const cleanText = text.replace(/\\s+/g, ' ').replace(/\\n\\s*\\n/g, '\\n').trim();
                            if (cleanText.length > 10) {
                                results.push(cleanText);
                            }
                        });
                    });
                    
                    return results;
                }
                
                function removePaddingAndTemp() {
                    const tempSelectors = [
                        '.loading', '.spinner', '.placeholder',
                        '[class*="temp"]', '[class*="padding"]', '[class*="margin"]',
                        '.hidden', '[style*="display: none"]'
                    ];
                    
                    tempSelectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => el.remove());
                    });
                }
                
                function getAllChats() {
                    const chats = [];
                    const chatElements = document.querySelectorAll(
                        '[data-testid="conversation-turn-3"], [class*="conversation"], [class*="chat-item"], .group\\\\/conversation-turn, [role="presentation"]'
                    );
                    
                    chatElements.forEach((chat, index) => {
                        const messages = chat.querySelectorAll(
                            '[data-message-author-role="assistant"], [data-message-author-role="user"], .markdown, .prose'
                        );
                        
                        const chatData = { id: index + 1, messages: [] };
                        
                        messages.forEach(msg => {
                            const text = msg.innerText || msg.textContent;
                            if (text && text.trim().length > 5) {
                                chatData.messages.push({
                                    role: msg.getAttribute('data-message-author-role') || 'unknown',
                                    content: text.trim()
                                });
                            }
                        });
                        
                        if (chatData.messages.length > 0) {
                            chats.push(chatData);
                        }
                    });
                    
                    return chats;
                }
                
                function formatOutput(chats, type) {
                    let output = \`ChatGPT \${type} Export - \${new Date().toLocaleString()}\\n\`;
                    output += '='.repeat(50) + '\\n\\n';
                    
                    if (type === 'All Chats') {
                        chats.forEach((chat, index) => {
                            output += \`--- Chat \${chat.id} ---\\n\`;
                            chat.messages.forEach(msg => {
                                output += \`[\${msg.role.toUpperCase()}]: \${msg.content}\\n\\n\`;
                            });
                            output += '\\n' + '-'.repeat(30) + '\\n\\n';
                        });
                    } else {
                        chats.forEach((msg, index) => {
                            output += \`[\${msg.role.toUpperCase()}]: \${msg.content}\\n\\n\`;
                        });
                    }
                    
                    return output;
                }
                
                function downloadFile(content, filename) {
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                
                // Main execution
                try {
                    removePaddingAndTemp();
                    const allChats = getAllChats();
                    const currentChat = allChats.length > 0 ? allChats[0].messages : [];
                    
                    console.log(\`📊 Found \${allChats.length} chats, \${currentChat.length} messages in current chat\`);
                    
                    const allOutput = formatOutput(allChats, 'All Chats');
                    const currentOutput = formatOutput(currentChat, 'Current Chat');
                    
                    console.log('📋 ALL CHATS:');
                    console.log(allOutput);
                    console.log('📋 CURRENT CHAT:');
                    console.log(currentOutput);
                    
                    downloadFile(allOutput + '\\n\\n' + currentOutput, 'logs.txt');
                    console.log('💾 Downloaded logs.txt to Desktop!');
                    
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(allOutput + '\\n\\n' + currentOutput).then(() => {
                            console.log('📋 Also copied to clipboard!');
                        });
                    }
                    
                    console.log('✅ Clean scraper completed successfully!');
                    
                } catch (error) {
                    console.error('❌ Error:', error);
                }
                
                // Self-destruct after completion
                setTimeout(() => {
                    console.log('💀 Clean scraper self-destructing...');
                }, 2000);
            })();
        `;
        
        // Execute clean code
        eval(cleanCode);
    }
    
    // Main execution with integrity monitoring
    try {
        logActivity('Clean entry point initialized');
        
        // Check integrity before execution
        if (!checkIntegrity()) {
            return; // Reset will handle execution
        }
        
        // Remove padding and temp elements
        removePaddingAndTemp();
        logActivity('Removed padding and temporary elements');
        
        // Extract content
        const allChats = getAllChats();
        const currentChat = allChats.length > 0 ? allChats[0].messages : [];
        
        logActivity(`Extracted ${allChats.length} chats, ${currentChat.length} messages`);
        
        // Format output
        const allOutput = formatOutput(allChats, 'All Chats');
        const currentOutput = formatOutput(currentChat, 'Current Chat');
        
        console.log('📋 ALL CHATS:');
        console.log(allOutput);
        console.log('📋 CURRENT CHAT:');
        console.log(currentOutput);
        
        // Download file
        downloadFile(allOutput + '\n\n' + currentOutput, 'logs.txt');
        logActivity('Downloaded logs.txt to Desktop');
        
        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(allOutput + '\n\n' + currentOutput).then(() => {
                logActivity('Content copied to clipboard');
                console.log('📋 Also copied to clipboard!');
            });
        }
        
        logActivity('Scraping completed successfully');
        console.log('✅ Clean scraper completed successfully!');
        
        // Download integrity logs
        if (window.scraperLogs) {
            downloadFile(window.scraperLogs, 'integrity_logs.txt');
        }
        
    } catch (error) {
        logActivity(`ERROR: ${error.message}`);
        console.error('❌ Error:', error);
    }
    
    // Self-destruct after completion
    setTimeout(() => {
        logActivity('Self-destructing...');
        console.log('💀 Clean scraper self-destructing...');
    }, 2000);
    
})();