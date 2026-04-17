HealthBridge
============

HealthBridge is a microservices-based healthcare platform that includes an API gateway, multiple backend services, and a frontend client. The repository includes Docker and Kubernetes deployment assets to run the stack locally or in a cluster.

Highlights
----------
- Multiple services: auth, appointment, doctor, patient, payment, notification, telemedicine, and AI.
- API gateway for unified routing.
- React client application.
- Containerization with Docker and deployment manifests for Kubernetes.

Repository Structure
--------------------
- api-gateway/ - Node.js API gateway
- client/ - Frontend application (Vite + React)
- database/ - MongoDB initialization and seed data
- docker/ - Docker Compose definitions
- k8s/ - Kubernetes manifests
- services/ - Backend microservices
- shared/ - Shared packages and config

Prerequisites
-------------
- Node.js 18+ (for local development)
- Docker Desktop (for containerized dev)
- Kubernetes cluster + kubectl (optional)

Quick Start (Docker Compose)
----------------------------
1) Build and start the stack:

```bash
docker compose -f docker/docker-compose.yml up --build
```

2) Stop the stack:

```bash
docker compose -f docker/docker-compose.yml down
```

Local Development (Service-by-Service)
--------------------------------------
Run any service locally:

```bash
cd services/<service-name>
npm install
npm run dev
```

Run the client locally:

```bash
cd client
npm install
npm run dev
```

Environment Variables
---------------------
Each service uses environment variables for configuration (for example, database URIs, JWT secrets, email/SMS credentials, and third-party API keys). The Kubernetes manifests in k8s/ show the expected variable names. Configure the same variables in your local environment or Docker Compose file when running locally.

Kubernetes Deployment
---------------------
Apply the namespace and service manifests:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

Then verify the pods and services:

```bash
kubectl get pods -n healthbridge
kubectl get svc -n healthbridge
```

Notes
-----
- The deployment manifests under k8s/ can be used as a reference for environment variables and ports.
- Docker build context matters when building service images locally. Build from the service directory when needed.

Contributing
------------
1) Create a feature branch.
2) Make changes with tests or validations where applicable.
3) Open a pull request with a clear description.

License
-------
This project is licensed under the ISC License.
