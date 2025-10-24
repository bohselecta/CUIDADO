#!/usr/bin/env node

const http = require('http');
const path = require('path');

console.log('⚙️ CUIDADO Engine starting...');
console.log('📁 Working directory:', process.cwd());
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

// Simple API server for testing
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'CUIDADO Engine',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));
  } else if (url.pathname === '/api/chat') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      message: 'CUIDADO Engine is running!',
      status: 'ready'
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const port = process.env.PORT || 3001;
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 CUIDADO Engine running on port ${port}`);
  console.log(`🌐 Health check: http://localhost:${port}/api/health`);
  console.log(`💬 Chat API: http://localhost:${port}/api/chat`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down CUIDADO Engine...');
  server.close(() => {
    console.log('✅ CUIDADO Engine stopped');
    process.exit(0);
  });
});
