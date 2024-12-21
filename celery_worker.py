from celery import Celery
import json
import ssl
import certifi
import re
from typing import Dict, List, Any

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
    def process_text(text: str) -> Dict[str, Any]:
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
                "avgChunkLength": sum(len(chunk["text"]) for chunk in chunks) / len(chunks) if chunks else 0
            }
            
            return {
                "chunks": chunks,
                "metadata": metadata
            }
        except Exception as e:
            return {"error": str(e)}

# Initialize Celery with LavinMQ connection
app = Celery('text_processor',
             broker='amqps://wfnozibh:4T_jdMaK65ElpLne0WeKkrzWW0v3BARP@possum.lmq.cloudamqp.com/wfnozibh',
             broker_use_ssl={
                 'cert_reqs': ssl.CERT_REQUIRED,
                 'ca_certs': certifi.where(),
             })

# Configure Celery
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    worker_pool='solo',
    worker_concurrency=1,
    task_acks_late=False,
    worker_prefetch_multiplier=1
)

@app.task
def process_text(text: str) -> Dict[str, Any]:
    """Process the input text and return chunks with metadata.
    
    Args:
        text (str): The input text to process
        
    Returns:
        Dict[str, Any]: Processed text chunks with metadata
    """
    return TextProcessor.process_text(text)
