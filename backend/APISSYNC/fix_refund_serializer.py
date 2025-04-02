#!/usr/bin/env python3
"""
Script to check for and create RefundRequestSerializer if it doesn't exist.
For use inside the Docker container.
"""

import os
import re

def fix_refund_serializer():
    # Paths inside the Docker container
    serializers_file = '/app/api/serializers.py'
    
    if not os.path.exists(serializers_file):
        print(f"Error: {serializers_file} not found.")
        return
    
    with open(serializers_file, 'r') as f:
        content = f.read()
    
    # Create a backup
    backup_file = f"{serializers_file}.bak"
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"Created backup at {backup_file}")
    
    # Check if RefundRequestSerializer already exists
    if re.search(r'class\s+RefundRequestSerializer\s*\(', content):
        print("RefundRequestSerializer already exists in serializers.py")
        return
    
    # Find a good place to add the new serializer, preferably after InvoiceSerializer
    serializer_position_pattern = re.compile(r'class\s+InvoiceSerializer\s*\(.*?\).*?(?=class|\Z)', re.DOTALL)
    serializer_position_match = serializer_position_pattern.search(content)
    
    if not serializer_position_match:
        print("Could not find InvoiceSerializer in serializers.py")
        # Add to the end of the file
        position = len(content)
        prefix = "\n\n"
    else:
        position = serializer_position_match.end()
        prefix = "\n\n\n"
    
    # Create the RefundRequestSerializer
    refund_serializer = f'''{prefix}class RefundRequestSerializer(serializers.Serializer):
    refund_date = serializers.DateField(required=True, help_text="Date when the refund was processed")
    refund_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True, help_text="Amount to be refunded")
    refund_reason = serializers.CharField(required=True, help_text="Reason for processing the refund")
    
    def validate_refund_amount(self, value):
        """
        Validate that refund amount is positive.
        """
        if value <= 0:
            raise serializers.ValidationError("Refund amount must be positive")
        return value
        
    def validate(self, data):
        """
        Check that refund date is not in the future.
        """
        if data.get('refund_date') and data['refund_date'] > datetime.date.today():
            raise serializers.ValidationError({
                "refund_date": "Refund date cannot be in the future"
            })
        return data'''
    
    # Insert the new serializer
    updated_content = content[:position] + refund_serializer + content[position:]
    
    # Check if datetime is imported, if not add it
    if 'import datetime' not in updated_content:
        updated_content = 'import datetime\n' + updated_content
    
    # Save the updated file
    with open(serializers_file, 'w') as f:
        f.write(updated_content)
    
    print("✅ Successfully added RefundRequestSerializer to serializers.py")

if __name__ == "__main__":
    fix_refund_serializer() 