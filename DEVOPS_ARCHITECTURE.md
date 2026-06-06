# EduFlow CRM - Professional DevOps Architecture

This document outlines the DevOps infrastructure built to make the project production-ready and fully automated, fulfilling the requirements for the Final Year Project defense.

## 1. Local Development (Docker Architecture)

We use Docker to ensure consistent environments across all machines.

**Requirements**: Docker Desktop installed.

### How to run locally:

1. In the root directory, run:
   ```bash
   docker-compose up --build -d
   ```
2. The following services will start:
   - **eduflow_database**: MySQL 8.0 on port 3306.
   - **eduflow_backend**: Laravel API running on Apache (port 8000). The database migrations will automatically run via the entrypoint script.
   - **eduflow_frontend**: React Production build running on Nginx (port 3000).

### Access Points:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`

---

## 2. CI/CD Pipeline (GitHub Actions)

We implemented an automated CI/CD pipeline using GitHub Actions, located at `.github/workflows/devops.yml`.

### Pipeline Stages:
1. **backend-checks**: Sets up PHP, installs Composer dependencies, and executes Laravel tests.
2. **frontend-build**: Sets up Node.js, installs npm dependencies, and runs `npm run build`.
3. **docker-build**: A simulated run of building the `backend` and `frontend` Dockerfiles to ensure container integrity.
4. **deploy**: Deploys the application automatically to production when changes are merged into the `main` branch.

---

## 3. Cloud Deployment Strategy

The application is deployed to the cloud for real-world production usage using the following stack:

`User -> React (Vercel) -> Laravel API (Railway) -> MySQL Cloud DB`

### A. Managed MySQL Database
1. Provision a MySQL Database on a cloud provider (e.g., PlanetScale, Aiven, Railway, AWS RDS).
2. Obtain connection credentials: `Host`, `Port`, `Database`, `Username`, `Password`.

### B. Deploying Backend (Laravel) to Railway or Render
1. Create a project on Railway (https://railway.app).
2. Link your GitHub Repository.
3. Railway will configure using the `backend/Dockerfile` and deploy the service.
4. In Railway variables, specify the Database credentials obtained in step A.
   - `DB_CONNECTION=mysql`
   - `DB_HOST=...`
   - `DB_DATABASE=...`
   - `DB_USERNAME=...`
   - `DB_PASSWORD=...`
5. Note the generated HTTPS domain (e.g., `api.eduflow.up.railway.app`).

### C. Deploying Frontend (React) to Vercel
1. Create a project on Vercel (https://vercel.com).
2. Link your GitHub Repository and set the Root Directory to `frontend`.
3. Set the Framework Preset to `Vite`.
4. In Environment Variables, set the API Base URL:
   - `VITE_API_URL=https://api.eduflow.up.railway.app/api`
5. Vercel will automatically build the `frontend` folder and deploy to its global CDN.

---

## Best Practices Adopted
- **Clean Architecture**: Decoupled deployment for specific domain needs (CDN for frontend, Container for API).
- **Environment Parity**: Local Docker container closely replicates the production cloud environments.
- **Security**: Process isolation in local setups, environment-variable dependent code for production to keep secrets out of source.
