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

    // Also update top model pills if in entry state
    if (!this.outputState.classList.contains('hidden')) {
        // We're in output state, only update bottom
    } else {
        document.querySelectorAll('[name="ai-model"]').forEach(radio => {
            if (radio.value === model) {
                radio.checked = true;
            }
        });
    }
}

syncBottomInput() {
    if (this.bottomPromptInput) {
        this.bottomPromptInput.value = '';
    }

    // Sync model selection
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
    const originalText = this.bottomReframeBtn.innerHTML;
    this.bottomReframeBtn.disabled = true;
    this.bottomReframeBtn.textContent = 'Reframing...';

    try {
        await this.restructurePrompt(prompt, {});
    } catch (error) {
        this.showError('We couldn\\'t reframe your prompt right now.Try again in a moment.');
            console.error('Reframe error:', error);
    } finally {
        this.bottomReframeBtn.disabled = false;
        this.bottomReframeBtn.innerHTML = originalText;
    }
}

resetToEntry() {
    this.promptInput.value = '';
    this.state.currentPrompt = '';
    this.state.clarifications = {};
    this.state.currentOutput = null;
    this.showState('entry');
}

toggleInputExpansion() {
    // Deprecated function for old UI - keep for compatibility
}
