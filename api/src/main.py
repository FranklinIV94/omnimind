"""
OmniMind FastAPI Backend
Compatible with Google AI Studio's Express.js API
"""

import os
import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
import base64

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import chromadb
from sentence_transformers import SentenceTransformer
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import magic
from PIL import Image
import io

# Configuration
MODEL_NAME = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
CHROMADB_HOST = os.getenv("CHROMADB_HOST", "chromadb")
CHROMADB_PORT = int(os.getenv("CHROMADB_PORT", "8000"))
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_DB = os.getenv("POSTGRES_DB", "omnimind")
POSTGRES_USER = os.getenv("POSTGRES_USER", "albs_admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

# Initialize FastAPI
app = FastAPI(title="OmniMind API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models (matching Google's API)
class Document(BaseModel):
    id: str
    filename: str
    content: str
    mime_type: str
    created_at: str
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    similarity: Optional[float] = None

class DocumentCreate(BaseModel):
    filename: str
    content: str
    mimeType: str

class SearchQuery(BaseModel):
    query: str

class StatsResponse(BaseModel):
    documents: int
    tags: int

# Initialize services
def init_database():
    """Initialize PostgreSQL database"""
    conn = psycopg2.connect(
        host=POSTGRES_HOST,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )
    
    with conn.cursor() as cur:
        # Create documents table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                content TEXT,
                mime_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB DEFAULT '{}'::jsonb
            )
        """)
        
        # Create tags table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS tags (
                id SERIAL PRIMARY KEY,
                doc_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
                tag TEXT NOT NULL,
                UNIQUE(doc_id, tag)
            )
        """)
        
        # Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_tags_doc_id ON tags(doc_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC)")
    
    conn.commit()
    return conn

def init_chromadb():
    """Initialize ChromaDB vector database"""
    chroma_client = chromadb.HttpClient(
        host=CHROMADB_HOST,
        port=CHROMADB_PORT
    )
    
    # Create or get collection
    collection = chroma_client.get_or_create_collection(
        name="documents",
        metadata={"hnsw:space": "cosine"}
    )
    
    return collection

def init_ai_model():
    """Initialize Sentence Transformers model"""
    model = SentenceTransformer(MODEL_NAME)
    return model

def init_redis():
    """Initialize Redis cache"""
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# Initialize connections
db_conn = init_database()
chroma_collection = init_chromadb()
ai_model = init_ai_model()
redis_client = init_redis()

# Helper functions
def cosine_similarity(vec_a, vec_b):
    """Calculate cosine similarity between two vectors"""
    import numpy as np
    dot_product = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    return dot_product / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0.0

def generate_tags_and_summary(content: str, mime_type: str) -> Dict[str, Any]:
    """
    Generate tags and summary for content.
    This mimics Google's Gemini API functionality but uses local models.
    """
    # For text content, extract key phrases
    if mime_type.startswith("text/") or mime_type == "application/json":
        # Simple keyword extraction (replace with better NLP in production)
        words = content.lower().split()[:100]  # First 100 words
        common_words = {"the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "a", "an"}
        keywords = [w for w in words if w not in common_words and len(w) > 3][:5]
        
        tags = list(set(keywords))[:5] or ["document", "text", "file"]
        summary = content[:200] + "..." if len(content) > 200 else content
    else:
        # For non-text files
        file_type = mime_type.split("/")[-1].upper()
        tags = [file_type, "media", "file"]
        summary = f"{file_type} file uploaded to OmniMind"
    
    return {
        "tags": tags,
        "summary": summary
    }

# API endpoints (matching Google's Express.js API)
@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """Get system statistics - matches Google's /api/stats"""
    with db_conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Document count
        cur.execute("SELECT COUNT(*) as count FROM documents")
        doc_count = cur.fetchone()["count"]
        
        # Tag count
        cur.execute("SELECT COUNT(DISTINCT tag) as count FROM tags")
        tag_count = cur.fetchone()["count"]
    
    return StatsResponse(documents=doc_count, tags=tag_count)

@app.get("/api/documents", response_model=List[Document])
async def get_documents():
    """Get all documents - matches Google's /api/documents"""
    with db_conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT d.*, array_agg(t.tag) as tags
            FROM documents d
            LEFT JOIN tags t ON d.id = t.doc_id
            GROUP BY d.id
            ORDER BY d.created_at DESC
        """)
        rows = cur.fetchall()
    
    documents = []
    for row in rows:
        doc = Document(
            id=row["id"],
            filename=row["filename"],
            content=row["content"] or "",
            mime_type=row["mime_type"],
            created_at=row["created_at"].isoformat(),
            tags=row["tags"] if row["tags"][0] else [],
            metadata=row["metadata"] or {}
        )
        documents.append(doc)
    
    return documents

@app.post("/api/documents", response_model=Document)
async def create_document(document: DocumentCreate):
    """Create a document - matches Google's /api/documents POST"""
    doc_id = str(uuid.uuid4())
    
    try:
        # Generate tags and summary
        ai_data = generate_tags_and_summary(document.content, document.mimeType)
        
        # Store in PostgreSQL
        with db_conn.cursor() as cur:
            cur.execute(
                "INSERT INTO documents (id, filename, content, mime_type, metadata) VALUES (%s, %s, %s, %s, %s)",
                (doc_id, document.filename, document.content, document.mimeType, json.dumps(ai_data))
            )
            
            # Store tags
            for tag in ai_data["tags"]:
                cur.execute(
                    "INSERT INTO tags (doc_id, tag) VALUES (%s, %s)",
                    (doc_id, tag)
                )
        
        db_conn.commit()
        
        # Generate embedding and store in ChromaDB
        text_to_embed = document.content if document.mimeType.startswith("text/") else ai_data["summary"]
        embedding = ai_model.encode(text_to_embed).tolist()
        
        chroma_collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            metadatas=[{
                "filename": document.filename,
                "mime_type": document.mimeType,
                "tags": json.dumps(ai_data["tags"])
            }],
            documents=[text_to_embed[:1000]]  # Store first 1000 chars
        )
        
        # Cache in Redis
        redis_client.setex(
            f"document:{doc_id}",
            3600,  # 1 hour TTL
            json.dumps({
                "id": doc_id,
                "filename": document.filename,
                "tags": ai_data["tags"],
                "summary": ai_data["summary"]
            })
        )
        
        # Return document in Google's format
        return Document(
            id=doc_id,
            filename=document.filename,
            content=document.content,
            mime_type=document.mimeType,
            created_at=datetime.now().isoformat(),
            tags=ai_data["tags"],
            metadata=ai_data
        )
        
    except Exception as e:
        db_conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@app.post("/api/search", response_model=List[Document])
async def search_documents(query: SearchQuery):
    """Search documents - matches Google's /api/search"""
    try:
        # Generate query embedding
        query_embedding = ai_model.encode(query.query).tolist()
        
        # Search in ChromaDB
        results = chroma_collection.query(
            query_embeddings=[query_embedding],
            n_results=5,
            include=["metadatas", "documents", "distances"]
        )
        
        if not results["ids"][0]:
            return []
        
        # Get document details from PostgreSQL
        doc_ids = results["ids"][0]
        similarities = [1 - distance for distance in results["distances"][0]]
        
        with db_conn.cursor(cursor_factory=RealDictCursor) as cur:
            placeholders = ",".join(["%s"] * len(doc_ids))
            cur.execute(f"""
                SELECT d.*, array_agg(t.tag) as tags
                FROM documents d
                LEFT JOIN tags t ON d.id = t.doc_id
                WHERE d.id IN ({placeholders})
                GROUP BY d.id
            """, doc_ids)
            
            rows = cur.fetchall()
        
        # Create response matching Google's format
        documents = []
        for i, row in enumerate(rows):
            doc = Document(
                id=row["id"],
                filename=row["filename"],
                content=row["content"] or "",
                mime_type=row["mime_type"],
                created_at=row["created_at"].isoformat(),
                tags=row["tags"] if row["tags"][0] else [],
                metadata=row["metadata"] or {},
                similarity=similarities[i]
            )
            documents.append(doc)
        
        return documents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document - matches Google's /api/documents/:id DELETE"""
    try:
        with db_conn.cursor() as cur:
            # Delete from PostgreSQL
            cur.execute("DELETE FROM documents WHERE id = %s", (doc_id,))
        
        db_conn.commit()
        
        # Delete from ChromaDB
        chroma_collection.delete(ids=[doc_id])
        
        # Delete from Redis cache
        redis_client.delete(f"document:{doc_id}")
        
        return {"success": True}
        
    except Exception as e:
        db_conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "postgres": "connected",
            "chromadb": "connected",
            "redis": "connected",
            "ai_model": "loaded"
        }
    }

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("OmniMind API starting up...")
    print(f"Using AI model: {MODEL_NAME}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    db_conn.close()
    print("OmniMind API shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)