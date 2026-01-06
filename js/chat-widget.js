/**
 * Lightweight Chat Widget
 * - Predefined auto-replies for common questions
 * - Stores messages in localStorage
 * - Admin can reply from admin panel
 */

const ChatWidget = {
    isOpen: false,
    userId: null,
    
    // Predefined auto-replies (Admin can customize these)
    autoReplies: {
        greetings: {
            keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'assalamu', 'salam'],
            reply: "Hello! 👋 Welcome to Project Alpha. How can I help you today?\n\nYou can ask about:\n• Products & Investments\n• Deposits & Withdrawals\n• Account Issues\n• Referral Program"
        },
        products: {
            keywords: ['product', 'invest', 'plan', 'package', 'roi', 'return', 'profit'],
            reply: "We offer various investment products with attractive returns! 📈\n\nPlease visit our Products page to see all available options. Each product shows:\n• Minimum investment\n• Daily/Monthly returns\n• Duration\n\nNeed help choosing? Let me know your budget!"
        },
        deposit: {
            keywords: ['deposit', 'add money', 'fund', 'payment', 'pay', 'bkash', 'nagad', 'rocket'],
            reply: "To make a deposit: 💳\n\n1. Go to Dashboard → Wallet\n2. Click 'Deposit'\n3. Choose payment method\n4. Enter amount & submit\n\nMinimum deposit: ৳500\nPayments are processed within 5-30 minutes.\n\nNeed immediate help? An admin will respond soon!"
        },
        withdraw: {
            keywords: ['withdraw', 'cashout', 'cash out', 'withdrawal', 'money out', 'payout'],
            reply: "To withdraw your earnings: 💰\n\n1. Go to Dashboard → Wallet\n2. Click 'Withdraw'\n3. Enter amount & payment details\n4. Submit request\n\nMinimum withdrawal: ৳200\nProcessing time: 1-24 hours\n\nHaving issues? An admin will check your message!"
        },
        referral: {
            keywords: ['refer', 'referral', 'invite', 'friend', 'bonus', 'commission'],
            reply: "Our Referral Program: 🎁\n\n• Earn commission on every referral\n• Multi-level bonus structure\n• Instant credit to wallet\n\nFind your referral link in Dashboard → Referrals\n\nShare with friends and earn together!"
        },
        account: {
            keywords: ['account', 'login', 'password', 'forgot', 'reset', 'profile', 'register', 'signup'],
            reply: "Account Help: 🔐\n\n• Forgot password? Use 'Forgot Password' on login page\n• Update profile in Dashboard → Profile\n• Need account recovery? Please share your registered email\n\nAn admin will assist you shortly!"
        },
        task: {
            keywords: ['task', 'earn', 'work', 'youtube', 'social', 'daily'],
            reply: "Earning Tasks: 📋\n\n• Daily Tasks - Complete simple actions\n• YouTube Tasks - Watch & earn\n• Social Tasks - Follow & share\n\nAll tasks available in Dashboard → Tasks\n\nComplete tasks daily for maximum earnings!"
        },
        problem: {
            keywords: ['problem', 'issue', 'error', 'help', 'support', 'not working', 'stuck', 'failed'],
            reply: "I'm sorry you're facing an issue! 😟\n\nPlease describe your problem in detail:\n• What were you trying to do?\n• Any error message?\n• Your registered email/phone\n\nAn admin will respond as soon as possible!"
        },
        thanks: {
            keywords: ['thank', 'thanks', 'thx', 'appreciate', 'great', 'awesome', 'good'],
            reply: "You're welcome! 😊\n\nWe're always here to help. If you have any more questions, feel free to ask!\n\nHappy investing! 🚀"
        },
        bye: {
            keywords: ['bye', 'goodbye', 'see you', 'later', 'close'],
            reply: "Goodbye! 👋\n\nThank you for chatting with us. Have a great day!\n\nFeel free to come back anytime you need help."
        }
    },
    
    // Default reply when no match found
    defaultReply: "Thank you for your message! 📝\n\nOur team will review and respond shortly. Typical response time is 5-30 minutes during business hours.\n\nMeanwhile, you can check our FAQ or browse the dashboard for quick answers.",
    
    // Initialize chat widget
    init() {
        this.userId = this.getUserId();
        this.injectStyles();
        this.createWidget();
        this.loadMessages();
        this.checkUnreadReplies();
        this.startPolling(); // Start polling for admin replies
        this.registerUser(); // Register user in global list
    },
    
    // Register user in global chat list so admin can see them
    registerUser() {
        const allChats = JSON.parse(localStorage.getItem('allChatUsers') || '{}');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (!allChats[this.userId]) {
            allChats[this.userId] = {
                id: this.userId,
                name: currentUser.name || 'Guest User',
                email: currentUser.email || '',
                lastMessage: '',
                lastTime: new Date().toISOString(),
                unreadCount: 0,
                totalMessages: 0
            };
            localStorage.setItem('allChatUsers', JSON.stringify(allChats));
        }
    },
    
    // Get or create user ID
    getUserId() {
        let id = localStorage.getItem('chatUserId');
        if (!id) {
            id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chatUserId', id);
        }
        
        // If logged in, use actual user ID
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser.id) {
            return currentUser.id;
        }
        return id;
    },
    
    // Inject minimal CSS
    injectStyles() {
        if (document.getElementById('chat-widget-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'chat-widget-styles';
        styles.textContent = `
            .chat-widget-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: var(--primary-gradient);
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(99, 91, 255, 0.4);
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: all 0.3s ease;
            }
            .chat-widget-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 25px rgba(99, 91, 255, 0.5);
            }
            .chat-widget-btn .unread-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 22px;
                height: 22px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .chat-widget-container {
                position: fixed;
                bottom: 100px;
                right: 24px;
                width: 380px;
                height: 520px;
                background: var(--bg-primary);
                border-radius: 16px;
                box-shadow: 0 10px 50px rgba(0,0,0,0.2);
                z-index: 9999;
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid var(--border-color);
            }
            .chat-widget-container.open { display: flex; }
            .chat-header {
                background: var(--primary-gradient);
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .chat-header-info { display: flex; align-items: center; gap: 12px; }
            .chat-header-avatar {
                width: 40px;
                height: 40px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .chat-header-text h4 { font-size: 15px; font-weight: 600; margin: 0; }
            .chat-header-text span { font-size: 12px; opacity: 0.9; }
            .chat-close-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                background: var(--bg-secondary);
                align-items: flex-start;
            }
            .chat-message {
                max-width: 85%;
                padding: 8px 12px;
                border-radius: 12px;
                font-size: 14px;
                line-height: 1.4;
                white-space: pre-wrap;
                word-wrap: break-word;
                flex-shrink: 0;
            }
            .chat-message.user {
                background: var(--primary-gradient);
                color: white;
                margin-left: auto;
                border-bottom-right-radius: 4px;
            }
            .chat-message.bot, .chat-message.admin {
                background: var(--bg-primary);
                color: var(--text-primary);
                margin-right: auto;
                border-bottom-left-radius: 4px;
                border: 1px solid var(--border-color);
            }
            .chat-message.admin { border-left: 3px solid var(--primary-color); }
            .chat-message-time {
                font-size: 10px;
                opacity: 0.7;
                margin-top: 2px;
                display: block;
            }
            .chat-input-area {
                padding: 12px 16px;
                background: var(--bg-primary);
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 10px;
            }
            .chat-input {
                flex: 1;
                padding: 12px 16px;
                border: 1.5px solid var(--border-color);
                border-radius: 24px;
                font-size: 14px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                outline: none;
                transition: border-color 0.2s;
            }
            .chat-input:focus { border-color: var(--primary-color); }
            .chat-input::placeholder { color: var(--text-muted); }
            .chat-send-btn {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: var(--primary-gradient);
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s;
            }
            .chat-send-btn:hover { transform: scale(1.05); }
            .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
                background: var(--bg-primary);
                border-radius: 16px;
                border-bottom-left-radius: 4px;
                align-self: flex-start;
                border: 1px solid var(--border-color);
            }
            .typing-indicator span {
                width: 8px;
                height: 8px;
                background: var(--text-muted);
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                30% { transform: translateY(-4px); opacity: 1; }
            }
            .quick-replies {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 12px 16px;
                background: var(--bg-primary);
                border-top: 1px solid var(--border-color);
            }
            .quick-reply-btn {
                padding: 8px 14px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 20px;
                font-size: 12px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s;
            }
            .quick-reply-btn:hover {
                border-color: var(--primary-color);
                color: var(--primary-color);
                background: var(--primary-light);
            }
            @media (max-width: 480px) {
                .chat-widget-container {
                    width: calc(100% - 20px);
                    height: calc(100% - 120px);
                    right: 10px;
                    bottom: 90px;
                    border-radius: 12px;
                }
                .chat-widget-btn { width: 54px; height: 54px; right: 16px; bottom: 16px; }
            }
        `;
        document.head.appendChild(styles);
    },
    
    // Create widget HTML
    createWidget() {
        const widget = document.createElement('div');
        widget.innerHTML = `
            <button class="chat-widget-btn" id="chatWidgetBtn" onclick="ChatWidget.toggle()">
                <i class="fas fa-comments"></i>
                <span class="unread-badge" id="chatUnreadBadge" style="display: none;">0</span>
            </button>
            <div class="chat-widget-container" id="chatContainer">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-header-avatar">
                            <i class="fas fa-headset"></i>
                        </div>
                        <div class="chat-header-text">
                            <h4>Support Chat</h4>
                            <span><i class="fas fa-circle" style="font-size: 8px; color: #10b981;"></i> Online</span>
                        </div>
                    </div>
                    <button class="chat-close-btn" onclick="ChatWidget.toggle()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="quick-replies" id="quickReplies">
                    <button class="quick-reply-btn" onclick="ChatWidget.sendQuickReply('Products & Plans')">Products & Plans</button>
                    <button class="quick-reply-btn" onclick="ChatWidget.sendQuickReply('How to deposit?')">How to deposit?</button>
                    <button class="quick-reply-btn" onclick="ChatWidget.sendQuickReply('Withdrawal help')">Withdrawal help</button>
                    <button class="quick-reply-btn" onclick="ChatWidget.sendQuickReply('I have a problem')">I have a problem</button>
                </div>
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Type your message..." onkeypress="if(event.key==='Enter')ChatWidget.send()">
                    <button class="chat-send-btn" onclick="ChatWidget.send()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(widget);
    },
    
    // Toggle chat window
    toggle() {
        const container = document.getElementById('chatContainer');
        this.isOpen = !this.isOpen;
        container.classList.toggle('open', this.isOpen);
        
        if (this.isOpen) {
            document.getElementById('chatInput').focus();
            this.markAsRead();
            this.scrollToBottom();
            
            // Show welcome message if first time
            const messages = this.getMessages();
            if (messages.length === 0) {
                this.addMessage('bot', "Hello! 👋 Welcome to Project Alpha Support.\n\nI'm here to help you 24/7. Ask me anything about:\n• Products & Investments\n• Deposits & Withdrawals\n• Account & Profile\n• Tasks & Earnings\n\nOr just type your question!");
            }
        }
    },
    
    // Send message
    send() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;
        
        input.value = '';
        this.addMessage('user', text);
        this.saveMessage('user', text);
        
        // Hide quick replies after first message
        document.getElementById('quickReplies').style.display = 'none';
        
        // Show typing indicator
        this.showTyping();
        
        // Find auto-reply or use default
        setTimeout(() => {
            this.hideTyping();
            const reply = this.getAutoReply(text);
            this.addMessage('bot', reply);
            this.saveMessage('bot', reply);
        }, 1000 + Math.random() * 1000);
    },
    
    // Send quick reply
    sendQuickReply(text) {
        document.getElementById('chatInput').value = text;
        this.send();
    },
    
    // Get auto-reply based on keywords
    getAutoReply(message) {
        const lowerMessage = message.toLowerCase();
        
        for (const category in this.autoReplies) {
            const { keywords, reply } = this.autoReplies[category];
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return reply;
            }
        }
        
        return this.defaultReply;
    },
    
    // Sanitize HTML to prevent XSS attacks
    sanitizeHTML(str) {
        if (!str) return '';
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },
    
    // Add message to UI
    addMessage(type, text, time = null) {
        const container = document.getElementById('chatMessages');
        const messageTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Sanitize text to prevent XSS
        const sanitizedText = this.sanitizeHTML(text);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.innerHTML = `
            ${sanitizedText}
            <span class="chat-message-time">${type === 'admin' ? '👤 Admin • ' : ''}${messageTime}</span>
        `;
        container.appendChild(messageDiv);
        this.scrollToBottom();
    },
    
    // Show typing indicator
    showTyping() {
        const container = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(typingDiv);
        this.scrollToBottom();
    },
    
    // Hide typing indicator
    hideTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    },
    
    // Scroll to bottom
    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    },
    
    // Save message to localStorage
    saveMessage(type, text) {
        const messages = this.getMessages();
        messages.push({
            id: Date.now(),
            type,
            text,
            time: new Date().toISOString(),
            userId: this.userId,
            read: type === 'user'
        });
        localStorage.setItem('chatMessages_' + this.userId, JSON.stringify(messages));
        
        // Also save to global chat list for admin
        this.updateGlobalChatList();
    },
    
    // Get messages from localStorage
    getMessages() {
        return JSON.parse(localStorage.getItem('chatMessages_' + this.userId) || '[]');
    },
    
    // Load messages to UI
    loadMessages() {
        const messages = this.getMessages();
        messages.forEach(msg => {
            const time = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.addMessage(msg.type, msg.text, time);
        });
        
        if (messages.length > 0) {
            document.getElementById('quickReplies').style.display = 'none';
        }
    },
    
    // Check for unread admin replies
    checkUnreadReplies() {
        const messages = this.getMessages();
        const unread = messages.filter(m => m.type === 'admin' && !m.read).length;
        const badge = document.getElementById('chatUnreadBadge');
        
        if (unread > 0) {
            badge.textContent = unread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },
    
    // Poll for new admin messages
    startPolling() {
        this.lastMessageCount = this.getMessages().length;
        
        setInterval(() => {
            const messages = this.getMessages();
            if (messages.length > this.lastMessageCount) {
                // New message arrived (from admin)
                const newMessages = messages.slice(this.lastMessageCount);
                newMessages.forEach(msg => {
                    if (msg.type === 'admin') {
                        const time = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        this.addMessage('admin', msg.text, time);
                    }
                });
                this.lastMessageCount = messages.length;
                this.checkUnreadReplies();
            }
        }, 2000); // Check every 2 seconds
    },
    
    // Mark messages as read
    markAsRead() {
        const messages = this.getMessages();
        messages.forEach(m => m.read = true);
        localStorage.setItem('chatMessages_' + this.userId, JSON.stringify(messages));
        document.getElementById('chatUnreadBadge').style.display = 'none';
    },
    
    // Update global chat list for admin
    updateGlobalChatList() {
        const allChats = JSON.parse(localStorage.getItem('allChatUsers') || '{}');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const messages = this.getMessages();
        const lastMessage = messages[messages.length - 1];
        
        allChats[this.userId] = {
            id: this.userId,
            name: currentUser.name || 'Guest User',
            email: currentUser.email || '',
            lastMessage: lastMessage?.text?.substring(0, 50) + '...' || '',
            lastTime: lastMessage?.time || new Date().toISOString(),
            unreadCount: messages.filter(m => m.type === 'user' && !m.adminRead).length,
            totalMessages: messages.length
        };
        
        localStorage.setItem('allChatUsers', JSON.stringify(allChats));
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChatWidget.init());
} else {
    ChatWidget.init();
}
