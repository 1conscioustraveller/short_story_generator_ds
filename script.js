document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const generateBtn = document.getElementById('generate-btn');
    const promptInput = document.getElementById('prompt');
    const openaiKeyInput = document.getElementById('openai-key');
    const ttsKeyInput = document.getElementById('tts-key');
    const languageSelect = document.getElementById('language');
    const storyContainer = document.querySelector('.story-container');
    const loadingElement = document.querySelector('.loading');
    const englishText = document.getElementById('english-text');
    const spanishText = document.getElementById('spanish-text');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageCounter = document.getElementById('page-counter');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const playButtons = document.querySelectorAll('.play-btn');

    // Story data
    let currentStory = {
        english: [],
        spanish: []
    };
    let currentPage = 0;
    let audioElements = { en: null, es: null };

    // Apply light theme by default
    document.body.classList.add('light');

    // Theme switcher
    themeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove all theme classes
            document.body.classList.remove('light', 'dark', 'sepia', 'blue');
            // Add selected theme
            document.body.classList.add(this.dataset.theme);
        });
    });

    // Generate story
    generateBtn.addEventListener('click', async function() {
        const prompt = promptInput.value.trim();
        const openaiKey = openaiKeyInput.value.trim();
        const ttsKey = ttsKeyInput.value.trim();
        const language = languageSelect.value;

        if (!prompt) {
            alert('Please enter a story idea!');
            return;
        }

        if (!openaiKey) {
            alert('Please enter your OpenAI API key!');
            return;
        }

        // Show loading, hide story
        loadingElement.classList.remove('hidden');
        storyContainer.classList.add('hidden');

        try {
            // Generate story with OpenAI
            const generatedStory = await generateStory(prompt, openaiKey, language);
            
            // Parse the response
            const parsedStory = parseStoryResponse(generatedStory);
            
            // Update current story
            currentStory = {
                english: parsedStory.english || [],
                spanish: parsedStory.spanish || []
            };
            
            // Reset page navigation
            currentPage = 0;
            updatePageNavigation();
            
            // Show story, hide loading
            storyContainer.classList.remove('hidden');
            loadingElement.classList.add('hidden');
            
            // Generate TTS for each page (if TTS key provided)
            if (ttsKey) {
                await generateTTSForStory(currentStory, ttsKey);
            }
        } catch (error) {
            console.error('Error generating story:', error);
            alert('Error generating story. Please check your API keys and try again.');
            loadingElement.classList.add('hidden');
        }
    });

    // Page navigation
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 0) {
            currentPage--;
            updatePageNavigation();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < Math.max(currentStory.english.length, currentStory.spanish.length) - 1) {
            currentPage++;
            updatePageNavigation();
        }
    });

    // Play audio buttons
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const lang = this.dataset.lang;
            if (audioElements[lang] && audioElements[lang][currentPage]) {
                // Stop any currently playing audio
                Object.values(audioElements).forEach(audioArray => {
                    if (Array.isArray(audioArray)) {
                        audioArray.forEach(audio => {
                            if (audio) audio.pause();
                        });
                    }
                });
                
                // Play the selected audio
                audioElements[lang][currentPage].currentTime = 0;
                audioElements[lang][currentPage].play();
            }
        });
    });

    // Update page content and navigation
    function updatePageNavigation() {
        // Update page content
        englishText.textContent = currentStory.english[currentPage] || 'No English content for this page';
        spanishText.textContent = currentStory.spanish[currentPage] || 'No Spanish content for this page';
        
        // Update page counter
        const totalPages = Math.max(currentStory.english.length, currentStory.spanish.length);
        pageCounter.textContent = `Page ${currentPage + 1} of ${totalPages}`;
        
        // Update button states
        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = currentPage === totalPages - 1;
    }

    // Generate story with OpenAI
    async function generateStory(prompt, apiKey, language) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a children's story generator. Create a simple, engaging story based on the user's prompt. 
                        The story should be appropriate for children aged 6-10. 
                        Provide the story in both English and Spanish, formatted as a JSON object with "english" and "spanish" arrays.
                        Each array should contain the story split into 1-2 sentence pages (maximum 10 pages).
                        Use simple vocabulary and short sentences. Make it fun and educational.`
                    },
                    {
                        role: "user",
                        content: `Story idea: ${prompt}`
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Parse the story response
    function parseStoryResponse(response) {
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(response);
            
            // Ensure we have the expected structure
            if (parsed.english && parsed.spanish) {
                // Limit to 10 pages max
                return {
                    english: parsed.english.slice(0, 10),
                    spanish: parsed.spanish.slice(0, 10)
                };
            }
            
            // If structure is unexpected, try to handle it
            return fallbackParse(response);
        } catch (e) {
            // If JSON parsing fails, try to handle it
            return fallbackParse(response);
        }
    }

    // Fallback parsing for when JSON parsing fails
    function fallbackParse(text) {
        // This is a simple fallback - in a real app you'd want more robust parsing
        const english = [];
        const spanish = [];
        
        // Split into paragraphs and take first 10
        const paragraphs = text.split('\n\n').slice(0, 10);
        
        // Simple approach - just use the same text for both languages
        // In a real app, you'd want better language detection
        paragraphs.forEach(para => {
            english.push(para);
            spanish.push(para); // In reality, you'd want actual translation
        });
        
        return { english, spanish };
    }

    // Generate TTS for the entire story
    async function generateTTSForStory(story, apiKey) {
        // Reset audio elements
        audioElements = { en: [], es: [] };
        
        // Generate English TTS
        for (let i = 0; i < story.english.length; i++) {
            if (story.english[i]) {
                const audioUrl = await generateTTS(story.english[i], 'en', apiKey);
                if (audioUrl) {
                    const audio = new Audio(audioUrl);
                    audioElements.en.push(audio);
                } else {
                    audioElements.en.push(null);
                }
            }
        }
        
        // Generate Spanish TTS
        for (let i = 0; i < story.spanish.length; i++) {
            if (story.spanish[i]) {
                const audioUrl = await generateTTS(story.spanish[i], 'es', apiKey);
                if (audioUrl) {
                    const audio = new Audio(audioUrl);
                    audioElements.es.push(audio);
                } else {
                    audioElements.es.push(null);
                }
            }
        }
    }

    // Generate TTS for a single page
    async function generateTTS(text, language, apiKey) {
        // Note: This is a placeholder - Gemini TTS API implementation would go here
        // In a real implementation, you would call the actual TTS API
        console.log(`Generating TTS for: ${text} (${language})`);
        
        // For demo purposes, we'll just return null
        return null;
        
        // Actual implementation might look like:
        /*
        try {
            const response = await fetch('https://api.gemini-tts.com/v1/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    text: text,
                    language: language,
                    voice: language === 'es' ? 'es-ES-Standard-A' : 'en-US-Standard-C'
                })
            });
            
            if (!response.ok) {
                console.error('TTS API error:', response.status);
                return null;
            }
            
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('TTS generation failed:', error);
            return null;
        }
        */
    }
});
