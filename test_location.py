import json

DESTINATIONS_FILE = 'static/destinations.json'

def load_destinations():
    """Load destination names from the destinations.json file."""
    try:
        with open(DESTINATIONS_FILE, 'r') as f:
            destinations_data = json.load(f)
            return [d['name'].lower() for d in destinations_data['destinations']]
    except FileNotFoundError:
        print(f"Error: {DESTINATIONS_FILE} not found.")
        return []
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

if __name__ == "__main__":
    possible_destinations = load_destinations()
    if possible_destinations:
        print("Possible Destinations Loaded Successfully:", possible_destinations)
    else:
        print("No destinations found or error in loading.")
