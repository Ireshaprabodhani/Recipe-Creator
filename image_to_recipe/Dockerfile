FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create and set permissions for generated_recipes directory
RUN mkdir -p generated_recipes && \
    chown -R appuser:appuser /app/generated_recipes && \
    chmod 755 /app/generated_recipes

# Switch to non-root user
USER appuser

# Make port 5000 available
EXPOSE 5000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production
ENV GUNICORN_CMD_ARGS="--workers=2 --threads=4 --worker-class=gthread --worker-tmp-dir=/dev/shm"

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]