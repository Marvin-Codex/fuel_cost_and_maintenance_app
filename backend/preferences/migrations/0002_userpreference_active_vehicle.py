import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('preferences', '0001_initial'),
        ('vehicles', '0004_vehicle_management_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='userpreference',
            name='active_vehicle',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='selected_by_users',
                to='vehicles.vehicle',
            ),
        ),
    ]
