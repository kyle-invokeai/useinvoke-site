// Main JavaScript for AI Agent Orchestrator Web Interface

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const promptForm = document.getElementById('promptForm');
    const userPromptInput = document.getElementById('userPrompt');
    const conversationContainer = document.getElementById('conversation');
    const agentListContainer = document.getElementById('agent-list');
    const clearBtn = document.getElementById('clearBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const autoRouteSwitch = document.getElementById('autoRouteSwitch');
    const selectedAgentBadge = document.getElementById('selectedAgentBadge');
    const agentNameSpan = document.getElementById('agentName');
    const clearAgentBtn = document.getElementById('clearAgentBtn');
    
    // State
    let selectedAgent = null;
    let agentList = [];
    
    // Initialize
    fetchAgents();
    
    // Event listeners
    promptForm.addEventListener('submit', handlePromptSubmit);
    clearBtn.addEventListener('click', clearConversation);
    clearAgentBtn.addEventListener('click', clearSelectedAgent);
    
    // Auto-focus the prompt input
    userPromptInput.focus();
    
    // Handle form submission
    async function handlePromptSubmit(e) {
        e.preventDefault();
        
        const userPrompt = userPromptInput.value.trim();
        if (!userPrompt) return;
        
        // Add user message to conversation
        addMessage('user', userPrompt);
        
        // Clear input and show loading state
        userPromptInput.value = '';
        setLoadingState(true);
        
        try {
            // Determine if we should use auto-routing or selected agent
            const useAutoRoute = autoRouteSwitch.checked;
            const requestBody = {
                prompt: userPrompt
            };
            
            if (!useAutoRoute && selectedAgent) {
                requestBody.agent = selectedAgent;
            }
            
            // Send the request to the API
            const response = await fetch('/api/prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            // Add agent response to conversation
            addMessage('agent', data.response, data.agent);
        } catch (error) {
            console.error('Error:', error);
            addMessage('system', 'An error occurred while processing your request.');
        } finally {
            setLoadingState(false);
        }
    }
    
    // Add a message to the conversation
    function addMessage(type, content, agentName = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        
        let messageContent = '';
        
        if (type === 'agent' && agentName) {
            messageContent += `<div class="agent-badge">${agentName}</div>`;
        }
        
        if (type === 'agent') {
            // Parse markdown in agent responses
            messageContent += `<div class="agent-content">${marked.parse(content)}</div>`;
        } else {
            messageContent += `<p>${content}</p>`;
        }
        
        // Add timestamp
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageContent += `<div class="message-time">${timeStr}</div>`;
        
        messageDiv.innerHTML = messageContent;
        conversationContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
    }
    
    // Fetch available agents
    async function fetchAgents() {
        try {
            const response = await fetch('/api/agents');
            const data = await response.json();
            
            agentList = data.agents;
            
            // Clear loading state
            agentListContainer.innerHTML = '';
            
            // Add each agent to the list
            agentList.forEach(agent => {
                const agentItem = document.createElement('a');
                agentItem.className = 'list-group-item list-group-item-action agent-list-item';
                agentItem.textContent = `${agent.name}`;
                agentItem.dataset.keyword = agent.keyword;
                
                // Add click handler
                agentItem.addEventListener('click', () => {
                    selectAgent(agent.keyword, agent.name);
                });
                
                agentListContainer.appendChild(agentItem);
            });
        } catch (error) {
            console.error('Error fetching agents:', error);
            agentListContainer.innerHTML = '<div class="text-center p-3">Failed to load agents</div>';
        }
    }
    
    // Select an agent
    function selectAgent(keyword, name) {
        // Update UI
        selectedAgent = keyword;
        agentNameSpan.textContent = name;
        selectedAgentBadge.classList.remove('d-none');
        
        // Turn off auto-routing
        autoRouteSwitch.checked = false;
        
        // Update agent list UI
        const agentItems = document.querySelectorAll('.agent-list-item');
        agentItems.forEach(item => {
            if (item.dataset.keyword === keyword) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Clear selected agent
    function clearSelectedAgent() {
        selectedAgent = null;
        selectedAgentBadge.classList.add('d-none');
        
        // Turn on auto-routing
        autoRouteSwitch.checked = true;
        
        // Reset agent list UI
        const agentItems = document.querySelectorAll('.agent-list-item');
        agentItems.forEach(item => {
            item.classList.remove('active');
        });
    }
    
    // Clear conversation
    function clearConversation() {
        // Remove all messages except the welcome message
        const messages = conversationContainer.querySelectorAll('.user-message, .agent-message');
        messages.forEach(msg => msg.remove());
    }
    
    // Set loading state
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtnText.classList.add('d-none');
            loadingSpinner.classList.remove('d-none');
            userPromptInput.disabled = true;
        } else {
            submitBtnText.classList.remove('d-none');
            loadingSpinner.classList.add('d-none');
            userPromptInput.disabled = false;
            userPromptInput.focus();
        }
    }
});
