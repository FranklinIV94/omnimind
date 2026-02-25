# OmniMind - ALBS Knowledge Management System

A self-hosted alternative to Supermemory AI for All Lines Business Solutions. Provides autonomous document organization, semantic search, and AI agent memory management.

## 🎯 Project Vision

Create a localized knowledge management system that:
- Stores all ALBS business documents locally
- Provides semantic search and AI-powered organization
- Enables autonomous agentic workflows
- Eliminates cloud API dependencies for core memory functions
- Maintains complete data sovereignty

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document      │    │   Processing    │    │   Vector        │
│   Ingest        │────│   Pipeline      │────│   Database      │
│                 │    │                 │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Watch Folder  │    │ • Text Extract  │    │ • ChromaDB      │
│ • Email Import  │    │ • Embedding     │    │ • LanceDB       │
│ • API Upload    │    │ • Categorization│    │ • PostgreSQL    │
│ • Web Form      │    │ • Tagging       │    │ • Redis Cache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                         ┌─────────────────┐
                         │   Web Interface │
                         │   & API         │
                         │                 │
                         ├─────────────────┤
                         │ • Search UI     │
                         │ • Document Mgmt │
                         │ • REST API      │
                         │ • WebSocket     │
                         └─────────────────┘
```

## 📊 Storage Requirements

### Minimum Viable Product (MVP)
- **Total:** ~5.6GB
- Vector DB: 500MB
- Documents (1,000): 1GB  
- Embedding Model: 100MB
- App Stack: 500MB
- OS & Dependencies: 3.5GB

### Business Scale (Year 1)
- **Total:** ~22GB
- Vector DB: 1GB
- Documents (10,000): 10GB
- Multiple Models: 1GB
- App Stack: 1GB
- OS & Dependencies: 4GB
- Backups: 5GB

### Target Hardware: Intel N150 Mini PC
- CPU: 4-core Intel N100
- RAM: 16GB recommended (8GB minimum)
- Storage: 512GB SSD (256GB minimum)
- Power: ~10W (24/7 operation)

## 💰 Cost Analysis

### Year 1 Total: ~$170 + development time
- Hardware (N150): $150
- Power: $10/year
- Software: Open source (free)
- Internet: Already covered

### Year 2+: ~$10/year + maintenance
- Only power costs after initial investment

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.9+
- Node.js 18+

### Quick Start
```bash
# Clone repository
git clone https://github.com/FranklinIV94/omnimind.git
cd omnimind

# Copy environment configuration
cp .env.example .env

# Start services
docker-compose up -d

# Access web interface
open http://localhost:3000
```

### Repository
- **GitHub:** https://github.com/FranklinIV94/omnimind
- **Status:** Initial commit - development phase
- **CI/CD:** GitHub Actions configured

## 🛠️ Technology Stack

### Core Components
- **Vector Database:** ChromaDB (primary), LanceDB (alternative)
- **Embedding Models:** sentence-transformers (all-MiniLM-L6-v2)
- **Web Framework:** Next.js (frontend), FastAPI (backend)
- **Database:** PostgreSQL (metadata), Redis (cache)
- **Document Processing:** Unstructured.io, PyPDF2, pytesseract

### Deployment Options
1. **Docker Compose** (recommended for N150)
2. **Kubernetes** (for scaling)
3. **Bare Metal** (maximum performance)

## 🔄 Autonomous Features

### Smart Document Processing
- Automatic text extraction from PDFs, images, documents
- AI-generated tags and categories
- Cross-reference detection between documents
- Version tracking and change detection

### Agent Integration
- REST API for AI agent memory operations
- WebSocket for real-time updates
- Permission system for different agent roles
- Audit logging for all operations

## 📈 Roadmap

### Phase 1: Foundation (2-4 weeks)
- Basic document ingestion and vector storage
- Simple web interface for search
- REST API for basic operations

### Phase 2: Automation (4-6 weeks)
- Watch folder auto-processing
- AI-powered categorization
- Email integration
- Advanced search features

### Phase 3: Enhancement (6-8 weeks)
- Multi-user collaboration
- Advanced analytics
- Mobile interface
- Integration with existing ALBS systems

### Phase 4: Optimization (ongoing)
- Performance improvements
- Additional file format support
- Advanced AI features
- Scaling optimizations

## 🔒 Security & Privacy

### Data Protection
- All data stored locally on ALBS hardware
- Encryption at rest and in transit
- Role-based access control
- Comprehensive audit logging

### Backup Strategy
- Daily incremental backups to network storage
- Weekly full backups to offsite location
- One-click disaster recovery procedure

## 🤝 Contributing

### Development Setup
```bash
# Install dependencies
pip install -r requirements.txt
npm install

# Set up development environment
python -m venv venv
source venv/bin/activate

# Run development servers
docker-compose -f docker-compose.dev.yml up
npm run dev
python -m uvicorn api.main:app --reload
```

### Code Standards
- Follow PEP 8 for Python
- Use ESLint/Prettier for JavaScript/TypeScript
- Write comprehensive tests
- Document all public APIs

## 📚 Documentation

- [Architecture Decision Records](./docs/adr/)
- [API Documentation](./docs/api/)
- [Deployment Guide](./docs/deployment/)
- [User Guide](./docs/user-guide/)

## 📞 Support

For issues and questions:
1. Check [Troubleshooting Guide](./docs/troubleshooting.md)
2. Search existing GitHub issues
3. Create new issue with detailed description

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

---

*Project initiated: 2026-02-25*  
*Target completion: 2026-Q2*  
*Primary maintainer: ALBS AI Integration Team*