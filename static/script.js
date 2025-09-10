// Authentication state
let currentUser = null;
let geminiApiKey = ""; // This will be set from server-side

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthentication();
    initializeEventListeners();
    
    // Check API status
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        const apiStatusIcon = document.getElementById('apiStatusIcon');
        const apiStatusText = document.getElementById('apiStatusText');
        const apiKeyContainer = document.getElementById('apiKeyContainer');
        
        if (data.gemini_status === "configured") {
            apiStatusIcon.className = "fas fa-check-circle";
            apiStatusIcon.style.color = "#059669";
            apiStatusText.textContent = "Gemini API Connected";
            apiStatusText.className = "status-connected";
            apiKeyContainer.style.display = "none"; // Hide API key input as it's server-side
        } else {
            apiStatusIcon.className = "fas fa-times-circle";
            apiStatusIcon.style.color = "#dc2626";
            apiStatusText.textContent = "Gemini API Not Configured";
            apiStatusText.className = "status-disconnected";
        }
    } catch (error) {
        console.error('API health check failed:', error);
    }
});

// Initialize all event listeners
function initializeEventListeners() {
    // Auth buttons
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    
    if (signInBtn) signInBtn.addEventListener('click', () => openModal(signInModal));
    if (signUpBtn) signUpBtn.addEventListener('click', () => openModal(signUpModal));

    // Modal switches
    const switchToSignUp = document.getElementById('switchToSignUp');
    const switchToSignIn = document.getElementById('switchToSignIn');
    
    if (switchToSignUp) switchToSignUp.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(signInModal);
        openModal(signUpModal);
    });
    
    if (switchToSignIn) switchToSignIn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(signUpModal);
        openModal(signInModal);
    });

    // Close buttons
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(signInModal);
            closeModal(signUpModal);
        });
    });

    // Form submissions
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    
    if (signInForm) signInForm.addEventListener('submit', handleSignIn);
    if (signUpForm) signUpForm.addEventListener('submit', handleSignUp);

    // Chat functionality
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatInput = document.getElementById('chatInput');
    
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', handleUserMessage);
    if (chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });

    // Course generation
    const generateCourseBtn = document.getElementById('generateCourseBtn');
    const courseTopicInput = document.getElementById('courseTopic');
    
    if (generateCourseBtn) generateCourseBtn.addEventListener('click', generateCourse);
    if (courseTopicInput) courseTopicInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateCourse();
    });
}

// Check if user is authenticated
async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            updateAuthUI(true, data.user.name);
        } else {
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        updateAuthUI(false);
    }
}

// Update UI based on authentication status
function updateAuthUI(isAuthenticated, userName = '') {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
    if (isAuthenticated) {
        authButtons.innerHTML = `
            <span style="color: #6C63FF; font-weight: 600; margin-right: 15px;">
                <i class="fas fa-user"></i> Welcome, ${userName}
            </span>
            <button class="btn btn-outline" id="signOutBtn">Sign Out</button>
        `;
        
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) signOutBtn.addEventListener('click', signOut);
    } else {
        authButtons.innerHTML = `
            <button class="btn btn-outline" id="signInBtn">Sign In</button>
            <button class="btn btn-primary" id="signUpBtn">Sign Up</button>
        `;
        
        // Reattach event listeners
        const signInBtn = document.getElementById('signInBtn');
        const signUpBtn = document.getElementById('signUpBtn');
        
        if (signInBtn) signInBtn.addEventListener('click', () => openModal(signInModal));
        if (signUpBtn) signUpBtn.addEventListener('click', () => openModal(signUpModal));
    }
}

// Modal functionality
const signInModal = document.getElementById('signInModal');
const signUpModal = document.getElementById('signUpModal');

function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    });
});

// Sign in functionality
async function handleSignIn(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Login successful!');
            currentUser = data.user;
            updateAuthUI(true, data.user.name);
            closeModal(signInModal);
            document.getElementById('signInForm').reset();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Sign up functionality
async function handleSignUp(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                confirm_password: confirmPassword
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Account created successfully!');
            currentUser = data.user;
            updateAuthUI(true, data.user.name);
            closeModal(signUpModal);
            document.getElementById('signUpForm').reset();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
    }
}

// Sign out functionality
async function signOut() {
    try {
        const response = await fetch('/api/auth/signout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            currentUser = null;
            updateAuthUI(false);
            alert('Logged out successfully');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

// Chatbot functionality
function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return null;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typing-indicator';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'typing-indicator';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingContent.appendChild(dot);
    }
    
    typingDiv.appendChild(typingContent);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return typingDiv;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function addMessage(text, isUser = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Format text with bold and font adjustments
    let formattedText = text;
    
    // Make text between ** bold
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Make text between * italic
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    messageContent.innerHTML = formattedText;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleUserMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    
    if (!chatInput || !chatMessages) return;
    
    const message = chatInput.value.trim();
    if (message) {
        addMessage(message, true);
        chatInput.value = '';
        
        // Show typing indicator
        addTypingIndicator();
        
        try {
            // Call backend API (using server-side configured API key)
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Chat request failed');
            }
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response
            addMessage(data.response);
        } catch (error) {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Show error message
            addMessage("Error: " + error.message);
            console.error("API Error:", error);
        }
    }
}

// Course generation functionality
async function generateCourse() {
    const courseTopicInput = document.getElementById('courseTopic');
    const coursePreview = document.getElementById('coursePreview');
    
    if (!courseTopicInput || !coursePreview) return;
    
    const topic = courseTopicInput.value.trim();
    if (!topic) {
        alert('Please enter a topic first.');
        return;
    }
    
    coursePreview.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 70px 0;">Generating course content...</p>';
    
    try {
        const response = await fetch('/api/generate-course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: topic
            }),
            credentials: 'include'
        });
        
        if (response.status === 401) {
            throw new Error('Please sign in to generate courses');
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Course generation failed');
        }
        
        const data = await response.json();
        coursePreview.innerHTML = data.content;
    } catch (error) {
        console.error("Course generation error:", error);
        coursePreview.innerHTML = `<p style="color: #dc2626; text-align: center;">Error: ${error.message}</p>`;
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Highlight active navigation link while scrolling
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

function highlightNavLink() {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', highlightNavLink);
// Add these variables at the top of your script.js
let currentCourseTopic = '';
let youtubeModal = null;

// Add this function to initialize YouTube modal
function initYouTubeModal() {
    // Create YouTube modal element
    const modalHTML = `
    <div class="modal-overlay" id="youtubeModal">
        <div class="modal youtube-modal">
            <div class="modal-header">
                <h2>Learning Videos: <span id="videoTopic"></span></h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="videos-container" id="videosContainer">
                <div class="loading-videos">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <p>Loading educational videos...</p>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get reference to the modal
    youtubeModal = document.getElementById('youtubeModal');
    
    // Add event listeners
    const closeBtn = youtubeModal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => closeModal(youtubeModal));
    
    // Close when clicking outside
    youtubeModal.addEventListener('click', (e) => {
        if (e.target === youtubeModal) {
            closeModal(youtubeModal);
        }
    });
}

// Add this function to load videos for a topic
async function loadVideosForTopic(topic) {
    const videosContainer = document.getElementById('videosContainer');
    
    try {
        const response = await fetch('/api/search-videos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `${topic} tutorial education`
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch videos');
        }
        
        const data = await response.json();
        
        if (data.videos && data.videos.length > 0) {
            displayVideos(data.videos);
        } else {
            videosContainer.innerHTML = `
                <div class="no-videos">
                    <i class="fas fa-video-slash"></i>
                    <p>No educational videos found for "${topic}"</p>
                    <p>Try a different search term or check your YouTube API configuration.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        videosContainer.innerHTML = `
            <div class="no-videos">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading videos: ${error.message}</p>
            </div>
        `;
    }
}

// Add this function to display videos
function displayVideos(videos) {
    const videosContainer = document.getElementById('videosContainer');
    
    const videosHTML = videos.map(video => `
        <div class="video-card" data-video-id="${video.video_id}">
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
                <div class="play-button">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <h4 class="video-title">${video.title}</h4>
                <p class="video-channel">${video.channel}</p>
            </div>
        </div>
    `).join('');
    
    videosContainer.innerHTML = `
        <div class="videos-grid">
            ${videosHTML}
        </div>
    `;
    
    // Add click event to video cards
    const videoCards = videosContainer.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        card.addEventListener('click', () => {
            const videoId = card.getAttribute('data-video-id');
            playVideo(videoId);
        });
    });
}

// Add this function to play a video
function playVideo(videoId) {
    const videosContainer = document.getElementById('videosContainer');
    
    videosContainer.innerHTML = `
        <div class="video-player">
            <iframe 
                width="100%" 
                height="400" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
            <button class="btn btn-outline back-to-videos">
                <i class="fas fa-arrow-left"></i> Back to Videos
            </button>
        </div>
    `;
    
    // Add event listener to back button
    const backButton = videosContainer.querySelector('.back-to-videos');
    backButton.addEventListener('click', () => {
        loadVideosForTopic(currentCourseTopic);
    });
}

// Modify your generateCourse function to handle the "Start Learning" button
function handleCourseButtonClick() {
    if (!youtubeModal) {
        initYouTubeModal();
    }
    
    const videoTopicElement = document.getElementById('videoTopic');
    if (videoTopicElement) {
        videoTopicElement.textContent = currentCourseTopic;
    }
    
    const videosContainer = document.getElementById('videosContainer');
    videosContainer.innerHTML = `
        <div class="loading-videos">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <p>Loading educational videos...</p>
        </div>
    `;
    
    openModal(youtubeModal);
    loadVideosForTopic(currentCourseTopic);
}

// Update your generateCourse function to set the current topic
async function generateCourse() {
    const courseTopicInput = document.getElementById('courseTopic');
    const coursePreview = document.getElementById('coursePreview');
    
    if (!courseTopicInput || !coursePreview) return;
    
    const topic = courseTopicInput.value.trim();
    if (!topic) {
        alert('Please enter a topic first.');
        return;
    }
    
    // Set the current course topic
    currentCourseTopic = topic;
    
    coursePreview.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 70px 0;">Generating course content...</p>';
    
    try {
        const response = await fetch('/api/generate-course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: topic
            }),
            credentials: 'include'
        });
        
        if (response.status === 401) {
            throw new Error('Please sign in to generate courses');
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Course generation failed');
        }
        
        const data = await response.json();
        coursePreview.innerHTML = data.content;
        
        // Add event listener to the "Start Learning" button
        const startLearningBtn = coursePreview.querySelector('button');
        if (startLearningBtn) {
            startLearningBtn.addEventListener('click', handleCourseButtonClick);
        }
    } catch (error) {
        console.error("Course generation error:", error);
        coursePreview.innerHTML = `<p style="color: #dc2626; text-align: center;">Error: ${error.message}</p>`;
    }
}

// Update your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthentication();
    initializeEventListeners();
    
    // Initialize YouTube modal
    initYouTubeModal();
    
    // Check API status
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        const apiStatusIcon = document.getElementById('apiStatusIcon');
        const apiStatusText = document.getElementById('apiStatusText');
        const apiKeyContainer = document.getElementById('apiKeyContainer');
        
        if (data.gemini_status === "configured") {
            apiStatusIcon.className = "fas fa-check-circle";
            apiStatusIcon.style.color = "#059669";
            apiStatusText.textContent = "Gemini API Connected";
            apiStatusText.className = "status-connected";
            apiKeyContainer.style.display = "none";
        } else {
            apiStatusIcon.className = "fas fa-times-circle";
            apiStatusIcon.style.color = "#dc2626";
            apiStatusText.textContent = "Gemini API Not Configured";
            apiStatusText.className = "status-disconnected";
        }
    } catch (error) {
        console.error('API health check failed:', error);
    }
});

// Add active class styling to CSS
const style = document.createElement('style');
style.textContent = `
    .nav-links a.active {
        color: #6C63FF !important;
        position: relative;
    }
    
    .nav-links a.active::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 100%;
        height: 2px;
        background: #6C63FF;
        border-radius: 2px;
    }
`;
document.head.appendChild(style);