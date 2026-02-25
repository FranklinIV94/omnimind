# OmniMind Merge Plan: Combining Our Foundation with Google AI Studio

## 🎯 Goal
Create a hybrid OmniMind that combines:
1. **Google's beautiful UI and multimodal features**
2. **Our scalable, local-first architecture**
3. **Production deployment on N150 mini PC**

## 📊 Architecture Comparison

### Google AI Studio Version (Current)
```
Frontend: React + TypeScript + Tailwind + Vite
Backend: Express.js + SQLite
AI: Gemini API (cloud)
Vector: SQLite + custom cosine similarity
Deployment: Node.js server
Scale: Small-medium (SQLite limited)
Cost: Gemini API per use
```

### Our Foundation Version
```
Frontend: Next.js + TypeScript + Tailwind
Backend: FastAPI + PostgreSQL + ChromaDB
AI: Sentence Transformers (local)
Vector: ChromaDB (dedicated)
Deployment: Docker Compose on N150
Scale: Large (10,000-100,000+ docs)
Cost: $10/year (local power)
```

## 🔄 Proposed Hybrid Architecture

### Layer 1: Frontend (Use Google's UI)
- **Keep:** React + TypeScript + Tailwind + Vite from Google
- **Enhance:** Add Next.js for SSR and better routing
- **Integrate:** Our Docker deployment setup

### Layer 2: Backend (Use Our Scalable Foundation)
- **Keep:** FastAPI + PostgreSQL + ChromaDB from our foundation
- **Add:** Google's Express.js routes as FastAPI endpoints
- **Enhance:** Add Google's multimodal file handling

### Layer 3: AI Processing (Hybrid Approach)
- **Primary:** Sentence Transformers (local, free)
- **Fallback:** Gemini API (cloud, for advanced features)
- **Strategy:** Use local models for 90% of operations, Gemini for complex multimodal

### Layer 4: Deployment (Use Our Production Setup)
- **Keep:** Docker Compose + N150 optimization
- **Add:** Google's quick dev setup (`npm run dev`)
- **Enhance:** Our CI/CD + monitoring

## 🛠️ Implementation Plan

### Phase 1: Frontend Integration (Week 1)
1. **Migrate Google's React UI** to our `web/` directory
2. **Update API calls** from Express.js to FastAPI endpoints
3. **Add Next.js framework** for production optimization
4. **Integrate with our Docker setup**

### Phase 2: Backend Enhancement (Week 2)
1. **Implement Google's routes** as FastAPI endpoints:
   - `/api/stats` - System statistics
   - `/api/documents` - CRUD operations
   - `/api/search` - Semantic search
   - `/api/upload` - Multimodal file handling
2. **Add SQLite compatibility layer** for easy migration
3. **Implement hybrid AI processing** (local + Gemini)

### Phase 3: Database Migration (Week 3)
1. **Create migration script** from SQLite to PostgreSQL
2. **Implement ChromaDB integration** for vector search
3. **Add data synchronization** between SQLite (dev) and PostgreSQL (prod)

### Phase 4: Deployment Integration (Week 4)
1. **Update Docker Compose** to include both dev and prod setups
2. **Create hybrid environment** configs
3. **Test on N150 hardware**
4. **Deploy CI/CD pipeline**

## 📁 File Structure After Merge

```
omnimind/
├── web/                          # Google's React UI (enhanced)
│   ├── src/                      # React components (from Google)
│   ├── public/                   # Static assets
│   ├── next.config.js           # Next.js configuration
│   └── package.json             # Updated dependencies
├── api/                          # Our FastAPI backend (enhanced)
│   ├── src/
│   │   ├── routes/              # FastAPI endpoints (Google's routes)
│   │   ├── models/              # Pydantic models
│   │   ├── services/            # Business logic
│   │   │   ├── local_ai.py      # Sentence Transformers
│   │   │   ├── gemini_ai.py     # Gemini API fallback
│   │   │   └── multimodal.py    # File processing
│   │   └── utils/
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile
├── docker-compose.yml           # Production (our foundation)
├── docker-compose.dev.yml       # Development (Google's quick setup)
├── scripts/
│   ├── setup-n150.sh           # Production setup
│   ├── dev-setup.sh            # Development setup
│   └── migrate-sqlite-to-pg.sh # Database migration
└── config/
    ├── .env.production         # Production config
    └── .env.development        # Development config
```

## 🔌 API Compatibility Layer

To make migration seamless, we'll create compatibility endpoints:

```python
# FastAPI endpoints that match Google's Express.js API
@app.get("/api/stats")
async def get_stats():
    # Returns same format as Google's version
    return {"documents": 123, "tags": 45}

@app.post("/api/documents")
async def create_document(file: UploadFile):
    # Handles multimodal files like Google's version
    # Uses local AI first, Gemini fallback
    pass

@app.post("/api/search")
async def semantic_search(query: str):
    # Uses ChromaDB instead of custom cosine similarity
    # Returns same response format
    pass
```

## 🧠 Hybrid AI Processing Strategy

### Decision Flow:
```
1. File uploaded
2. If text/JSON/Markdown → Use local Sentence Transformers
3. If image/audio/video → Use Gemini API (if configured)
4. Generate embeddings with local model (768 dimensions)
5. Store in ChromaDB for fast similarity search
6. Return results in Google's UI format
```

### Configuration:
```yaml
ai:
  primary: "local"  # Sentence Transformers
  fallback: "gemini" # Gemini API (optional)
  gemini_api_key: ${GEMINI_API_KEY} # Only if using Gemini
```

## 💾 Database Strategy

### Development (Quick Start):
- **SQLite** (Google's choice) for easy setup
- **In-memory ChromaDB** for vector search
- **No external dependencies**

### Production (N150):
- **PostgreSQL** for metadata (scalable)
- **Persistent ChromaDB** for vectors
- **Redis** for caching
- **Automated backups**

### Migration Path:
```bash
# Dev to Prod migration
python scripts/migrate-sqlite-to-pg.py
```

## 🚀 Deployment Options

### Option A: Quick Development
```bash
# Google's original setup
npm install
npm run dev
# Runs Express.js + SQLite
```

### Option B: Local Production
```bash
# Our enhanced setup
docker-compose -f docker-compose.dev.yml up
# FastAPI + SQLite + ChromaDB
```

### Option C: N150 Production
```bash
# Full production on N150
./scripts/setup-n150.sh
docker-compose up -d
# FastAPI + PostgreSQL + ChromaDB + Redis
```

## 📈 Feature Comparison After Merge

| Feature | Google Original | Our Foundation | Hybrid OmniMind |
|---------|----------------|----------------|-----------------|
| **UI/UX** | ✅ Excellent | ❌ Basic | ✅ Excellent (Google's) |
| **Multimodal** | ✅ Gemini API | ❌ Text only | ✅ Hybrid (local + Gemini) |
| **Local AI** | ❌ Cloud only | ✅ Sentence Transformers | ✅ Primary local |
| **Scalability** | ❌ SQLite limited | ✅ PostgreSQL + ChromaDB | ✅ Scalable |
| **Cost** | ❌ API fees | ✅ $10/year | ✅ Minimal (local first) |
| **Deployment** | ❌ Node.js only | ✅ Docker + N150 | ✅ Multiple options |
| **Setup Time** | ✅ 5 minutes | ❌ 30 minutes | ✅ 5-30 minutes (options) |

## 🔧 Technical Decisions

### 1. Frontend Framework
- **Keep:** React + Vite (Google's choice) for dev speed
- **Add:** Next.js build for production optimization
- **Result:** Best of both worlds

### 2. Backend Language
- **Primary:** Python/FastAPI (our choice) for AI/ML ecosystem
- **Compatibility:** Match Google's API endpoints exactly
- **Result:** Python backend with Express.js API compatibility

### 3. Vector Database
- **Primary:** ChromaDB (our choice) for performance
- **Fallback:** SQLite vectors (Google's method) for dev
- **Result:** ChromaDB in production, SQLite in dev

### 4. AI Models
- **Primary:** Sentence Transformers (local, free)
- **Optional:** Gemini API (cloud, for advanced features)
- **Result:** Cost-effective with premium options

## 🚨 Risk Mitigation

### Risk 1: API Compatibility
- **Solution:** Create exact endpoint matching
- **Test:** Automated API comparison tests
- **Fallback:** Proxy layer if needed

### Risk 2: Performance on N150
- **Solution:** Optimize Docker images for ARM
- **Test:** Benchmark on actual N150 hardware
- **Fallback:** Lite mode for low-resource devices

### Risk 3: Data Migration
- **Solution:** Bidirectional sync between SQLite and PostgreSQL
- **Tool:** Create migration scripts
- **Backup:** Automatic backups before migration

### Risk 4: Gemini API Costs
- **Solution:** Local-first architecture
- **Config:** Disable Gemini by default
- **Monitoring:** API usage tracking

## 📅 Implementation Timeline

### Week 1-2: Foundation
- Merge frontend code
- Create API compatibility layer
- Set up hybrid development environment

### Week 3-4: Features
- Implement multimodal processing
- Add ChromaDB integration
- Create migration tools

### Week 5-6: Optimization
- N150 performance tuning
- CI/CD pipeline setup
- Documentation and testing

### Week 7-8: Deployment
- Test on actual N150 hardware
- Create production deployment guide
- Final integration testing

## 🎯 Success Criteria

### Technical Success:
- [ ] Google's UI works with our backend
- [ ] API endpoints 100% compatible
- [ ] Local AI processes 90% of documents
- [ ] N150 deployment successful
- [ ] SQLite → PostgreSQL migration works

### Business Success:
- [ ] Setup time < 10 minutes for dev
- [ ] Setup time < 30 minutes for production
- [ ] Cost < $20/month for 10,000 documents
- [ ] Search response < 100ms
- [ ] 99.9% uptime on N150

## 🤝 Next Steps

### Immediate (Today):
1. Review this merge plan with Google AI Studio output
2. Create GitHub branch for integration
3. Begin frontend migration

### Short-term (This Week):
1. Set up hybrid development environment
2. Create API compatibility layer
3. Test basic file upload and search

### Medium-term (Next Month):
1. Complete feature integration
2. Test on N150 hardware
3. Create deployment guides

### Long-term (Next Quarter):
1. Optimize performance
2. Add advanced features
3. Scale testing with large datasets

---

*Merge plan created: 2026-02-25*  
*Based on: Google AI Studio OmniMind + Our Foundation*  
*Target: Hybrid system with best features from both*