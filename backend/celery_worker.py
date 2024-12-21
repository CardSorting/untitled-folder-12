from celery import Celery
from redis import Redis
import os
from dotenv import load_dotenv
from language_utils.text_processor import TextProcessor
from language_utils import detect_language
import ssl

load_dotenv()

# Redis configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')
REDIS_SSL = os.getenv('REDIS_SSL', 'False').lower() == 'true'

# Redis URL configuration
REDIS_URL = f"redis{'s' if REDIS_SSL else ''}://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/0"
if REDIS_SSL:
    REDIS_URL += "?ssl_cert_reqs=CERT_NONE"

# Initialize Redis client
redis_client = Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    ssl=REDIS_SSL,
    ssl_cert_reqs=ssl.CERT_NONE if REDIS_SSL else None
)

# Initialize Celery
app = Celery('text_processor')
app.conf.update(
    broker_url=REDIS_URL,
    result_backend=REDIS_URL,
    broker_use_ssl={
        'ssl_cert_reqs': ssl.CERT_NONE
    } if REDIS_SSL else None,
    redis_backend_use_ssl={
        'ssl_cert_reqs': ssl.CERT_NONE
    } if REDIS_SSL else None
)

# Initialize text processor
text_processor = TextProcessor()

@app.task(name='celery_worker.process_text_task')
def process_text(text):
    """Process the input text using the language utilities."""
    try:
        # Detect language
        language = detect_language(text)
        
        # Analyze the text block
        block_info = text_processor.analyze_block_type(text)
        
        # Create optimal chunks for processing
        chunks = text_processor.create_optimal_chunks(text)
        
        return {
            'status': 'success',
            'language': language,
            'block_info': block_info,
            'chunks': chunks
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }
