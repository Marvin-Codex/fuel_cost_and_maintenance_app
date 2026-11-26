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

                hwy_mpg = row.get('highway MPG') or row.get('highway_mpg') or row.get('Highway MPG') or ''
                city_mpg = row.get('city mpg') or row.get('city_mpg') or row.get('City MPG') or row.get('City mpg') or ''
                hwy = None
                city = None
                try:
                    if hwy_mpg not in (None, '', '0'):
                        hwy = Decimal(str(hwy_mpg))
                except Exception:
                    pass
                try:
                    if city_mpg not in (None, '', '0'):
                        city = Decimal(str(city_mpg))
                except Exception:
                    pass
                combined_mpg = None
                if hwy is not None and city is not None:
                    try:
                        combined_mpg = ((city + hwy) / Decimal('2')).quantize(Decimal('0.01'))
                    except Exception:
                        combined_mpg = None
                elif hwy is not None:
                    combined_mpg = hwy
                elif city is not None:
                    combined_mpg = city

                def mpg_to_l100(mpg):
                    if mpg is None or mpg <= 0:
                        return None
                    try:
                        return (Decimal('235.214583') / mpg).quantize(Decimal('0.01'))
                    except Exception:
                        return None

                combined_l = mpg_to_l100(combined_mpg)
                city_l = mpg_to_l100(city)
                hwy_l = mpg_to_l100(hwy)

                # Detect bikes/scooters/mopeds/trikes
                category = 'car'
                text_all = ' '.join(str(v or '') for v in row.values()).lower()
                bike_hints = ['motorcycle', 'motorbike', 'bike', 'scooter', 'moped', 'tricycle', 'tuk', 'atv', 'quad']
                if any(h in text_all or h in body_raw for h in bike_hints):
                    if any(h in text_all for h in ['scooter', 'moped']):
                        category = 'scooter'
                    elif any(h in text_all for h in ['tricycle', 'tuk']):
                        category = 'tricycle'
                    elif any(h in text_all for h in ['atv', 'quad']):
                        category = 'atv'
                    else:
                        category = 'bike'

                # Map bike body/style to categories
                if body_raw:
                    if 'naked' in body_raw or 'street' in body_raw and category == 'bike':
                        body = 'naked'
                    elif 'sport' in body_raw and category == 'bike':
                        body = 'sport'
                    elif 'cruiser' in body_raw:
                        body = 'cruiser'
                    elif 'touring' in body_raw:
                        body = 'touring'
                    elif 'adventure' in body_raw or 'adv' in body_raw:
                        body = 'adventure'
                    elif 'dual' in body_raw or 'enduro' in body_raw:
                        body = 'dual_sport'
                    elif 'scooter' in body_raw or 'moped' in body_raw:
                        body = 'scooter'
                        category = 'scooter'
                    elif 'commuter' in body_raw:
                        body = 'commuter'

                # Extract CC/displacement/power
                cc_raw = row.get('Engine Displacement') or row.get('Displacement') or row.get('displacement_cc') or row.get('engine_capacity_cc') or row.get('cc') or ''
                disp_cc = None
                if cc_raw:
                    try:
                        # handle like '124 cc' or '1.2L'
                        s = str(cc_raw).lower().strip()
                        if 'l' in s and 'cc' not in s:
                            try:
                                disp_cc = int(float(s.replace('l', '').strip()) * 1000)
                            except Exception:
                                pass
                        else:
                            # extract number
                            import re
                            m = re.findall(r'(\d+(?:\.\d+)?)', s)
                            if m:
                                disp_cc = int(float(m[0]))
                    except Exception:
                        pass
                if disp_cc:
                    if engine_capacity_cc is None:
                        engine_capacity_cc = disp_cc
                else:
                    engine_capacity_cc = None
                if displacement_cc is None and disp_cc:
                    displacement_cc = disp_cc

                power_rpm = None
                torque_rpm = None
                # try common names
                try:
                    pr = row.get('Power RPM') or row.get('power_rpm')
                    if pr: power_rpm = int(float(str(pr)))
                except Exception:
                    pass
                try:
                    tr = row.get('Torque RPM') or row.get('torque_rpm')
                    if tr: torque_rpm = int(float(str(tr)))
                except Exception:
                    pass

                wheelbase = None
                seat_h = None
                ground_c = None
                dry_w = None
                wet_w = None
                try:
                    wb = row.get('Wheelbase') or row.get('wheelbase_mm')
                    if wb:
                        s = str(wb).lower()
                        import re
                        m = re.findall(r'(\d+(?:\.\d+)?)', s)
                        if m: wheelbase = int(float(m[0]))
                except Exception:
                    pass
                try:
                    sh = row.get('Seat Height') or row.get('seat_height_mm')
                    if sh:
                        s = str(sh).lower()
                        import re
                        m = re.findall(r'(\d+(?:\.\d+)?)', s)
                        if m: seat_h = int(float(m[0]))
                except Exception:
                    pass
                try:
                    gc = row.get('Ground Clearance') or row.get('ground_clearance_mm')
                    if gc:
                        s = str(gc).lower()
                        import re
                        m = re.findall(r'(\d+(?:\.\d+)?)', s)
                        if m: ground_c = int(float(m[0]))
                except Exception:
                    pass
                try:
                    dw = row.get('Dry Weight') or row.get('dry_weight_kg')
                    if dw:
                        s = str(dw).lower()
                        import re
                        m = re.findall(r'(\d+(?:\.\d+)?)', s)
                        if m: dry_w = Decimal(m[0])
                except Exception:
                    pass
                try:
                    ww = row.get('Wet Weight') or row.get('wet_weight_kg') or row.get('Curb Weight') and category=='bike' and not row.get('curb_weight_kg') and None
                    if ww and not dry_w:
                        pass  # keep simple
                except Exception:
                    pass

                stroke = ''
                cooling = ''
                drive_sys = ''
                stroke_raw = (row.get('Stroke') or row.get('stroke') or '').lower()
                if '2' in stroke_raw:
                    stroke = '2_stroke'
                elif '4' in stroke_raw:
                    stroke = '4_stroke'
                cooling_raw = (row.get('Cooling') or row.get('cooling_system') or '').lower()
                if 'liquid' in cooling_raw or 'water' in cooling_raw:
                    cooling = 'liquid'
                elif 'oil' in cooling_raw:
                    cooling = 'oil'
                elif 'air' in cooling_raw:
                    cooling = 'air'
                drive_raw2 = (row.get('Final Drive') or row.get('drive_system') or '').lower()
                if 'chain' in drive_raw2:
                    drive_sys = 'chain'
                elif 'belt' in drive_raw2:
                    drive_sys = 'belt'
                elif 'shaft' in drive_raw2:
                    drive_sys = 'shaft'

                name = f'{make} {model} {year}' if year else f'{make} {model}'
                engine_desc = row.get('Market Category') or row.get('Engine Type') or ''
                defaults = {
                    'category': category,
                    'make': make,
                    'model': model,
                    'year': year,
                    'fuel_type': fuel_type,
                    'engine': engine_desc[:80] if engine_desc else '',
                    'engine_capacity_cc': engine_capacity_cc,
                    'displacement_cc': displacement_cc if 'displacement_cc' in locals() or True else disp_cc,
                    'cylinders': cyl,
                    'stroke': stroke,
                    'engine_type': (row.get('Engine Type') or '')[:60],
                    'cooling_system': cooling,
                    'transmission': trans,
                    'drive_type': drive,
                    'drive_system': drive_sys,
                    'body_type': body,
                    'doors': doors,
                    'seats': None,
                    'power_hp': hp,
                    'power_rpm': power_rpm,
                    'torque_rpm': torque_rpm,
                    'wheelbase_mm': wheelbase,
                    'seat_height_mm': seat_h,
                    'ground_clearance_mm': ground_c,
                    'dry_weight_kg': dry_w,
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
