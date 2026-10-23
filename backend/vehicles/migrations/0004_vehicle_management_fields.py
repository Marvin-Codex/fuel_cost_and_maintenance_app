from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import migrations, models


def migrate_legacy_status(apps, schema_editor):
    Vehicle = apps.get_model('vehicles', 'Vehicle')
    Vehicle.objects.filter(is_active=False).update(status='inactive')
    Vehicle.objects.filter(is_active=True).update(status='active')


class Migration(migrations.Migration):

    dependencies = [
        ('vehicles', '0003_alter_vehicle_id_vehicle_vehicle_org_created_idx_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vehicle',
            name='name',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='engine_capacity_cc',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='transmission',
            field=models.CharField(
                choices=[
                    ('manual', 'Manual'),
                    ('automatic', 'Automatic'),
                    ('cvt', 'CVT'),
                    ('other', 'Other'),
                ],
                default='other',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='tank_capacity_liters',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=7,
                null=True,
                validators=[MinValueValidator(Decimal('0.01'))],
            ),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='status',
            field=models.CharField(
                choices=[
                    ('active', 'Active'),
                    ('inactive', 'Inactive'),
                    ('in_service', 'In service'),
                    ('simulation', 'Simulation'),
                ],
                default='simulation',
                max_length=20,
            ),
        ),
        migrations.RunPython(
            migrate_legacy_status,
            migrations.RunPython.noop,
        ),
    ]
