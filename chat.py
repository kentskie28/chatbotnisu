import random
import json
import torch
from model import NeuralNet
from nltk_util import bag_of_words, tokenize

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

FILE = "data.pth"
data = torch.load(FILE)
input_size = data["input_size"]
hidden_size = data["hidden_size"]
output_size = data["output_size"]
all_words = data['all_words']
tags = data['tags']
model_state = data["model_state"]

model = NeuralNet(input_size, hidden_size, output_size).to(device)
model.load_state_dict(model_state)
model.eval()

bot_name = "Nisu"
context = {}

DESTINATIONS_FILE = 'static/destinations.json'

def load_destinations():
    try:
        with open(DESTINATIONS_FILE, 'r') as f:
            destinations_data = json.load(f)
            return [d['name'].lower() for d in destinations_data['destinations']]
    except FileNotFoundError:
        print(f"Error: {DESTINATIONS_FILE} not found.")
        return []

def load_intents(language):
    if language == "tagalog":
        file_path = 'data/intentsph.json'
    else:
        file_path = 'data/intents.json'

    with open(file_path, 'r') as json_data:
        return json.load(json_data)

def get_user_context(user_id):
    return context.get(user_id, None)

def set_user_context(user_id, new_context):
    context[user_id] = new_context

def get_response(msg, user_id="default_user", language='english'):
    intents = load_intents(language)
    possible_destinations = load_destinations()  
    sentence = tokenize(msg)
    X = bag_of_words(sentence, all_words)
    X = X.reshape(1, X.shape[0])
    X = torch.from_numpy(X).to(device)

    output = model(X)
    _, predicted = torch.max(output, dim=1)
    tag = tags[predicted.item()]
    
    probs = torch.softmax(output, dim=1)
    prob = probs[0][predicted.item()]

    print(f"Predicted probability for the tag '{tag}': {prob.item()}")

    confidence_threshold = 0.60

    if prob.item() > confidence_threshold:
        current_context = get_user_context(user_id)
        for intent in intents['intents']:
            if tag == intent["tag"]:
                suggestions = intent.get("suggestions", [])
                if tag == "location":
                    if current_context == "awaiting_location_confirmation":
                        set_user_context(user_id, None)
                        return {"response": f"Showing map for {msg}", "destination": msg, "secondary_response": None, "suggestions": []}
                    else:
                        normalized_destination = msg.lower().strip()
                        normalized_destinations = [dest.lower().strip() for dest in possible_destinations]
                        for destination in normalized_destinations:
                            if destination in normalized_destination:
                                return {"response": f"Can I access your location to show you the map for {destination}?", "destination": destination, "secondary_response": None, "suggestions": []}
                        return {"response": "Could not find your destination", "destination": None, "secondary_response": None, "suggestions": []}
                
                set_user_context(user_id, None)
                primary_response = random.choice(intent['responses'])
                secondary_response = random.choice(intent.get('secondary_responses', []))
                return {"response": primary_response, "destination": None, "secondary_response": secondary_response, "suggestions": suggestions}

    return {"response": "I don't understand.", "destination": None, "secondary_response": None, "suggestions": []}
