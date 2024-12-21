from celery import Celery
import json
import ssl
import certifi
import re
import uuid
import os
from typing import Dict, List, Any
from celery.signals import worker_init, worker_process_init
from dotenv import load_dotenv
import redis
from urllib.parse import urlparse

# Load environment variables from .env file
load_dotenv()

class TextProcessor:
    @staticmethod
    def prepare_text(text: str) -> str:
        # Basic normalization
        normalized = text
        normalized = re.sub(r'\s+', ' ', normalized)  # whitespace
        normalized = normalized.replace('"', '"').replace('"', '"')  # quotes
        normalized = re.sub(r'[—–]', '-', normalized)  # dashes
        normalized = re.sub(r'\.{3,}', '...', normalized)  # ellipsis
        normalized = re.sub(r'[\u200B-\u200D\uFEFF]', '', normalized)  # zero-width chars
        return normalized.strip()

    @staticmethod
    def split_into_blocks(text: str) -> List[str]:
        # Split text into semantic blocks
        blocks = []
        current_block = []
        
        for line in text.split('\n'):
            line = line.strip()
            if not line and current_block:
                blocks.append(' '.join(current_block))
                current_block = []
            elif line:
                current_block.append(line)
        
        if current_block:
            blocks.append(' '.join(current_block))
        
        return blocks

    @staticmethod
    def process_block(block: str) -> Dict[str, Any]:
        return {
            "text": block,
            "metadata": {
                "length": len(block),
                "wordCount": len(block.split()),
                "hasCode": bool(re.search(r'[{}\[\]()\'"]', block)),
                "hasNumbers": bool(re.search(r'\d', block))
            }
        }

    @staticmethod
    def process_text(text: str, task_id: str = None) -> Dict[str, Any]:
        try:
            # Prepare text
            prepared_text = TextProcessor.prepare_text(text)
            
            # Split into blocks
            blocks = TextProcessor.split_into_blocks(prepared_text)
            
            # Process each block
            chunks = [TextProcessor.process_block(block) for block in blocks]
            
            # Generate metadata
            metadata = {
                "totalChunks": len(chunks),
                "totalLength": sum(len(chunk["text"]) for chunk in chunks),
                "avgChunkLength": sum(len(chunk["text"]) for chunk in chunks) / len(chunks) if chunks else 0,
                "taskId": task_id
            }
            
            return {
                "chunks": chunks,
                "metadata": metadata
            }
        except Exception as e:
            return {"error": str(e), "taskId": task_id}

# Initialize Redis client
redis_host = os.getenv('REDIS_HOST')
redis_port = os.getenv('REDIS_PORT')
redis_password = os.getenv('REDIS_PASSWORD')

redis_client = redis.Redis(
    host=redis_host,
    port=int(redis_port),
    password=redis_password,
    ssl=True,
    ssl_cert_reqs=None
)

# Configure Celery to use Redis
app = Celery('text_processor')

# Build Redis URL with the correct format
redis_connection = f"rediss://:{redis_password}@{redis_host}:{redis_port}/0?ssl_cert_reqs=CERT_NONE"

app.conf.update(
    broker_url=redis_connection,
    result_backend=redis_connection,
    broker_use_ssl={
        'ssl_cert_reqs': None
    },
    redis_backend_use_ssl={
        'ssl_cert_reqs': None
    },
    task_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    worker_pool='solo',
    worker_concurrency=1,
    task_acks_late=False,
    worker_prefetch_multiplier=1,
    task_track_started=True,
    task_ignore_result=False,
)

@app.task(name='celery_worker.process_text_task', bind=True)
def process_text_task(self, text: str) -> Dict[str, Any]:
    print(f"Processing task {self.request.id}")
    task_id = self.request.id
    processor = TextProcessor()
    result = processor.process_text(text, task_id)
    print(f"Task {task_id} result: {result}")
    
    # Store result in Redis manually since we're using in-memory broker
    redis_client.set(f"celery-task-meta-{task_id}", json.dumps({
        'status': 'SUCCESS',
        'result': result,
        'traceback': None,
        'children': []
    }))
    
    return result

# Generate a unique worker ID at startup
WORKER_ID = str(uuid.uuid4())

@worker_init.connect
def worker_init_handler(sender=None, **kwargs):
    print(f"Worker initialized with ID: {WORKER_ID}")

@worker_process_init.connect
def worker_process_init_handler(sender=None, **kwargs):
    print(f"Worker process initialized for worker: {WORKER_ID}")

@app.task(bind=True, max_retries=3)
def process_text(self, text: str) -> Dict[str, Any]:
    """Process the input text and return chunks with metadata.
    
    Args:
        text (str): The input text to process
        
    Returns:
        Dict[str, Any]: Processed text chunks with metadata
    """
    try:
        task_id = str(self.request.id)
        worker_info = {
            "worker_id": WORKER_ID,
            "task_id": task_id,
            "retries": self.request.retries
        }
        print(f"Processing task with info: {json.dumps(worker_info)}")
        
        result = TextProcessor.process_text(text, task_id)
        result["worker_info"] = worker_info
        return result
        
    except Exception as exc:
        print(f"Error processing task {self.request.id}: {str(exc)}")
        self.retry(exc=exc, countdown=2 ** self.request.retries)
