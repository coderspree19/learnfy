from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import google.generativeai as genai
import os
import json
import hashlib
import secrets
from datetime import datetime
import re
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
CORS(app, supports_credentials=True)

# Get Gemini API key from environment variable
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# User database
USERS_FILE = 'users.json'

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Validation
        if not all([name, email, password, confirm_password]):
            return jsonify({'error': 'All fields are required'}), 400
        
        if password != confirm_password:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        if not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        users = load_users()
        if email in users:
            return jsonify({'error': 'User already exists with this email'}), 409
        
        # Create new user
        users[email] = {
            'name': name,
            'password_hash': hash_password(password),
            'created_at': datetime.now().isoformat(),
            'last_login': None
        }
        
        save_users(users)
        
        # Create session
        session['user_email'] = email
        session['user_name'] = name
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'user': {'name': name, 'email': email}
        })
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500
    
# Add to your imports
from googleapiclient.discovery import build

# Add this after your Gemini configuration
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')

# Add this function to search YouTube videos
def search_youtube_videos(query, max_results=5):
    try:
        if not YOUTUBE_API_KEY:
            return []
            
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        search_response = youtube.search().list(
            q=query,
            part='snippet',
            maxResults=max_results,
            type='video',
            relevanceLanguage='en',
            videoDuration='medium',
            videoDefinition='high',
            videoEmbeddable='true'
        ).execute()
        
        videos = []
        for item in search_response.get('items', []):
            video_id = item['id']['videoId']
            video_title = item['snippet']['title']
            video_thumbnail = item['snippet']['thumbnails']['high']['url']
            channel_title = item['snippet']['channelTitle']
            
            videos.append({
                'video_id': video_id,
                'title': video_title,
                'thumbnail': video_thumbnail,
                'channel': channel_title
            })
            
        return videos
        
    except Exception as e:
        print(f"YouTube API error: {str(e)}")
        return []

# Add this new endpoint to your app.py
@app.route('/api/search-videos', methods=['POST'])
def search_videos():
    try:
        # Check authentication
        if 'user_email' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
            
        videos = search_youtube_videos(query)
        
        return jsonify({'videos': videos})
        
    except Exception as e:
        return jsonify({'error': f'Error searching videos: {str(e)}'}), 500

@app.route('/api/auth/signin', methods=['POST'])
def signin():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Check user exists and password matches
        users = load_users()
        if email not in users:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        user = users[email]
        if user['password_hash'] != hash_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Update last login
        user['last_login'] = datetime.now().isoformat()
        save_users(users)
        
        # Create session
        session['user_email'] = email
        session['user_name'] = user['name']
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {'name': user['name'], 'email': email}
        })
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@app.route('/api/auth/signout', methods=['POST'])
def signout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    if 'user_email' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'email': session['user_email'],
                'name': session.get('user_name', '')
            }
        })
    return jsonify({'authenticated': False})

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Check authentication
        if 'user_email' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Check if Gemini API key is configured
        if not GEMINI_API_KEY:
            return jsonify({'error': 'Gemini API is not configured on the server'}), 500
        
        # Configure the Gemini API
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Use the Gemini 1.5 Flash model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate response
        response = model.generate_content(user_message)
        
        return jsonify({'response': response.text})
    
    except Exception as e:
        error_message = str(e)
        if "API_KEY_INVALID" in error_message:
            return jsonify({'error': 'Invalid API key configuration'}), 500
        elif "quota" in error_message.lower():
            return jsonify({'error': 'API quota exceeded'}), 429
        else:
            return jsonify({'error': f'Error communicating with Gemini API: {error_message}'}), 500

@app.route('/api/generate-course', methods=['POST'])
def generate_course():
    try:
        # Check authentication
        if 'user_email' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        data = request.get_json()
        topic = data.get('topic', '')
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        # Check if Gemini API key is configured
        if not GEMINI_API_KEY:
            return jsonify({'error': 'Gemini API is not configured on the server'}), 500
        
        # Configure the Gemini API
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Use the Gemini 1.5 Flash model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Create a prompt for course generation
        prompt = f"""
        Create a structured learning course about: {topic}
        
        Format the response as HTML with the following structure:
        - A title (h3)
        - An introductory paragraph
        - 3-5 main sections with subheadings (h4) and brief explanations
        - A conclusion paragraph
        - A call-to-action button with the text "Start Learning"
        
        Use only basic HTML tags: h3, h4, p, strong, em, ul, li, and button.
        Do not include any CSS classes or inline styles.
        Keep the content concise and educational.
        """
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Clean and sanitize the HTML response
        cleaned_content = sanitize_html(response.text, topic)
        
        return jsonify({'content': cleaned_content})
    
    except Exception as e:
        error_message = str(e)
        if "API_KEY_INVALID" in error_message:
            return jsonify({'error': 'Invalid API key configuration'}), 500
        elif "quota" in error_message.lower():
            return jsonify({'error': 'API quota exceeded'}), 429
        else:
            return jsonify({'error': f'Error generating course: {error_message}'}), 500

def sanitize_html(html_content, topic):
    """
    Basic HTML sanitizer to allow only specific tags
    """
    allowed_tags = ['h3', 'h4', 'p', 'strong', 'em', 'ul', 'li', 'ol', 'button', 'b', 'i']
    html_content = re.sub(r'<script.?>.?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r'<style.?>.?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r'<iframe.?>.?</iframe>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r'on\w+=\".*?\"', '', html_content, flags=re.IGNORECASE)
    
    allowed_pattern = '|'.join(allowed_tags)
    pattern = re.compile(f'</?(?!({allowed_pattern})\\b)[^>]+>', re.IGNORECASE)
    sanitized = pattern.sub('', html_content)
    
    if not re.search(r'<h3>', sanitized):
        sanitized = f'<h3>Learn About {topic}</h3>' + sanitized
    
    if not re.search(r'<button', sanitized):
        sanitized += '<button class="btn btn-primary" style="margin-top: 15px;">Start Learning</button>'
    
    return sanitized

@app.route('/api/health', methods=['GET'])
def health_check():
    gemini_status = "configured" if GEMINI_API_KEY else "not configured"
    return jsonify({
        'status': 'ok', 
        'message': 'Learnly API is running',
        'gemini_status': gemini_status
    })

@app.route('/api/gemini', methods=['POST'])
def gemini_proxy():
    try:
        data = request.json
        message = data.get('message')
        
        if not message:
            return jsonify({'error': 'Missing message'}), 400
            
        # Check if Gemini API key is configured
        if not GEMINI_API_KEY:
            return jsonify({'error': 'Gemini API is not configured on the server'}), 500
            
        # Configure the Gemini API
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Use the Gemini 1.5 Flash model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate response
        response = model.generate_content(message)
        
        return jsonify({'text': response.text})
    
    except Exception as e:
        error_message = str(e)
        if "API_KEY_INVALID" in error_message:
            return jsonify({'error': 'Invalid API key configuration'}), 500
        elif "quota" in error_message.lower():
            return jsonify({'error': 'API quota exceeded'}), 429
        else:
            return jsonify({'error': f'Error communicating with Gemini API: {error_message}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)