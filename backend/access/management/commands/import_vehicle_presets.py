import csv
import os
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from access.models import VehiclePreset


class Command(BaseCommand):
    help = 'Import vehicle presets from CSV (docs/vehicle_dataset.csv by default).'

    def add_arguments(self, parser):
        parser.add_argument('--path', type=str, default=None)
        parser.add_argument('--activate', action='store_true', default=True)
        parser.add_argument('--deactivate-missing', action='store_true', default=False)

    def handle(self, *args, **options):
        path = options['path']
        if not path:
            base_dir = settings.BASE_DIR
            path = os.path.join(base_dir.parent, 'docs', 'vehicle_dataset.csv')
            if not os.path.exists(path):
                path = os.path.join(base_dir, 'docs', 'vehicle_dataset.csv')
        if not os.path.exists(path):
            raise CommandError(f'CSV not found: {path}')

        created = 0
        updated = 0
        with open(path, encoding='utf-8') as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                make = (row.get('Make') or row.get('make') or '').strip()
                model = (row.get('Model') or row.get('model') or '').strip()
                if not make or not model:
                    continue
                year_raw = (row.get('Year') or row.get('year') or '').strip()
                year = None
                if year_raw:
                    try:
                        year = int(float(year_raw))
                    except Exception:
                        year = None
                fuel_raw = (row.get('Engine Fuel Type') or row.get('fuel_type') or '').strip().lower()
                fuel_type = 'petrol'
                if 'diesel' in fuel_raw:
                    fuel_type = 'diesel'
                elif 'electric' in fuel_raw:
                    fuel_type = 'electric'
                elif 'hybrid' in fuel_raw:
                    fuel_type = 'hybrid'
                elif 'lpg' in fuel_raw or 'propane' in fuel_raw:
                    fuel_type = 'lpg'
                elif 'cng' in fuel_raw or 'natural gas' in fuel_raw:
                    fuel_type = 'cng'
                elif 'premium' in fuel_raw:
                    fuel_type = 'petrol'
                elif 'regular' in fuel_raw:
                    fuel_type = 'petrol'

                hp_raw = row.get('Engine HP') or row.get('power_hp') or ''
                hp = None
                if hp_raw:
                    try:
                        hp = Decimal(str(hp_raw).strip())
                    except Exception:
                        hp = None
                cyl_raw = row.get('Engine Cylinders') or row.get('cylinders') or ''
                cyl = None
                if cyl_raw:
                    try:
                        cyl = int(float(cyl_raw))
                    except Exception:
                        cyl = None
                trans_raw = (row.get('Transmission Type') or row.get('transmission') or '').strip().lower()
                trans = ''
                if trans_raw:
                    if 'manual' in trans_raw:
                        trans = 'manual'
                    elif 'cvt' in trans_raw:
                        trans = 'cvt'
                    elif 'dual' in trans_raw or 'dct' in trans_raw:
                        trans = 'dct'
                    elif 'amt' in trans_raw:
                        trans = 'amt'
                    elif 'auto' in trans_raw or 'automatic' in trans_raw:
                        trans = 'automatic'
                    else:
                        trans = trans_raw[:30]

                drive_raw = (row.get('Driven_Wheels') or row.get('drive_type') or '').strip().lower()
                drive = ''
                if drive_raw:
                    if 'all wheel' in drive_raw or drive_raw == 'awd':
                        drive = 'awd'
                    elif 'four wheel' in drive_raw or '4wd' in drive_raw:
                        drive = '4wd'
                    elif 'rear' in drive_raw:
                        drive = 'rwd'
                    elif 'front' in drive_raw:
                        drive = 'fwd'
                    else:
                        drive = drive_raw[:10]

                body_raw = (row.get('Vehicle Style') or row.get('body_type') or '').strip().lower()
                body = ''
                if body_raw:
                    if 'sedan' in body_raw:
                        body = 'sedan'
                    elif 'hatchback' in body_raw:
                        body = 'hatchback'
                    elif 'suv' in body_raw:
                        body = 'suv'
                    elif 'crossover' in body_raw:
                        body = 'crossover'
                    elif 'wagon' in body_raw:
                        body = 'wagon'
                    elif 'pickup' in body_raw or 'truck' in body_raw:
                        body = 'pickup'
                    elif 'van' in body_raw:
                        body = 'van'
                    elif 'coupe' in body_raw:
                        body = 'coupe'
                    elif 'convertible' in body_raw:
                        body = 'convertible'
                    elif 'bus' in body_raw:
                        body = 'bus'
                    else:
                        body = body_raw[:20].replace(' ', '_')

                doors_raw = row.get('Number of Doors') or row.get('doors') or ''
                doors = None
                if doors_raw:
                    try:
                        doors = int(float(doors_raw))
                    except Exception:
                        doors = None

                hwy_mpg = row.get('highway MPG') or row.get('highway_mpg') or ''
                city_mpg = row.get('city mpg') or row.get('city_mpg') or ''
                hwy = None
                city = None
                try:
                    if hwy_mpg:
                        hwy = Decimal(str(hwy_mpg))
                except Exception:
                    pass
                try:
                    if city_mpg:
                        city = Decimal(str(city_mpg))
                except Exception:
                    pass
                combined = None
                if hwy is not None and city is not None:
                    try:
                        combined = ((city + hwy) / Decimal('2')).quantize(Decimal('0.01'))
                    except Exception:
                        combined = None
                # Convert MPG to L/100km approx? Or store as-is? Dataset uses MPG; easier to store derived? We'll store combined if we have it as decimal (MPG value isn't same unit) - better skip conversion or store combined_mpg differently; but our model stores L/100km. We'll compute inverse approx: L/100km = 235.214583 / MPG for US mpg
                def mpg_to_l100(mpg):
                    if mpg is None or mpg <= 0:
                        return None
                    try:
                        return (Decimal('235.214583') / mpg).quantize(Decimal('0.01'))
                    except Exception:
                        return None

                combined_l = mpg_to_l100(combined)
                city_l = mpg_to_l100(city)
                hwy_l = mpg_to_l100(hwy)

                name = f'{make} {model} {year}' if year else f'{make} {model}'
                engine_desc = row.get('Market Category') or ''
                defaults = {
                    'make': make,
                    'model': model,
                    'year': year,
                    'fuel_type': fuel_type,
                    'engine': engine_desc[:80] if engine_desc else '',
                    'cylinders': cyl,
                    'transmission': trans,
                    'drive_type': drive,
                    'body_type': body,
                    'doors': doors,
                    'power_hp': hp,
                    'highway_fuel_consumption_l_100km': hwy_l,
                    'city_fuel_consumption_l_100km': city_l,
                    'combined_fuel_consumption_l_100km': combined_l,
                    'is_active': options['activate'],
                }
                obj, was_created = VehiclePreset.objects.update_or_create(
                    name=name,
                    make=make,
                    model=model,
                    year=year,
                    defaults=defaults,
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
        self.stdout.write(self.style.SUCCESS(f'Imported presets: created={created}, updated={updated}'))
