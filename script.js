document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const storyPrompt = document.getElementById('story-prompt');
    const languageSelect = document.getElementById('language');
    const dyslexiaToggle = document.getElementById('dyslexia-mode');
    const englishContent = document.getElementById('english-content');
    const spanishContent = document.getElementById('spanish-content');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageIndicator = document.getElementById('page-indicator');
    const playAudioBtn = document.getElementById('play-audio');
    const pauseAudioBtn = document.getElementById('pause-audio');
    const stopAudioBtn = document.getElementById('stop-audio');
    
    // Story data
    let currentStory = {
        english: [],
        spanish: [],
        currentPage: 0,
        totalPages: 0,
        englishAudioUrls: [], // Will store URLs to generated English TTS
        spanishAudioUrls: []  // Will store URLs to generated Spanish TTS
    };
    
    // Audio elements
    let englishAudio = new Audio();
    let spanishAudio = new Audio();
    let isPlaying = false;
    
    // API Configuration (Replace with your actual API keys)
    const OPENAI_API_KEY = 'your-openai-api-key'; // Replace with your OpenAI API key
    const GEMINI_TTS_API_KEY = 'your-gemini-tts-key'; // Replace with your Gemini TTS API key
    
    // Toggle dyslexia mode
    dyslexiaToggle.addEventListener('change', function() {
        document.body.classList.toggle('dyslexia-mode', this.checked);
    });
    
    // Generate story
    generateBtn.addEventListener('click', generateStory);
    
    // Navigation
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    
    // Audio controls
    playAudioBtn.addEventListener('click', playAudio);
    pauseAudioBtn.addEventListener('click', pauseAudio);
    stopAudioBtn.addEventListener('click', stopAudio);
    
    // Generate story function - INTEGRATE OPENAI API HERE
    async function generateStory() {
        const prompt = storyPrompt.value.trim();
        if (!prompt) {
            alert('Please enter a story idea!');
            return;
        }
        
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        
        try {
            // =============================================
            // OPENAI API INTEGRATION POINT - STORY GENERATION
            // =============================================
            const generatedStory = await generateStoryWithOpenAI(prompt);
            
            currentStory = {
                english: generatedStory.english,
                spanish: generatedStory.spanish,
                currentPage: 0,
                totalPages: generatedStory.english.length,
                englishAudioUrls: [],
                spanishAudioUrls: []
            };
            
            updateStoryDisplay();
            updateNavigation();
            
            // Generate TTS for all pages
            await generateAllTTS();
            
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Story';
        } catch (error) {
            console.error('Error generating story:', error);
            alert('Failed to generate story. Please try again.');
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Story';
        }
    }
    
    // =============================================
    // OPENAI API IMPLEMENTATION
    // =============================================
    async function generateStoryWithOpenAI(prompt) {
        // This is where you would call the OpenAI API
        // Example implementation (you'll need to adapt to your specific needs):
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: `You are a children's story generator. 
                                    Create a simple story in English and Spanish based on the user's prompt. 
                                    Split the story into 5 short paragraphs. 
                                    Return a JSON object with "english" and "spanish" arrays, 
                                    each containing the paragraphs.`
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            
            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // Parse the JSON response
            let storyData;
            try {
                storyData = JSON.parse(content);
            } catch (e) {
                // If the response isn't JSON, fall back to mock data
                console.warn("OpenAI didn't return valid JSON, using mock data");
                return mockAIStoryGeneration(prompt);
            }
            
            return storyData;
            
        } catch (error) {
            console.error("OpenAI API error:", error);
            // Fall back to mock data if API fails
            return mockAIStoryGeneration(prompt);
        }
    }
    
    // Mock story generation (fallback)
    async function mockAIStoryGeneration(prompt) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const englishStory = [
                    `Once upon a time, there was ${prompt}.`,
                    `At first, everyone thought this was very strange.`,
                    `But then something magical happened that changed everything.`,
                    `The ${prompt} became famous throughout the land.`,
                    `And they all lived happily ever after.`
                ];
                
                const spanishStory = [
                    `Había una vez ${prompt}.`,
                    `Al principio, todos pensaban que esto era muy extraño.`,
                    `Pero entonces algo mágico sucedió que lo cambió todo.`,
                    `El ${prompt} se hizo famoso en toda la tierra.`,
                    `Y todos vivieron felices para siempre.`
                ];
                
                resolve({
                    english: englishStory,
                    spanish: spanishStory
                });
            }, 500);
        });
    }
    
    // Update story display
    function updateStoryDisplay() {
        if (currentStory.totalPages === 0) return;
        
        englishContent.textContent = currentStory.english[currentStory.currentPage];
        spanishContent.textContent = currentStory.spanish[currentStory.currentPage];
        
        // Update audio sources if they exist
        if (currentStory.englishAudioUrls[currentStory.currentPage]) {
            englishAudio.src = currentStory.englishAudioUrls[currentStory.currentPage];
        }
        if (currentStory.spanishAudioUrls[currentStory.currentPage]) {
            spanishAudio.src = currentStory.spanishAudioUrls[currentStory.currentPage];
        }
    }
    
    // =============================================
    // GEMINI TTS API INTEGRATION POINT
    // =============================================
    async function generateAllTTS() {
        // Clear existing audio URLs
        currentStory.englishAudioUrls = [];
        currentStory.spanishAudioUrls = [];
        
        // Generate TTS for each page
        for (let i = 0; i < currentStory.totalPages; i++) {
            try {
                // Generate English TTS
                const englishAudioUrl = await generateTTSWithGemini(
                    currentStory.english[i], 
                    'en-US'
                );
                currentStory.englishAudioUrls.push(englishAudioUrl);
                
                // Generate Spanish TTS
                const spanishAudioUrl = await generateTTSWithGemini(
                    currentStory.spanish[i], 
                    'es-ES'
                );
                currentStory.spanishAudioUrls.push(spanishAudioUrl);
                
            } catch (error) {
                console.error(`Error generating TTS for page ${i}:`, error);
                // Push null if TTS generation fails
                currentStory.englishAudioUrls.push(null);
                currentStory.spanishAudioUrls.push(null);
            }
        }
    }
    
    // =============================================
    // GEMINI TTS API IMPLEMENTATION
    // =============================================
    async function generateTTSWithGemini(text, languageCode) {
        // This is where you would call the Gemini TTS API
        // Note: As of my knowledge cutoff, Gemini doesn't have a TTS API,
        // so you might need to use Google Cloud Text-to-Speech or another service
        
        // Example implementation (conceptual - you'll need to adapt to the actual API):
        try {
            const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GEMINI_TTS_API_KEY}`
                },
                body: JSON.stringify({
                    input: { text: text },
                    voice: {
                        languageCode: languageCode,
                        ssmlGender: 'FEMALE'
                    },
                    audioConfig: {
                        audioEncoding: 'MP3'
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`TTS API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Convert the base64 audio content to a blob URL
            const audioContent = data.audioContent;
            const binaryString = atob(audioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            return URL.createObjectURL(blob);
            
        } catch (error) {
            console.error("TTS API error:", error);
            // Return null if TTS generation fails
            return null;
        }
    }
    
    // Navigation functions
    function goToPreviousPage() {
        if (currentStory.currentPage > 0) {
            currentStory.currentPage--;
            updateStoryDisplay();
            updateNavigation();
        }
    }
    
    function goToNextPage() {
        if (currentStory.currentPage < currentStory.totalPages - 1) {
            currentStory.currentPage++;
            updateStoryDisplay();
            updateNavigation();
        }
    }
    
    function updateNavigation() {
        pageIndicator.textContent = `Page ${currentStory.currentPage + 1} of ${currentStory.totalPages}`;
        prevPageBtn.disabled = currentStory.currentPage === 0;
        nextPageBtn.disabled = currentStory.currentPage === currentStory.totalPages - 1;
    }
    
    // Audio control functions
    function playAudio() {
        if (currentStory.englishAudioUrls[currentStory.currentPage]) {
            englishAudio.play().catch(e => console.error("English audio error:", e));
        }
        if (currentStory.spanishAudioUrls[currentStory.currentPage]) {
            spanishAudio.play().catch(e => console.error("Spanish audio error:", e));
        }
        
        isPlaying = true;
        playAudioBtn.disabled = true;
        pauseAudioBtn.disabled = false;
        stopAudioBtn.disabled = false;
    }
    
    function pauseAudio() {
        englishAudio.pause();
        spanishAudio.pause();
        
        isPlaying = false;
        playAudioBtn.disabled = false;
        pauseAudioBtn.disabled = true;
        stopAudioBtn.disabled = false;
    }
    
    function stopAudio() {
        englishAudio.pause();
        englishAudio.currentTime = 0;
        spanishAudio.pause();
        spanishAudio.currentTime = 0;
        
        isPlaying = false;
        playAudioBtn.disabled = false;
        pauseAudioBtn.disabled = true;
        stopAudioBtn.disabled = true;
    }
    
    // Initialize
    updateNavigation();
});
