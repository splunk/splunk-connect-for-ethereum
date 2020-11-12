FROM splunkdlt/scfe-ci@sha256:b141249cf9221b76f05f98c87c015c8494673d0a4a8d15a93b97b117c9a1323f as builder

WORKDIR /ethlogger

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . ./
RUN yarn build

# MAIN IMAGE
FROM node:12.16-alpine

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

ENTRYPOINT [ "ethlogger" ]
