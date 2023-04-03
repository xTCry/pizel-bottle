# Example use: make up-build
# Example use: make up-build service_name=api_gateway

project_name = pizel-bottle
service_name = app_srv

up-prod-build:
	docker-compose -p "$(project_name)" -f docker-compose.yml -f docker-compose.prod.yml up -d --build $(service_name)

up-dev-build:
	docker-compose -p "$(project_name)" up -d --build $(service_name)

up-prod:
	docker-compose -p "$(project_name)" -f docker-compose.yml -f docker-compose.prod.yml up -d $(service_name)

up-dev:
	docker-compose -p "$(project_name)" up -d $(service_name)

down:
	docker-compose -p "$(project_name)" down
