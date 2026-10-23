import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

part 'app_database.g.dart';

class Vehicles extends Table {
  TextColumn get id => text().withLength(min: 1, max: 100)();
  TextColumn get name => text().withLength(min: 1, max: 200)();
  TextColumn get type => text().withLength(min: 1, max: 50)();
  TextColumn get manufacturer => text().withLength(min: 1, max: 100)();
  TextColumn get model => text().withLength(min: 1, max: 100)();
  IntColumn get year => integer()();
  TextColumn get engine => text().withLength(min: 1, max: 100)();
  TextColumn get fuelType => text().withLength(min: 1, max: 50)();
  RealColumn get tankCapacityLitres => real()();
  RealColumn get referenceConsumption => real()();
  IntColumn get seatingCapacity => integer().nullable()();
  RealColumn get payloadCapacityKg => real().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class FuelRecords extends Table {
  TextColumn get id => text().withLength(min: 1, max: 100)();
  TextColumn get vehicleId =>
      text().withLength(min: 1, max: 100).references(Vehicles, #id)();
  RealColumn get litres => real()();
  RealColumn get cost => real()();
  RealColumn get odometer => real()();
  DateTimeColumn get filledAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Trips extends Table {
  TextColumn get id => text().withLength(min: 1, max: 100)();
  TextColumn get vehicleId =>
      text().withLength(min: 1, max: 100).references(Vehicles, #id)();
  TextColumn get startLocation => text().withLength(min: 1, max: 200)();
  TextColumn get destination => text().withLength(min: 1, max: 200)();
  DateTimeColumn get startedAt => dateTime()();
  DateTimeColumn get endedAt => dateTime()();
  RealColumn get distanceKm => real()();
  IntColumn get startOdometerKm => integer().nullable()();
  IntColumn get endOdometerKm => integer().nullable()();
  RealColumn get fuelConsumedLiters => real().nullable()();
  RealColumn get fuelPricePerLiter => real().nullable()();
  TextColumn get notes => text().withDefault(const Constant(''))();
  TextColumn get clientId =>
      text().withLength(min: 0, max: 100).nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class MaintenanceRecords extends Table {
  TextColumn get id => text().withLength(min: 1, max: 100)();
  TextColumn get vehicleId =>
      text().withLength(min: 1, max: 100).references(Vehicles, #id)();
  TextColumn get serviceType => text().withLength(min: 1, max: 100)();
  DateTimeColumn get serviceDate => dateTime()();
  IntColumn get odometerKm => integer()();
  RealColumn get cost => real()();
  TextColumn get partsReplaced =>
      text().withLength(min: 0, max: 2000)(); // JSON-encoded list
  TextColumn get technician => text().withLength(min: 0, max: 200)();
  TextColumn get serviceCenter => text().withLength(min: 0, max: 200)();
  TextColumn get notes => text().withLength(min: 0, max: 2000)();

  @override
  Set<Column> get primaryKey => {id};
}

class SyncQueue extends Table {
  // autoIncrement() already makes this the primary key.
  IntColumn get id => integer().autoIncrement()();
  // Dart name avoids clashing with Table.tableName; SQL column stays "table_name".
  TextColumn get targetTable =>
      text().named('table_name').withLength(min: 1, max: 50)();
  TextColumn get recordId => text().withLength(min: 1, max: 100)();
  TextColumn get operation =>
      text().withLength(min: 1, max: 20)(); // create, update, delete
  TextColumn get payload => text().withLength(min: 0)(); // JSON-encoded
  DateTimeColumn get createdAt => dateTime()();
}

@DriftDatabase(
    tables: [Vehicles, FuelRecords, Trips, MaintenanceRecords, SyncQueue])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        beforeOpen: (details) async {
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'app.db'));
    return NativeDatabase.createBackgroundConnection(file);
  });
}