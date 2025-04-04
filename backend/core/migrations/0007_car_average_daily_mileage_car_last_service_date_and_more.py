# Generated by Django 5.1.7 on 2025-04-02 20:33

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_alter_service_service_mileage'),
    ]

    operations = [
        migrations.AddField(
            model_name='car',
            name='average_daily_mileage',
            field=models.FloatField(blank=True, null=True, verbose_name='Average Daily Mileage (km)'),
        ),
        migrations.AddField(
            model_name='car',
            name='last_service_date',
            field=models.DateField(blank=True, null=True, verbose_name='Last Service Date'),
        ),
        migrations.AddField(
            model_name='car',
            name='last_service_mileage',
            field=models.PositiveIntegerField(blank=True, null=True, verbose_name='Last Service Mileage'),
        ),
        migrations.AddField(
            model_name='car',
            name='next_service_date',
            field=models.DateField(blank=True, null=True, verbose_name='Estimated Next Service Date'),
        ),
        migrations.AddField(
            model_name='car',
            name='next_service_mileage',
            field=models.PositiveIntegerField(blank=True, null=True, verbose_name='Estimated Next Service Mileage'),
        ),
        migrations.CreateModel(
            name='ServiceInterval',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Service Type')),
                ('description', models.TextField(verbose_name='Description')),
                ('interval_type', models.CharField(choices=[('mileage', 'Mileage Based'), ('time', 'Time Based'), ('both', 'Mileage and Time Based')], max_length=10, verbose_name='Interval Type')),
                ('mileage_interval', models.PositiveIntegerField(blank=True, help_text='Distance in kilometers between services', null=True, verbose_name='Mileage Interval (km)')),
                ('time_interval_days', models.PositiveIntegerField(blank=True, help_text='Days between services', null=True, verbose_name='Time Interval (days)')),
                ('car_make', models.CharField(blank=True, help_text='Specific car make or leave blank for all makes', max_length=50, null=True, verbose_name='Car Make')),
                ('car_model', models.CharField(blank=True, help_text='Specific car model or leave blank for all models of the make', max_length=50, null=True, verbose_name='Car Model')),
                ('is_active', models.BooleanField(default=True, verbose_name='Active')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Service Interval',
                'verbose_name_plural': 'Service Intervals',
                'ordering': ['name', 'car_make', 'car_model'],
                'indexes': [models.Index(fields=['car_make', 'car_model'], name='core_servic_car_mak_70e1ec_idx'), models.Index(fields=['interval_type'], name='core_servic_interva_a1a0ae_idx'), models.Index(fields=['is_active'], name='core_servic_is_acti_72a12e_idx')],
            },
        ),
        migrations.CreateModel(
            name='MileageUpdate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mileage', models.PositiveIntegerField(verbose_name='Current Mileage')),
                ('reported_date', models.DateTimeField(auto_now_add=True, verbose_name='Reported Date')),
                ('notes', models.TextField(blank=True, null=True, verbose_name='Notes')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('car', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mileage_updates', to='core.car')),
            ],
            options={
                'verbose_name': 'Mileage Update',
                'verbose_name_plural': 'Mileage Updates',
                'ordering': ['-reported_date'],
                'indexes': [models.Index(fields=['car'], name='core_mileag_car_id_89a6d4_idx'), models.Index(fields=['reported_date'], name='core_mileag_reporte_71d970_idx')],
            },
        ),
    ]
