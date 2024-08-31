# Use an ARG to allow the .NET version to be specified at build time
ARG DOTNET_VERSION=6.0

# Use the specified .NET SDK version as the base image
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION}

# Set the working directory inside the container
WORKDIR /workspace

# Copy the entire workspace into the container's workspace directory
COPY . .

# Make sure the script is executable
RUN chmod +x /workspace/src/test.sh

# Set the entrypoint to the script
ENTRYPOINT ["/bin/bash", "/workspace/src/test.sh"]

