// MongoDB 初始化脚本
// 在容器首次启动时执行
db = db.getSiblingDB('medical_platform');

// 创建集合
db.createCollection('users');
db.createCollection('conversations');
db.createCollection('messages');
db.createCollection('medical_records');
db.createCollection('knowledge_chunks');
db.createCollection('wxwork_tokens');

// 创建索引
db.users.createIndex({ wxworkUserId: 1 }, { unique: true, sparse: true });
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });

db.conversations.createIndex({ userId: 1, createdAt: -1 });
db.conversations.createIndex({ status: 1 });

db.messages.createIndex({ conversationId: 1, createdAt: 1 });

db.medical_records.createIndex({ userId: 1, createdAt: -1 });
db.medical_records.createIndex({ parseStatus: 1 });

db.knowledge_chunks.createIndex({ sourceId: 1 });
db.knowledge_chunks.createIndex({ 'metadata.category': 1 });

db.wxwork_tokens.createIndex({ corpId: 1 }, { unique: true });
db.wxwork_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('MongoDB 初始化完成');
