#!/usr/bin/env bash

# ============================================================
# MongoDB 5 Installation Script (No AVX Required)
# برای سرورهایی که AVX ندارند
# ============================================================

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "❌ Run as root: sudo bash $0"
  exit 1
fi

MONGO_USER="${1:-pishro_user}"
MONGO_PASSWORD="${2:-}"

if [ -z "$MONGO_PASSWORD" ]; then
  read -s -p "🔐 Enter MongoDB admin password: " MONGO_PASSWORD
  echo
fi

echo "==========================================";
echo "🚀 Installing MongoDB 5 (No AVX Required)";
echo "==========================================";

# Stop existing MongoDB
echo "⏹️  Stopping any existing MongoDB..."
systemctl stop mongod || true

# Add MongoDB 5 repo (works without AVX)
echo "📦 Adding MongoDB repository..."
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-5.0.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-5.0.gpg] https://repo.mongodb.org/apt/ubuntu $(lsb_release -sc)/mongodb-org/5.0 multiverse" \
  | tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Install MongoDB 5
echo "⬇️  Installing MongoDB 5..."
apt-get update
apt-get install -y mongodb-org mongodb-clients

# Start MongoDB
echo "🚀 Starting MongoDB..."
systemctl enable --now mongod
sleep 3

# Check status
if systemctl is-active --quiet mongod; then
  echo "✅ MongoDB is running"
else
  echo "❌ MongoDB failed to start"
  journalctl -u mongod -n 20
  exit 1
fi

# Create admin user
echo "👤 Creating admin user..."
mongosh --quiet --host 127.0.0.1 --port 27017 <<EOF
use admin
if (db.getUser("$MONGO_USER") == null) {
  db.createUser({
    user: "$MONGO_USER",
    pwd: "$MONGO_PASSWORD",
    roles: [{role: 'root', db: 'admin'}]
  })
  print("✅ User $MONGO_USER created")
} else {
  print("ℹ️  User $MONGO_USER already exists")
}
EOF

# Enable authentication
echo "🔒 Enabling authentication..."
if ! grep -q "^security:" /etc/mongod.conf 2>/dev/null; then
  cat >> /etc/mongod.conf <<'EOF'

security:
  authorization: enabled
EOF
  systemctl restart mongod
  sleep 2
  echo "✅ Authentication enabled"
fi

# Enable replica set
echo "🔄 Enabling replica set (rs0)..."
if ! grep -q "^replication:" /etc/mongod.conf 2>/dev/null; then
  cat >> /etc/mongod.conf <<'EOF'

replication:
  replSetName: rs0
EOF
  systemctl restart mongod
  sleep 2
fi

# Initiate replica set if needed
REPLICA_SET_STATUS=$(mongosh --username "$MONGO_USER" --password "$MONGO_PASSWORD" --authenticationDatabase admin --quiet --host 127.0.0.1 --eval "rs.status().ok" 2>/dev/null || echo "0")

if [ "$REPLICA_SET_STATUS" != "1" ]; then
  echo "🔧 Initializing replica set..."
  mongosh --quiet --host 127.0.0.1 --eval "rs.initiate()"
  sleep 2
fi

# Test connection
echo "🧪 Testing connection..."
CONNECTION_TEST=$(mongosh --username "$MONGO_USER" --password "$MONGO_PASSWORD" --authenticationDatabase admin --quiet --host 127.0.0.1 --eval "db.adminCommand('ping').ok" 2>/dev/null || echo "0")

if [ "$CONNECTION_TEST" = "1" ]; then
  echo "✅ Connection successful!"
else
  echo "⚠️  Connection test failed - but MongoDB might still be running"
fi

# Display connection string
echo ""
echo "==========================================";
echo "✅ MongoDB 5 Installation Complete!"
echo "==========================================";
echo ""
echo "📝 Connection string for .env:"
echo "DATABASE_URL=\"mongodb://$MONGO_USER:$MONGO_PASSWORD@127.0.0.1:27017/pishro?authSource=admin&replicaSet=rs0\""
echo ""
echo "🔍 Useful commands:"
echo "  mongosh --username $MONGO_USER --password <password> --authenticationDatabase admin"
echo "  systemctl status mongod"
echo "  journalctl -u mongod -f"
echo ""
