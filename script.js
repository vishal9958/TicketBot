// Select necessary elements
const menuToggle = document.querySelector('.menuToggle');
const closeBtn = document.querySelector('.bx-x');
const chatBox = document.querySelector('.chart-section');
const textarea = document.querySelector('textarea');
const sendBtn = document.querySelector('.bxs-send');
let currentSpeech = null; // Track current voice

// Track if the chatbot is activated
let isChatbotActivated = false;
let currentStep = 0; // Flow control variable
let userLocation = {}; // To store the user's location
let selectedEvent = ''; // Track selected event

// Event Price List
const eventPrices = {
    "Art Exhibition": "₹500",
    "Science Fair": "₹300",
    "Cultural Show": "₹400",
    "Kiran Nadar Museum of Art": "₹700",
    "National Gallery of Modern Art": "₹600",
};

// Example Indian museums mapped to states
const indianMuseums = {
    "Delhi": ["National Museum", "National Science Museum","National Rail Museum","Crafts Museum","National Gandhi Museum","Museum of Illusions"],
    "Maharashtra": ["Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", "Dr. Bhau Daji Lad Museum"],
    "West Bengal": ["Indian Museum", "Victoria Memorial Hall"],
    // Add more Indian states and museums here...
};

const eventsByState = {
    "Delhi": ["Art Exhibition", "Cultural Show" ,"Kiran Nadar Museum of Art","National Gallery of Modern Art"],
    "Maharashtra": ["Science Fair", "Art Exhibition"],
    "West Bengal": ["Cultural Show", "Art Exhibition"],
    // Add more events based on state...
};

// Toggle menu button action to activate the chatbot
menuToggle.onclick = function () {
    menuToggle.classList.toggle('active');
    chatBox.classList.toggle('active');
    
    // Restart the chatbot when menu toggle is clicked
    if (!isChatbotActivated) {
        initChatbot();
        isChatbotActivated = true;
    } else {
        resetChatbot();
    }
}

// Close button action
closeBtn.onclick = function () {
    menuToggle.classList.remove('active');
    chatBox.classList.remove('active');
    
    // Stop voice when closing
    if (currentSpeech) {
        window.speechSynthesis.cancel();
    }
}

// Send message when "Enter" is pressed or Send button is clicked
sendBtn.onclick = handleUserInput;
textarea.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleUserInput();
    }
});

// Display bot message and speak it aloud
function displayBotMessage(message) {
    const botMsgDiv = document.createElement('div');
    botMsgDiv.classList.add('left-part');
    botMsgDiv.innerHTML = `<div class="agent-chart"><img src="bot.png" alt=""><p>${message}</p></div>`;
    chatBox.appendChild(botMsgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom

    // Speak the message using Web Speech API
    speakMessage(message);
}

// Speak the bot's message
function speakMessage(message) {
    if (currentSpeech) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
    currentSpeech = new SpeechSynthesisUtterance(message);
    currentSpeech.lang = 'en-US';  // Set language
    currentSpeech.pitch = 1.2;     // Set consistent pitch
    currentSpeech.rate = 0.9;      // Maintain a slower and consistent speed
    window.speechSynthesis.speak(currentSpeech);
}

// Display user message
function displayUserMessage(message) {
    const userMsgDiv = document.createElement('div');
    userMsgDiv.classList.add('right-part');
    userMsgDiv.innerHTML = `<p>${message}</p><span>Just Now</span>`;
    chatBox.appendChild(userMsgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
}

// Initialize chatbot
function initChatbot() {
    displayBotMessage("Hey! Would you like to book a ticket? (yes/no)");
    currentStep = 0;  // Start the chatbot from step 0
}

// Reset chatbot when menu is toggled again
function resetChatbot() {
    chatBox.innerHTML = ''; // Clear chatbox
    initChatbot(); // Restart the chatbot
    window.speechSynthesis.cancel(); // Stop any ongoing speech
}

// Handle user input
function handleUserInput() {
    const message = textarea.value.trim().toLowerCase();
    if (!message) return;

    displayUserMessage(message); // Show user message
    textarea.value = ''; // Clear input

    switch (currentStep) {
        case 0: // Initial question
            if (message === 'yes') {
                requestLocationPermission(); // Ask for location after confirmation
                currentStep = 1;  // Move to the next step
            } else if (message === 'no') {
                displayBotMessage("Okay, bye!");
                currentStep = -1;  // End the conversation
            } else {
                displayBotMessage("Please answer 'yes' or 'no'.");
            }
            break;
        case 1: // Wait for user location
            displayBotMessage("Please allow location access to find nearby museums.");
            break;
        case 2: // Museum selection after getting location
            const museumChoice = parseInt(message);
            if (museumChoice >= 1 && museumChoice <= userLocation.museums.length) {
                displayBotMessage(`You selected ${userLocation.museums[museumChoice - 1]}. Now, here is the list of events:`);
                userLocation.events.forEach((event, index) => displayBotMessage(`${index + 1}. ${event}`));
                displayBotMessage("Please select an event by number.");
                currentStep = 3; // Move to event selection
            } else {
                displayBotMessage("Invalid choice. Please select a valid museum number.");
            }
            break;
        case 3: // Event selection
            const eventChoice = parseInt(message);
            if (eventChoice >= 1 && eventChoice <= userLocation.events.length) {
                selectedEvent = userLocation.events[eventChoice - 1]; // Store the selected event
                const eventPrice = eventPrices[selectedEvent]; // Get the price of the event
                displayBotMessage(`You selected ${selectedEvent}. The price is ${eventPrice}. Do you want to proceed with payment? (yes/no)`);
                currentStep = 4; // Move to price confirmation
            } else {
                displayBotMessage("Invalid choice. Please select a valid event number.");
            }
            break;
        case 4: // Price confirmation
            if (message === 'yes') {
                displayBotMessage("Please enter your UPI for verification:");
                currentStep = 5; // Move to UPI verification
            } else {
                displayBotMessage("You canceled the payment.");
                currentStep = -1;  // End the conversation
            }
            break;
        case 5: // Payment details verification
            verifyUPI(message); // Verify UPI details
            break;
        default:
            displayBotMessage("An error occurred. Please try again.");
    }
}

// Function to request location access
function requestLocationPermission() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showMuseumsBasedOnLocation, handleLocationError);
    } else {
        displayBotMessage("Geolocation is not supported by this browser.");
    }
}

// Function to display museums based on user's state
function showMuseumsBasedOnLocation(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Simulate getting the user's state based on location
    const state = getStateFromCoordinates(latitude, longitude); // Function to get the state from coordinates

    userLocation.museums = indianMuseums[state] || [];
    userLocation.events = eventsByState[state] || [];

    if (userLocation.museums.length > 0) {
        displayBotMessage(`Here are the museums in ${state}:`);
        userLocation.museums.forEach((museum, index) => displayBotMessage(`${index + 1}. ${museum}`));
        displayBotMessage("Please select a museum by number.");
        currentStep = 2; // Move to museum selection
    } else {
        displayBotMessage("No museums found in your location.");
    }
}

// Function to simulate getting the state based on latitude and longitude
function getStateFromCoordinates(latitude, longitude) {
    // For demonstration purposes, we'll simulate a state based on random coordinates
    // In real implementation, this should use a reverse geolocation API
    if (latitude > 28 && longitude > 77) {
        return "Delhi";
    } else if (latitude > 19 && longitude > 72) {
        return "Maharashtra";
    } else {
        return "West Bengal";
    }
}

// Function to handle location errors
function handleLocationError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            displayBotMessage("Location permission denied. Unable to proceed.");
            break;
        case error.POSITION_UNAVAILABLE:
            displayBotMessage("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            displayBotMessage("Location request timed out.");
            break;
        case error.UNKNOWN_ERROR:
            displayBotMessage("An unknown error occurred.");
            break;
    }
}

// Function to verify UPI details
function verifyUPI(upi) {
    displayBotMessage(`Verifying UPI: ${upi}...`);
    
    // Simulating UPI verification (no real verification)
    setTimeout(() => {
        const isValidUPI = Math.random() > 0.5; // Simulating a 50/50 chance of correct UPI
        if (isValidUPI) {
            displayBotMessage(`UPI ${upi} has been verified successfully. Generating your ticket...`);
            generateQRCode();
        } else {
            displayBotMessage(`UPI ${upi} is invalid. Please try again.`);
            currentStep = 5; // Stay in UPI verification step
        }
    }, 2000);
}

// Generate QR code
function generateQRCode() {
    const qrDiv = document.createElement('div');
    qrDiv.id = 'qrcode';
    chatBox.appendChild(qrDiv);

    // Assuming QR code library is already included in your project
    new QRCode(qrDiv, {
        text: "Sample Ticket Information",
        width: 128,
        height: 128
    });
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
}
