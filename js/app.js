// ================================
// Reframe V1 - Application Logic
// ================================

class ReframeApp {
    constructor() {
        this.state = {
            currentPrompt: '',
            selectedModel: 'chatgpt',
            clarifications: {},
            isAuthenticated: false,
            userData: null,
            savedPrompts: [],
            currentOutput: null
        };

        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.checkAuthStatus();
    }

    cacheElements() {
        // States
        this.entryState = document.getElementById('entryState');
        this.clarificationState = document.getElementById('clarificationState');
        this.outputState = document.getElementById('outputState');

        // Entry state elements
        this.promptInput = document.getElementById('promptInput');
        this.modelPills = document.getElementById('modelPills');
        this.reframeBtn = document.getElementById('reframeBtn');

        // Clarification state elements
        this.inputSummary = document.getElementById('inputSummary');
        this.clarificationForm = document.getElementById('clarificationForm');
        this.reframeWithAnswersBtn = document.getElementById('reframeWithAnswersBtn');
        this.skipLink = document.getElementById('skipLink');

        // Output state elements (new glassmorphism UI)
        this.originalPromptBubble = document.getElementById('originalPromptBubble');
        this.outputTitle = document.getElementById('outputTitle');
        this.outputContent = document.getElementById('outputContent');
        this.copyBtn = document.getElementById('copyBtn');
        this.saveBtn = document.getElementById('saveBtn');

        // Bottom input panel elements
        this.bottomPromptInput = document.getElementById('bottomPromptInput');
        this.bottomModelPills = document.getElementById('bottomModelPills');
        this.bottomReframeBtn = document.getElementById('bottomReframeBtn');

        // Auth elements
        this.loginBtn = document.getElementById('loginBtn');
        this.userProfile = document.getElementById('userProfile');
        this.authModal = document.getElementById('authModal');
        this.modalClose = document.getElementById('modalClose');
        this.googleAuthBtn = document.getElementById('googleAuthBtn');

        // Saved prompts
        this.savedPromptsSection = document.getElementById('savedPromptsSection');
        this.savedPromptsGrid = document.getElementById('savedPromptsGrid');
        this.emptyState = document.getElementById('emptyState');

        // Utilities
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    attachEventListeners() {
        // Model selector
        this.modelPills.addEventListener('click', (e) => {
            if (e.target.classList.contains('pill')) {
                this.selectModel(e.target.dataset.model);
            }
        });

        // Reframe button
        this.reframeBtn.addEventListener('click', () => this.handleReframe());

        // Clarification actions
        this.reframeWithAnswersBtn.addEventListener('click', () => this.handleReframeWithAnswers());
        this.skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSkipClarifications();
        });

        // Output actions (glassmorphism UI)
        this.copyBtn.addEventListener('click', () => this.handleCopy());
        this.saveBtn.addEventListener('click', () => this.handleSave());

        // Bottom panel actions
        if (this.bottomPromptInput) {
            this.bottomPromptInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    this.handleBottomReframe();
                }
            });
        }

        if (this.bottomModelPills) {
            this.bottomModelPills.addEventListener('click', (e) => {
                const pill = e.target.closest('.bottom-pill');
                if (pill) {
                    const model = pill.dataset.model;
                    this.selectBottomModel(model);
                }
            });
        }

        if (this.bottomReframeBtn) {
            this.bottomReframeBtn.addEventListener('click', () => this.handleBottomReframe());
        }

        // Auth actions
        this.loginBtn.addEventListener('click', () => this.showAuthModal());
        this.modalClose.addEventListener('click', () => this.hideAuthModal());
        this.authModal.addEventListener('click', (e) => {
            if (e.target === this.authModal) this.hideAuthModal();
        });
        this.googleAuthBtn.addEventListener('click', () => this.handleGoogleAuth());
    }

    // ================================
    // State Management
    // ================================

    selectModel(model) {
        this.state.selectedModel = model;

        // Update UI
        document.querySelectorAll('.pill').forEach(pill => {
            pill.classList.remove('active');
        });
        document.querySelector(`[data-model="${model}"]`).classList.add('active');
    }

    showState(stateName) {
        this.entryState.classList.add('hidden');
        this.clarificationState.classList.add('hidden');
        this.outputState.classList.add('hidden');

        if (stateName === 'entry') {
            this.entryState.classList.remove('hidden');
            // Show saved prompts only in entry state
            if (this.state.isAuthenticated && this.savedPromptsSection) {
                this.savedPromptsSection.classList.remove('hidden');
            }
        } else {
            // Hide saved prompts in clarification and output states
            if (this.savedPromptsSection) {
                this.savedPromptsSection.classList.add('hidden');
            }
        }

        if (stateName === 'clarification') this.clarificationState.classList.remove('hidden');
        if (stateName === 'output') this.outputState.classList.remove('hidden');
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.reframeBtn.disabled = true;
            this.reframeBtn.querySelector('.btn-text').textContent = 'Reframing...';
        } else {
            this.reframeBtn.disabled = false;
            this.reframeBtn.querySelector('.btn-text').textContent = 'Reframe';
        }
    }

    // ================================
    // Core Functionality
    // ================================

    async handleReframe() {
        const prompt = this.promptInput.value.trim();

        if (!prompt) {
            this.showToast('Please enter a prompt to reframe');
            return;
        }

        this.state.currentPrompt = prompt;
        this.setLoading(true);

        try {
            // Check for ambiguity
            const ambiguityCheck = await this.checkAmbiguity(prompt);

            if (ambiguityCheck.hasAmbiguity && ambiguityCheck.questions.length > 0) {
                this.showClarificationState(prompt, ambiguityCheck.questions);
            } else {
                await this.restructurePrompt(prompt, {});
            }
        } catch (error) {
            this.showError("We couldn't reframe your prompt right now. Try again in a moment.");
            console.error('Reframe error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    async checkAmbiguity(prompt) {
        // Call backend API to check for ambiguity
        // For now, return mock data
        return {
            hasAmbiguity: false,
            questions: []
        };

        // Actual implementation:
        // const response = await fetch('/api/check-ambiguity', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ prompt })
        // });
        // return await response.json();
    }

    showClarificationState(prompt, questions) {
        this.inputSummary.textContent = prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '');

        // Clear previous questions
        this.clarificationForm.innerHTML = '';

        // Render questions (max 3)
        questions.slice(0, 3).forEach((q, index) => {
            const questionGroup = document.createElement('div');
            questionGroup.className = 'question-group';

            const label = document.createElement('label');
            label.className = 'question-label';
            label.textContent = q.question;

            if (q.type === 'radio' && q.options) {
                const radioGroup = document.createElement('div');
                radioGroup.className = 'radio-group';

                q.options.forEach(option => {
                    const radioOption = document.createElement('label');
                    radioOption.className = 'radio-option';

                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = `question_${index}`;
                    input.value = option;

                    radioOption.appendChild(input);
                    radioOption.appendChild(document.createTextNode(option));
                    radioGroup.appendChild(radioOption);
                });

                questionGroup.appendChild(label);
                questionGroup.appendChild(radioGroup);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'question-input';
                input.name = `question_${index}`;
                input.placeholder = 'Your answer...';

                questionGroup.appendChild(label);
                questionGroup.appendChild(input);
            }

            this.clarificationForm.appendChild(questionGroup);
        });

        this.showState('clarification');
    }

    async handleReframeWithAnswers() {
        const formData = new FormData(this.clarificationForm);
        const clarifications = {};

        for (let [key, value] of formData.entries()) {
            clarifications[key] = value;
        }

        this.state.clarifications = clarifications;
        await this.restructurePrompt(this.state.currentPrompt, clarifications);
    }

    async handleSkipClarifications() {
        await this.restructurePrompt(this.state.currentPrompt, {});
    }

    async restructurePrompt(prompt, clarifications) {
        try {
            const response = await fetch('http://localhost:3000/api/reframe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    raw_prompt: prompt,
                    model: this.state.selectedModel,
                    clarifications: clarifications
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            // Handle new JSON response format - pass both prompt and full data
            this.showOutputState(prompt, data.reframed ? data : data.restructured_prompt || prompt, data.reframed !== undefined);

        } catch (error) {
            // Fallback: show original prompt with error notice
            this.showOutputState(prompt, prompt, true);
            console.error('Restructure error:', error);
        }
    }

    showOutputState(originalPrompt, responseData, isNewFormat = false) {
        // Set original prompt bubble
        if (this.originalPromptBubble) {
            this.originalPromptBubble.textContent = originalPrompt;
        }

        let output, apiReady;

        // Handle new JSON format or old format
        if (isNewFormat && typeof responseData === 'object' && responseData.reframed) {
            output = responseData.reframed.raw || '';
            apiReady = responseData.reframed.api_ready;
        } else if (typeof responseData === 'string') {
            output = responseData;
            apiReady = null;
        } else {
            // Fallback for plain text or old format
            output = responseData.restructured_prompt || responseData.reframed?.raw || String(responseData);
            apiReady = null;
        }

        // Set output content - Always show the enhanced prompt text
        if (this.outputContent) {
            // Always display the readable enhanced prompt text
            this.outputContent.textContent = output;
            this.outputContent.style.fontFamily = '';
            this.outputContent.style.whiteSpace = '';
        }

        // Store current output (for copy functionality)
        this.state.currentOutput = {
            original: originalPrompt,
            restructured: apiReady ? JSON.stringify(apiReady, null, 2) : output,
            model: this.state.selectedModel,
            timestamp: new Date().toISOString(),
            apiReady: apiReady
        };

        // Show state
        this.showState('output');

        // Sync bottom input with current state
        this.syncBottomInput();
    }

    selectBottomModel(model) {
        this.state.selectedModel = model;

        // Update bottom pills UI
        const pills = this.bottomModelPills.querySelectorAll('.bottom-pill');
        pills.forEach(pill => {
            if (pill.dataset.model === model) {
                pill.className = 'bottom-pill px-4 py-1.5 rounded-full border border-primary bg-primary/10 text-xs font-bold text-primary shadow-sm shadow-primary/10 transition-all';
            } else {
                pill.className = 'bottom-pill px-4 py-1.5 rounded-full bg-white/50 border border-gray-200/60 hover:border-primary/50 text-xs font-medium text-gray-600 hover:bg-primary/5 hover:text-primary transition-all';
            }
        });
    }

    syncBottomInput() {
        if (this.bottomPromptInput) {
            this.bottomPromptInput.value = '';
        }

        // Sync model selection with bottom pills
        if (this.bottomModelPills) {
            const pills = this.bottomModelPills.querySelectorAll('.bottom-pill');
            pills.forEach(pill => {
                if (pill.dataset.model === this.state.selectedModel) {
                    pill.className = 'bottom-pill px-4 py-1.5 rounded-full border border-primary bg-primary/10 text-xs font-bold text-primary shadow-sm shadow-primary/10 transition-all';
                } else {
                    pill.className = 'bottom-pill px-4 py-1.5 rounded-full bg-white/50 border border-gray-200/60 hover:border-primary/50 text-xs font-medium text-gray-600 hover:bg-primary/5 hover:text-primary transition-all';
                }
            });
        }
    }

    async handleBottomReframe() {
        const prompt = this.bottomPromptInput.value.trim();

        if (!prompt) {
            this.showToast('Please enter a prompt to reframe');
            return;
        }

        this.state.currentPrompt = prompt;

        // Disable button during loading
        const originalHTML = this.bottomReframeBtn.innerHTML;
        this.bottomReframeBtn.disabled = true;
        this.bottomReframeBtn.textContent = 'Reframing...';

        try {
            await this.restructurePrompt(prompt, {});
        } catch (error) {
            this.showError("We couldn't reframe your prompt right now. Try again in a moment.");
            console.error('Reframe error:', error);
        } finally {
            this.bottomReframeBtn.disabled = false;
            this.bottomReframeBtn.innerHTML = originalHTML;
        }
    }

    toggleInputExpansion() {
        // Deprecated - kept for compatibility
    }

    async handleCopy() {
        try {
            await navigator.clipboard.writeText(this.outputContent.textContent);
            this.showToast('Copied to clipboard');
        } catch (error) {
            this.showToast('Failed to copy. Please try again.');
        }
    }

    async handleSave() {
        if (!this.state.isAuthenticated) {
            this.showAuthModal();
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/prompts/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state.currentOutput)
            });

            if (!response.ok) {
                throw new Error('Save failed');
            }

            this.saveBtn.classList.add('saved');
            document.getElementById('starIcon').setAttribute('fill', 'currentColor');
            this.showToast('Prompt saved');

            // Refresh saved prompts
            await this.loadSavedPrompts();

        } catch (error) {
            this.showToast('Failed to save. Please try again.');
            console.error('Save error:', error);
        }
    }

    resetToEntry() {
        this.promptInput.value = '';
        this.state.currentPrompt = '';
        this.state.clarifications = {};
        this.state.currentOutput = null;
        this.showState('entry');
    }

    // ================================
    // Authentication
    // ================================

    checkAuthStatus() {
        // Check if user is authenticated (from session/cookie)
        // For now, assume not authenticated
        const user = localStorage.getItem('reframe_user');

        if (user) {
            this.state.isAuthenticated = true;
            this.state.userData = JSON.parse(user);
            this.showAuthenticatedUI();
            this.loadSavedPrompts();
        }
    }

    showAuthModal() {
        this.authModal.classList.remove('hidden');
    }

    hideAuthModal() {
        this.authModal.classList.add('hidden');
    }

    async handleGoogleAuth() {
        // Redirect to backend OAuth endpoint
        try {
            // Store current state if needed
            if (this.state.currentOutput) {
                sessionStorage.setItem('pendingSave', JSON.stringify(this.state.currentOutput));
            }

            // Redirect to Google OAuth
            window.location.href = 'http://localhost:3000/api/auth/google';
        } catch (error) {
            this.showToast('Authentication failed. Please try again.');
            console.error('Auth error:', error);
        }
    }

    showAuthenticatedUI() {
        this.loginBtn.classList.add('hidden');
        this.userProfile.classList.remove('hidden');

        document.getElementById('userName').textContent = this.state.userData.name;
        document.getElementById('userAvatar').src = this.state.userData.avatar;

        this.savedPromptsSection.classList.remove('hidden');
    }

    async loadSavedPrompts() {
        try {
            const response = await fetch('http://localhost:3000/api/prompts');

            if (!response.ok) {
                throw new Error('Failed to load prompts');
            }

            const prompts = await response.json();
            this.state.savedPrompts = prompts;
            this.renderSavedPrompts(prompts);

        } catch (error) {
            console.error('Load prompts error:', error);
            // Show empty state on error
            this.renderSavedPrompts([]);
        }
    }

    renderSavedPrompts(prompts) {
        if (prompts.length === 0) {
            this.savedPromptsGrid.classList.add('hidden');
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.savedPromptsGrid.classList.remove('hidden');
        this.emptyState.classList.add('hidden');

        this.savedPromptsGrid.innerHTML = prompts.map(prompt => `
            <div class="saved-prompt-card" data-id="${prompt.id}">
                <div class="saved-prompt-title">${prompt.original.substring(0, 60)}...</div>
                <div class="saved-prompt-meta">
                    <span class="model-badge">${prompt.model}</span>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z"/>
                    </svg>
                </div>
            </div>
        `).join('');

        // Attach click listeners
        this.savedPromptsGrid.querySelectorAll('.saved-prompt-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const prompt = prompts.find(p => p.id === id);
                if (prompt) {
                    this.loadSavedPrompt(prompt);
                }
            });
        });
    }

    loadSavedPrompt(prompt) {
        this.showOutputState(prompt.original, prompt.restructured);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ================================
    // Utilities
    // ================================

    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.remove('hidden');

        setTimeout(() => {
            this.toast.classList.add('hidden');
        }, 3000);
    }

    showError(message) {
        this.showToast(message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.reframeApp = new ReframeApp();
});
