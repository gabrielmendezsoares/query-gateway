# 🔍 Query Gateway

## 📋 Overview

The Query Gateway is a dynamic SQL execution engine that securely connects to multiple database types (MySQL, SQL Server, Oracle) and executes pre-configured queries stored in the system. It supports runtime decryption of database credentials, dynamic query construction with variable and replacement maps, and unified result aggregation across sources.

This service enables a centralized way to securely and flexibly query external databases without hardcoding SQL, database credentials, or connection logic in client applications.

### 🎯 Objectives

- Dynamically execute stored SQL queries across multiple databases
- Support MySQL, SQL Server, and Oracle with dialect-specific handling
- Securely decrypt and use database credentials at runtime (AES-256-CBC)
- Allow dynamic parameterization via variable_map and replacement_map
- Gracefully handle failures per query while maintaining partial success responses
- Return all query results in a unified, structured response object
- Enable easy extension and onboarding of new data sources through configuration

--- 

## 📦 Quick Start

### ⚠️ Prerequisites 

- **Node.js** ≥ `20.14.0` — _JavaScript runtime environment_
- **MySQL** ≥ `8.0` — _Relational database_

### ⚙️ Setup 

```bash 
# Clone & navigate
git clone <repository-url> && cd query-gateway

# Configure environment
cp .env.example .env  # Edit with your settings

# Install dependencies (auto-runs database setup)
npm install
```

> **💡 Database:** Import `storage.sql.example` before running `npm install`

---

## ⚡ Usage

### 🛠️ Development

```bash
npm run start:development
```

### 🏗️ Production

```bash
npm run build && npm run start:production
```

---

## 📚 Command Reference

### 🧰 Core

| Command | Description |
| ------- | ----------- |
| `npm run start:development` | _Start the application in development_ |
| `npm run start:production` | _Start the application in production_ |
| `npm run build` | _Build the application for production_ |
| `npm run build:watch` | _Build the application with watch mode_ |
| `npm run clean` | _Clean application build artifacts_ |
 
### 🛢️ Database

| Command | Description |
| ------- | ----------- |
| `npm run db:pull` | _Pull database schema into Prisma across all schemas_ |
| `npm run db:push` | _Push Prisma schema to the database across all schemas_ |
| `npm run db:generate` | _Generate Prisma Client for all schemas_ |
| `npm run db:migrate:dev` | _Run development migrations across all schemas_ |
| `npm run db:migrate:deploy` | _Deploy migrations to production across all schemas_ |
| `npm run db:studio` | _Open Prisma Studio (GUI) across all schemas_ |
| `npm run db:reset` | _Reset database (pull + generate) for all schemas_ |

### 🐳 Docker 

| Command | Description |
| ------- | ----------- |
| `npm run docker:build:development` | _Build Docker image for development_ |
| `npm run docker:build:production` | _Build Docker image for production_ |
| `npm run docker:run:development` | _Run development Docker container_ |
| `npm run docker:run:production` | _Run production Docker container_ |
| `npm run docker:compose:up:development` | _Start Docker Compose in development_ |
| `npm run docker:compose:up:production` | _Start Docker Compose in production_ |
| `npm run docker:compose:up:build:development` | _Start & rebuild Docker Compose in development_ |
| `npm run docker:compose:up:build:production` | _Start & rebuild Docker Compose in production_ |
| `npm run docker:compose:down` | _Stop Docker Compose services_ |
| `npm run docker:compose:logs` | _View Docker Compose logs_ |
| `npm run docker:prune` | _Clean up unused Docker resources_ |

### 🧪 Testing

| Command | Description |
| ------- | ----------- |
| `npm test` | _Run all tests once_ |
| `npm run test:watch` | _Run tests in watch mode_ |
| `npm run test:coverage` | _Run tests and generate a coverage report_ |
   