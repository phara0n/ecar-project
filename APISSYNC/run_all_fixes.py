#!/usr/bin/env python3
"""
Master script to run all API documentation fix scripts.
This should be executed inside the Docker container.
"""

import subprocess
import os
import sys

def run_script(script_name):
    """Run a Python script and return its stdout and stderr."""
    print(f"📂 Running {script_name}...")
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ {script_name} completed successfully")
        if result.stdout:
            print(f"Output:\n{result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {script_name} failed with exit code {e.returncode}")
        if e.stdout:
            print(f"Output:\n{e.stdout}")
        if e.stderr:
            print(f"Error:\n{e.stderr}")
        return False

def main():
    print("🔍 Starting API documentation fixes...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # First check if we're in the Docker container
    if not os.path.exists('/app'):
        print("❌ This script must be run inside the Docker container.")
        print("Try running: docker-compose exec backend python /app/APISSYNC/run_all_fixes.py")
        return False
    
    # Ensure all our scripts are executable
    scripts = [
        "docker_update_docs.py",
        "fix_refund_docs.py",
        "fix_invoice_endpoints.py",
        "fix_refund_serializer.py"
    ]
    
    for script in scripts:
        if not os.path.exists(script):
            print(f"❌ Script {script} not found in {script_dir}")
            continue
        os.chmod(script, 0o755)
    
    # Run each script in sequence
    success = True
    success = success and run_script("fix_refund_serializer.py")
    success = success and run_script("fix_invoice_endpoints.py")
    success = success and run_script("fix_refund_docs.py")
    success = success and run_script("docker_update_docs.py")
    
    if success:
        print("✅✅✅ All API documentation fixes completed successfully")
        print("🔄 Remember to restart your backend to see the updated Swagger docs:")
        print("docker-compose restart backend")
    else:
        print("❌ Some API documentation fixes failed, check the output for details")
    
    return success

if __name__ == "__main__":
    sys.exit(0 if main() else 1) 