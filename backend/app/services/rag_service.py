import json
import math
import uuid
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document_embedding import DocumentEmbedding

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter  # type: ignore
    _HAS_LANGCHAIN = True
except ImportError:
    _HAS_LANGCHAIN = False


def _simple_chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """Fallback text chunker when langchain is not available."""
    if len(text) <= chunk_size:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


def _chunk_text(text: str) -> List[str]:
    if _HAS_LANGCHAIN:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            length_function=len,
        )
        return splitter.split_text(text)
    return _simple_chunk_text(text)


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two vectors in pure Python."""
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class RagService:

    @staticmethod
    def _get_embedding(text_content: str) -> List[float]:
        """Generate embedding using OpenAI API."""
        import openai

        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")

        if settings.ENDPOINT and (
            "azure.com" in settings.ENDPOINT
            or "cognitiveservices" in settings.ENDPOINT
        ):
            client = openai.AzureOpenAI(
                api_key=settings.OPENAI_API_KEY,
                api_version="2024-02-01",
                azure_endpoint=settings.ENDPOINT.split("/openai/")[0],
            )
        else:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        model = "text-embedding-3-small"
        try:
            response = client.embeddings.create(input=text_content, model=model)
            return response.data[0].embedding
        except Exception as e:
            print(f"Embedding error: {e}")
            raise

    @staticmethod
    def index_document(
        db: Session,
        patient_id: str,
        source_id: str,
        source_type: str,
        content: str,
    ):
        """Chunk text and store embeddings in the database."""
        if not content or not content.strip():
            return

        chunks = _chunk_text(content)

        for chunk in chunks:
            embedding = RagService._get_embedding(chunk)
            record = DocumentEmbedding(
                id=str(uuid.uuid4()),   # Always set explicitly to avoid SQLAlchemy sentinel issues
                patient_id=patient_id,
                source_record_id=source_id,
                source_type=source_type,
                content=chunk,
                embedding=json.dumps(embedding),
            )
            db.add(record)

        db.commit()

    @staticmethod
    def query_patient_history(
        db: Session,
        patient_id: str,
        query_text: str,
        limit: int = 5,
        similarity_threshold: float = 0.3,
    ) -> List[Dict[str, Any]]:
        """Find the most relevant historical chunks for a patient using cosine similarity."""
        if not query_text or not patient_id:
            return []

        query_embedding = RagService._get_embedding(query_text)

        # Fetch all embeddings for this patient
        rows = (
            db.query(DocumentEmbedding)
            .filter(DocumentEmbedding.patient_id == patient_id)
            .all()
        )

        if not rows:
            print(f"DEBUG: No embeddings found in DB for patient {patient_id}")
            return []

        # Score each chunk
        scored = []
        for row in rows:
            try:
                vec = json.loads(row.embedding)
                sim = _cosine_similarity(query_embedding, vec)
                if sim >= similarity_threshold:
                    scored.append((sim, row))
            except Exception as e:
                print(f"DEBUG: Skipping embedding row {row.id}: {e}")
                continue

        # Sort by similarity descending, take top N
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:limit]

        return [
            {
                "content": row.content,
                "source_type": row.source_type,
                "created_at": row.created_at.isoformat() if row.created_at else "",
                "similarity": float(sim),
            }
            for sim, row in top
        ]

    @staticmethod
    def get_augmented_context(
        db: Session, patient_id: str, query_text: str
    ) -> str:
        """Format retrieved history for prompt injection."""
        print(
            f"DEBUG: RAG searching for patient {patient_id} with query: {query_text[:80]}..."
        )
        relevant_chunks = RagService.query_patient_history(
            db, patient_id, query_text
        )

        if not relevant_chunks:
            print("DEBUG: RAG found NO relevant historical context.")
            return ""

        print(f"DEBUG: RAG found {len(relevant_chunks)} relevant history snippets.")
        context_parts = [
            "The following are relevant excerpts from the patient's historical records:"
        ]
        for i, chunk in enumerate(relevant_chunks):
            source_info = (
                f"[Source: {chunk['source_type'].upper()}, Date: {chunk['created_at']}]"
            )
            context_parts.append(
                f"--- Record {i + 1} {source_info} ---\n{chunk['content']}"
            )

        return "\n\n".join(context_parts)

    @staticmethod
    def query_all_patients(
        db: Session,
        query_text: str,
        limit: int = 15,
        similarity_threshold: float = 0.3,
    ) -> List[Dict[str, Any]]:
        """Find the most relevant historical chunks across ALL patients."""
        if not query_text:
            return []

        query_embedding = RagService._get_embedding(query_text)

        rows = db.query(DocumentEmbedding).all()

        if not rows:
            return []

        scored = []
        for row in rows:
            try:
                vec = json.loads(row.embedding)
                sim = _cosine_similarity(query_embedding, vec)
                if sim >= similarity_threshold:
                    scored.append((sim, row))
            except Exception:
                continue

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:limit]

        return [
            {
                "patient_id": str(row.patient_id),
                "content": row.content,
                "source_type": row.source_type,
                "created_at": row.created_at.isoformat() if row.created_at else "",
                "similarity": float(sim),
            }
            for sim, row in top
        ]

    @staticmethod
    def get_population_context(db: Session, query_text: str) -> str:
        """Format retrieved population history for prompt injection."""
        relevant_chunks = RagService.query_all_patients(db, query_text)

        if not relevant_chunks:
            return "No historical medical records found matching this disease/condition in the database."

        context_parts = [
            "The following are relevant excerpts from various patients in our database matching this condition:"
        ]
        for i, chunk in enumerate(relevant_chunks):
            source_info = f"[Patient UUID: {chunk['patient_id']}, Source: {chunk['source_type'].upper()}]"
            context_parts.append(
                f"--- Record {i + 1} {source_info} ---\n{chunk['content']}"
            )

        return "\n\n".join(context_parts)
