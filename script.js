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
        totalPages: 0
    };
    
    // Audio elements
    let englishAudio = new Audio();
    let spanishAudio = new Audio();
    let isPlaying = false;
    
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
            // In a real app, you would call an AI API here
            // For this example, we'll use mock data
            const generatedStory = await mockAIStoryGeneration(prompt);
            
            currentStory = {
                english: generatedStory.english,
                spanish: generatedStory.spanish,
                currentPage: 0,
                totalPages: generatedStory.english.length
            };
            
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
    
    // Mock AI story generation
    async function mockAIStoryGeneration(prompt) {
        // In a real implementation, you would call an AI API like OpenAI or similar
        // This is just a mock response for demonstration
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const englishStory = [
                    "Once upon a time, there was a cow named Daisy.",
                    "Daisy loved to sing, but all the other animals laughed at her.",
                    "One day, a famous music producer heard Daisy singing in the field.",
                    "He was amazed by her beautiful voice and offered her a recording contract!",
                    "Daisy became a famous singing cow and all the animals cheered for her."
                ];
                
                const spanishStory = [
                    "Había una vez una vaca llamada Daisy.",
                    "A Daisy le encantaba cantar, pero todos los otros animales se reían de ella.",
                    "Un día, un famoso productor musical escuchó a Daisy cantando en el campo.",
                    "¡Quedó asombrado por su hermosa voz y le ofreció un contrato de grabación!",
                    "Daisy se convirtió en una vaca cantante famosa y todos los animales la animaban."
                ];
                
                resolve({
                    english: englishStory,
                    spanish: spanishStory
                });
            }, 1500); // Simulate API delay
        });
    }
    
    // Update story display
    function updateStoryDisplay() {
        if (currentStory.totalPages === 0) return;
        
        englishContent.textContent = currentStory.english[currentStory.currentPage];
        spanishContent.textContent = currentStory.spanish[currentStory.currentPage];
        
        // In a real app, you would generate or fetch TTS audio here
        // For this example, we'll just simulate it
        simulateTTSGeneration();
    }
    
    // Simulate TTS generation
    function simulateTTSGeneration() {
        // In a real app, you would use a TTS API or service
        console.log("TTS audio would be generated here for:", 
                   currentStory.english[currentStory.currentPage],
                   currentStory.spanish[currentStory.currentPage]);
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
        // In a real app, this would play the generated TTS audio
        console.log("Playing audio for current page");
        isPlaying = true;
        playAudioBtn.disabled = true;
        pauseAudioBtn.disabled = false;
        stopAudioBtn.disabled = false;
    }
    
    function pauseAudio() {
        console.log("Pausing audio");
        isPlaying = false;
        playAudioBtn.disabled = false;
        pauseAudioBtn.disabled = true;
        stopAudioBtn.disabled = false;
    }
    
    function stopAudio() {
        console.log("Stopping audio");
        isPlaying = false;
        playAudioBtn.disabled = false;
        pauseAudioBtn.disabled = true;
        stopAudioBtn.disabled = true;
    }
    
    // Initialize
    updateNavigation();
});
