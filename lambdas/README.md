# AI Bot Python - Conversational AI System

A Python-based serverless conversational AI system for multi-service document management, built with AWS Lambda and powered by Amazon Bedrock.

## Overview

This project provides a comprehensive AI-powered chat system that can process documents, store embeddings, and engage in intelligent conversations based on uploaded content. The system is designed to handle PDF documents, extract text, create embeddings for semantic search, and provide context-aware responses using large language models.

## Features

- **Document Upload & Processing**: Upload PDF documents with automatic text extraction
- **Embedding Generation**: Create vector embeddings using Amazon Titan models
- **Semantic Search**: FAISS-powered similarity search for relevant document retrieval
- **Conversational AI**: Context-aware conversations using Claude 3 Sonnet
- **Multi-Service Architecture**: Modular serverless functions for different operations
- **Real-time Processing**: S3-triggered automatic document processing
- **RESTful API**: HTTP endpoints for all operations

## Architecture

### Core Components

- **AWS Lambda Functions**: Serverless compute for all operations
- **Amazon Bedrock**: LLM inference using Claude 3 Sonnet
- **Amazon S3**: Document storage and processing triggers
- **DynamoDB**: Metadata and conversation storage
- **FAISS**: Vector similarity search
- **AWS Textract**: Document text extraction

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload-data` | POST | Upload documents for processing |
| `/conversation` | POST | Engage in conversation with the AI |
| `/messages` | GET | Retrieve conversation messages |
| `/documents` | GET | List uploaded documents |
| `/document/{document_id}` | GET | Get single document with presigned S3 URL |
| `/services` | GET | Get available services with optional filtering |
| `/services` | POST | Create a new service |

## Project Structure

```
src/
├── config/
│   ├── __init__.py
│   └── environment.py          # Environment configuration
├── functions/
│   ├── converse/               # AI conversation handler
│   ├── create_service/         # Service creation
│   ├── get_document/           # Single document retrieval with presigned URL
│   ├── get_documents/          # Document listing
│   ├── get_messages/           # Message retrieval
│   ├── get_services/           # Service listing
│   ├── process_embeddings/     # Document processing & embeddings
│   └── upload_document/        # Document upload handler
└── shared/
    ├── enums.py               # Common enumerations
    ├── interfaces.py          # Data interfaces
    ├── services/
    │   ├── dynamodb_service.py  # DynamoDB operations
    │   ├── faiss_service.py     # Vector search operations
    │   ├── pdf_service.py       # PDF processing
    │   └── s3_service.py        # S3 operations and presigned URLs
    └── utils/
        └── responses.py         # HTTP response utilities
```

## Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ (for Serverless Framework)
- AWS CLI configured
- Serverless Framework

### Environment Variables

Create a `.env` file with the following variables:

```env
# AWS Configuration
ACCESS_KEY_ID=your_access_key
SECRET_ACCESS_KEY=your_secret_key
REGION=us-east-1
STATIC_AUTH_TOKEN=your_auth_token

# AWS Resources
S3_BUCKET_NAME=your-s3-bucket
EMBEDDING_MODEL_ID=amazon.titan-embed-text-v1

# DynamoDB Tables
CONVERSATION_TABLE=ia-chat
MESSAGE_TABLE=ia-mensaje
DOCUMENT_TABLE=ia-documento
SERVICE_TABLE=ia-servicio

# Processing Configuration
EMBEDDING_BATCH_SIZE=5
DELAY_BETWEEN_BATCHES=3000
MAX_EMBEDDING_RETRIES=5
INITIAL_RETRY_DELAY=2000
```

### Dependencies Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Serverless Framework globally
npm install -g serverless

# Install Node.js dependencies
npm install
```

## Deployment

### Deploy to AWS

```bash
# Deploy to development stage
npm run deploy

# Deploy to specific stage
serverless deploy --stage prod

# Deploy specific function
serverless deploy function --function converse
```

### Remove Deployment

```bash
npm run remove
```

## Usage

### Document Upload

**Endpoint:** `POST /upload-data`  
**Headers:** `Authorization: Bearer your-token`

**Request Body:**
```json
{
  "agent_id": "uuid-of-existing-service",
  "file_name": "document.pdf"
}
```

**Response:**
```json
{
  "presigned_url": "https://s3.amazonaws.com/bucket/service-id/document.pdf?...",
  "pdf_key": "service-id/document.pdf",
  "message": "Upload URL generated successfully. Use PUT method to upload the file to the presigned URL."
}
```

### Start Conversation

**Endpoint:** `POST /conversation`  
**Headers:** `Authorization: Bearer your-token`

**Request Body:**
```json
{
  "message": "What is the main topic of the uploaded document?",
  "conversation_id": "optional-conversation-uuid",
  "agent_id": "service-uuid"
}
```

**Response:**
```json
{
  "answer": "Based on the uploaded document, the main topic is...",
  "contexts": [
    {
      "content": "Relevant document excerpt...",
      "score": 0.8924,
      "metadata": {
        "page": 1,
        "chunk_id": "chunk-123"
      },
      "rank": 1
    }
  ],
  "search_info": {
    "queries_used": ["main topic document"],
    "total_documents_found": 15,
    "contexts_used": 7,
    "context_length": 2048,
    "agent_id": "service-uuid",
    "agent_name": "Document Analysis Service"
  }
}
```

### Get Messages

**Endpoint:** `GET /messages`  
**Headers:** `Authorization: Bearer your-token`  
**Query Parameters:** `?user=string&agent_id=uuid&limit=100`

**Response:**
```json
{
  "user": "user123",
  "agent_id": "service-uuid",
  "total_messages": 6,
  "messages": [
    {
      "role": "user",
      "content": "What is the main topic of the uploaded document?",
      "timestamp": "2025-07-19T10:30:00Z",
      "metadata": {}
    },
    {
      "role": "assistant", 
      "content": "Based on the uploaded document, the main topic is...",
      "timestamp": "2025-07-19T10:30:15Z",
      "metadata": {
        "contexts_used": 7,
        "processing_time": 2.3
      }
    }
  ]
}
```

### Get Documents

**Endpoint:** `GET /documents`  
**Headers:** `Authorization: Bearer your-token`  
**Query Parameters:** `?agent_id=uuid`

**Response:**
```json
{
  "agent_id": "service-uuid",
  "total_documents": 3,
  "documents": [
    {
      "id": "doc-uuid-1",
      "file_name": "annual-report.pdf",
      "agent_id": "service-uuid",
      "status": "completed",
      "s3_key": "service-uuid/annual-report.pdf",
      "created_at": "2025-07-19T09:00:00Z",
      "updated_at": "2025-07-19T09:05:00Z",
      "processed_chunks": 45,
      "metadata": {
        "file_size": 2048576,
        "processing_duration": 300
      }
    }
  ]
}
```

### Get Document

**Endpoint:** `GET /document/{document_id}`  
**Headers:** `Authorization: Bearer your-token`  
**Path Parameters:** `document_id` - The unique identifier of the document  
**Query Parameters (Optional):** `?expiration=3600` - Presigned URL expiration time in seconds (60-604800)

**Description:** Retrieves a single document's metadata along with a presigned S3 URL for direct file access.

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc-uuid-1",
    "file_name": "annual-report.pdf",
    "agent_id": "service-uuid",
    "status": "completed",
    "s3_key": "service-uuid/annual-report.pdf",
    "created_at": "2025-07-19T09:00:00Z",
    "updated_at": "2025-07-19T09:05:00Z",
    "processed_chunks": 45,
    "error_message": null,
    "metadata": {
      "file_size": 2048576,
      "processing_duration": 300
    },
    "presigned_url": "https://s3.amazonaws.com/bucket/path/to/file?X-Amz-Algorithm=...",
    "presigned_url_expires_in": 3600
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Document not found with ID: invalid-uuid"
}
```

```json
{
  "success": false,
  "message": "Document file not found in S3: service-uuid/missing-file.pdf"
}
```

```json
{
  "success": false,
  "message": "Failed to generate presigned URL for document: doc-uuid-1"
}
```

### Get Services

**Endpoint:** `GET /services`  
**Headers:** `Authorization: Bearer your-token`  
**Query Parameters:** `?action=user_services|available_services|statistics`

#### Get All Services (Default)
**Query:** `?action=user_services` or no action parameter

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "id": "service-uuid-1",
      "name": "Financial Analysis Service",
      "description": "Service for analyzing financial documents",
      "status": "active",
      "created_at": "2025-07-19T08:00:00Z",
      "updated_at": "2025-07-19T08:00:00Z",
      "document_count": 5,
      "metadata": {}
    }
  ],
  "total": 1
}
```

#### Get Available Services
**Query:** `?action=available_services`  
Returns only services that have at least one completed document.

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "id": "service-uuid-1",
      "name": "Financial Analysis Service",
      "description": "Service for analyzing financial documents",
      "status": "active",
      "created_at": "2025-07-19T08:00:00Z",
      "updated_at": "2025-07-19T08:00:00Z",
      "document_count": 5,
      "completed_documents": 3,
      "metadata": {}
    }
  ],
  "total": 1
}
```

#### Get Service Statistics
**Query:** `?action=statistics`  
Returns comprehensive statistics about all services.

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total_services": 3,
    "active_services": 2,
    "inactive_services": 1,
    "total_documents": 15,
    "documents_by_status": {
      "pending": 2,
      "processing": 1,
      "completed": 10,
      "failed": 2
    },
    "services_with_documents": 2,
    "services_with_conversations": 1,
    "active_percentage": 66.67,
    "services_with_documents_percentage": 66.67,
    "services_with_conversations_percentage": 33.33,
    "service_breakdown": [
      {
        "id": "service-uuid-1",
        "name": "Financial Analysis Service",
        "status": "active",
        "document_count": 5,
        "documents_by_status": {
          "pending": 0,
          "processing": 0,
          "completed": 5,
          "failed": 0
        },
        "created_at": "2025-07-19T08:00:00Z",
        "updated_at": "2025-07-19T08:00:00Z"
      }
    ]
  }
}
```

### Create Service

**Endpoint:** `POST /services`  
**Headers:** `Authorization: Bearer your-token`

**Request Body:**
```json
{
  "name": "Financial Analysis Service",
  "description": "Service for analyzing financial documents and reports"
}
```

**Response:**
```json
{
  "id": "service-uuid",
  "name": "Financial Analysis Service",
  "description": "Service for analyzing financial documents and reports",
  "status": "active",
  "created_at": "2025-07-19T08:00:00Z",
  "updated_at": "2025-07-19T08:00:00Z",
  "document_count": 0,
  "metadata": {}
}
```

## Key Dependencies

- **PyPDF2**: PDF text extraction
- **faiss-cpu**: Vector similarity search
- **langchain**: LLM framework and document processing
- **langchain-aws**: AWS Bedrock integration
- **pydantic**: Data validation and serialization

## Development

### Code Quality

```bash
# Run linting
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

### Local Development

The project is designed for serverless deployment, but individual functions can be tested locally using the Serverless Framework offline plugins.

## Features in Detail

### Document Processing Pipeline

1. **Upload**: Documents are uploaded via the `/upload-data` endpoint
2. **Storage**: Files are stored in S3 with metadata in DynamoDB
3. **Processing**: S3 triggers automatic processing via Lambda
4. **Text Extraction**: PyPDF2 extracts text from PDF documents
5. **Embedding Generation**: Text is split and embedded using Amazon Titan
6. **Vector Storage**: Embeddings are stored using FAISS for similarity search

### Conversation Flow

1. **Query Processing**: User queries are cleaned and optimized
2. **Semantic Search**: FAISS finds relevant document chunks
3. **Context Assembly**: Relevant context is assembled for the LLM
4. **AI Response**: Claude 3 Sonnet generates contextual responses
5. **Conversation Storage**: Messages are stored in DynamoDB

## Monitoring & Logging

- CloudWatch logs for all Lambda functions
- Custom metrics for processing times and error rates
- Structured logging for better observability

## Security

- Bearer token authentication
- IAM roles with least privilege principles
- Encrypted data at rest and in transit
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is part of the CPA Vision DevOps AI system.

## Support

For issues and questions, please refer to the project documentation or contact the development team.