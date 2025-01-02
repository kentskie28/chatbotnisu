document.addEventListener("DOMContentLoaded", function() {
class Chatbox {
    constructor() {
        this.args = {
            openButton: document.querySelector('.chatbox__button'),
            chatBox: document.querySelector('.chatbox__support'),
            sendButton: document.querySelector('.send__button'),
        };

        this.state = false;
        this.messages = [];
        this.isSending = false; // Prevents multiple sends
    }

    display() {
        const { openButton, chatBox, sendButton } = this.args;
        const exitButton = chatBox.querySelector('.chatbox__exit');
    
        // Log chatBox to ensure it is the correct element
        console.log('chatBox reference:', chatBox);
    
        openButton.addEventListener('click', () => {
            this.toggleState(chatBox);
            openButton.style.display = 'none';  // Hide the openButton when clicked
        });
    
        exitButton.addEventListener('click', () => {
            this.toggleState(chatBox);
            openButton.style.display = 'block';  // Show the openButton when chatbox is closed
        });
    
        sendButton.addEventListener('click', () => this.onSendButton(chatBox));
    
        const node = chatBox.querySelector('input');
        node.addEventListener("keyup", ({ key }) => {
            if (key === "Enter") {
                this.onSendButton(chatBox);
            }
        });
    }
    
    toggleState(chatbox) {
        this.state = !this.state;
        if (this.state) {
            chatbox.classList.add('chatbox--active');
        } else {
            chatbox.classList.remove('chatbox--active');
        }
    }

    onSendButton(chatbox) {
        if (this.isSending) return;

        this.isSending = true;
        var textField = chatbox.querySelector('input');
        let text1 = textField.value;
        let language = document.getElementById("language-select").value;

        if (text1 === "") {
            this.isSending = false;
            return;
        }

        let msg1 = { name: "User", message: text1 };
        this.messages.push(msg1);
        this.updateChatText(chatbox);

        textField.value = '';
        this.sendMessageToBot(text1, language, chatbox);
    }

    sendMessageToBot(text, language, chatbox) {
        fetch('http://192.168.83.214:5000/predict', {
            method: 'POST',
            body: JSON.stringify({ message: text, language: language }),
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((r) => r.json())
        .then((r) => {
            const { answer, secondary_response, suggestion } = r;
            console.log("Response from server:", r); // Log the full response for debugging
            let botResponse = r.answer;
            let secondaryResponse = r.secondary_response; // Get the secondary response
            let destination = r.destination;

            // Show bot's main response
            setTimeout(() => {
                this.messages.push({ name: "NISUBOT", message: answer });
                this.isSending = false;
                this.suggestions = suggestion; // Store suggestions here
                this.updateChatText(chatbox);
            }, 0);
    
            // Show secondary response if it exists
            if (secondary_response) {
                setTimeout(() => {
                    this.messages.push({ name: "NISUBOT", message: secondary_response });
                    this.updateChatText(chatbox);
                }, 2000);
            }
    
            // If suggestions exist, render them
            if (suggestion && suggestion.length > 0) {
                this.generateSuggestionButtons(chatbox, suggestion);
            }

            if (botResponse.includes("Can I access your location")) {
                this.requestGeolocation(chatbox, destination);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            this.isSending = false;
        });
    }
    requestGeolocation(chatbox, destination) {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition((position) => {
                const { latitude, longitude } = position.coords;
    
                const mapId = `map-${Date.now()}`;
                const mapMsg = `<div id="${mapId}" class="map-container"></div>`;
                this.messages.push({ name: "NISUBOT", message: mapMsg, isMap: true });
                this.updateChatText(chatbox);
    
                this.showMap(latitude, longitude, destination, mapId);
            }, () => {
                alert('Geolocation permission denied.');
            });
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    }
    
    generateSuggestionButtons(chatbox, suggestions) {
        const chatmessage = chatbox.querySelector('.chatbox__messages');
    
        // Create a container for suggestion buttons
        const suggestionContainer = document.createElement('div');
        suggestionContainer.className = 'suggested-replies'; // Assign a class for styling
    
        // Add buttons for each suggestion
        suggestions.forEach((suggestion) => {
            const button = document.createElement('button');
            button.className = 'suggestion-button';
            button.textContent = suggestion;
    
            // Handle button click
            button.addEventListener('click', () => {
                this.onSendSuggestion(chatbox, suggestion);
            });
    
            suggestionContainer.appendChild(button);
        });
    
        // Prepend the suggestion container to make it appear at the top
        chatmessage.prepend(suggestionContainer);
    
        // Scroll to the bottom to ensure buttons are visible
        chatmessage.scrollTop = chatmessage.scrollHeight;
    }
        
    onSendSuggestion(chatbox, suggestion) {
        console.log(`Suggestion clicked: ${suggestion}`);
        fetch('http://192.168.83.214:5000/get_pattern', {  // Ensure the port is correct
            method: 'POST',
            body: JSON.stringify({ tag: suggestion }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(`Pattern received for ${suggestion}:`, data.pattern);
            const pattern = data.pattern; // Get the pattern for the suggestion
            if (pattern) {
                const textField = chatbox.querySelector('input');
                textField.value = pattern; // Autofill the input field with the pattern
                this.onSendButton(chatbox); // Trigger the send button logic
            } else {
                console.error('Pattern not found for suggestion:', suggestion);
            }
        })
        .catch(error => console.error('Error fetching pattern:', error));
    }
    updateChatText(chatbox) {
        let html = '';
        this.messages.slice().reverse().forEach((item) => {
            if (item.isMap) {
                html += item.message; 
            }if (item.name === "NISUBOT") {
                html += `<div class="messages__item messages__item--visitor">${item.message}</div>`;
            } else {
                html += `<div class="messages__item messages__item--operator">${item.message}</div>`;
            }
        });
    
        const chatmessage = chatbox.querySelector('.chatbox__messages');
    
        if (chatmessage) {
            // Update chat messages
            chatmessage.innerHTML = html;
    
            // Scroll to the bottom of chat messages
            chatmessage.scrollTop = chatmessage.scrollHeight;
        }
    
        // Render suggestion buttons AFTER messages are updated
        if (this.suggestions && this.suggestions.length > 0) {
            this.generateSuggestionButtons(chatbox, this.suggestions);
        }
    }
}      
document.addEventListener("DOMContentLoaded", () => {
    const chatbox = new Chatbox();
    chatbox.display();
});
});