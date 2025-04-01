"""
API Documentation Templates

This file contains templates for properly documenting API endpoints in the ECAR project.
These templates can be copied and adapted for use in your views.py file.

For more information on drf-yasg documentation, see:
https://drf-yasg.readthedocs.io/en/stable/custom_spec.html
"""

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets
from rest_framework.decorators import action

# Import your serializers here
# from api.serializers import YourSerializer


# ====================================
# Standard ViewSet Method Documentation
# ====================================

class DocumentedViewSetExample(viewsets.ModelViewSet):
    """
    Example of a fully documented ViewSet.
    
    This shows how to document all standard methods (list, create, retrieve, update, delete)
    as well as custom actions.
    """
    
    # Document the standard methods
    @swagger_auto_schema(
        operation_summary="List all items",
        operation_description="Returns a paginated list of all items the user has access to",
        responses={200: 'YourSerializer(many=True)'}
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Create a new item",
        operation_description="Create a new item with the provided data",
        request_body='YourSerializer',
        responses={
            201: 'YourSerializer',
            400: "Bad request - invalid data"
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Get item details",
        operation_description="Retrieve detailed information about a specific item",
        responses={
            200: 'YourSerializer',
            404: "Item not found"
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Update an item",
        operation_description="Update all fields of an existing item",
        request_body='YourSerializer',
        responses={
            200: 'YourSerializer',
            400: "Bad request - invalid data",
            404: "Item not found"
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Partially update an item",
        operation_description="Update specific fields of an existing item",
        request_body='YourSerializer',
        responses={
            200: 'YourSerializer',
            400: "Bad request - invalid data",
            404: "Item not found"
        }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_summary="Delete an item",
        operation_description="Permanently delete an item",
        responses={
            204: "No content - deletion successful",
            404: "Item not found"
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


# ====================================
# Custom Action Documentation Templates
# ====================================

class CustomActionExamples(viewsets.ModelViewSet):
    """Examples of documented custom actions for different HTTP methods"""
    
    # GET action on a specific object
    @swagger_auto_schema(
        operation_summary="Get specific data for an item",
        operation_description="Retrieves specialized information for a specific item",
        responses={
            200: 'SpecializedSerializer',
            404: "Item not found"
        }
    )
    @action(detail=True, methods=['get'])
    def special_info(self, request, pk=None):
        """Get specialized information about this item"""
        pass
    
    # GET action on the collection
    @swagger_auto_schema(
        operation_summary="Get filtered items",
        operation_description="Returns items filtered by specific criteria",
        manual_parameters=[
            openapi.Parameter(
                'status', 
                openapi.IN_QUERY, 
                description="Filter by status", 
                type=openapi.TYPE_STRING,
                enum=['active', 'pending', 'cancelled']
            ),
            openapi.Parameter(
                'date_from', 
                openapi.IN_QUERY, 
                description="Filter by date (from)", 
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE
            )
        ],
        responses={200: 'YourSerializer(many=True)'}
    )
    @action(detail=False, methods=['get'])
    def filtered(self, request):
        """Get filtered list of items"""
        pass
    
    # POST action with request body
    @swagger_auto_schema(
        operation_summary="Process an item",
        operation_description="Perform a specific process on this item",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['reason'],
            properties={
                'reason': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Reason for processing"
                ),
                'amount': openapi.Schema(
                    type=openapi.TYPE_NUMBER,
                    description="Amount to process (optional)"
                )
            }
        ),
        responses={
            200: 'ProcessedSerializer',
            400: "Bad request - invalid data",
            404: "Item not found"
        }
    )
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process this item"""
        pass


# ====================================
# Real-World Refund Example
# ====================================

class InvoiceViewSetExample(viewsets.ModelViewSet):
    """Example of documenting an invoice refund action"""
    
    @swagger_auto_schema(
        operation_summary="Process refund for invoice",
        operation_description="""
        Refund a paid invoice and record refund details.
        
        Only invoices with 'paid' status can be refunded. The refund amount defaults to
        the full invoice amount if not specified. A reason for the refund is required.
        """,
        tags=['invoices'],
        request_body='RefundRequestSerializer',  # You would define this serializer
        responses={
            200: 'InvoiceSerializer',
            400: "Bad request - invoice cannot be refunded (not in paid status or missing reason)",
            404: "Invoice not found"
        }
    )
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Process refund for a paid invoice"""
        pass 