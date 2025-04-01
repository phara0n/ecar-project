# API Documentation Checklist

Generated: 2025-04-01 17:59:04

## Documentation Coverage

- Total ViewSets: 7
- Total Actions: 31
- Documented Actions: 4
- Documentation Coverage: 12.9%

## Undocumented Actions

The following actions need documentation:

- [ ] `update_address`
- [ ] `cars`
- [ ] `bulk_create`
- [ ] `export`
- [ ] `services`
- [ ] `items`
- [ ] `invoice`
- [ ] `send_sms_notification`
- [ ] `complete`
- [ ] `cancel`
- [ ] `reschedule`
- [ ] `upcoming`
- [ ] `in_progress`
- [ ] `completed`
- [ ] `bulk_update`
- [ ] `download`
- [ ] `upload_pdf`
- [ ] `mark_as_paid`
- [ ] `refund`
- [ ] `paid`
- [ ] `refunded`
- [ ] `send_sms_notification`
- [ ] `bulk_upload`
- [ ] `mark_read`
- [ ] `mark_all_read`

## API Endpoints

### UserViewSet

| Method | URL | Action | Documented |
|--------|-----|--------|------------|
| GET | `/api/users/` | `list` | ❌ |
| POST | `/api/users/` | `create` | ❌ |
| GET | `/api/users/{id}/` | `retrieve` | ❌ |
| PUT | `/api/users/{id}/` | `update` | ❌ |
| PATCH | `/api/users/{id}/` | `partial_update` | ❌ |
| DELETE | `/api/users/{id}/` | `destroy` | ❌ |
| GET | `/api/users/{id}/me/` | `me` | ✅ |
| GET | `/api/users/statistics/` | `statistics` | ✅ |
| GET | `/api/users/service-history/` | `service_history` | ✅ |
| PUT | `/api/users/update-address/` | `update_address` | ❌ |
| GET | `/api/users/cars/` | `cars` | ❌ |
| GET | `/api/users/bulk-create/` | `bulk_create` | ❌ |
| GET | `/api/users/export/` | `export` | ❌ |
| GET | `/api/users/services/` | `services` | ❌ |
| GET | `/api/users/items/` | `items` | ❌ |
| GET | `/api/users/invoice/` | `invoice` | ❌ |
| GET | `/api/users/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/users/complete/` | `complete` | ❌ |
| GET | `/api/users/cancel/` | `cancel` | ❌ |
| GET | `/api/users/reschedule/` | `reschedule` | ❌ |
| GET | `/api/users/upcoming/` | `upcoming` | ❌ |
| GET | `/api/users/in-progress/` | `in_progress` | ❌ |
| GET | `/api/users/completed/` | `completed` | ❌ |
| GET | `/api/users/statistics/` | `statistics` | ✅ |
| GET | `/api/users/bulk-update/` | `bulk_update` | ❌ |
| GET | `/api/users/{id}/download/` | `download` | ❌ |
| GET | `/api/users/upload-pdf/` | `upload_pdf` | ❌ |
| GET | `/api/users/mark-as-paid/` | `mark_as_paid` | ❌ |
| POST | `/api/users/{id}/refund/` | `refund` | ❌ |
| GET | `/api/users/unpaid/` | `unpaid` | ✅ |
| GET | `/api/users/paid/` | `paid` | ❌ |
| GET | `/api/users/refunded/` | `refunded` | ❌ |
| GET | `/api/users/statistics/` | `statistics` | ✅ |
| GET | `/api/users/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/users/bulk-upload/` | `bulk_upload` | ❌ |
| GET | `/api/users/mark-read/` | `mark_read` | ❌ |
| GET | `/api/users/mark-all-read/` | `mark_all_read` | ❌ |

### CustomerViewSet

| Method | URL | Action | Documented |
|--------|-----|--------|------------|
| GET | `/api/customers/` | `list` | ❌ |
| POST | `/api/customers/` | `create` | ❌ |
| GET | `/api/customers/{id}/` | `retrieve` | ❌ |
| PUT | `/api/customers/{id}/` | `update` | ❌ |
| PATCH | `/api/customers/{id}/` | `partial_update` | ❌ |
| DELETE | `/api/customers/{id}/` | `destroy` | ❌ |
| GET | `/api/customers/{id}/me/` | `me` | ✅ |
| GET | `/api/customers/statistics/` | `statistics` | ✅ |
| GET | `/api/customers/service-history/` | `service_history` | ✅ |
| PUT | `/api/customers/update-address/` | `update_address` | ❌ |
| GET | `/api/customers/cars/` | `cars` | ❌ |
| GET | `/api/customers/bulk-create/` | `bulk_create` | ❌ |
| GET | `/api/customers/export/` | `export` | ❌ |
| GET | `/api/customers/services/` | `services` | ❌ |
| GET | `/api/customers/items/` | `items` | ❌ |
| GET | `/api/customers/invoice/` | `invoice` | ❌ |
| GET | `/api/customers/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/customers/complete/` | `complete` | ❌ |
| GET | `/api/customers/cancel/` | `cancel` | ❌ |
| GET | `/api/customers/reschedule/` | `reschedule` | ❌ |
| GET | `/api/customers/upcoming/` | `upcoming` | ❌ |
| GET | `/api/customers/in-progress/` | `in_progress` | ❌ |
| GET | `/api/customers/completed/` | `completed` | ❌ |
| GET | `/api/customers/statistics/` | `statistics` | ✅ |
| GET | `/api/customers/bulk-update/` | `bulk_update` | ❌ |
| GET | `/api/customers/{id}/download/` | `download` | ❌ |
| GET | `/api/customers/upload-pdf/` | `upload_pdf` | ❌ |
| GET | `/api/customers/mark-as-paid/` | `mark_as_paid` | ❌ |
| POST | `/api/customers/{id}/refund/` | `refund` | ❌ |
| GET | `/api/customers/unpaid/` | `unpaid` | ✅ |
| GET | `/api/customers/paid/` | `paid` | ❌ |
| GET | `/api/customers/refunded/` | `refunded` | ❌ |
| GET | `/api/customers/statistics/` | `statistics` | ✅ |
| GET | `/api/customers/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/customers/bulk-upload/` | `bulk_upload` | ❌ |
| GET | `/api/customers/mark-read/` | `mark_read` | ❌ |
| GET | `/api/customers/mark-all-read/` | `mark_all_read` | ❌ |

### CarViewSet

| Method | URL | Action | Documented |
|--------|-----|--------|------------|
| GET | `/api/cars/` | `list` | ❌ |
| POST | `/api/cars/` | `create` | ❌ |
| GET | `/api/cars/{id}/` | `retrieve` | ❌ |
| PUT | `/api/cars/{id}/` | `update` | ❌ |
| PATCH | `/api/cars/{id}/` | `partial_update` | ❌ |
| DELETE | `/api/cars/{id}/` | `destroy` | ❌ |
| GET | `/api/cars/{id}/me/` | `me` | ✅ |
| GET | `/api/cars/statistics/` | `statistics` | ✅ |
| GET | `/api/cars/service-history/` | `service_history` | ✅ |
| PUT | `/api/cars/update-address/` | `update_address` | ❌ |
| GET | `/api/cars/cars/` | `cars` | ❌ |
| GET | `/api/cars/bulk-create/` | `bulk_create` | ❌ |
| GET | `/api/cars/export/` | `export` | ❌ |
| GET | `/api/cars/services/` | `services` | ❌ |
| GET | `/api/cars/items/` | `items` | ❌ |
| GET | `/api/cars/invoice/` | `invoice` | ❌ |
| GET | `/api/cars/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/cars/complete/` | `complete` | ❌ |
| GET | `/api/cars/cancel/` | `cancel` | ❌ |
| GET | `/api/cars/reschedule/` | `reschedule` | ❌ |
| GET | `/api/cars/upcoming/` | `upcoming` | ❌ |
| GET | `/api/cars/in-progress/` | `in_progress` | ❌ |
| GET | `/api/cars/completed/` | `completed` | ❌ |
| GET | `/api/cars/statistics/` | `statistics` | ✅ |
| GET | `/api/cars/bulk-update/` | `bulk_update` | ❌ |
| GET | `/api/cars/{id}/download/` | `download` | ❌ |
| GET | `/api/cars/upload-pdf/` | `upload_pdf` | ❌ |
| GET | `/api/cars/mark-as-paid/` | `mark_as_paid` | ❌ |
| POST | `/api/cars/{id}/refund/` | `refund` | ❌ |
| GET | `/api/cars/unpaid/` | `unpaid` | ✅ |
| GET | `/api/cars/paid/` | `paid` | ❌ |
| GET | `/api/cars/refunded/` | `refunded` | ❌ |
| GET | `/api/cars/statistics/` | `statistics` | ✅ |
| GET | `/api/cars/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/cars/bulk-upload/` | `bulk_upload` | ❌ |
| GET | `/api/cars/mark-read/` | `mark_read` | ❌ |
| GET | `/api/cars/mark-all-read/` | `mark_all_read` | ❌ |

### ServiceViewSet

| Method | URL | Action | Documented |
|--------|-----|--------|------------|
| GET | `/api/services/` | `list` | ❌ |
| POST | `/api/services/` | `create` | ❌ |
| GET | `/api/services/{id}/` | `retrieve` | ❌ |
| PUT | `/api/services/{id}/` | `update` | ❌ |
| PATCH | `/api/services/{id}/` | `partial_update` | ❌ |
| DELETE | `/api/services/{id}/` | `destroy` | ❌ |
| GET | `/api/services/{id}/me/` | `me` | ✅ |
| GET | `/api/services/statistics/` | `statistics` | ✅ |
| GET | `/api/services/service-history/` | `service_history` | ✅ |
| PUT | `/api/services/update-address/` | `update_address` | ❌ |
| GET | `/api/services/cars/` | `cars` | ❌ |
| GET | `/api/services/bulk-create/` | `bulk_create` | ❌ |
| GET | `/api/services/export/` | `export` | ❌ |
| GET | `/api/services/services/` | `services` | ❌ |
| GET | `/api/services/items/` | `items` | ❌ |
| GET | `/api/services/invoice/` | `invoice` | ❌ |
| GET | `/api/services/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/services/complete/` | `complete` | ❌ |
| GET | `/api/services/cancel/` | `cancel` | ❌ |
| GET | `/api/services/reschedule/` | `reschedule` | ❌ |
| GET | `/api/services/upcoming/` | `upcoming` | ❌ |
| GET | `/api/services/in-progress/` | `in_progress` | ❌ |
| GET | `/api/services/completed/` | `completed` | ❌ |
| GET | `/api/services/statistics/` | `statistics` | ✅ |
| GET | `/api/services/bulk-update/` | `bulk_update` | ❌ |
| GET | `/api/services/{id}/download/` | `download` | ❌ |
| GET | `/api/services/upload-pdf/` | `upload_pdf` | ❌ |
| GET | `/api/services/mark-as-paid/` | `mark_as_paid` | ❌ |
| POST | `/api/services/{id}/refund/` | `refund` | ❌ |
| GET | `/api/services/unpaid/` | `unpaid` | ✅ |
| GET | `/api/services/paid/` | `paid` | ❌ |
| GET | `/api/services/refunded/` | `refunded` | ❌ |
| GET | `/api/services/statistics/` | `statistics` | ✅ |
| GET | `/api/services/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/services/bulk-upload/` | `bulk_upload` | ❌ |
| GET | `/api/services/mark-read/` | `mark_read` | ❌ |
| GET | `/api/services/mark-all-read/` | `mark_all_read` | ❌ |

### ServiceItemViewSet

| Method | URL | Action | Documented |
|--------|-----|--------|------------|
| GET | `/api/service-items/` | `list` | ❌ |
| POST | `/api/service-items/` | `create` | ❌ |
| GET | `/api/service-items/{id}/` | `retrieve` | ❌ |
| PUT | `/api/service-items/{id}/` | `update` | ❌ |
| PATCH | `/api/service-items/{id}/` | `partial_update` | ❌ |
| DELETE | `/api/service-items/{id}/` | `destroy` | ❌ |
| GET | `/api/service-items/{id}/me/` | `me` | ✅ |
| GET | `/api/service-items/statistics/` | `statistics` | ✅ |
| GET | `/api/service-items/service-history/` | `service_history` | ✅ |
| PUT | `/api/service-items/update-address/` | `update_address` | ❌ |
| GET | `/api/service-items/cars/` | `cars` | ❌ |
| GET | `/api/service-items/bulk-create/` | `bulk_create` | ❌ |
| GET | `/api/service-items/export/` | `export` | ❌ |
| GET | `/api/service-items/services/` | `services` | ❌ |
| GET | `/api/service-items/items/` | `items` | ❌ |
| GET | `/api/service-items/invoice/` | `invoice` | ❌ |
| GET | `/api/service-items/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/service-items/complete/` | `complete` | ❌ |
| GET | `/api/service-items/cancel/` | `cancel` | ❌ |
| GET | `/api/service-items/reschedule/` | `reschedule` | ❌ |
| GET | `/api/service-items/upcoming/` | `upcoming` | ❌ |
| GET | `/api/service-items/in-progress/` | `in_progress` | ❌ |
| GET | `/api/service-items/completed/` | `completed` | ❌ |
| GET | `/api/service-items/statistics/` | `statistics` | ✅ |
| GET | `/api/service-items/bulk-update/` | `bulk_update` | ❌ |
| GET | `/api/service-items/{id}/download/` | `download` | ❌ |
| GET | `/api/service-items/upload-pdf/` | `upload_pdf` | ❌ |
| GET | `/api/service-items/mark-as-paid/` | `mark_as_paid` | ❌ |
| POST | `/api/service-items/{id}/refund/` | `refund` | ❌ |
| GET | `/api/service-items/unpaid/` | `unpaid` | ✅ |
| GET | `/api/service-items/paid/` | `paid` | ❌ |
| GET | `/api/service-items/refunded/` | `refunded` | ❌ |
| GET | `/api/service-items/statistics/` | `statistics` | ✅ |
| GET | `/api/service-items/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/service-items/bulk-upload/` | `bulk_upload` | ❌ |
| GET | `/api/service-items/mark-read/` | `mark_read` | ❌ |
| GET | `/api/service-items/mark-all-read/` | `mark_all_read` | ❌ |

### InvoiceViewSet

| Method | URL | Action | Documented |
|--------|-----|--------|------------|
| GET | `/api/invoices/` | `list` | ❌ |
| POST | `/api/invoices/` | `create` | ❌ |
| GET | `/api/invoices/{id}/` | `retrieve` | ❌ |
| PUT | `/api/invoices/{id}/` | `update` | ❌ |
| PATCH | `/api/invoices/{id}/` | `partial_update` | ❌ |
| DELETE | `/api/invoices/{id}/` | `destroy` | ❌ |
| GET | `/api/invoices/{id}/me/` | `me` | ✅ |
| GET | `/api/invoices/statistics/` | `statistics` | ✅ |
| GET | `/api/invoices/service-history/` | `service_history` | ✅ |
| PUT | `/api/invoices/update-address/` | `update_address` | ❌ |
| GET | `/api/invoices/cars/` | `cars` | ❌ |
| GET | `/api/invoices/bulk-create/` | `bulk_create` | ❌ |
| GET | `/api/invoices/export/` | `export` | ❌ |
| GET | `/api/invoices/services/` | `services` | ❌ |
| GET | `/api/invoices/items/` | `items` | ❌ |
| GET | `/api/invoices/invoice/` | `invoice` | ❌ |
| GET | `/api/invoices/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/invoices/complete/` | `complete` | ❌ |
| GET | `/api/invoices/cancel/` | `cancel` | ❌ |
| GET | `/api/invoices/reschedule/` | `reschedule` | ❌ |
| GET | `/api/invoices/upcoming/` | `upcoming` | ❌ |
| GET | `/api/invoices/in-progress/` | `in_progress` | ❌ |
| GET | `/api/invoices/completed/` | `completed` | ❌ |
| GET | `/api/invoices/statistics/` | `statistics` | ✅ |
| GET | `/api/invoices/bulk-update/` | `bulk_update` | ❌ |
| GET | `/api/invoices/{id}/download/` | `download` | ❌ |
| GET | `/api/invoices/upload-pdf/` | `upload_pdf` | ❌ |
| GET | `/api/invoices/mark-as-paid/` | `mark_as_paid` | ❌ |
| POST | `/api/invoices/{id}/refund/` | `refund` | ❌ |
| GET | `/api/invoices/unpaid/` | `unpaid` | ✅ |
| GET | `/api/invoices/paid/` | `paid` | ❌ |
| GET | `/api/invoices/refunded/` | `refunded` | ❌ |
| GET | `/api/invoices/statistics/` | `statistics` | ✅ |
| GET | `/api/invoices/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/invoices/bulk-upload/` | `bulk_upload` | ❌ |
| GET | `/api/invoices/mark-read/` | `mark_read` | ❌ |
| GET | `/api/invoices/mark-all-read/` | `mark_all_read` | ❌ |

### NotificationViewSet

| Method | URL | Action | Documented |
|--------|-----|--------|------------|
| GET | `/api/notifications/` | `list` | ❌ |
| POST | `/api/notifications/` | `create` | ❌ |
| GET | `/api/notifications/{id}/` | `retrieve` | ❌ |
| PUT | `/api/notifications/{id}/` | `update` | ❌ |
| PATCH | `/api/notifications/{id}/` | `partial_update` | ❌ |
| DELETE | `/api/notifications/{id}/` | `destroy` | ❌ |
| GET | `/api/notifications/{id}/me/` | `me` | ✅ |
| GET | `/api/notifications/statistics/` | `statistics` | ✅ |
| GET | `/api/notifications/service-history/` | `service_history` | ✅ |
| PUT | `/api/notifications/update-address/` | `update_address` | ❌ |
| GET | `/api/notifications/cars/` | `cars` | ❌ |
| GET | `/api/notifications/bulk-create/` | `bulk_create` | ❌ |
| GET | `/api/notifications/export/` | `export` | ❌ |
| GET | `/api/notifications/services/` | `services` | ❌ |
| GET | `/api/notifications/items/` | `items` | ❌ |
| GET | `/api/notifications/invoice/` | `invoice` | ❌ |
| GET | `/api/notifications/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/notifications/complete/` | `complete` | ❌ |
| GET | `/api/notifications/cancel/` | `cancel` | ❌ |
| GET | `/api/notifications/reschedule/` | `reschedule` | ❌ |
| GET | `/api/notifications/upcoming/` | `upcoming` | ❌ |
| GET | `/api/notifications/in-progress/` | `in_progress` | ❌ |
| GET | `/api/notifications/completed/` | `completed` | ❌ |
| GET | `/api/notifications/statistics/` | `statistics` | ✅ |
| GET | `/api/notifications/bulk-update/` | `bulk_update` | ❌ |
| GET | `/api/notifications/{id}/download/` | `download` | ❌ |
| GET | `/api/notifications/upload-pdf/` | `upload_pdf` | ❌ |
| GET | `/api/notifications/mark-as-paid/` | `mark_as_paid` | ❌ |
| POST | `/api/notifications/{id}/refund/` | `refund` | ❌ |
| GET | `/api/notifications/unpaid/` | `unpaid` | ✅ |
| GET | `/api/notifications/paid/` | `paid` | ❌ |
| GET | `/api/notifications/refunded/` | `refunded` | ❌ |
| GET | `/api/notifications/statistics/` | `statistics` | ✅ |
| GET | `/api/notifications/send-sms-notification/` | `send_sms_notification` | ❌ |
| GET | `/api/notifications/bulk-upload/` | `bulk_upload` | ❌ |
| GET | `/api/notifications/mark-read/` | `mark_read` | ❌ |
| GET | `/api/notifications/mark-all-read/` | `mark_all_read` | ❌ |


## Documentation Template

For undocumented actions, use this template:

```python
@swagger_auto_schema(
    operation_summary="Short description here",
    operation_description="Detailed description here",
    request_body=YourRequestSerializer,  # If applicable
    responses={
        200: YourResponseSerializer,
        400: "Bad request description",
        404: "Not found description"
    }
)
@action(detail=True, methods=['post'])  # Your existing action decorator
def your_action(self, request, pk=None):
    ...
```
