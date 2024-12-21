# Text-to-Speech Chrome Extension

This Chrome extension allows you to convert selected text to speech using the web's native speech synthesis API with enhanced robustness and performance.

## Features

- Right-click menu integration for easy access
- Uses native web speech synthesis (no external APIs required)
- Advanced task queue system for reliable processing
- Non-blocking concurrent processing
- Intelligent text chunking with natural breaks
- Real-time progress tracking
- Floating control panel with play/pause/stop controls
- Adjustable speech rate in real-time
- Memory-efficient processing
- Works on any webpage

## Technical Improvements

### Task Processing System
- Non-blocking task queue implementation
- Concurrent processing of text and speech
- Smart state management without locks
- Automatic task prioritization
- Graceful error recovery

### Text Processing
- Intelligent sentence and phrase detection
- Natural break point identification
- Optimal chunk size management
- Memory-efficient text handling
- Worker-based processing to prevent UI blocking

### Speech Synthesis
- Queue-based speech management
- Smooth transitions between chunks
- Automatic rate adjustment
- Resource cleanup and management
- Error recovery with continuation

## Architecture

The extension uses a sophisticated multi-worker architecture:
1. Task Queue Worker: Manages processing tasks and state
2. Content Script: Handles UI and speech synthesis
3. Background Script: Manages context menu and messaging

### Processing Flow
1. Text selection → Task Queue
2. Task Queue → Chunk Processing
3. Chunks → Speech Queue
4. Speech Queue → Synthesis
5. Real-time Progress Updates

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select this extension's directory

## Usage

1. Select any text on a webpage
2. Right-click the selected text
3. Click "Read Selected Text" from the context menu
4. Use the floating control panel to:
   - Pause/Resume speech
   - Stop speech
   - Adjust speech rate in real-time
   - Monitor progress

## Performance

- Non-blocking operation for smooth UI
- Efficient memory usage through streaming
- Smart task scheduling
- Minimal CPU usage
- Automatic resource management
- Progressive text processing

## AWS Deployment

### Prerequisites
- AWS Account with Elastic Beanstalk access
- AWS CLI installed and configured
- Docker installed locally

### Local Development
1. Build and test locally using Docker Compose:
```bash
docker-compose build
docker-compose up
```

### AWS Deployment Steps

#### 1. Flask Server Deployment (Elastic Beanstalk)
```bash
# Initialize Elastic Beanstalk application (first time only)
eb init text-processor --platform "Docker running on 64bit Amazon Linux 2" --region us-west-2

# Create the environment (first time only)
eb create text-processor-env --single --instance-type t2.micro

# Deploy updates
eb deploy
```

#### 2. Celery Worker Deployment (EC2)
1. Launch an EC2 instance (t2.micro recommended for testing)
2. SSH into the instance
3. Install Docker:
```bash
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user
```
4. Pull and run the worker container:
```bash
docker build -t text-processor-worker -f Dockerfile.worker .
docker run -d \
  --name text-processor-worker \
  --restart unless-stopped \
  text-processor-worker
```

### Environment Variables
- `FLASK_ENV`: Set to 'production' in AWS
- `CELERY_BROKER_URL`: Your CloudAMQP URL
- `FLASK_APP`: Set to 'app.py'

### Monitoring
- View Flask server logs: `eb logs`
- View worker logs: `docker logs text-processor-worker`

### Security Notes
- Store sensitive credentials in AWS Parameter Store
- Use AWS VPC for enhanced security
- Enable AWS CloudWatch for monitoring
