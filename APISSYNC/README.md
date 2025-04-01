# API Documentation Tools

This directory contains scripts to automatically fix and update the Swagger API documentation for the ECAR project.

## Scripts Overview

- **docker_update_docs.py**: Updates missing Swagger documentation throughout the project
- **fix_refund_docs.py**: Adds documentation for the invoice refund action
- **fix_invoice_endpoints.py**: Adds documentation for all invoice-related actions
- **fix_refund_serializer.py**: Creates the RefundRequestSerializer if it doesn't exist
- **run_all_fixes.py**: Master script that runs all the above scripts in sequence
- **copy_to_docker.sh**: Copies all scripts to the Docker container

## Running the Scripts

### Method 1: Run inside Docker container (recommended)

1. Make the copy script executable:
   ```
   chmod +x copy_to_docker.sh
   ```

2. Copy all scripts to the Docker container:
   ```
   ./copy_to_docker.sh
   ```

3. Run the master fix script inside the Docker container:
   ```
   docker-compose exec backend python /app/APISSYNC/run_all_fixes.py
   ```

4. Restart the backend to see the changes in Swagger:
   ```
   docker-compose restart backend
   ```

### Method 2: Run individual scripts

You can run individual scripts inside the Docker container:

```
docker-compose exec backend python /app/APISSYNC/fix_refund_docs.py
```

## Adding New Documentation Scripts

If you need to add documentation for new endpoints:

1. Create a new script following the pattern of the existing scripts
2. Add the script to the `scripts` list in `run_all_fixes.py`
3. Copy it to the Docker container using `copy_to_docker.sh`

## Generated Documentation

The scripts will add Swagger documentation in the following format:

```python
@swagger_auto_schema(
    operation_summary="Short summary",
    operation_description="Longer description",
    tags=["category"],
    request_body=SomeSerializer,
    responses={
        200: SuccessSerializer,
        400: "Bad request description",
        404: "Not found description"
    }
)
```

## Troubleshooting

If you encounter issues:

1. Make sure all scripts have executable permissions
2. Check that the Docker container is running
3. Verify the path to the scripts in the Docker container
4. Check for error messages in the script output 