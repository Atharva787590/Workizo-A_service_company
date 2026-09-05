"""
Django settings for config project.
"""

from pathlib import Path
import environ
import os
from datetime import timedelta

# Initialize environ
env = environ.Env(
    DEBUG=(bool, False)
)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Read .env file
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY', default='django-insecure-unnati-dev-fallback-key-change-in-production')
DEBUG = env.bool('DEBUG', default=False)

allowed_hosts_str = env('ALLOWED_HOSTS', default='*')
ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_str.split(',') if h.strip()]

# Application definition
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party packages
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    
    # Project apps
    'accounts',
    'customers',
    'workers',
    'services',
    'bookings',
    'notifications',
    'billing',
    'assistant',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # Put at the top
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

redis_host = env('REDIS_HOST', default=None)
if redis_host:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [(redis_host, env.int('REDIS_PORT', default=6379))],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        },
    }

# Database Setup
database_url = env('DATABASE_URL', default=None)
if database_url:
    DATABASES = {
        'default': env.db_url('DATABASE_URL')
    }
else:
    db_engine = env('DB_ENGINE', default='django.db.backends.sqlite3' if not env('DB_NAME', default='') else 'django.db.backends.mysql')
    if db_engine == 'django.db.backends.sqlite3':
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
    elif 'postgres' in db_engine:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': env('DB_NAME', default='unnati_db'),
                'USER': env('DB_USER', default='postgres'),
                'PASSWORD': env('DB_PASSWORD', default=''),
                'HOST': env('DB_HOST', default='127.0.0.1'),
                'PORT': env('DB_PORT', default='5432'),
            }
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.mysql',
                'NAME': env('DB_NAME', default='unnati_db'),
                'USER': env('DB_USER', default='root'),
                'PASSWORD': env('DB_PASSWORD', default=''),
                'HOST': env('DB_HOST', default='127.0.0.1'),
                'PORT': env('DB_PORT', default='3306'),
                'OPTIONS': {
                    'charset': 'utf8mb4',
                }
            }
        }

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# REST Framework Config
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# Simple JWT Config
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS Config
cors_origins = env('CORS_ALLOWED_ORIGINS', default='')
if cors_origins:
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins.split(',')]
else:
    CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Security Headers & Cookie Hardening
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=False)
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=False)
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=False)

csrf_trusted = env('CSRF_TRUSTED_ORIGINS', default='')
if csrf_trusted:
    CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in csrf_trusted.split(',') if origin.strip()]

# Internationalization

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media Files (User profile photos, verification files)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Google OAuth Client ID
GOOGLE_CLIENT_ID = env('GOOGLE_CLIENT_ID', default=None)

# SMTP Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='localhost')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='webmaster@localhost')

# Token Expirations
PASSWORD_RESET_TIMEOUT = 900  # 15 minutes in seconds

# Razorpay Config
RAZORPAY_KEY_ID = env('RAZORPAY_KEY_ID', default='rzp_test_51O2p3D4R5S6T7U')
RAZORPAY_KEY_SECRET = env('RAZORPAY_KEY_SECRET', default='dummy_secret_value')
