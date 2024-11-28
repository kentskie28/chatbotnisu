import json
import random
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from chat import get_response
app = Flask(__name__)
CORS(app)

# Load destinations data for location-based queries
with open('static/destinations.json', 'r') as f:
    destinations_data = json.load(f)

@app.get("/")
def index_get():
    return render_template("base.html")

@app.post("/predict")
def predict():
    data = request.get_json()
    text = data.get("message")
    language = data.get("language", "english")

    response_data = get_response(text, language)

    # Include suggestions in the response
    message = {
        "answer": response_data["response"],
        "secondary_response": response_data.get("secondary_response"),
        "destination": response_data.get("destination"),
        "suggestion": response_data.get("suggestions", []) 
    }
    return jsonify(message)

@app.route('/get_pattern', methods=['POST'])
def get_pattern():
    tag = request.json.get("tag")
    print(f"Received request for tag: {tag}")  # Debug log
    
    # Load intents from the JSON file
    with open('intents.json', 'r') as f:
        intents = json.load(f)
    
    # Find the intent matching the provided tag
    for intent in intents['intents']:
        if intent['tag'].lower() == tag.lower():
            print(f"Found patterns for tag {tag}: {intent['patterns']}")  # Debug log
            pattern = random.choice(intent['patterns'])  # Choose a random pattern
            return jsonify({"pattern": pattern})
    
    print(f"No patterns found for tag: {tag}")  # Debug log
    return jsonify({"pattern": None})  # Return None if no matching tag is found


@app.post("/get_destination")
def get_destination():
    data = request.get_json()
    destination_name = data.get("destination").lower()
    matching_destinations = [
        d for d in destinations_data['destinations']
        if destination_name in d['name'].lower()
    ]

    if matching_destinations:
        return jsonify({
            'lat': matching_destinations['destinationlat'],
            'lon': matching_destinations['destinationlon'],
            'name': matching_destinations['name']
        })
    else:
        print(f"waay destination")
    
    return jsonify({'lat': None, 'lon': None})
if __name__ == "__main__":
    app.run(debug=True)