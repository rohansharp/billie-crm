# Billie Servicing Event Processor Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install base requirements
RUN pip install --no-cache-dir -r requirements.txt

# Install Billie Event SDKs (requires GITHUB_TOKEN at build time)
ARG GITHUB_TOKEN

# Configure git to use the token for GitHub authentication
RUN git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"

# Install the SDKs
RUN pip install --no-cache-dir \
    "git+https://github.com/BillieLoans/billie-event-sdks.git@accounts-v2.2.0#subdirectory=packages/accounts" \
    "git+https://github.com/BillieLoans/billie-event-sdks.git@customers-v2.0.0#subdirectory=packages/customers"

# Copy application code
COPY src/ src/

# Set Python path
ENV PYTHONPATH=/app/src

# Run the processor
CMD ["python", "-m", "billie_servicing.main"]
