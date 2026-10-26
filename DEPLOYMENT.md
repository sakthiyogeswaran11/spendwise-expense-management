# Deployment guide

## EC2 outline

1. Create an Ubuntu LTS EC2 instance. Restrict SSH to your IP, allow inbound 80/443, and keep PostgreSQL private.
2. Install Docker Engine and the Compose plugin using Docker's official Ubuntu instructions.
3. Clone the repository and enter the SpendWise project directory.
4. Create `.env` from `.env.example`. Set a unique long `JWT_SECRET`, a strong `DB_PASSWORD`, and the public `FRONTEND_URL`. Keep `.env` out of Git.
5. Start services with `docker compose up --build -d`. Compose applies the migration and seeds the demo account for this local/demo setup. Do not run the demo seed on a public production environment.
6. Configure Nginx with `nginx/spendwise.conf`; update `server_name`, enable the site, and reload Nginx. Proxy to app port 4000 and keep that port private.
7. Point DNS at the instance. Configure HTTPS with Certbot/Let's Encrypt or terminate TLS at a managed load balancer. Production mode sets secure auth cookies.
8. Verify `/api/health`, sign-in, and static assets. Inspect `docker compose logs -f app db`.

## Operations

- Restart: `docker compose restart app`
- Update: `git pull && docker compose up --build -d`
- Logs: `docker compose logs --tail=200 app`
- Backups: use `pg_dump`, store backups off-instance, and test restores.

Use managed PostgreSQL for production, enable backups, monitor resources, and rotate secrets.

## GitHub Actions

The included CI workflow runs `npm ci`, tests, frontend build, and Docker build. It requires no secrets. A future deploy job can use an SSH deploy key or OIDC access plus `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, and `DEPLOY_PATH`. Current CI does not consume those values.

## Nginx and TLS

`nginx/spendwise.conf` demonstrates API forwarding and SPA routing. Replace the example domain, enable the config in `sites-enabled`, run `nginx -t`, and reload. Add TLS directives after issuing a certificate; enable HSTS only after HTTPS works across the full domain.
