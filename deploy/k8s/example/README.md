# Kubernetes Example

These manifests are examples for platforms such as AWS EKS, Alibaba ACK, or
another Kubernetes-compatible environment. They are not production-ready.

Before production use, replace image names, secrets, resource requests,
networking, ingress, TLS, observability, and provider-specific security
settings.

Apply order for a disposable environment:

```sh
kubectl apply -f api-config.example.yaml
kubectl apply -f api-secret.example.yaml
kubectl apply -f migration-secret.example.yaml
kubectl apply -f migration-job.example.yaml
kubectl apply -f api-deployment.yaml
kubectl apply -f api-service.yaml
```
