# System Deployment Architecture

This document describes the technical architecture and deployment strategies for the Ethio-Adaptive-Learning platform. The system is designed to be highly portable, scalable, and resilient, utilizing modern containerization and cloud-native practices.

## 1. Architectural Overview

The platform follows a **three-tier architecture** containerized using Docker. This ensures that the development, staging, and production environments are identical, reducing "it works on my machine" issues and simplifying horizontal scaling.

### 1.1. Component Stack
-   **Frontend/API Tier**: Next.js 16 (React 19) running in a Node.js 22 LTS environment.
-   **Database Tier**: PostgreSQL 15 for relational data (Curriculum, Mastery, Users).
-   **Intelligence Tier**: 
    -   **Ollama (Optional/External)**: Provides the local LLM execution environment for Socratic tutoring.

---

## 2. Containerization Strategy

The system uses a **multi-stage Docker build** to optimize image size and security.

### 2.1. Web Application (`Dockerfile`)
-   **Stage 1: Builder**: Installs all dependencies (including devDependencies), generates the Prisma client, and executes the Next.js build process.
-   **Stage 2: Runner**: A slim Alpine Linux image containing only the production-ready build artifacts and minimal Node.js runtime. This reduces the attack surface and deployment latency.

### 2.2. Orchestration (`docker-compose.yml`)
The platform is orchestrated using **Docker Compose**, which manages three primary services:
1.  **`web`**: The Next.js application, exposed on port 3000. It depends on both the database and vector store.
2.  **`db`**: The PostgreSQL instance with persistent volume mapping (`db_data`) to ensure data remains safe across container restarts.

---

## 3. Deployment Environments

### 3.1. Self-Hosted (VPS / Private Cloud)
This is the primary deployment target for the Ethiopian educational context, allowing for local data residency and lower latency.
-   **Deployment Tool**: Docker Compose.
-   **Reverse Proxy**: Typically Nginx or Caddy with SSL certificates provided by Let's Encrypt.
-   **Hardware**: A Linux server (Ubuntu 22.04+) with at least 8GB RAM (16GB recommended if hosting LLMs locally).

### 3.2. Cloud-Native (Vercel + Managed DB)
For rapid scaling and global availability.
-   **Frontend**: Deployed via the Vercel edge network.
-   **Database**: Utilizes managed PostgreSQL (e.g., Supabase or Neon).
-   **Vector Store**: Hosted ChromaDB or a serverless alternative.

---

## 4. CI/CD Pipeline

We utilize **GitHub Actions** to automate the deployment lifecycle:
1.  **Static Analysis**: Automated linting (ESLint) and type-checking (TypeScript) on every pull request.
2.  **Unit Testing**: Executing the Vitest suite to ensure mathematical integrity of BKT/KST models.
3.  **Build Verification**: Validating that the Docker image builds successfully before merging to the `main` branch.
4.  **Automatic Deployment**: Merges to `main` trigger a webhook to the production server to pull the latest images and restart the services (`docker-compose up -d --build`).

---

## 5. Security & Persistence

-   **Environment Management**: Sensitive keys (DB credentials, Auth secrets) are never committed to version control and are managed via `.env` files or Vercel Environment Variables.
-   **Data Persistence**: All critical data (PostgreSQL) is stored in **Docker Volumes** mapped to the host filesystem, ensuring that application updates do not result in data loss.
-   **Backups**: Daily automated snapshots of the PostgreSQL volume are recommended as part of the operational maintenance.
