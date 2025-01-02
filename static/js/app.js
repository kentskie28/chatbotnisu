class Chatbox {
    constructor() {
        this.args = {
            openButton: document.querySelector('.chatbox__button'),
            chatBox: document.querySelector('.chatbox__support'),
            sendButton: document.querySelector('.send__button'),
        };

        this.state = false;
        this.messages = [];
        this.isSending = false;
    }
    

    display() {
        const { openButton, chatBox, sendButton } = this.args;
        const exitButton = chatBox.querySelector('.chatbox__exit');
    
        console.log('chatBox reference:', chatBox);
    
        openButton.addEventListener('click', () => {
            this.toggleState(chatBox);
            openButton.style.display = 'none';  
        });
    
        exitButton.addEventListener('click', () => {
            this.toggleState(chatBox);
            openButton.style.display = 'block';  
        });
    
        sendButton.addEventListener('click', () => this.onSendButton(chatBox));
    
        const node = chatBox.querySelector('input');
        node.addEventListener("keyup", ({ key }) => {
            if (key === "Enter") {
                this.onSendButton(chatBox);
            }
        });


    const suggestionButtons = chatBox.querySelectorAll('.start-suggestion-button'); 
    suggestionButtons.forEach((button) => { 
        button.addEventListener('click', () => {
            const userInput = button.getAttribute('data-input'); 
            const textField = chatBox.querySelector('input');
            textField.value = userInput; 

            this.onSendButton(chatBox);

            this.hideWelcomeMessage(chatBox);
        });
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

    hideWelcomeMessage(chatbox) {
        const welcomeMessage = chatbox.querySelector('#welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        const startButton = chatbox.querySelector('.start-suggestion-button');
        if (startButton) {
            startButton.style.display = 'none';
        }
    }
    redirectToMap() {
        const currentLocation = JSON.parse(sessionStorage.getItem("currentLocation"));
        const destination = sessionStorage.getItem("destination");

        if (currentLocation && destination) {
            const url = new URL(window.location.origin + "/view_map");
            url.searchParams.append("lat", currentLocation.latitude);
            url.searchParams.append("lon", currentLocation.longitude);
            url.searchParams.append("destination", destination);
            window.location.href = url;
        } else {
            alert("Location or destination is missing. Ensure geolocation is enabled.");
        }
    }

    onStartButton(chatbox) {
        const textField = chatbox.querySelector('input');
        textField.value = "Directional";
    
        this.onSendButton(chatbox);
    
        this.hideWelcomeMessage(chatbox);
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

        this.hideWelcomeMessage(chatbox);

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
            console.log("Response from server:", r);
            let botResponse = r.answer;
            let secondaryResponse = r.secondary_response; 
            let destination = r.destination;

            setTimeout(() => {
                this.messages.push({ name: "NISUBOT", message: answer });
                this.isSending = false;
                this.suggestions = suggestion; 
                this.updateChatText(chatbox);
            }, 0);
    
            if (secondary_response) {
                setTimeout(() => {
                    this.messages.push({ name: "NISUBOT", message: secondary_response });
                    this.updateChatText(chatbox);
                }, 2000);
            }
    
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
            navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
    
                    sessionStorage.setItem("currentLocation", JSON.stringify({ latitude, longitude }));
                    sessionStorage.setItem("destination", destination); 
    
                    const existingButton = chatbox.querySelector('.map-button');
                    if (existingButton) {
                        return; 
                    }
    
                    const chatmessage = chatbox.querySelector(".chatbox__messages");
                    const buttonContainer = document.createElement("div");
                    buttonContainer.className = "messages__item messages__item--visitor";
    
                    const button = document.createElement("button");
                    button.className = "map-button";
                    button.innerHTML = `<i class='fas fa-map'></i> Click me to View Map`; // Use innerHTML for the icon
                    button.addEventListener("click", () => {
                        const url = new URL(window.location.origin + "/view_map");
                        url.searchParams.append("lat", latitude);
                        url.searchParams.append("lon", longitude);
                        url.searchParams.append("destination", destination); 
                        window.open(url, "_blank");
                    });
    
                    buttonContainer.appendChild(button);
                    chatmessage.prepend(buttonContainer); 
    
                    chatmessage.scrollTop = 0;
                },
                () => {
                    alert("Geolocation permission denied.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    }
    
    generateSuggestionButtons(chatbox, suggestions) {
        const chatmessage = chatbox.querySelector('.chatbox__messages');
    
        const suggestionContainer = document.createElement('div');
        suggestionContainer.className = 'suggested-replies'; 
    

        suggestions.forEach((suggestion) => {
            const button = document.createElement('button');
            button.className = 'suggestion-button';
            button.textContent = suggestion;
    

            button.addEventListener('click', () => {
                this.onSendSuggestion(chatbox, suggestion);
            });
    
            suggestionContainer.appendChild(button);
        });

        chatmessage.prepend(suggestionContainer);
    
  
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
            const pattern = data.pattern; 
            if (pattern) {
                const textField = chatbox.querySelector('input');
                textField.value = pattern; 
                this.onSendButton(chatbox); 
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
            chatmessage.innerHTML = html;
    
            chatmessage.scrollTop = chatmessage.scrollHeight;
        }
    
        if (this.suggestions && this.suggestions.length > 0) {
            this.generateSuggestionButtons(chatbox, this.suggestions);
        }
    }
    
}      
document.addEventListener("DOMContentLoaded", () => {
    const chatbox = new Chatbox();
    chatbox.display();
});
function redirectToMap() {
    // Retrieve latitude and longitude from session storage (if set previously)
    const currentLocation = JSON.parse(sessionStorage.getItem("currentLocation"));
    const destination = sessionStorage.getItem("destination");

    // Check if current location and destination are available
    if (currentLocation && destination) {
        const url = new URL(window.location.origin + "/view_map");
        url.searchParams.append("lat", currentLocation.latitude);
        url.searchParams.append("lon", currentLocation.longitude);
        url.searchParams.append("destination", destination);
        window.location.href = url; // Perform the redirection
    } else {
        alert("Location or destination is missing. Ensure geolocation is enabled.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const chatboxButton = document.querySelector(".chatbox__button");
    const chatbox = document.querySelector(".chatbox__support");
    const chatboxExit = document.querySelector(".chatbox__exit");
    const footer = document.getElementById("footer");

    // Open Chatbox
    chatboxButton.addEventListener("click", () => {
        chatbox.classList.add("chatbox--active");
        footer.style.display = "none"; // Hide footer
    });

    // Close Chatbox
    chatboxExit.addEventListener("click", () => {
        chatbox.classList.remove("chatbox--active");
        footer.style.display = "block"; // Show footer
    });
});

