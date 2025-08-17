document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const readAloudBtn = document.getElementById('read-aloud-btn');
    const downloadBtn = document.getElementById('download-story-btn');
    const apiSettingsBtn = document.getElementById('api-settings-btn');
    const saveApiBtn = document.getElementById('save-api-btn');
    const closeApiBtn = document.getElementById('close-api-btn');
    const apiModal = document.getElementById('api-modal');
    const showSpanishCheckbox = document.getElementById('show-spanish');
    const enableTtsCheckbox = document.getElementById('enable-tts');
    const currentPageElement = document.getElementById('current-page');
    const pageIndicator = document.getElementById('page-indicator');
    
    // Story data
    let storyData = {
        english: [],
        spanish: [],
        currentPage: 0,
        totalPages: 0
    };
    
    // API keys
    let apiKeys = {
        openai: localStorage.getItem('openaiKey') || '',
        tts: localStorage.getItem('ttsKey') || ''
    };
    
    // Initialize
    document.getElementById('openai-key').value = apiKeys.openai;
    document.getElementById('tts-key').value = apiKeys.tts;
    
    // Event Listeners
    generateBtn.addEventListener('click', generateStory);
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    readAloudBtn.addEventListener('click', readCurrentPage);
    downloadBtn.addEventListener('click', downloadStory);
    apiSettingsBtn.addEventListener('click', openApiModal);
    saveApiBtn.addEventListener('click', saveApiKeys);
    closeApiBtn.addEventListener('click', closeApiModal);
    showSpanishCheckbox.addEventListener('change', toggleSpanishTranslation);
    
    // Functions
    async function generateStory() {
        const theme = document.getElementById('story-theme').value.trim();
        const character = document.getElementById('main-character').value.trim();
        
        if (!theme || !character) {
            alert('Please enter both a theme and main character');
            return;
        }
        
        if (!apiKeys.openai) {
            alert('Please enter your OpenAI API key in the settings');
            openApiModal();
            return;
        }
        
        generateBtn.disabled = true;
        generateBtn.textContent = 'Creating Magic...';
        
        try {
            const prompt = `Create a short children's story for ages 6-10 about ${character} with a theme of ${theme}. 
                The story should be 10-15 pages long with exactly 2 sentences per page. 
                Make it fun, educational, and appropriate for young readers. 
                Format the response as a JSON object with two arrays: "english" containing the English version and "spanish" containing the Spanish translation. 
                Each array should have exactly the same number of elements (one per page), with each element containing exactly 2 sentences.`;
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKeys.openai}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    response_format: { type: "json_object" }
                })
            });
            
            const data = await response.json();
            
            if (data.choices && data.choices[0].message.content) {
                const storyContent = JSON.parse(data.choices[0].message.content);
                
                storyData = {
                    english: storyContent.english || [],
                    spanish: storyContent.spanish || [],
                    currentPage: 0,
                    totalPages: Math.max(
                        storyContent.english?.length || 0, 
                        storyContent.spanish?.length || 0
                    )
                };
                
                displayCurrentPage();
                updateNavigation();
            } else {
                throw new Error('Unexpected response format from OpenAI');
            }
        } catch (error) {
            console.error('Error generating story:', error);
            alert('Failed to generate story. Please check your API key and try again.');
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Create Story';
        }
    }
    
    function displayCurrentPage() {
        if (storyData.totalPages === 0) {
            currentPageElement.innerHTML = '<p class="english-text">Your generated story will appear here, two sentences at a time.</p>';
            return;
        }
        
        const englishPage = storyData.english[storyData.currentPage] || "Page content not available";
        const spanishPage = storyData.spanish[storyData.currentPage] || "Contenido de página no disponible";
        
        currentPageElement.innerHTML = `
            <p class="english-text">${englishPage}</p>
            <p class="spanish-text ${showSpanishCheckbox.checked ? '' : 'hidden'}">${spanishPage}</p>
        `;
        
        pageIndicator.textContent = `Page ${storyData.currentPage + 1} of ${storyData.totalPages}`;
    }
    
    function goToPreviousPage() {
        if (storyData.currentPage > 0) {
            storyData.currentPage--;
            displayCurrentPage();
            updateNavigation();
        }
    }
    
    function goToNextPage() {
        if (storyData.currentPage < storyData.totalPages - 1) {
            storyData.currentPage++;
            displayCurrentPage();
            updateNavigation();
        }
    }
    
    function updateNavigation() {
        prevPageBtn.disabled = storyData.currentPage === 0;
        nextPageBtn.disabled = storyData.currentPage === storyData.totalPages - 1;
        readAloudBtn.disabled = storyData.totalPages === 0 || !enableTtsCheckbox.checked;
    }
    
    async function readCurrentPage() {
        if (!apiKeys.tts && enableTtsCheckbox.checked) {
            alert('Please enter your TTS API key in the settings to use this feature');
            openApiModal();
            return;
        }
        
        const englishText = storyData.english[storyData.currentPage] || "";
        
        // This is a placeholder for TTS API implementation
        // In a real implementation, you would call the Gemini TTS API or another TTS service
        console.log('Would read aloud:', englishText);
        alert('In a real implementation, this would use the TTS API to read the current page.');
    }
    
    function downloadStory() {
        if (storyData.totalPages === 0) {
            alert('No story to download. Please generate a story first.');
            return;
        }
        
        // Create a text version of the story
        let storyText = `Story about ${document.getElementById('main-character').value} - ${document.getElementById('story-theme').value}\n\n`;
        
        for (let i = 0; i < storyData.totalPages; i++) {
            storyText += `Page ${i + 1}:\n`;
            storyText += `English: ${storyData.english[i]}\n`;
            if (showSpanishCheckbox.checked) {
                storyText += `Spanish: ${storyData.spanish[i]}\n`;
            }
            storyText += '\n';
        }
        
        // Create download link
        const blob = new Blob([storyText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'childrens_story.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function toggleSpanishTranslation() {
        const spanishTextElements = document.querySelectorAll('.spanish-text');
        spanishTextElements.forEach(el => {
            el.classList.toggle('hidden', !showSpanishCheckbox.checked);
        });
    }
    
    function openApiModal() {
        apiModal.classList.add('active');
    }
    
    function closeApiModal() {
        apiModal.classList.remove('active');
    }
    
    function saveApiKeys() {
        apiKeys.openai = document.getElementById('openai-key').value.trim();
        apiKeys.tts = document.getElementById('tts-key').value.trim();
        
        localStorage.setItem('openaiKey', apiKeys.openai);
        localStorage.setItem('ttsKey', apiKeys.tts);
        
        closeApiModal();
    }
    
    // Initialize TTS checkbox change listener
    enableTtsCheckbox.addEventListener('change', updateNavigation);
});
