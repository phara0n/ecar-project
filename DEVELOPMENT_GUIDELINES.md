# ECAR Project Development Guidelines

## Backend Code Policy (April 9, 2025)

### CRITICAL: DO NOT MODIFY BACKEND CODE

- **Strict Backend Separation**: All development work must focus exclusively on the frontend (web-admin). Backend code should never be modified directly.

- **Frontend-Only Development**: Only make changes to React Admin components and related frontend files. All improvements must be implemented on the frontend side.

- **Reporting Backend Requirements**: If backend functionality is missing or needs adjustment, document it and communicate it clearly rather than making direct changes. Create detailed documentation of what is needed from the backend.

- **Working Within API Constraints**: Frontend must adapt to existing backend API contracts and data structures. Make use of transformers and formatters on the frontend to handle any inconsistencies.

- **Data Transformation**: Any data transformation, format conversion, or validation should be implemented on the frontend side. The frontend is responsible for sending data in the format expected by the backend.

## Development Process

1. Identify frontend requirements and implement them without modifying backend code
2. If backend changes are needed, document them clearly and wait for approval
3. Use frontend techniques to work around backend limitations when possible
4. Test all changes thoroughly against the existing backend API
5. Update documentation to reflect frontend changes and any backend requirements

This strict separation of concerns ensures stability of the backend services while allowing frontend development to progress. 