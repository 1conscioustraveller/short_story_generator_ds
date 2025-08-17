// API Keys - REPLACE THESE WITH YOUR ACTUAL API KEYS
const OPENAI_API_KEY = 'Your-OpenAI-API-key-here';
const GEMINI_TTS_API_KEY = 'Your-Gemini-TTS-API-key-here';

// DOM Elements
const storyPromptInput = document.getElementById('storyPrompt');
const generateBtn = document.getElementById('generateBtn');
const storyContainer = document.querySelector('.story-container');
const englishText = document.getElementById('englishText');
const spanishText = document.getElementById('spanishText');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageIndicator = document.getElementById('pageIndicator');
const readBtn = document.getElementById('readBtn');
const wordDisplay = document.getElementById('wordDisplay');
const loadingDiv = document.querySelector('.loading');
const themeButtons = document.querySelectorAll('.theme-btn');

// State variables
let currentStory = {
    english: [],
    spanish: []
};
let currentPage = 0;
let isReading = false;
let speechSynthesis = window.speechSynthesis || null;

// Theme switching
themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        document.body.className = `theme-${button.dataset.theme}`;
    });
});

// Generate story
generateBtn.addEventListener('click', async () => {
    const prompt = storyPromptInput.value.trim();
    if (!prompt) return;

    loadingDiv.classList.remove('hidden');
    storyContainer.classList.add('hidden');

    try {
        const story = await generateStory(prompt);
        currentStory = splitStoryIntoPages(story);
        currentPage = 0;
        displayCurrentPage();
        storyContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Error generating story:', error);
        alert('Failed to generate story. Please try again.');
    } finally {
        loadingDiv.classList.add('hidden');
    }
});

// Navigation
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        displayCurrentPage();
    }
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < currentStory.english.length - 1) {
        currentPage++;
        displayCurrentPage();
    }
});

// Read aloud
readBtn.addEventListener('click', () => {
    if (isReading) {
        stopReading();
    } else {
        readCurrentPage();
    }
});

// Word highlighting
englishText.addEventListener('click', (e) => {
    if (e.target.classList.contains('story-word')) {
        const word = e.target.textContent;
        highlightAndReadWord(word, e.target);
    }
});

spanishText.addEventListener('click', (e) => {
    if (e.target.classList.contains('story-word')) {
        const word = e.target.textContent;
        highlightAndReadWord(word, e.target);
    }
});

// Functions
async function generateStory(prompt) {
    // Call OpenAI API to generate the story
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
                    content: "You are a children's story writer. Create a short story (about 20 sentences total) based on the user's prompt. Then provide a Spanish translation of the same story. Format your response as follows:\n\nEnglish:\n[story here]\n\nSpanish:\n[translation here]"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7
        })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the response into English and Spanish parts
    const englishMatch = content.match(/English:\n([\s\S]*?)\n\nSpanish:/);
    const spanishMatch = content.match(/Spanish:\n([\s\S]*?)$/);

    return {
        english: englishMatch ? englishMatch[1].trim() : '',
        spanish: spanishMatch ? spanishMatch[1].trim() : ''
    };
}

function splitStoryIntoPages(story) {
    // Split both English and Spanish stories into sentences
    const englishSentences = splitIntoSentences(story.english);
    const spanishSentences = splitIntoSentences(story.spanish);
    
    // Group into pages with max 2 sentences each
    const englishPages = [];
    const spanishPages = [];
    
    for (let i = 0; i < englishSentences.length; i += 2) {
        englishPages.push(englishSentences.slice(i, i + 2).join(' '));
    }
    
    for (let i = 0; i < spanishSentences.length; i += 2) {
        spanishPages.push(spanishSentences.slice(i, i + 2).join(' '));
    }
    
    // Make sure both languages have the same number of pages
    const maxPages = Math.max(englishPages.length, spanishPages.length);
    while (englishPages.length < maxPages) englishPages.push('');
    while (spanishPages.length < maxPages) spanishPages.push('');
    
    return { english: englishPages, spanish: spanishPages };
}

function splitIntoSentences(text) {
    // Simple sentence splitting (improve this for production)
    return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

function displayCurrentPage() {
    if (currentStory.english.length === 0) return;
    
    // Update page indicator
    pageIndicator.textContent = `Page ${currentPage + 1} of ${currentStory.english.length}`;
    
    // Display English text with clickable words
    englishText.innerHTML = addWordSpans(currentStory.english[currentPage]);
    
    // Display Spanish text with clickable words
    spanishText.innerHTML = addWordSpans(currentStory.spanish[currentPage]);
    
    // Disable/enable navigation buttons
    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = currentPage === currentStory.english.length - 1;
}

function addWordSpans(text) {
    if (!text) return '';
    return text.split(' ').map(word => {
        const cleanWord = word.replace(/[.,!?]/g, '');
        return `<span class="story-word" data-word="${cleanWord}">${word}</span>`;
    }).join(' ');
}

function readCurrentPage() {
    if (isReading) return;
    
    isReading = true;
    readBtn.textContent = 'Stop Reading';
    
    const englishText = currentStory.english[currentPage];
    const spanishText = currentStory.spanish[currentPage];
    
    // Use Gemini TTS API to read the text
    // Note: This is a placeholder - you'll need to implement the actual API call
    console.log('Reading English:', englishText);
    console.log('Reading Spanish:', spanishText);
    
    // For demo purposes, we'll use Web Speech API as fallback
    if (speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(englishText);
        utterance.onend = () => {
            isReading = false;
            readBtn.textContent = 'Read Aloud';
        };
        speechSynthesis.speak(utterance);
    } else {
        alert('Text-to-speech not supported in this browser');
        isReading = false;
        readBtn.textContent = 'Read Aloud';
    }
}

function stopReading() {
    if (speechSynthesis) {
        speechSynthesis.cancel();
    }
    isReading = false;
    readBtn.textContent = 'Read Aloud';
}

function highlightAndReadWord(word, element) {
    // Highlight the word
    const allWords = document.querySelectorAll('.story-word');
    allWords.forEach(w => w.classList.remove('highlighted-word'));
    element.classList.add('highlighted-word');
    
    // Display the word prominently
    wordDisplay.textContent = word;
    
    // Read the word using TTS
    // Note: This is a placeholder - you'll need to implement the actual API call
    console.log('Reading word:', word);
    
    // For demo purposes, we'll use Web Speech API as fallback
    if (speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(word);
        speechSynthesis.speak(utterance);
    }
}
