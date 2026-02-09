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
    gcloud sql instances create CLOUD_SQL_INSTANCE \
        --database-version=POSTGRES_15 \
        --cpu=1 \
        --memory=4GiB \
        --region=asia-northeast1
    ```

2.  **Set Password**:
    ```bash
    gcloud sql users set-password postgres \
        --instance=CLOUD_SQL_INSTANCE \
        --password=CLOUD_SQL_PASSWORD
    ```

3.  **Create Database**:
    ```bash
    gcloud sql databases create coach_db \
        --instance=CLOUD_SQL_INSTANCE
    ```

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
    gcloud builds submit --tag asia-northeast1-docker.pkg.dev/PROJECT_ID/coach-creator/server:latest .
    ```

2.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy server \
        --image asia-northeast1-docker.pkg.dev/PROJECT_ID/coach-creator/server:latest \
        --region asia-northeast1 \
        --allow-unauthenticated \
        --add-cloudsql-instances PROJECT_ID:asia-northeast1:CLOUD_SQL_INSTANCE \
        --set-env-vars "DB_TYPE=postgres" \
        --set-env-vars "DATABASE_URL=postgres://postgres:CLOUD_SQL_PASSWORD@/coach_db?host=/cloudsql/PROJECT_ID:asia-northeast1:CLOUD_SQL_INSTANCE" \
        --set-env-vars "GEMINI_API_KEY=GEMINI_API_KEY" \
        --set-env-vars "GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID"
    ```

3.  **Get Backend URL**:
    Note the URL provided in the output (e.g., `https://server-204524688402.asia-northeast1.run.app`).

Note **Only Update Server**:
    ```bash
    gcloud run services update server \
        --region asia-northeast1 \
        --update-env-vars "DATABASE_URL=postgres://postgres:CLOUD_SQL_PASSWORD@/coach_db?host=/cloudsql/PROJECT_ID:asia-northeast1:CLOUD_SQL_INSTANCE"
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
        --image gcr.io/PROJECT_ID/coach-creator/frontend:latest \
        --region asia-northeast1 \
        --allow-unauthenticated
    ```

3.  **Done!** Access your app at the Frontend URL.

