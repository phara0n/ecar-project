FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create media and staticfiles directories with proper permissions
RUN mkdir -p /app/media /app/staticfiles \
    && chmod -R 777 /app/media /app/staticfiles

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /app/

# Make sure manage.py is executable
RUN chmod +x /app/manage.py

# Add wait script to wait for the database to be ready
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.9.0/wait /wait
RUN chmod +x /wait

# Run with Django development server for testing
CMD /wait && python manage.py migrate && python manage.py collectstatic --noinput && python manage.py runserver 0.0.0.0:8000 