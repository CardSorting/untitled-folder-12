from flask import Flask, request, jsonify
from flask_cors import CORS
from celery_worker import process_text

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/process_text', methods=['POST'])
def handle_process_text():
    try:
        data = request.json
        text = data.get('text')
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Send task to Celery
        result = process_text.delay(text)
        processed_result = result.get(timeout=30)  # Wait for result with timeout
        return jsonify(processed_result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
