# Contributing to Local Supermemory

Thank you for your interest in contributing to the ALBS Local Supermemory project! This document provides guidelines and instructions for contributing.

## 🎯 Development Philosophy

1. **Data Sovereignty First:** All features must prioritize local storage and privacy
2. **Autonomous Operation:** Systems should self-organize and require minimal human intervention
3. **Business Focus:** Solutions should directly address ALBS workflow needs
4. **Simplicity:** Prefer simple, maintainable solutions over complex ones

## 📋 Contribution Workflow

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR-USERNAME/local-supermemory.git
cd local-supermemory

# Add upstream remote
git remote add upstream https://github.com/alllinesbusiness/local-supermemory.git
```

### 2. Set Up Development Environment
```bash
# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements-dev.txt
npm install

# Set up pre-commit hooks
pre-commit install
```

### 3. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 4. Make Changes
- Follow the coding standards below
- Write tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 5. Test Your Changes
```bash
# Run tests
pytest
npm test

# Run linters
black .
flake8
eslint .

# Start development environment
docker-compose -f docker-compose.dev.yml up
```

### 6. Submit Pull Request
1. Push your branch: `git push origin feature/your-feature-name`
2. Create PR on GitHub with clear description
3. Link any related issues
4. Request review from maintainers

## 🏗️ Project Structure

```
local-supermemory/
├── api/                    # FastAPI backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # Pydantic models
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   ├── tests/
│   └── Dockerfile
├── web/                   # Next.js frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Next.js pages
│   │   ├── lib/          # Client-side utilities
│   │   └── styles/       # CSS/SCSS
│   ├── tests/
│   └── Dockerfile
├── processor/             # Document processing
│   ├── src/
│   │   ├── extractors/   # File format handlers
│   │   ├── embedders/    # Vector embedding
│   │   └── classifiers/  # AI categorization
│   ├── tests/
│   └── Dockerfile
├── watcher/              # File system monitoring
├── config/               # Configuration files
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── docker-compose.yml    # Production deployment
```

## 📝 Coding Standards

### Python
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Use type hints for all function signatures
- Document public functions with docstrings
- Maximum line length: 88 characters (Black default)

```python
def process_document(file_path: Path) -> Document:
    """Extract text and metadata from a document file.
    
    Args:
        file_path: Path to the document file
        
    Returns:
        Document object with extracted content
        
    Raises:
        FileNotFoundError: If file doesn't exist
        UnsupportedFormatError: If file format not supported
    """
    # Implementation
```

### JavaScript/TypeScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks
- Prefer async/await over promises

```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  embeddings: number[];
}

const processDocument = async (file: File): Promise<Document> => {
  // Implementation
};
```

### Docker
- Use multi-stage builds for production
- Specify exact version tags
- Minimize layer count
- Run as non-root user

```dockerfile
FROM python:3.11-slim as builder
# Build stage

FROM python:3.11-slim as runtime
# Runtime stage with minimal layers
```

## 🧪 Testing

### Test Structure
- Unit tests: Test individual functions/classes
- Integration tests: Test service interactions
- E2E tests: Test complete workflows

### Running Tests
```bash
# Run all tests
pytest
npm test

# Run specific test suite
pytest tests/unit/
pytest tests/integration/

# Run with coverage
pytest --cov=api tests/
npm test -- --coverage
```

### Test Guidelines
- Tests should be independent and idempotent
- Mock external dependencies
- Use fixtures for complex setup
- Aim for >80% code coverage

## 📚 Documentation

### Code Documentation
- Document all public APIs
- Include examples for complex functionality
- Update README when adding features
- Keep architecture diagrams current

### Architecture Decision Records (ADRs)
When making significant architectural decisions:
1. Create ADR in `docs/adr/`
2. Use template: `docs/adr/template.md`
3. Include context, decision, and consequences
4. Get approval from maintainers

## 🔍 Code Review Process

### What Reviewers Look For
1. **Correctness:** Does the code work as intended?
2. **Testing:** Are there adequate tests?
3. **Performance:** Will this scale on N150 hardware?
4. **Security:** Any potential vulnerabilities?
5. **Maintainability:** Is the code clean and well-documented?
6. **Alignment:** Does this fit project goals?

### Review Checklist
- [ ] Code follows project standards
- [ ] Tests pass and coverage is adequate
- [ ] Documentation is updated
- [ ] No security issues introduced
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

## 🐛 Issue Reporting

### Bug Reports
When reporting bugs, include:
1. Clear description of the issue
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details (OS, Docker version, etc.)
5. Relevant logs or error messages

### Feature Requests
When requesting features:
1. Describe the problem you're solving
2. Explain why existing solutions don't work
3. Provide use cases and examples
4. Suggest implementation approach if possible

## 🚀 Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

### Release Checklist
1. Update version in `pyproject.toml` and `package.json`
2. Update CHANGELOG.md
3. Run full test suite
4. Update documentation
5. Create release tag
6. Build and push Docker images
7. Update deployment guides

## 🤝 Community Guidelines

### Communication
- Be respectful and inclusive
- Assume good intentions
- Focus on technical merit
- Keep discussions productive

### Decision Making
- Technical decisions based on data and evidence
- Business decisions align with ALBS goals
- Disagreements resolved through discussion
- Maintainers have final say on controversial issues

## 📞 Getting Help

- Check [documentation](./docs/) first
- Search existing issues
- Join ALBS AI Integration team discussions
- Contact maintainers for critical issues

---

*Thank you for contributing to making ALBS more efficient and autonomous!*