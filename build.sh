#!/bin/bash
set -e

echo "Building pagihall frontend..."
cd packages/pagihall
npm run build
echo "Build completed successfully!"
