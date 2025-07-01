document.addEventListener('DOMContentLoaded', function () {

    const inputText = document.getElementById('input-text');
    const analyzeButton = document.getElementById('analyze-button');
    const clearButton = document.getElementById('clear-button');
    const resultSection = document.getElementById('result-section');
    const spinner = document.getElementById('spinner');
    const sentimentEmoji = document.getElementById('sentiment-emoji');
    const sentimentLabel = document.getElementById('sentiment-label');
    const sentimentScore = document.getElementById('sentiment-score');
    const languageInfo = document.getElementById('language-info');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    inputText.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            analyzeButton.click();
        }
    });

    analyzeButton.addEventListener('click', function () {
        const text = inputText.value.trim();
        console.log(text)
        if (!text) {
            showError('Please enter some text to analyze.');
            return;
        }

        analyzeSentiment(text);
    });

    clearButton.addEventListener('click', function () {
        inputText.value = '';
        resultSection.classList.add('hidden');
        errorMessage.classList.add('hidden');
        inputText.focus();
    });

    function analyzeSentiment(text) {
        resultSection.classList.remove('hidden');
        spinner.classList.remove('hidden');
        sentimentEmoji.textContent = '';
        sentimentLabel.textContent = '';
        sentimentScore.textContent = '';
        languageInfo.textContent = '';
        errorMessage.classList.add('hidden');

        fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text }),
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'An error occurred during analysis.');
                    });
                }
                return response.json();
            })
            .then(data => {
                displayResults(data);
            })
            .catch(error => {
                showError(error.message);
                resultSection.classList.add('hidden');
            })
            .finally(() => {
                spinner.classList.add('hidden');
            });
    }

    function displayResults(data) {
        const sentimentClass = getSentimentClass(data.emotion);
        const emoji = getSentimentEmoji(data.emotion);

        sentimentEmoji.innerHTML = '';
        sentimentEmoji.innerHTML = `<img src="${emoji}" alt="${data.emotion}" class="w-28 h-28" />`;
        sentimentLabel.textContent = data.emotion;
        sentimentLabel.classList.remove('positive', 'negative', 'neutral');
        sentimentLabel.classList.add(sentimentClass);   

        const scorePercent = Math.round(data.score * 100);
        sentimentScore.textContent = `Confidence: ${scorePercent}%`;

        resultSection.classList.remove('hidden');
        resultSection.style.backgroundColor = getBackgroundColor(data.emotion);
        languageInfo.textContent = '';
        resultSection.classList.remove('positive-result', 'negative-result', 'neutral-result');
        resultSection.classList.remove('hidden');
        resultSection.classList.add(`${sentimentClass}-result`);
        // resultSection.className = 'result-section'; 
        // resultSection.classList.remove('hidden');
        // resultSection.classList.add(sentimentClass + '-result');

    }

    function showError(message) {
        errorText.textContent = "Something Went wrong";
        errorMessage.classList.remove('hidden');
    }

    function getSentimentClass(label) {
        switch (label.toLowerCase()) {
            case 'joy': return 'positive';
            case 'love': return 'positive';
            case 'anger': return 'negative';
            case 'sadness': return 'negative';
            case 'fear': return 'neutral';
            case 'surprise': return 'neutral';
            default: return '';
        }
    }

    function getSentimentEmoji(label) {
        switch (label.toLowerCase()) {
            case 'joy': return '/static/assets/logo.png';
            case 'love': return '/static/assets/love.png';
            case 'anger': return '/static/assets/angry.png';
            case 'sadness': return '/static/assets/sad.png';
            case 'fear': return '/static/assets/fear.png';
            case 'surprise': return '/static/assets/surprise.png';
            default: return '/static/assets/logo.png';
        }
    }


    function getBackgroundColor(emotion) {
        switch (emotion.toLowerCase()) {
            case 'joy': return '#008819';   
            case 'anger': return '#FF3D3D';  
            case 'love': return '#F44298';    
            case 'sadness': return '#727272'; 
            case 'fear': return '#000000';    
            default: return '#CBD5E0';        
        }
    }
});
