# Deploying to Google Cloud Run

This guide outlines the steps to deploy your application (Frontend & Backend) to Google Cloud Run with a PostgreSQL database (Cloud SQL).

## Prerequisites
1.  **Google Cloud Project**: Create a project in the Google Cloud Console.
2.  **Billing**: Enable billing for your project.
3.  **gcloud CLI**: Install and initialize the Google Cloud CLI (`gcloud init`).
4.  **APIs Enabled**:
    ```bash
    gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com
    ```

## 1. Set up Database (Cloud SQL)

1.  **Create a PostgreSQL Instance**:
    ```bash
    gcloud sql instances create coach-creator-db \
        --database-version=POSTGRES_15 \
        --cpu=1 \
        --memory=4GiB \
        --region=asia-northeast1
    ```
    *(Adjust region as needed)*

2.  **Set Password**:
    ```bash
    gcloud sql users set-password postgres \
        --instance=coach-creator-db \
        --password=Z11q5tXoFhQihi
    ```

3.  **Create Database**:
    ```bash
    gcloud sql databases create coach_db \
        --instance=coach-creator-db
    ```

4.  **Get Connection Name**:
    ```bash
    gcloud sql instances describe coach-creator-db --format='value(connectionName)'
    ```
    *Save this (e.g., `project-id:region:instance-name`) for later.*

## 2. Create Artifact Registry

Create a repository to store your Docker images.

```bash
gcloud artifacts repositories create coach-creator \
    --repository-format=docker \
    --location=asia-northeast1
```

## 3. Deploy Backend

1.  **Build and Push Image**:
    ```bash
    # From the root directory
    cd server
    gcloud builds submit --tag asia-northeast1-docker.pkg.dev/gemini-hack-485913/coach-creator/server:latest .
    ```

2.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy server \
        --image asia-northeast1-docker.pkg.dev/gemini-hack-485913/coach-creator/server:latest \
        --region asia-northeast1 \
        --allow-unauthenticated \
        --add-cloudsql-instances gemini-hack-485913:asia-northeast1:coach-creator-db \
        --set-env-vars "DB_TYPE=postgres" \
        --set-env-vars "DATABASE_URL=postgres://postgres:Z11q5tXoFhQihi@/coach_db?host=/cloudsql/gemini-hack-485913:asia-northeast1:coach-creator-db" \
        --set-env-vars "GEMINI_API_KEY=AIzaSyBZIUd_gDDxhUrLpo9CLK8CFmGVNXGo1cw" \
        --set-env-vars "GOOGLE_CLIENT_ID=204524688402-p1004vh1jovje3mnm0trubhl6ulnr8cd.apps.googleusercontent.com"
    ```

3.  **Get Backend URL**:
    Note the URL provided in the output (e.g., `https://server-204524688402.asia-northeast1.run.app`).

Note **Only Update Server**:
    ```bash
    gcloud run services update server \
        --region asia-northeast1 \
        --update-env-vars "DATABASE_URL=postgres://postgres:Z11q5tXoFhQihi@/coach_db?host=/cloudsql/gemini-hack-485913:asia-northeast1:coach-creator-db"
    ```

## 4. Deploy Frontend

1.  **Build and Push Image**:
    *Pass the Backend URL as a build argument so the frontend knows where to connect.*

    ```bash
    gcloud builds submit --config cloudbuild.yaml .
    ```

2.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy frontend \
        --image gcr.io/gemini-hack-485913/coach-creator/frontend:latest \
        --region asia-northeast1 \
        --allow-unauthenticated
    ```

3.  **Done!** Access your app at the Frontend URL.

