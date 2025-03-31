# Local Development Environment Setup

## Prerequisites
- Python 3.12
- PostgreSQL 15
- Redis 7.2
- virtualenv (recommended)

## Steps to Set Up Local Backend Environment

### 1. Create and Activate Virtual Environment
```bash
cd /home/ecar/ecar_project/backend
python -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Local Database
Make sure PostgreSQL is installed locally. Then:
```bash
# Create database
sudo -u postgres createuser -P ecar_user  # Enter password: ecar_password
sudo -u postgres createdb -O ecar_user ecar_db
```

### 4. Create Local Environment File
Create a `.env.local` file in the backend directory:
```bash
# Django settings
DEBUG=True
SECRET_KEY=django-insecure-sf&5=mdd7n16u!co7v&i8)ygr4c16x(_g7$k=cjvyuqqm!2-kh
ALLOWED_HOSTS=localhost,127.0.0.1

# Database settings (direct connection, no PgBouncer)
DB_NAME=ecar_db
DB_USER=ecar_user
DB_PASSWORD=ecar_password
DB_HOST=localhost
DB_PORT=5432

# Redis settings
REDIS_URL=redis://localhost:6379/1
```

### 5. Run Migrations
```bash
python manage.py migrate
```

### 6. Run Development Server
```bash
python manage.py runserver 0.0.0.0:8000
```

## Troubleshooting Tips
- Make sure PostgreSQL and Redis are running locally
- Verify database connection parameters
- Check for port conflicts with existing Docker services 