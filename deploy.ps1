Write-Host "🔄 Cleaning up existing Kubernetes pods..." -ForegroundColor Yellow
kubectl delete -f k8s/ -R
docker build -t api-gateway ./api-gateway
docker build -t docker-auth-service:latest -f ./services/auth-service/Dockerfile .
docker build -t docker-patient-service:latest -f ./services/patient-service/Dockerfile .
docker build -t docker-doctor-service:latest -f ./services/doctor-service/Dockerfile .
docker build -t docker-notification-service:latest -f ./services/notification-service/Dockerfile .
docker build -t docker-appointment-service:latest -f ./services/appointment-service/Dockerfile .
docker build -t docker-payment-service:latest -f ./services/payment-service/Dockerfile .
docker build -t docker-telemedicine-service:latest -f ./services/telemedicine-service/Dockerfile .
docker build -t docker-ai-service:latest -f services/ai-service/Dockerfile services/ai-service
docker build -t healthbridge-client:latest -f client/Dockerfile . 
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
Start-Sleep -Seconds 5
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/ -R 
Write-Host "✅ Done! Run: kubectl get pods -n healthbridge -w" -ForegroundColor Green

# Running Command: .\deploy.ps1