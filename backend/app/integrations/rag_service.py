import json
import boto3

from app.config import env


s3vectors_client = boto3.client(
    "s3vectors",
    region_name=env.region,
    aws_access_key_id=env.aws_access_key_id,
    aws_secret_access_key=env.aws_secret_access_key,
)

bedrock_embed_client = boto3.client(
    "bedrock-runtime",
    region_name=env.region,
    aws_access_key_id=env.aws_access_key_id,
    aws_secret_access_key=env.aws_secret_access_key,
)
class RAGService:
    """Handles retrieval-augmented generation via S3 Vectors and Bedrock embeddings."""

    def build_context(self, agent_id: str, message: str) -> tuple[str | None, list]:
        """Query S3 Vectors for documents belonging to agent_id, relevant to message.
        Returns (context_string, used_contexts_list)."""
        try:
            embed_response = bedrock_embed_client.invoke_model(
                modelId="amazon.titan-embed-text-v2:0",
                body=json.dumps({"inputText": message}),
            )
            embedding = json.loads(embed_response["body"].read())["embedding"]

            vec_response = s3vectors_client.query_vectors(
                vectorBucketName="sales-agent-ai-vectors",
                indexName="documents-index",
                queryVector={"float32": embedding},
                topK=5,
                filter={"agent_id": agent_id},
                returnDistance=True,
                returnMetadata=True,
            )
            vectors = vec_response.get("vectors", [])
            print(f"[CONTEXT] Agent {agent_id}: found {len(vectors)} relevant documents")

            context_parts = []
            used_contexts = []
            for i, doc in enumerate(vectors):
                metadata = doc.get("metadata", {})
                source_text = metadata.get("source_text", "")
                document_name = metadata.get("source", f"Document_{i + 1}")
                context_parts.append(f'[Documento origen "{document_name}": \n {source_text}]')
                used_contexts.append({"content": source_text, "metadata": metadata, "rank": i + 1})

            if context_parts:
                return "### Contexto base de conocimientos \n\n" + "\n\n".join(context_parts), used_contexts
            return None, []

        except Exception as e:
            print(f"[CONTEXT] Failed to build context for agent {agent_id}: {e}")
            return None, []


rag_service = RAGService()
