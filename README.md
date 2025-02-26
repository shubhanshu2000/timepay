# Payment Management System

A full-stack application for managing customer payments with real-time notifications.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (Package Manager)
- **Docker**
- **Git**

---

## Getting Started

### Install pnpm (if not already installed)

```bash
npm install -g pnpm
```

### Start Elasticsearch

```bash
docker run -p 127.0.0.1:9200:9200 -d --name elasticsearch \
 -e "discovery.type=single-node" \
 -e "xpack.security.enabled=false" \
 -e "xpack.license.self_generated.type=trial" \
 -v "elasticsearch-data:/usr/share/elasticsearch/data" \
 docker.elastic.co/elasticsearch/elasticsearch:8.15.0
```

### Install dependencies

```bash
pnpm install
```

## Running the Application

### Start Backend Server

```bash
cd be
pnpm run dev
```

### Start Frontend Application

```bash
cd fe
pnpm run dev
```
