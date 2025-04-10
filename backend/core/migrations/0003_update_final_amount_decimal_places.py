# Generated by Django 5.0.6 on 2024-05-25 10:39

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='invoice',
            name='final_amount',
            field=models.DecimalField(decimal_places=3, default=0.0, help_text='The final amount of the invoice after discounts and taxes.', max_digits=10),
        ),
    ] 