all: production

define run_docker
	$(eval $@_STAGE = $(1))

	docker buildx build --progress=plain --target "${$@_STAGE}" -t "viz_${$@_STAGE}" ./docker
	docker run \
		-it \
		--rm \
		--gpus all \
		-v /tmp/viz:/tmp/viz \
		"viz_${$@_STAGE}" || true
endef

production:
	@$(call run_docker,"production")
