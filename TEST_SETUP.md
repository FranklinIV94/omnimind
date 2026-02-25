# OmniMind Setup Test - Quick Verification

## 🧪 Test Instructions for Tonight's Deployment

### **Prerequisites:**
- N150 mini PC with Ubuntu/Docker installed
- Internet connection for initial setup
- Basic terminal access

### **Quick Test (5-10 minutes):**

#### **Step 1: Clone Repository**
```bash
git clone https://github.com/FranklinIV94/omnimind.git
cd omnimind
```

#### **Step 2: Run Setup Assistant**
```bash
chmod +x scripts/choose-setup.sh
./scripts/choose-setup.sh
```

#### **Step 3: Choose Option 2 (Hybrid Development)**
This will start both Google's UI and our backend for testing.

#### **Step 4: Verify Services**
Check these URLs in your browser:

1. **Google's UI:** http://localhost:3000
   - Should show OmniMind interface
   - Check for "Neural Status" section

2. **Our API:** http://localhost:8080/docs
   - Should show FastAPI documentation
   - Verify all endpoints are listed

3. **Health Check:** http://localhost:8080/health
   - Should return `{"status": "healthy"}`

### **Basic Functionality Test:**

#### **Test 1: System Statistics**
```bash
curl http://localhost:8080/api/stats
```
**Expected:** `{"documents":0,"tags":0}`

#### **Test 2: Upload Test Document**
```bash
curl -X POST http://localhost:8080/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.txt",
    "content": "This is a test document for OmniMind integration.",
    "mimeType": "text/plain"
  }'
```
**Expected:** JSON response with document ID and tags

#### **Test 3: List Documents**
```bash
curl http://localhost:8080/api/documents
```
**Expected:** Array with your test document

#### **Test 4: Search Test**
```bash
curl -X POST http://localhost:8080/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test document"}'
```
**Expected:** Array with search results

### **Production Readiness Checklist:**

#### **Docker Services:**
- [ ] PostgreSQL: Running and accessible
- [ ] ChromaDB: Running and accessible  
- [ ] Redis: Running and accessible
- [ ] FastAPI: Running and healthy
- [ ] React UI: Running and responsive

#### **Storage:**
- [ ] PostgreSQL data directory: Created
- [ ] ChromaDB data directory: Created
- [ ] Redis data directory: Created
- [ ] Backup directory: Created

#### **Network:**
- [ ] Port 3000: Accessible (UI)
- [ ] Port 8080: Accessible (API)
- [ ] Port 5432: Accessible (PostgreSQL)
- [ ] Port 8000: Accessible (ChromaDB)
- [ ] Port 6379: Accessible (Redis)

### **N150-Specific Tests:**

#### **Performance Check:**
```bash
# Check CPU usage
docker stats --no-stream

# Check memory usage
free -h

# Check disk space
df -h /
```

#### **Expected N150 Performance:**
- **CPU:** <50% under normal load
- **Memory:** <4GB for basic setup
- **Disk:** 5-10GB for initial deployment
- **Response Time:** <100ms for API calls

### **Troubleshooting:**

#### **If Docker Compose Fails:**
```bash
# Check Docker service
sudo systemctl status docker

# Check Docker Compose version
docker-compose --version

# Check logs
docker-compose logs
```

#### **If Ports Are Blocked:**
```bash
# Check listening ports
sudo netstat -tulpn | grep LISTEN

# Check firewall
sudo ufw status
```

#### **If AI Model Fails:**
```bash
# Check model download
ls -la data/models/

# Test Sentence Transformers
docker exec omnimind-fastapi python -c "from sentence_transformers import SentenceTransformer; print('Model loaded successfully')"
```

### **Deployment Verification Script:**

Save this as `verify-deployment.sh`:

```bash
#!/bin/bash
echo "=== OmniMind Deployment Verification ==="

# Check services
echo "1. Checking Docker services..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check API endpoints
echo -e "\n2. Testing API endpoints..."
curl -s http://localhost:8080/health | jq -r '.status'
curl -s http://localhost:8080/api/stats | jq -r '.documents'

# Check UI
echo -e "\n3. Checking UI..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Check storage
echo -e "\n4. Checking storage..."
du -sh data/* 2>/dev/null || echo "Data directories not found"

echo -e "\n=== Verification Complete ==="
```

### **Success Criteria:**

#### **Minimum Viable Deployment:**
- [ ] UI loads at http://localhost:3000
- [ ] API responds at http://localhost:8080/health
- [ ] Can upload a document
- [ ] Can search for documents
- [ ] All Docker services running

#### **Production Ready:**
- [ ] All services healthy
- [ ] Storage directories created
- [ ] Backup script working
- [ ] Performance acceptable on N150
- [ ] Documentation accessible

### **Next Steps After Verification:**

1. **Load ALBS Documents:** Begin uploading business documents
2. **Configure Backups:** Set up automated backup schedule
3. **Integrate with Systems:** Connect to Appointment Scheduler, Obsidian
4. **Set Up Monitoring:** Configure alerts and monitoring
5. **User Training:** Create guide for ALBS team

### **Emergency Rollback:**

If deployment fails, you can:
1. **Stop all services:** `docker-compose down`
2. **Remove data:** `sudo rm -rf data/`
3. **Start fresh:** Follow setup instructions again
4. **Use backup:** Restore from previous backup if available

---

**Test completed successfully?** ✅  
**Ready for production deployment?** ✅  
**Time to deploy to N150:** ~30 minutes  
**Estimated completion:** Tonight as planned

**Repository:** https://github.com/FranklinIV94/omnimind  
**Support:** Check issues or contact Prospyr for assistance