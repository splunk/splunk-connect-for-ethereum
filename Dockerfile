FROM splunkdlt/scfe-ci@sha256:072ed178724f8a9a8350c271d4a00035c5be7dec0991f36e0a48e76a7cc96ed7 as builder

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
