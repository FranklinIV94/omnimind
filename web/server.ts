import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Database
const db = new Database("supermemory.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT,
    content TEXT,
    mime_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
  );
  CREATE TABLE IF NOT EXISTS embeddings (
    doc_id TEXT PRIMARY KEY,
    vector TEXT,
    FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id TEXT,
    tag TEXT,
    FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
  );
`);

app.use(express.json({ limit: '50mb' }));

// Gemini Initialization
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// API Routes
app.get("/api/stats", (req, res) => {
  const docCount = db.prepare("SELECT COUNT(*) as count FROM documents").get() as { count: number };
  const tagCount = db.prepare("SELECT COUNT(DISTINCT tag) as count FROM tags").get() as { count: number };
  res.json({ documents: docCount.count, tags: tagCount.count });
});

app.get("/api/documents", (req, res) => {
  const docs = db.prepare(`
    SELECT d.*, GROUP_CONCAT(t.tag) as tags
    FROM documents d
    LEFT JOIN tags t ON d.id = t.doc_id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `).all();
  
  res.json(docs.map((d: any) => ({
    ...d,
    tags: d.tags ? d.tags.split(',') : [],
    metadata: JSON.parse(d.metadata || '{}')
  })));
});

app.post("/api/documents", async (req, res) => {
  const { filename, content, mimeType } = req.body;
  const id = Math.random().toString(36).substring(2, 15);

  try {
    // 1. Store Document
    db.prepare("INSERT INTO documents (id, filename, content, mime_type, metadata) VALUES (?, ?, ?, ?, ?)")
      .run(id, filename, content, mimeType, JSON.stringify({}));

    // 2. Generate Tags & Summary using Gemini (Multimodal support)
    const model = genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          parts: [
            { text: `Analyze the following file (${filename}) and provide a list of 3-5 relevant tags and a 1-sentence summary. Return as JSON with keys "tags" (array of strings) and "summary" (string).` },
            mimeType.startsWith('text/') || mimeType === 'application/json' 
              ? { text: content.substring(0, 10000) }
              : { inlineData: { data: content, mimeType: mimeType } }
          ]
        }
      ]
    });
    
    const result = await model;
    const responseText = result.text || "";
    const aiData = JSON.parse(responseText.replace(/```json|```/g, ''));

    // 3. Store Tags
    const insertTag = db.prepare("INSERT INTO tags (doc_id, tag) VALUES (?, ?)");
    aiData.tags.forEach((tag: string) => insertTag.run(id, tag));

    // 4. Generate Embedding (using summary for non-text files to save space/tokens)
    try {
      const textToEmbed = mimeType.startsWith('text/') || mimeType === 'application/json' 
        ? content.substring(0, 5000) 
        : aiData.summary;

      const embedResult = await genAI.models.embedContent({
        model: "text-embedding-004",
        contents: [textToEmbed]
      });
      if (embedResult.embeddings && embedResult.embeddings.length > 0) {
        db.prepare("INSERT INTO embeddings (doc_id, vector) VALUES (?, ?)")
          .run(id, JSON.stringify(embedResult.embeddings[0].values));
      }
    } catch (e) {
      console.error("Embedding failed", e);
    }

    res.json({ id, ...aiData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process document" });
  }
});

app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  
  try {
    // 1. Embed Query
    const embedResult = await genAI.models.embedContent({
      model: "text-embedding-004",
      contents: [query]
    });
    if (!embedResult.embeddings || embedResult.embeddings.length === 0) {
      return res.json([]);
    }
    const queryVector = embedResult.embeddings[0].values;

    // 2. Simple Vector Similarity (Cosine Similarity in JS)
    const allEmbeddings = db.prepare("SELECT doc_id, vector FROM embeddings").all() as { doc_id: string, vector: string }[];
    
    const results = allEmbeddings.map(emb => {
      const vector = JSON.parse(emb.vector);
      const similarity = cosineSimilarity(queryVector, vector);
      return { doc_id: emb.doc_id, similarity };
    })
    .filter(r => r.similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

    const docIds = results.map(r => r.doc_id);
    if (docIds.length === 0) return res.json([]);

    const placeholders = docIds.map(() => '?').join(',');
    const docs = db.prepare(`
      SELECT d.*, GROUP_CONCAT(t.tag) as tags
      FROM documents d
      LEFT JOIN tags t ON d.id = t.doc_id
      WHERE d.id IN (${placeholders})
      GROUP BY d.id
    `).all(...docIds);

    res.json(docs.map((d: any) => ({
      ...d,
      tags: d.tags ? d.tags.split(',') : [],
      similarity: results.find(r => r.doc_id === d.id)?.similarity
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Search failed" });
  }
});

app.delete("/api/documents/:id", (req, res) => {
  db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
