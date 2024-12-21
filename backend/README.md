# Text Processor Backend Services

This directory contains the backend services for the Text Processor Chrome Extension.

## Components

### Flask API Server (`app.py`)
- Handles incoming requests from the Chrome extension
- Processes text using Celery workers
- Provides RESTful API endpoints

### Celery Worker (`celery_worker.py`)
- Processes text asynchronously
- Handles text normalization and block splitting
- Generates metadata for processed text

## Local Development

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.template .env
# Edit .env with your configuration
```

4. Start services using Docker Compose:
```bash
docker-compose up
```

## AWS Deployment

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed locally

### Initial Setup

1. Initialize Elastic Beanstalk application (first time only):
```bash
eb init text-processor --platform "Docker running on 64bit Amazon Linux 2" --region us-west-2
```

2. Create the environment (first time only):
```bash
eb create text-processor-env --single --instance-type t2.micro
```

3. Create ECR repository (first time only):
```bash
aws ecr create-repository --repository-name text-processor-worker --region us-west-2
```

### Deployment

1. Configure your AWS credentials

2. Run the deployment script:
```bash
./deploy.sh
```

The deployment script will:
- Deploy the Flask application to Elastic Beanstalk
- Build and push the worker image to ECR
- Update the worker EC2 instance

### Monitoring

1. CloudWatch Dashboard
- Access the CloudWatch dashboard named "text-processor-dashboard"
- View metrics for both Flask and Celery components

2. Logs
- Flask logs: `eb logs`
- Worker logs: Access through CloudWatch Logs

3. Alerts
- CPU utilization alerts are configured through SNS
- Check the SNS topic "text-processor-alerts" for notifications

### Security

1. Environment Variables
- Store sensitive credentials in AWS Parameter Store
- Use `.env` file for local development only

2. Network Security
- Services run within a VPC
- Security groups control access
- SSL/TLS encryption for all communications

3. Monitoring and Logging
- CloudWatch metrics and alarms
- CloudWatch Logs for centralized logging
- SNS notifications for alerts

## Troubleshooting

1. Check service status:
```bash
eb status
aws cloudformation describe-stacks --stack-name text-processor-worker
```

2. View logs:
```bash
eb logs
aws logs get-log-events --log-group-name /aws/ec2/text-processor-worker
```

3. Common Issues
- Connection timeouts: Check security group rules
- Worker not processing: Verify CloudAMQP connection
- Deployment failures: Check EB deployment logs

## Contributing

1. Follow the existing code structure
2. Update documentation as needed
3. Test locally before deploying
4. Use the deployment script for consistent deployments
