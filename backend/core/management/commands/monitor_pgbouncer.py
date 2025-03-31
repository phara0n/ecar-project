import os
import subprocess
import psycopg2
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from datetime import datetime


class Command(BaseCommand):
    help = 'Monitor PgBouncer connection pool status'

    def add_arguments(self, parser):
        parser.add_argument(
            '--host',
            default=os.environ.get('DB_HOST', 'pgbouncer'),
            help='PgBouncer host'
        )
        parser.add_argument(
            '--port',
            default=os.environ.get('DB_PORT', '6432'),
            help='PgBouncer port'
        )
        parser.add_argument(
            '--user',
            default=os.environ.get('DB_USER', 'postgres'),
            help='PgBouncer admin user'
        )
        parser.add_argument(
            '--output-format',
            choices=['console', 'json', 'csv'],
            default='console',
            help='Output format for results'
        )

    def handle(self, *args, **options):
        host = options['host']
        port = options['port']
        user = options['user']
        output_format = options['output_format']

        try:
            # Connect to PgBouncer admin console
            self.stdout.write(self.style.SUCCESS(f'Connecting to PgBouncer at {host}:{port}...'))
            
            conn = psycopg2.connect(
                dbname='pgbouncer',
                user=user,
                host=host,
                port=port
            )
            cursor = conn.cursor()
            
            # Check pool status
            self.stdout.write(self.style.SUCCESS('Checking connection pools...'))
            cursor.execute('SHOW POOLS;')
            pools = cursor.fetchall()
            
            col_names = [desc[0] for desc in cursor.description]
            
            if output_format == 'console':
                self.stdout.write(self.style.SUCCESS('\nConnection Pools:'))
                self.stdout.write('-' * 80)
                self.stdout.write('| ' + ' | '.join(col_names) + ' |')
                self.stdout.write('-' * 80)
                
                for pool in pools:
                    self.stdout.write('| ' + ' | '.join(str(col) for col in pool) + ' |')
                self.stdout.write('-' * 80)
            
            # Check stats
            self.stdout.write(self.style.SUCCESS('\nChecking usage statistics...'))
            cursor.execute('SHOW STATS;')
            stats = cursor.fetchall()
            
            col_names = [desc[0] for desc in cursor.description]
            
            if output_format == 'console':
                self.stdout.write(self.style.SUCCESS('\nUsage Statistics:'))
                self.stdout.write('-' * 80)
                self.stdout.write('| ' + ' | '.join(col_names) + ' |')
                self.stdout.write('-' * 80)
                
                for stat in stats:
                    self.stdout.write('| ' + ' | '.join(str(col) for col in stat) + ' |')
                self.stdout.write('-' * 80)
            
            # Check for potential issues
            cursor.execute("""
                SELECT database, total_xact_count, total_query_count, 
                total_received, total_sent, total_xact_time
                FROM STATS;
            """)
            stats_data = cursor.fetchall()
            
            # Calculate average transaction time
            for stat in stats_data:
                if stat[1] > 0:  # total_xact_count
                    avg_xact_time = stat[5] / stat[1]  # total_xact_time / total_xact_count
                    if avg_xact_time > 1000000:  # more than 1 second in μs
                        self.stdout.write(self.style.WARNING(
                            f"Warning: High average transaction time ({avg_xact_time/1000000:.2f} sec) "
                            f"for database '{stat[0]}'"
                        ))
            
            # Get client connections
            cursor.execute('SHOW CLIENTS;')
            clients = cursor.fetchall()
            active_clients = len(clients)
            
            self.stdout.write(self.style.SUCCESS(f"\nActive clients: {active_clients}"))
            
            # Check if nearing max connections
            cursor.execute('SHOW CONFIG;')
            configs = {row[0]: row[1] for row in cursor.fetchall()}
            max_clients = int(configs.get('max_client_conn', '100'))
            
            if active_clients > max_clients * 0.8:
                self.stdout.write(self.style.WARNING(
                    f"Warning: Active clients ({active_clients}) approaching max limit ({max_clients})"
                ))
            
            # Write report to file
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            report_dir = os.path.join(settings.BASE_DIR, '..', 'reports', 'pgbouncer')
            os.makedirs(report_dir, exist_ok=True)
            
            report_path = os.path.join(report_dir, f'pgbouncer_report_{timestamp}.txt')
            with open(report_path, 'w') as f:
                f.write(f"PgBouncer Status Report - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("=" * 80 + "\n\n")
                
                f.write("Connection Pools:\n")
                f.write("-" * 80 + "\n")
                cursor.execute('SHOW POOLS;')
                col_names = [desc[0] for desc in cursor.description]
                f.write("| " + " | ".join(col_names) + " |\n")
                f.write("-" * 80 + "\n")
                
                for pool in cursor.fetchall():
                    f.write("| " + " | ".join(str(col) for col in pool) + " |\n")
                
                f.write("\n\nStatistics:\n")
                f.write("-" * 80 + "\n")
                cursor.execute('SHOW STATS;')
                col_names = [desc[0] for desc in cursor.description]
                f.write("| " + " | ".join(col_names) + " |\n")
                f.write("-" * 80 + "\n")
                
                for stat in cursor.fetchall():
                    f.write("| " + " | ".join(str(col) for col in stat) + " |\n")
            
            self.stdout.write(self.style.SUCCESS(f"\nReport written to {report_path}"))
            
        except psycopg2.OperationalError as e:
            raise CommandError(f"Failed to connect to PgBouncer: {e}")
        except Exception as e:
            raise CommandError(f"Error monitoring PgBouncer: {e}")
        finally:
            if 'conn' in locals():
                conn.close() 