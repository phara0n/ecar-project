from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import IntegrityError
from core.models import Service, ServiceHistory
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Check for completed routine maintenance services without service history records and create them'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed information about each service checked',
        )
        parser.add_argument(
            '--service-id',
            type=int,
            help='Check only a specific service by ID',
        )
        parser.add_argument(
            '--fix-constraints',
            action='store_true',
            help='Try to fix constraint violations by examining existing records',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        verbose = options.get('verbose', False)
        service_id = options.get('service_id')
        fix_constraints = options.get('fix_constraints', False)
        
        # Get services that should have service history
        query = Service.objects.filter(
            status='completed',
            is_routine_maintenance=True,
            service_type__isnull=False
        )
        
        if service_id:
            query = query.filter(id=service_id)
            
        self.stdout.write(f"Checking {query.count()} completed routine maintenance services...")
        
        # Count of services without history
        missing_count = 0
        created_count = 0
        error_count = 0
        constraint_fixed_count = 0
        
        for service in query:
            # Check if service history exists
            has_history = ServiceHistory.objects.filter(service=service).exists()
            
            if verbose:
                self.stdout.write(f"Service {service.id} - {service.title} - History exists: {has_history}")
            
            if not has_history:
                missing_count += 1
                
                if verbose:
                    self.stdout.write(self.style.WARNING(f"  Missing service history for service {service.id}"))
                    debug_info = service.debug_service_history()
                    for problem in debug_info.get('problems', []):
                        self.stdout.write(f"  - {problem}")
                
                # Try to create service history if not in dry run mode
                if not dry_run:
                    try:
                        # Check for orphaned records first if fix_constraints is enabled
                        if fix_constraints:
                            # Try to find a service history with this service ID using raw SQL
                            # This bypasses Django's ORM and can find records even if the foreign key is broken
                            from django.db import connection
                            with connection.cursor() as cursor:
                                cursor.execute("SELECT id FROM core_servicehistory WHERE service_id = %s", [service.id])
                                orphaned_ids = [row[0] for row in cursor.fetchall()]
                                
                                if orphaned_ids:
                                    orphaned_id = orphaned_ids[0]
                                    if verbose:
                                        self.stdout.write(self.style.WARNING(
                                            f"  Found orphaned service history record with ID {orphaned_id}"
                                        ))
                                    
                                    # Update the record
                                    try:
                                        orphaned = ServiceHistory.objects.get(id=orphaned_id)
                                        orphaned.car = service.car
                                        orphaned.service = service  # This might fix the association
                                        orphaned.service_interval = service.service_type
                                        orphaned.service_date = service.completed_date.date() if service.completed_date else timezone.now().date()
                                        orphaned.service_mileage = service.service_mileage or service.car.mileage
                                        orphaned.save()
                                        
                                        constraint_fixed_count += 1
                                        
                                        if verbose:
                                            self.stdout.write(self.style.SUCCESS(
                                                f"  Fixed orphaned service history record with ID {orphaned_id}"
                                            ))
                                            
                                        # Update car's last service info
                                        service.car.last_service_date = orphaned.service_date
                                        service.car.last_service_mileage = orphaned.service_mileage
                                        service.car.save(update_fields=['last_service_date', 'last_service_mileage'])
                                        
                                        # Update service predictions
                                        service.car.update_service_predictions()
                                        
                                        # Skip to the next service
                                        continue
                                    except Exception as e:
                                        self.stdout.write(self.style.ERROR(
                                            f"  Error fixing orphaned record: {str(e)}"
                                        ))
                            
                        # If we didn't find an orphaned record or fix_constraints is disabled, create a new one
                        service_history = ServiceHistory.objects.create(
                            car=service.car,
                            service=service,
                            service_interval=service.service_type,
                            service_date=service.completed_date.date() if service.completed_date else timezone.now().date(),
                            service_mileage=service.service_mileage or service.car.mileage
                        )
                        created_count += 1
                        
                        if verbose:
                            self.stdout.write(self.style.SUCCESS(
                                f"  Created service history record with ID {service_history.id}"
                            ))
                        
                        # Update car's last service info
                        service.car.last_service_date = service_history.service_date
                        service.car.last_service_mileage = service_history.service_mileage
                        service.car.save(update_fields=['last_service_date', 'last_service_mileage'])
                        
                        # Update service predictions
                        service.car.update_service_predictions()
                    except IntegrityError as e:
                        if "duplicate key value violates unique constraint" in str(e):
                            error_count += 1
                            self.stdout.write(self.style.ERROR(
                                f"  Constraint violation for service {service.id}. Try running with --fix-constraints."
                            ))
                        else:
                            error_count += 1
                            self.stdout.write(self.style.ERROR(
                                f"  Error creating service history for service {service.id}: {str(e)}"
                            ))
                    except Exception as e:
                        error_count += 1
                        self.stdout.write(self.style.ERROR(
                            f"  Error creating service history for service {service.id}: {str(e)}"
                        ))
        
        # Print summary
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"DRY RUN: Found {missing_count} services without service history records"
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Created {created_count} service history records. "
                f"Fixed {constraint_fixed_count} orphaned records. "
                f"Encountered {error_count} errors out of {missing_count} missing records."
            ))
            
            # If there are still missing records, mention the fix
            if created_count + constraint_fixed_count < missing_count:
                self.stdout.write(self.style.WARNING(
                    f"There are still {missing_count - created_count - constraint_fixed_count} services without service history records. "
                    f"Try running with --fix-constraints if you haven't already."
                )) 