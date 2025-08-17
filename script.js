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
        englishAudioUrls: [],
        spanishAudioUrls: []
    };
    
    // Audio elements
    let englishAudio = new Audio();
    let spanishAudio = new Audio();
    let isPlaying = false;
    let currentAudio = null;
    
    // API Configuration
    const API_CONFIG = {
        OPENAI_API_KEY: 'sk_prod_XXXxxxXXXxxx1234567890abcdef',
        GEMINI_TTS_KEY: 'tts_prod_XXxxXXxx9876543210zyxwvuts',
        OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
        GEMINI_TTS_ENDPOINT: 'https://api.geminiai.com/v1/tts'
    };
    
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
    
    // Generate story function
    async function generateStory() {
        const prompt = storyPrompt.value.trim();
        if (!prompt) {
            alert('Please enter a story idea!');
            return;
        }
        
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        
        try {
            // Call our mock OpenAI API
            const generatedStory = await callOpenAIAPI(prompt);
            
            currentStory = {
                english: generatedStory.english,
                spanish: generatedStory.spanish,
                currentPage: 0,
                totalPages: generatedStory.english.length,
                englishAudioUrls: [],
                spanishAudioUrls: []
            };
            
            // Generate TTS audio for each page
            await generateTTSAudio();
            
            updateStoryDisplay();
            updateNavigation();
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Story';
        } catch (error) {
            console.error('Error generating story:', error);
            alert('Failed to generate story. Please try again.');
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Story';
        }
    }
    
    // Mock OpenAI API call
    async function callOpenAIAPI(prompt) {
        console.log(`Calling OpenAI API with key: ${API_CONFIG.OPENAI_API_KEY.substring(0, 8)}...`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // This would be the actual API call in a real implementation:
        /*
        const response = await fetch(API_CONFIG.OPENAI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `Create a children's story about ${prompt}. 
                              Return as JSON with 'english' and 'spanish' arrays, 
                              each containing 3-5 short paragraphs.`
                }],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
        */
        
        // Mock response
        const englishStory = generateEnglishStory(prompt);
        const spanishStory = generateSpanishStory(prompt);
        
        return {
            english: englishStory,
            spanish: spanishStory
        };
    }
    
    // Generate TTS audio for all pages
    async function generateTTSAudio() {
        console.log(`Calling Gemini TTS API with key: ${API_CONFIG.GEMINI_TTS_KEY.substring(0, 8)}...`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a real implementation, we would call the TTS API for each paragraph
        // and store the audio URLs
        for (let i = 0; i < currentStory.english.length; i++) {
            currentStory.englishAudioUrls.push(
                `https://fake-tts-server.com/audio/${Math.random().toString(36).substring(2)}_en.mp3`
            );
            currentStory.spanishAudioUrls.push(
                `https://fake-tts-server.com/audio/${Math.random().toString(36).substring(2)}_es.mp3`
            );
        }
        
        console.log("Generated TTS audio URLs:", {
            english: currentStory.englishAudioUrls,
            spanish: currentStory.spanishAudioUrls
        });
    }
    
    // Generate mock English story based on prompt
    function generateEnglishStory(prompt) {
        const stories = {
            "cow": [
                "Once upon a time, there was a cow named Daisy who loved to sing.",
                "All the other animals thought her moo-sic was silly and would laugh at her.",
                "One sunny day, a talent scout heard Daisy singing in the meadow.",
                "He was amazed by her beautiful voice and invited her to perform at the big concert!",
                "Daisy became a star and proved that everyone has a special talent to share."
            ],
            "dragon": [
                "In a land far away, lived a small dragon named Ember who couldn't breathe fire.",
                "While other dragons practiced roaring and flying, Ember loved to read books.",
                "When the kingdom's library caught fire, Ember used his knowledge to save the books.",
                "He organized all the animals to form a bucket brigade and put out the flames.",
                "The king declared Ember the Royal Librarian, showing brains can be better than fire!"
            ],
            "default": [
                `Once there was a ${prompt.split(' ')[0]} who had an amazing adventure.`,
                `The ${prompt.split(' ')[0]} discovered something wonderful about itself.`,
                `At first, others didn't understand the ${prompt.split(' ')[0]}'s special quality.`,
                `But soon everyone realized how special the ${prompt.split(' ')[0]} truly was!`,
                `The ${prompt.split(' ')[0]} lived happily ever after, being itself.`
            ]
        };
        
        const key = prompt.toLowerCase().includes('cow') ? 'cow' : 
                   prompt.toLowerCase().includes('dragon') ? 'dragon' : 'default';
        
        return stories[key];
    }
    
    // Generate mock Spanish story based on prompt
    function generateSpanishStory(prompt) {
        const stories = {
            "cow": [
                "Había una vez una vaca llamada Daisy a quien le encantaba cantar.",
                "Todos los otros animales pensaban que su música era tonta y se reían de ella.",
                "Un día soleado, un cazatalentos escuchó a Daisy cantando en el prado.",
                "¡Quedó asombrado por su hermosa voz y la invitó a actuar en el gran concierto!",
                "Daisy se convirtió en una estrella y demostró que todos tienen un talento especial para compartir."
            ],
            "dragon": [
                "En una tierra lejana, vivía un pequeño dragón llamado Ember que no podía respirar fuego.",
                "Mientras otros dragones practicaban rugir y volar, a Ember le encantaba leer libros.",
                "Cuando la biblioteca del reino se incendió, Ember usó sus conocimientos para salvar los libros.",
                "Organizó a todos los animales para formar una cadena de cubos y apagar las llamas.",
                "¡El rey declaró a Ember Bibliotecario Real, mostrando que el cerebro puede ser mejor que el fuego!"
            ],
            "default": [
                `Había una vez ${prompt.split(' ')[0]} que tuvo una aventura increíble.`,
                `El ${prompt.split(' ')[0]} descubrió algo maravilloso sobre sí mismo.`,
                `Al principio, los demás no entendían la cualidad especial del ${prompt.split(' ')[0]}.`,
                `¡Pero pronto todos se dieron cuenta de lo especial que era realmente el ${prompt.split(' ')[0]}!`,
                `El ${prompt.split(' ')[0]} vivió feliz para siempre, siendo él mismo.`
            ]
        };
        
        const key = prompt.toLowerCase().includes('cow') ? 'cow' : 
                   prompt.toLowerCase().includes('dragon') ? 'dragon' : 'default';
        
        return stories[key];
    }
    
    // Update story display
    function updateStoryDisplay() {
        if (currentStory.totalPages === 0) return;
        
        englishContent.textContent = currentStory.english[currentStory.currentPage];
        spanishContent.textContent = currentStory.spanish[currentStory.currentPage];
        
        // Set up audio elements for the current page
        if (currentStory.englishAudioUrls.length > currentStory.currentPage) {
            englishAudio.src = currentStory.englishAudioUrls[currentStory.currentPage];
        }
        if (currentStory.spanishAudioUrls.length > currentStory.currentPage) {
            spanishAudio.src = currentStory.spanishAudioUrls[currentStory.currentPage];
        }
    }
    
    // Navigation functions
    function goToPreviousPage() {
        if (currentStory.currentPage > 0) {
            currentStory.currentPage--;
            updateStoryDisplay();
            updateNavigation();
            stopAudio(); // Stop audio when changing pages
        }
    }
    
    function goToNextPage() {
        if (currentStory.currentPage < currentStory.totalPages - 1) {
            currentStory.currentPage++;
            updateStoryDisplay();
            updateNavigation();
            stopAudio(); // Stop audio when changing pages
        }
    }
    
    function updateNavigation() {
        pageIndicator.textContent = `Page ${currentStory.currentPage + 1} of ${currentStory.totalPages}`;
        prevPageBtn.disabled = currentStory.currentPage === 0;
        nextPageBtn.disabled = currentStory.currentPage === currentStory.totalPages - 1;
    }
    
    // Audio control functions
    function playAudio() {
        if (languageSelect.value === 'english') {
            currentAudio = englishAudio;
        } else {
            currentAudio = spanishAudio;
        }
        
        currentAudio.play()
            .then(() => {
                isPlaying = true;
                playAudioBtn.disabled = true;
                pauseAudioBtn.disabled = false;
                stopAudioBtn.disabled = false;
                
                currentAudio.addEventListener('ended', () => {
                    isPlaying = false;
                    playAudioBtn.disabled = false;
                    pauseAudioBtn.disabled = true;
                    stopAudioBtn.disabled = true;
                });
            })
            .catch(error => {
                console.error("Audio playback failed:", error);
                alert("Audio playback failed. Please try again.");
            });
    }
    
    function pauseAudio() {
        if (currentAudio) {
            currentAudio.pause();
            isPlaying = false;
            playAudioBtn.disabled = false;
            pauseAudioBtn.disabled = true;
            stopAudioBtn.disabled = false;
        }
    }
    
    function stopAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            isPlaying = false;
            playAudioBtn.disabled = false;
            pauseAudioBtn.disabled = true;
            stopAudioBtn.disabled = true;
        }
    }
    
    // Initialize
    updateNavigation();
    
    // Simulate API key validation on startup
    console.log("Validating API keys...");
    setTimeout(() => {
        console.log("OpenAI API key valid:", API_CONFIG.OPENAI_API_KEY.substring(0, 8) + "...");
        console.log("Gemini TTS API key valid:", API_CONFIG.GEMINI_TTS_KEY.substring(0, 8) + "...");
    }, 500);
});
