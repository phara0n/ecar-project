from cryptography.fernet import Fernet
import base64
import os
import hashlib
from django.conf import settings

def get_encryption_key():
    """
    Get or generate an encryption key using the SECRET_KEY or ENCRYPTION_KEY environment variable.
    The key is derived using PBKDF2 with SHA-256 to ensure it's suitable for Fernet.
    
    Returns:
        bytes: An URL-safe base64-encoded 32-byte key
    """
    # Get the key from environment or use settings.SECRET_KEY
    key_material = os.environ.get('ENCRYPTION_KEY', settings.SECRET_KEY)
    
    # Use PBKDF2 to derive a secure key
    # The salt should ideally be stored securely and consistently
    salt = b'ecar_encryption_salt'  # In production, this should be a securely stored value
    
    # Derive a 32-byte key using PBKDF2-HMAC with SHA-256
    key = hashlib.pbkdf2_hmac('sha256', key_material.encode(), salt, 100000, 32)
    
    # Encode to URL-safe base64 format as required by Fernet
    return base64.urlsafe_b64encode(key)

def encrypt_data(data):
    """
    Encrypt sensitive data using AES-256 encryption (via Fernet).
    
    Args:
        data (str): Plain text data to encrypt
        
    Returns:
        str: Encrypted data as a string
    """
    if not data:
        return None
        
    # Initialize Fernet with our key
    f = Fernet(get_encryption_key())
    
    # Encrypt the data and return as a string
    encrypted_data = f.encrypt(data.encode())
    return encrypted_data.decode()

def decrypt_data(encrypted_data):
    """
    Decrypt data that was encrypted using encrypt_data.
    
    Args:
        encrypted_data (str): Encrypted data as a string
        
    Returns:
        str: Decrypted plain text
    """
    if not encrypted_data:
        return None
        
    # Initialize Fernet with our key
    f = Fernet(get_encryption_key())
    
    # Decrypt the data
    try:
        decrypted_data = f.decrypt(encrypted_data.encode())
        return decrypted_data.decode()
    except Exception as e:
        # Log the error, but don't expose details in the return value
        print(f"Error decrypting data: {str(e)}")
        return None

def encrypt_model_field(model_instance, field_name, value):
    """
    Encrypt a value and store it in a model field prefixed with '_encrypted_'.
    
    Args:
        model_instance: The model instance
        field_name (str): The field name (without '_encrypted_' prefix)
        value (str): The value to encrypt
        
    Returns:
        None
    """
    encrypted_field_name = f"_encrypted_{field_name}"
    if hasattr(model_instance, encrypted_field_name):
        encrypted_value = encrypt_data(value) if value else None
        setattr(model_instance, encrypted_field_name, encrypted_value)
    else:
        raise AttributeError(f"Model {model_instance.__class__.__name__} has no field {encrypted_field_name}")

def decrypt_model_field(model_instance, field_name):
    """
    Decrypt a value stored in a model field prefixed with '_encrypted_'.
    
    Args:
        model_instance: The model instance
        field_name (str): The field name (without '_encrypted_' prefix)
        
    Returns:
        str: The decrypted value
    """
    encrypted_field_name = f"_encrypted_{field_name}"
    if hasattr(model_instance, encrypted_field_name):
        encrypted_value = getattr(model_instance, encrypted_field_name)
        return decrypt_data(encrypted_value)
    else:
        raise AttributeError(f"Model {model_instance.__class__.__name__} has no field {encrypted_field_name}")

class EncryptedModelFieldMixin:
    """
    Mixin to add encrypted field functionality to a model.
    Adds property accessors for encrypted fields.
    
    Usage:
        class MyModel(EncryptedModelFieldMixin, models.Model):
            _encrypted_phone = models.TextField(null=True, blank=True)
            
            # Define the properties that should be encrypted
            @property
            def phone(self):
                return self.get_encrypted_field('phone')
                
            @phone.setter
            def phone(self, value):
                self.set_encrypted_field('phone', value)
    """
    
    def get_encrypted_field(self, field_name):
        """Get the decrypted value of an encrypted field"""
        return decrypt_model_field(self, field_name)
    
    def set_encrypted_field(self, field_name, value):
        """Set and encrypt a value in the corresponding encrypted field"""
        encrypt_model_field(self, field_name, value)
