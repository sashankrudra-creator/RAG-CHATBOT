document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const suggestedQuestions = document.getElementById('suggested-questions');
    const logoutBtn = document.getElementById('logout-btn');
    const sourceTemplate = document.getElementById('source-template');

    // State
    let isProcessing = false;

    // Check Authentication (GET /api/auth/me/)
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/me/', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                // If unauthorized, redirect to login
                window.location.href = 'login.html';
            } else {
                const data = await response.json();
                if (data.username) {
                    document.getElementById('user-name').textContent = data.username;
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Optionally redirect on network error, or just let it be handled by subsequent requests
        }
    }
    
    // Call immediately
    checkAuth();

    // Event Listeners
    
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Enable/disable send button
        if (this.value.trim() && !isProcessing) {
            sendBtn.disabled = false;
        } else {
            sendBtn.disabled = true;
        }
    });

    // Handle Enter key
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim() && !isProcessing) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Handle Form Submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const question = chatInput.value.trim();
        if (!question || isProcessing) return;
        
        await submitQuestion(question);
    });

    // Handle Suggested Questions
    if (suggestedQuestions) {
        suggestedQuestions.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-btn')) {
                const question = e.target.textContent;
                submitQuestion(question);
            }
        });
    }

    // Handle Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
        }
    });

    // Core Chat Logic
    async function submitQuestion(question) {
        // Hide suggestions once chat starts
        if (suggestedQuestions && suggestedQuestions.parentNode) {
            suggestedQuestions.parentNode.removeChild(suggestedQuestions);
        }
        
        // Reset input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;
        isProcessing = true;
        
        // Add User Message
        appendMessage(question, 'user');
        
        // Add Loading Message
        const loadingId = appendLoadingMessage();
        
        try {
            // POST /api/chat/
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: question })
            });
            
            if (response.status === 401 || response.status === 403) {
                window.location.href = 'login.html';
                return;
            }
            
            // Remove loading
            removeMessage(loadingId);
            
            if (!response.ok) {
                throw new Error('Server returned error');
            }
            
            const data = await response.json();
            
            if (data.success || data.answer) {
                appendMessage(data.answer, 'ai', data.sources);
            } else {
                appendMessage("I'm sorry, I encountered an error processing your request.", 'ai');
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            removeMessage(loadingId);
            appendMessage("Sorry, I'm unable to connect to the server right now. Please try again later.", 'ai');
        } finally {
            isProcessing = false;
            chatInput.focus();
        }
    }

    function appendMessage(text, sender, sources = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        let avatarSvg = '';
        if (sender === 'user') {
            avatarSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        } else {
            avatarSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2H4a2 2 0 0 1-2-2v-1H1a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1V6a2 2 0 0 1 2-2h2V2a2 2 0 0 1 2-2h4z"></path></svg>`;
        }

        // Format text (simple markdown to HTML for paragraphs and lists)
        let formattedText = escapeHtml(text);
        
        // Handle basic bold
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Split into paragraphs based on double newlines
        const paragraphs = formattedText.split(/\n\n+/);
        let htmlContent = '';
        
        paragraphs.forEach(p => {
            // Check for list items (lines starting with - or *)
            if (p.trim().match(/^[-\*]\s/m) || p.trim().match(/^\d+\.\s/m)) {
                const lines = p.split('\n');
                let inUl = false;
                let inOl = false;
                
                lines.forEach(line => {
                    const ulMatch = line.trim().match(/^[-\*]\s(.*)/);
                    const olMatch = line.trim().match(/^\d+\.\s(.*)/);
                    
                    if (ulMatch) {
                        if (!inUl) { htmlContent += '<ul>'; inUl = true; }
                        htmlContent += `<li>${ulMatch[1]}</li>`;
                    } else if (olMatch) {
                        if (!inOl) { htmlContent += '<ol>'; inOl = true; }
                        htmlContent += `<li>${olMatch[1]}</li>`;
                    } else {
                        if (inUl) { htmlContent += '</ul>'; inUl = false; }
                        if (inOl) { htmlContent += '</ol>'; inOl = false; }
                        htmlContent += `<p>${line}</p>`;
                    }
                });
                
                if (inUl) htmlContent += '</ul>';
                if (inOl) htmlContent += '</ol>';
            } else {
                // Regular paragraph with <br> for single newlines
                htmlContent += `<p>${p.replace(/\n/g, '<br>')}</p>`;
            }
        });

        let sourcesHtml = '';
        if (sources && sources.length > 0) {
            sourcesHtml = `<div class="sources-container">
                <div class="sources-title">Sources</div>
                <div class="source-cards">`;
                
            sources.forEach(source => {
                const docName = escapeHtml(source.document || 'Unknown');
                const pageNum = escapeHtml(String(source.page || ''));
                
                sourcesHtml += `
                    <div class="source-card">
                        <div class="source-icon">📄</div>
                        <div class="source-info">
                            <div class="source-name">${docName}</div>
                            ${pageNum ? `<div class="source-page">Page ${pageNum}</div>` : ''}
                        </div>
                    </div>`;
            });
            
            sourcesHtml += `</div></div>`;
        }

        messageDiv.innerHTML = `
            <div class="avatar ${sender}-avatar">
                ${avatarSvg}
            </div>
            <div class="message-content">
                ${htmlContent}
                ${sourcesHtml}
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function appendLoadingMessage() {
        const id = 'loading-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ai-message`;
        messageDiv.id = id;
        
        messageDiv.innerHTML = `
            <div class="avatar ai-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2H4a2 2 0 0 1-2-2v-1H1a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1V6a2 2 0 0 1 2-2h2V2a2 2 0 0 1 2-2h4z"></path></svg>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        return id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
