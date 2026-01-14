# Billie Servicing Event Processor Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install base requirements (excluding git-based SDKs)
RUN grep -v "git+https" requirements.txt > /tmp/base-requirements.txt && \
    pip install --no-cache-dir -r /tmp/base-requirements.txt

# Install Billie Event SDKs from requirements.txt (requires GITHUB_TOKEN at build time)
ARG GITHUB_TOKEN

# Configure git to use the token for GitHub authentication
RUN git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"

# Install the SDKs from requirements.txt
RUN grep "git+https.*billie-event-sdks" requirements.txt | \
    sed "s/\${GITHUB_TOKEN}/${GITHUB_TOKEN}/g" | \
    xargs -I {} pip install --no-cache-dir "{}"

# Copy application code
COPY src/ src/

# Set Python path
ENV PYTHONPATH=/app/src

# Run the processor
CMD ["python", "-m", "billie_servicing.main"]
