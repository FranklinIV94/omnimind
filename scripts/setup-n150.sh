#!/bin/bash
# Setup script for Local Supermemory on N150 Mini PC

set -e

echo "========================================="
echo "Local Supermemory N150 Setup Script"
echo "========================================="
echo "Target: Intel N150 Mini PC"
echo "Purpose: ALBS Knowledge Management System"
echo "========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# System Information
echo ""
echo "=== System Information ==="
echo "Hostname: $(hostname)"
echo "Kernel: $(uname -r)"
echo "Distribution: $(lsb_release -d | cut -f2)"
echo "CPU: $(lscpu | grep "Model name" | cut -d: -f2 | xargs)"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $2 " used: " $3 " (" $5 ")"}')"

# Update system
echo ""
echo "=== Updating System ==="
apt-get update
apt-get upgrade -y

# Install Docker
echo ""
echo "=== Installing Docker ==="
if ! command -v docker &> /dev/null; then
    echo "Docker not found, installing..."
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
else
    echo "Docker already installed: $(docker --version)"
fi

# Install Docker Compose
echo ""
echo "=== Installing Docker Compose ==="
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found, installing..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed: $(docker-compose --version)"
fi

# Create supermemory user
echo ""
echo "=== Creating Application User ==="
if ! id -u supermemory >/dev/null 2>&1; then
    useradd -m -s /bin/bash -G docker supermemory
    echo "User 'supermemory' created"
else
    echo "User 'supermemory' already exists"
fi

# Create directory structure
echo ""
echo "=== Creating Directory Structure ==="
mkdir -p /opt/supermemory/{data,models,inbox,processed,watch,backups,config}
chown -R supermemory:supermemory /opt/supermemory
chmod -R 755 /opt/supermemory

# Download embedding models
echo ""
echo "=== Downloading Embedding Models ==="
sudo -u supermemory bash -c '
cd /opt/supermemory/models
echo "Downloading all-MiniLM-L6-v2..."
python3 -c "
from sentence_transformers import SentenceTransformer
model = SentenceTransformer(\"all-MiniLM-L6-v2\")
model.save(\"/opt/supermemory/models/all-MiniLM-L6-v2\")
"
echo "Model downloaded successfully"
'

# Generate secure passwords
echo ""
echo "=== Generating Secure Configuration ==="
cd /opt/supermemory/config
cat > .env << EOF
# Auto-generated configuration for N150
# Generated on: $(date)

# Database Configuration
DB_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=supermemory
POSTGRES_USER=albs_admin

# API Security
API_KEY=$(openssl rand -base64 48)
JWT_SECRET=$(openssl rand -base64 48)
JWT_EXPIRY_HOURS=24

# Vector Database
CHROMADB_PERSIST_DIR=/chroma/chroma
CHROMADB_TELEMETRY=FALSE

# Embedding Model
MODEL_NAME=all-MiniLM-L6-v2
MODEL_CACHE_DIR=/app/models

# Redis Cache
REDIS_PASSWORD=$(openssl rand -base64 32)
REDIS_MAXMEMORY=256mb

# Application Settings (optimized for N150)
DEBUG=false
LOG_LEVEL=INFO
MAX_FILE_SIZE_MB=25
WORKER_COUNT=2
BATCH_SIZE=8
EMBEDDING_BATCH_SIZE=4
MAX_CONCURRENT_PROCESSES=2

# Network Settings
API_PORT=8080
WEB_PORT=3000
CHROMADB_PORT=8000
POSTGRES_PORT=5432
REDIS_PORT=6379

# Backup Settings
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
EOF

echo "Configuration generated at /opt/supermemory/config/.env"
echo "IMPORTANT: Save these passwords in a secure location!"

# Create docker-compose.yml
echo ""
echo "=== Creating Docker Compose Configuration ==="
cd /opt/supermemory
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  chromadb:
    image: chromadb/chroma:latest
    container_name: supermemory-chromadb
    ports: ["8000:8000"]
    volumes:
      - ./data/chroma:/chroma/chroma
      - ./models:/models
    environment:
      - IS_PERSISTENT=TRUE
      - PERSIST_DIRECTORY=/chroma/chroma
      - ANONYMIZED_TELEMETRY=FALSE
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: supermemory-postgres
    ports: ["5432:5432"]
    volumes: ["./data/postgres:/var/lib/postgresql/data"]
    environment:
      - POSTGRES_DB=supermemory
      - POSTGRES_USER=albs_admin
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: supermemory-redis
    ports: ["6379:6379"]
    volumes: ["./data/redis:/data"]
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    restart: unless-stopped

  api:
    image: ghcr.io/alllinesbusiness/local-supermemory-api:latest
    container_name: supermemory-api
    ports: ["8080:8080"]
    volumes:
      - ./models:/app/models
      - ./config:/app/config
    environment:
      - CHROMADB_HOST=chromadb
      - CHROMADB_PORT=8000
      - POSTGRES_HOST=postgres
      - POSTGRES_DB=supermemory
      - POSTGRES_USER=albs_admin
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - API_KEY=${API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - chromadb
      - postgres
      - redis
    restart: unless-stopped

  web:
    image: ghcr.io/alllinesbusiness/local-supermemory-web:latest
    container_name: supermemory-web
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080
    depends_on:
      - api
    restart: unless-stopped
EOF

echo "Docker Compose configuration created"

# Create systemd service
echo ""
echo "=== Creating Systemd Service ==="
cat > /etc/systemd/system/supermemory.service << EOF
[Unit]
Description=Local Supermemory Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=supermemory
Group=supermemory
WorkingDirectory=/opt/supermemory
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable supermemory.service

echo "Systemd service created and enabled"

# Create backup script
echo ""
echo "=== Creating Backup Script ==="
cat > /opt/supermemory/scripts/backup.sh << 'EOF'
#!/bin/bash
# Backup script for Local Supermemory

BACKUP_DIR="/opt/supermemory/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/supermemory_backup_$DATE.tar.gz"

echo "Starting backup: $BACKUP_FILE"

# Stop services
cd /opt/supermemory
docker-compose stop

# Create backup
tar -czf "$BACKUP_FILE" \
    --exclude="*.log" \
    --exclude="*.tmp" \
    data/ config/.env docker-compose.yml

# Start services
docker-compose start

# Remove old backups (keep last 7 days)
find "$BACKUP_DIR" -name "supermemory_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
EOF

chmod +x /opt/supermemory/scripts/backup.sh

# Create cron job for daily backup
echo "0 2 * * * /opt/supermemory/scripts/backup.sh" | crontab -u supermemory -

echo "Backup system configured (runs daily at 2 AM)"

# Performance tuning for N150
echo ""
echo "=== Tuning System for N150 ==="

# Increase swap for memory-intensive operations
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
    echo "4GB swap file created"
fi

# Tune kernel parameters for Docker
cat >> /etc/sysctl.conf << EOF
# Docker optimizations
vm.swappiness=10
vm.vfs_cache_pressure=50
net.core.somaxconn=1024
net.ipv4.tcp_max_syn_backlog=2048
EOF

sysctl -p

# Set Docker logging limits
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker

echo "System tuning completed"

# Final instructions
echo ""
echo "========================================="
echo "SETUP COMPLETE!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review configuration: /opt/supermemory/config/.env"
echo "2. Start the service: systemctl start supermemory"
echo "3. Access web interface: http://$(hostname -I | awk '{print $1}'):3000"
echo "4. API endpoint: http://$(hostname -I | awk '{print $1}'):8080"
echo ""
echo "Important files:"
echo "  - Configuration: /opt/supermemory/config/.env"
echo "  - Docker Compose: /opt/supermemory/docker-compose.yml"
echo "  - Service: /etc/systemd/system/supermemory.service"
echo "  - Backup script: /opt/supermemory/scripts/backup.sh"
echo ""
echo "Backup schedule: Daily at 2 AM"
echo "Logs: journalctl -u supermemory -f"
echo ""
echo "========================================="
echo "Local Supermemory is ready for ALBS!"
echo "========================================="