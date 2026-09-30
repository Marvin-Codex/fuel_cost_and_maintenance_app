// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fuel_cost_and_maintenance_app/main.dart';
import 'package:fuel_cost_and_maintenance_app/models/fuel_record.dart';
import 'package:fuel_cost_and_maintenance_app/models/vehicle.dart';

void main() {
  test('vehicle calculations use stored specifications', () {
    const vehicle = Vehicle(
      id: 'test',
      name: 'Test car',
      type: VehicleType.car,
      manufacturer: 'Test',
      model: 'Model',
      year: 2024,
      engine: '1.0L petrol',
      fuelType: 'Petrol',
      tankCapacityLitres: 50,
      referenceConsumption: 5,
    );

    expect(vehicle.estimatedRangeKm, 1000);
    expect(vehicle.fullTankCost(1.5), 75);
  });

  test('fuel records calculate weighted cost metrics', () {
    const records = [
      FuelRecord(
        id: 'one',
        vehicleId: 'vehicle-1',
        litres: 40,
        cost: 60,
        odometer: 12500,
      ),
      FuelRecord(
        id: 'two',
        vehicleId: 'vehicle-1',
        litres: 20,
        cost: 36,
        odometer: 12800,
      ),
    ];

    expect(FuelRecord.totalCost(records), 96);
    expect(FuelRecord.averageCostPerLitre(records), 1.6);
    expect(
      const FuelRecord(
        id: 'empty',
        vehicleId: 'vehicle-1',
        litres: 0,
        cost: 10,
        odometer: 13000,
      ).costPerLitre,
      0,
    );
  });

  testWidgets('dashboard shows tracked vehicle', (WidgetTester tester) async {
    await tester.pumpWidget(const FuelMaintenanceApp());
    expect(find.text('Fuel and Maintenance'), findsOneWidget);
    expect(find.text('1 vehicle tracked'), findsOneWidget);
    expect(find.text('Your vehicle costs at a glance'), findsOneWidget);
    expect(find.text('UGX 0.00'), findsOneWidget);
  });

  testWidgets('settings can change the currency selector',
      (WidgetTester tester) async {
    await tester.pumpWidget(const FuelMaintenanceApp());

    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    expect(find.text('UGX'), findsWidgets);

    await tester.tap(find.byType(DropdownButtonFormField<String>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('USD').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.text('USD 0.00'), findsOneWidget);
  });

  testWidgets('user can add a vehicle', (WidgetTester tester) async {
    await tester.pumpWidget(const FuelMaintenanceApp());

    await tester.tap(find.text('Vehicles'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add another vehicle'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Ford Ranger');
    await tester.tap(find.text('Add'));
    await tester.pumpAndSettle();

    expect(find.text('Ford Ranger'), findsOneWidget);
    expect(find.textContaining('Car'), findsOneWidget);
    expect(find.textContaining('L tank'), findsWidgets);
  });

  testWidgets('user can update the fuel price used for estimates',
      (WidgetTester tester) async {
    await tester.pumpWidget(const FuelMaintenanceApp());
    await tester.tap(find.text('Vehicles'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Full tank: 75.00'), findsOneWidget);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), '2.00');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Full tank: 100.00'), findsOneWidget);
  });

  testWidgets('user can log a fuel purchase offline',
      (WidgetTester tester) async {
    await tester.pumpWidget(const FuelMaintenanceApp());
    await tester.tap(find.text('Fuel'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Log a fuel purchase'));
    await tester.pumpAndSettle();

    final fields = find.byType(TextField);
    await tester.enterText(fields.at(0), '40');
    await tester.enterText(fields.at(1), '60');
    await tester.enterText(fields.at(2), '12500');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.text('1 purchase stored locally.'), findsOneWidget);
    expect(find.text('40.0 L • 60.00'), findsOneWidget);
    expect(find.textContaining('Odometer: 12500 km'), findsOneWidget);
    expect(find.textContaining('1.50 per litre'), findsOneWidget);
    await tester.tap(find.text('Overview'));
    await tester.pumpAndSettle();
    expect(find.text('60.00'), findsOneWidget);
    expect(find.text('1.50'), findsOneWidget);
  });
}
