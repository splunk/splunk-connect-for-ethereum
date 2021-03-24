FROM ghcr.io/splunkdlt/connect-ci@sha256:10e6353d1bedecfb5a0100053ad0f0def1d2437e9ef79d0c3404ee877db5cad8 as builder

WORKDIR /ethlogger

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . ./
RUN yarn build

# MAIN IMAGE
FROM node:14.16-alpine

LABEL org.opencontainers.image.source https://github.com/splunk/splunk-connect-for-ethereum

WORKDIR /ethlogger

COPY --from=builder /ethlogger/package.json /ethlogger/yarn.lock /ethlogger/
COPY --from=builder /ethlogger/defaults.ethlogger.yaml /ethlogger/
RUN yarn install --production --frozen-lockfile && yarn link

COPY --from=builder /ethlogger/bin /ethlogger/bin
COPY --from=builder /ethlogger/lib /ethlogger/lib
COPY --from=builder /ethlogger/data /ethlogger/data
COPY --from=builder /ethlogger/wasm/ethabi/pkg /ethlogger/wasm/ethabi/pkg

WORKDIR /app
VOLUME /app

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD ethlogger --health-check

ENV NODE_ENV production
ENV NODE_OPTS --max-old-size=4096

ARG DOCKER_BUILD_GIT_COMMIT="n/a"
ENV ETHLOGGER_GIT_COMMIT $DOCKER_BUILD_GIT_COMMIT

ENTRYPOINT [ "ethlogger" ]
