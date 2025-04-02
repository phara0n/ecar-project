# Generated by Django 5.1.7 on 2025-04-02 20:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_service_service_mileage'),
    ]

    operations = [
        migrations.AlterField(
            model_name='service',
            name='service_mileage',
            field=models.PositiveIntegerField(blank=True, help_text="The car's mileage at the time of service. Cannot be less than the car's registered mileage.", null=True, verbose_name='Service Mileage'),
        ),
    ]
