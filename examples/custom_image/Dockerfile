FROM ethlogger

WORKDIR /app

# Add a custom configuration file to the docker image
# So every container started from this image will have the configuration
COPY ethlogger.yaml .

# Add a sample ABI definition
COPY ERC20.json ./abis/

ENTRYPOINT [ "ethlogger", "--debug", "--print-config" ]
