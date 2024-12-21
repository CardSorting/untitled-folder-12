#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env

# Configure AWS credentials
export AWS_DEFAULT_REGION=us-west-2
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Deploy Flask application to Elastic Beanstalk
echo "Deploying Flask application..."
eb deploy text-processor-env

# Build and push worker image to ECR
echo "Building worker image..."
docker build -t text-processor-worker -f Dockerfile.worker .

# Get the ECR login token and login
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com

# Tag and push the worker image
docker tag text-processor-worker:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/text-processor-worker:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/text-processor-worker:latest

# Update the worker EC2 instance
WORKER_INSTANCE_ID=$(aws cloudformation describe-stacks --stack-name text-processor-worker --query 'Stacks[0].Outputs[?OutputKey==`WorkerInstanceId`].OutputValue' --output text)

# Send SSM command to update the worker container
aws ssm send-command \
    --instance-ids ${WORKER_INSTANCE_ID} \
    --document-name "AWS-RunShellScript" \
    --parameters commands=["docker pull ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/text-processor-worker:latest",
                         "docker stop text-processor-worker || true",
                         "docker rm text-processor-worker || true",
                         "docker run -d --name text-processor-worker --restart unless-stopped \
                          -e CELERY_BROKER_URL=${CELERY_BROKER_URL} \
                          -e AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION} \
                          ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/text-processor-worker:latest"]

echo "Deployment complete!"
