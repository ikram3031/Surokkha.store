.PHONY: deploy build-shop build-store build-offer build-dashboard build-frontend restart-backend status logs down help sync-config

# ── Surokkha Shop Environment & Paths (Native VPS: systemd + Nginx) ──
CLIENT := surokkha

# ── Targets ───────────────────────────────────────────────────

help:
	@echo "=========================================================="
	@echo " Surokkha Shop — Native VPS Deployment Automation"
	@echo "=========================================================="
	@echo ""
	@echo "Component Builds (Native VPS Mode):"
	@echo "  make deploy             Pull latest, build shop + dashboard, restart backend"
	@echo "  make build-shop         Build SurokkhaShop and deploy to /opt/clients/surokkha/shop"
	@echo "  make build-offer        Build SurokkhaOffer Docker image and (re)start it on 127.0.0.1:3002"
	@echo "  make build-store        Build SurokkhaStore Docker image and (re)start it on 127.0.0.1:3001"
	@echo "  make build-dashboard    Build Admin Dashboard and deploy to /opt/clients/surokkha/dashboard"
	@echo "  make restart-backend    Restart systemd services (surokkha-storefront, surokkha-storeweb & surokkha-dashboard)"
	@echo ""
	@echo "Status & Health:"
	@echo "  make status             Check systemd service and mongo status"
	@echo "  make logs               Tail backend systemd logs"
	@echo "=========================================================="

sync-config:
	@node scripts/sync-config.js $(CLIENT) 2>/dev/null || true

# ── Safe Native VPS Deployment (Default) ──────────────────────
# Pulls Live, builds the shop storefront & dashboard to their exact Nginx webroots, and restarts the backend
deploy:
	@echo "🚀 Deploying Surokkha Shop [Live branch] using Native VPS Architecture..."
	git pull origin Live
	@$(MAKE) sync-config
	@# 1. Build and deploy Shop storefront
	@if [ -d "SurokkhaShop" ]; then \
		set -e; \
		echo "📦 Building Surokkha Shop (surokkha.shop)..."; \
		npm install --prefix SurokkhaShop; \
		npm run build --prefix SurokkhaShop; \
		mkdir -p /opt/clients/surokkha/shop; \
		cp -r SurokkhaShop/dist/* /opt/clients/surokkha/shop/; \
		echo "✓ Storefront (surokkha.shop) deployed to /opt/clients/surokkha/shop"; \
	fi

	@# 1b. Build and (re)start the SurokkhaStore container (surokkha.store)
	@$(MAKE) build-store

	@# 1c. Build and (re)start the SurokkhaOffer container (offer.surokkha.shop)
	@$(MAKE) build-offer

	@# 2. Build and deploy Admin Dashboard
	@if [ -d "dashboard" ]; then \
		set -e; \
		echo "📦 Building Admin Dashboard..."; \
		npm install --prefix dashboard; \
		npm run build --prefix dashboard; \
		if [ -d "/var/www/admin.surokkha.store" ]; then \
			mkdir -p /var/www/admin.surokkha.store/dist; \
			cp -r dashboard/dist/* /var/www/admin.surokkha.store/dist/; \
		fi; \
		echo "✓ Admin Dashboard built and deployed"; \
	fi

	@# 3. Update Backend dependencies and restart services
	@if [ -d "backend" ]; then \
		echo "📦 Updating Backend dependencies..."; \
		npm install --prefix backend; \
		systemctl restart surokkha-storefront surokkha-storeweb surokkha-dashboard 2>/dev/null || true; \
		echo "✓ Surokkha backend services restarted"; \
	fi

	@# 4. Reload Nginx
	@systemctl reload nginx 2>/dev/null || true
	@echo "🎉 Surokkha Shop deployment finished!"

build-shop:
	@echo "📦 Building and deploying Surokkha Shop (surokkha.shop)..."
	npm install --prefix SurokkhaShop
	npm run build --prefix SurokkhaShop
	@mkdir -p /opt/clients/surokkha/shop
	@cp -r SurokkhaShop/dist/* /opt/clients/surokkha/shop/
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Surokkha Shop deployed to /opt/clients/surokkha/shop!"

# SurokkhaStore runs in Docker; --no-deps keeps compose from touching the live MongoDB container
build-store:
	@echo "🐳 Building and starting SurokkhaStore container (surokkha.store)..."
	docker compose -f docker-compose.prod.yml up -d --build --no-deps frontend-store
	@docker image prune -f >/dev/null 2>&1 || true
	@echo "✓ SurokkhaStore running on 127.0.0.1:$${STORE_FRONTEND_PORT:-3001}"

# SurokkhaOffer (offer.surokkha.shop) also runs in Docker
build-offer:
	@echo "🐳 Building and starting SurokkhaOffer container (offer.surokkha.shop)..."
	docker compose -f docker-compose.prod.yml up -d --build --no-deps frontend-offer
	@docker image prune -f >/dev/null 2>&1 || true
	@echo "✓ SurokkhaOffer running on 127.0.0.1:$${OFFER_FRONTEND_PORT:-3002}"

build-frontend: build-shop

build-dashboard:
	@echo "📦 Building and deploying Surokkha Admin Dashboard..."
	@$(MAKE) sync-config
	npm install --prefix dashboard
	npm run build --prefix dashboard
	@if [ -d "/var/www/admin.surokkha.store" ]; then \
		mkdir -p /var/www/admin.surokkha.store/dist; \
		cp -r dashboard/dist/* /var/www/admin.surokkha.store/dist/; \
	fi
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Admin Dashboard deployed to /var/www/admin.surokkha.store/dist!"

restart-backend:
	systemctl restart surokkha-storefront surokkha-storeweb surokkha-dashboard 2>/dev/null || true
	@echo "✓ Backend restarted!"

status:
	@systemctl status surokkha-storefront surokkha-storeweb surokkha-dashboard --no-pager 2>/dev/null || true
	@docker ps --filter "name=surokkha-mongodb-live" --filter "name=surokkha-frontend-store-live" --filter "name=surokkha-frontend-offer-live" 2>/dev/null || true

logs:
	journalctl -u surokkha-storefront -u surokkha-storeweb -u surokkha-dashboard -f --no-tail

down:
	systemctl stop surokkha-storefront surokkha-storeweb surokkha-dashboard 2>/dev/null || true
