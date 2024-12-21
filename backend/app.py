from flask import Flask, request, jsonify
from flask_cors import CORS
from celery_worker import app as celery_app
from celery.result import AsyncResult
from dotenv import load_dotenv
import json
import os
import redis

# Load environment variables
load_dotenv()

# Initialize Redis client
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST'),
    port=int(os.getenv('REDIS_PORT')),
    password=os.getenv('REDIS_PASSWORD'),
    ssl=True,
    ssl_cert_reqs=None
)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/process_text', methods=['POST'])
def handle_process_text():
    try:
        data = request.json
        text = data.get('text')
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Send task to Celery and get task ID
        task = celery_app.send_task('celery_worker.process_text_task', args=[text])
        return jsonify({"task_id": task.id}), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/task_status/<task_id>', methods=['GET'])
def task_status(task_id):
    try:
        # Get task result from Redis
        result_key = f"celery-task-meta-{task_id}"
        result_data = redis_client.get(result_key)
        
        if result_data:
            result = json.loads(result_data)
            if result['status'] == 'SUCCESS':
                return jsonify({
                    "status": "completed",
                    "result": result['result']
                })
            elif result['status'] == 'FAILURE':
                return jsonify({
                    "status": "failed",
                    "error": str(result.get('result', 'Unknown error'))
                })
        
        return jsonify({
            "status": "pending"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
