import os
import requests
from flask import Flask, render_template, request, jsonify
from langdetect import detect, LangDetectException
from langdetect.lang_detect_exception import ErrorCode
import langdetect
from dotenv import load_dotenv

# Configure langdetect for more consistent results
langdetect.DetectorFactory.seed = 0

# Load environment variables from .env file if present
load_dotenv()

app = Flask(__name__)

# Hugging Face API configuration
API_URL = "https://api-inference.huggingface.co/models/bhadresh-savani/distilbert-base-uncased-emotion"
API_KEY = os.getenv("HUGGINGFACE_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Check if API key is configured
if not API_KEY:
    print("Warning: HUGGINGFACE_API_KEY environment variable is not set.")
    print("The API might work with limited rate without authentication, but it's recommended to set up an API key.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'status': 'error', 'message': 'No text provided'}), 400
    
    text = data['text'].strip()
    
    if not text:
        return jsonify({'status': 'error', 'message': 'Empty text provided'}), 400
    
    try:
        # Detect language - use a longer sample for more accurate detection
        # and handle short texts better by setting a minimum length
        if len(text) < 10:
            # For very short text, language detection may be unreliable
            language = 'short-text'
        else:
            # Use the first 200 characters for more consistent detection
            sample = text[:min(200, len(text))]
            language = detect(sample)
    except LangDetectException as e:
        if hasattr(e, 'code') and e.code == ErrorCode.CantDetectLanguage:
            language = 'undetermined'
        else:
            language = 'error'
    
    try:
        # Call the Hugging Face Inference API
        payload = {"inputs": text}
        response = requests.post(API_URL, headers=HEADERS, json=payload)
        
        # Check for API errors
        if response.status_code != 200:
            return jsonify({
                'status': 'error', 
                'message': f'API Error: {response.status_code} - {response.text}'
            }), 500
        
        # Parse the results
        api_results = response.json()
        
        # API returns a list of dictionaries with label and score
        if not api_results or not isinstance(api_results, list) or not api_results[0]:
            return jsonify({
                'status': 'error',
                'message': 'Invalid response from API'
            }), 500
            
        results = api_results[0]
        
        # Sort by score in descending order
        results.sort(key=lambda x: x["score"], reverse=True)
        
        # Return the full analysis with top sentiment
        return jsonify({
            'status': 'success',
            'warnings': [],
            'emotion': results[0]['label'],
            'score': results[0]['score'],
            'all_results': results,
            'language': language
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error', 
            'message': f'An error occurred during analysis: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
