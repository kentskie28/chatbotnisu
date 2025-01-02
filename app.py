import json
import subprocess
import os
import time
import random
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from chat import get_response

app = Flask(__name__)
CORS(app)

app.secret_key = 'admin'
SUPERUSER_CREDENTIALS = {
    "username": "admin",
    "password": "admin"
}
INTENTS_FILE = 'intents.json'
DESTINATIONS_FILE = 'destinations.json'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_FILE = os.path.join(BASE_DIR, 'data', 'intents.json')
INTENTSPH_FILE = os.path.join(BASE_DIR, 'data', 'intentsph.json')
DESTINATIONS_FILE = os.path.join(BASE_DIR, 'static', 'destinations.json')

with open(DESTINATIONS_FILE, 'r') as f:
    destinations_data = json.load(f)
    print(f"Destinations data loaded: {destinations_data}")
with open(INTENTSPH_FILE, 'r') as f:
        intents = json.load(f)

@app.get("/")
def index_get():
    return render_template("base.html", timestamp=time.time())

@app.post("/predict")
def predict():
    data = request.get_json()
    text = data.get("message")
    language = data.get("language", "english",)
    print(f"Language selected: {language}")

    response_data = get_response(text, user_id="default_user", language=language)
    if "destination" in response_data and response_data["destination"]:
        print(f"Destination resolved: {response_data['destination']}")
    else:
        print("No destination found in the bot's response.")

    message = {
        "answer": response_data["response"],
        "secondary_response": response_data.get("secondary_response"),
        "destination": response_data.get("destination"),
        "context": response_data.get("context"),
        "suggestion": response_data.get("suggestions", []) 
    }
    return jsonify(message)

@app.route('/get_pattern', methods=['POST'])
def get_pattern():
    tag = request.json.get("tag")
    
    with open(INTENTS_FILE, 'r') as f:
        intents = json.load(f)


    
    for intent in intents['intents']:
        if intent['tag'].lower() == tag.lower():
            pattern = random.choice(intent['patterns']) 
            return jsonify({"pattern": pattern})
    
    return jsonify({"pattern": None})


@app.post("/get_destination")
def get_destination():
    data = request.get_json()
  

    destination_name = data.get("destination").lower().strip()
    print(f"Looking for destination: {destination_name}")  
    matching_destinations = [
        d for d in destinations_data['destinations']
        if destination_name in d['name'].lower().strip()
    ]
    
    if matching_destinations:
        destination = matching_destinations[0]  
        print(f"Found destination: {destination}")  
        return jsonify({
            'lat': destination['destinationlat'],
            'lon': destination['destinationlon'],
            'name': destination['name']
        })
    else:
        print(f"Destination not found: {destination_name}") 
    
    return jsonify({'lat': None, 'lon': None})

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/get_data', methods=['GET'])
def get_data():
    try:
        with open(INTENTS_FILE, 'r') as f:
            intents = json.load(f)
        return jsonify({'intents': intents})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update_intents', methods=['POST'])
def update_intents():
    try:
        data = request.json
        with open(INTENTS_FILE, 'w') as f:
            json.dump(data, f, indent=4)
        return jsonify({'message': 'Intents updated successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == SUPERUSER_CREDENTIALS['username'] and password == SUPERUSER_CREDENTIALS['password']:
            session['superuser'] = True
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error="Invalid credentials!")
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('superuser', None)
    return redirect(url_for('index_get'))

@app.route('/superuser_dashboard')
def superuser_dashboard():
    if not session.get('superuser'):
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/add-intent', methods=['POST'])
def add_intent():
    data = request.get_json()
    try:
        with open(INTENTS_FILE, 'r') as file:
            intents = json.load(file)
        
        new_intent = {
            "tag": data.get('tag', ''),
            "patterns": data.get('patterns', []),
            "responses": data.get('responses', []),
            "secondary_responses": data.get('secondary_responses', []),
            "context": data.get('context', ''),
            "suggestions": data.get('suggestions', [])
        }

        intents['intents'].append(new_intent)

        with open(INTENTS_FILE, 'w') as file:
            json.dump(intents, file, indent=4)

        return jsonify({"success": True, "message": "Intent added successfully!"})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"success": False, "message": "Failed to add intent."})
    
@app.route('/api/intents', methods=['GET'])
def get_intents():
    try:
        with open('data/intents.json', 'r') as file:
            intents_data = json.load(file)
        print("Intents data:", intents_data)
        return jsonify(intents_data['intents'])  
    except FileNotFoundError:
        return jsonify({"error": "intents.json file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/view_map")
def view_map():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        lat, lon = None, None  # Handle missing data gracefully
    return render_template("map.html", lat=lat, lon=lon)

@app.route('/settings', methods=['GET'])
def settings_page():
    return render_template('settings.html')

@app.route('/update_settings', methods=['POST'])
def update_settings():
    data = request.json
    title = data.get('title', 'NISU AI')
    nav_color = data.get('navColor', '#00258b')
    content = data.get('content', '')

    with open('templates/index.html', 'r') as file:
        html = file.read()

    updated_html = html.replace('<title>NISU AI</title>', f'<title>{title}</title>')

    updated_html = updated_html.replace(
        'background-color: rgb(0, 36, 199);', f'background-color: {nav_color};'
    )

    if '<!-- CONTENT_PLACEHOLDER -->' in updated_html:
        updated_html = updated_html.replace(
            '<!-- CONTENT_PLACEHOLDER -->', content
        )

    with open('templates/index.html', 'w') as file:
        file.write(updated_html)

    return jsonify({'message': 'Settings updated successfully!'})

@app.route('/edit_base', methods=['GET', 'POST'])
def edit_base():
    base_path = 'templates/base.html'
    if request.method == 'POST':
        # Save the updated HTML
        updated_content = request.form.get('html_content')
        with open(base_path, 'w') as file:
            file.write(updated_content)
        return jsonify({"message": "Saved successfully!"})
    else:
        # Load the current HTML content
        with open(base_path, 'r') as file:
            html_content = file.read()
        return render_template('base.html', content=html_content)
    
@app.route('/save_base_html', methods=['POST'])
def save_base_html():
    data = request.get_json()
    html_content = data.get('htmlContent')
    
    with open('templates/base.html', 'r') as file:
        base_html = file.read()

    # Find and replace the sections in the HTML file
    updated_html = base_html  # Assuming the full base.html template is preserved
    updated_html = updated_html.replace('<section class="vision">', html_content)  # You may need to customize this part

    # Save the updated HTML back to the file
    with open('templates/base.html', 'w') as file:
        file.write(updated_html)

    return jsonify({"success": True})
@app.route('/train', methods=['GET', 'POST'])
def train_model():
    if request.method == 'POST':
        try:
            # Execute the train.py script
            result = subprocess.run(['python', 'train.py'], capture_output=True, text=True)
            
            output = result.stdout
            error = result.stderr
            
            # Debug: Log the result of the training script
            print("Training output:", output)
            print("Training error:", error)
            
            if result.returncode == 0:
                return jsonify({"success": True, "message": "Training completed successfully!", "output": output})
            else:
                return jsonify({"success": False, "message": "Error during training.", "error": error})
        
        except Exception as e:
            print("Exception occurred:", e)
            return jsonify({"success": False, "message": str(e)})

    # If it's a GET request, render the training page
    return render_template('train.html')
@app.route('/feedback', methods=['GET', 'POST'])
def feedback():
    return render_template('feedback.html')

FEEDBACK_FILE = 'data/feedback.json'

@app.route('/view_feedback')
def view_feedback():
    try:
        # Define the path for the feedback.json file
        feedback_file = 'data/feedback.json'
        
        # Check if the feedback.json file exists
        if os.path.exists(feedback_file):
            with open(feedback_file, 'r') as f:
                feedback = json.load(f)  # Load data from the JSON file
            print(feedback)  # Debugging line to ensure data is loaded correctly
        else:
            feedback = []  # Return an empty list if the file doesn't exist

        # Render the template with the feedback data
        return render_template('feedbackdata.html', feedback=feedback)
    except Exception as e:
        # In case of an error, log and return a JSON error response
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    try:
        feedback_data = request.get_json()
        
        if os.path.exists(FEEDBACK_FILE):
            with open(FEEDBACK_FILE, 'r') as f:
                feedback = json.load(f)
        else:
            feedback = []
        
        feedback.append(feedback_data)
        
        with open(FEEDBACK_FILE, 'w') as f:
            json.dump(feedback, f, indent=4)
        
        return jsonify({"success": True, "message": "Feedback submitted successfully!"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    
app.run(debug=True, host="0.0.0.0", port=5000)
