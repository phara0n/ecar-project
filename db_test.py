#!/usr/bin/env python3
import psycopg2
import sys

def test_connection(host, port, dbname, user, password):
    """Test PostgreSQL connection and print results."""
    try:
        # Connect to the database
        print(f"Attempting to connect to {host}:{port}/{dbname} as {user}...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        
        # Create a cursor
        cur = conn.cursor()
        
        # Test the connection with a simple query
        print("Connection established, testing query...")
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"PostgreSQL version: {version[0]}")
        
        # Close cursor and connection
        cur.close()
        conn.close()
        print("Connection test successful!")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Default connection parameters
    host = "pgbouncer"
    port = "6432"
    dbname = "ecar_db"
    user = "ecar_user"
    password = "ecar_password"
    
    # Check if connection successful
    result = test_connection(host, port, dbname, user, password)
    
    # Exit with appropriate status code
    sys.exit(0 if result else 1) 