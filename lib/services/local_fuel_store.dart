import 'package:drift/drift.dart';

import '../database/app_database.dart';
import '../models/fuel_record.dart' as domain;

/// Drift-backed persistent store for fuel records. All operations are
/// asynchronous and survive app restarts.
class LocalFuelStore {
  LocalFuelStore(this._db) : _initialized = Future<void>.value();

  final AppDatabase _db;
  final Future<void> _initialized;
  final List<domain.FuelRecord> _cache = [];

  Future<void> _loadCache() async {
    await _initialized;
    final rows = await _db.select(_db.fuelRecords).get();
    _cache
      ..clear()
      ..addAll(rows.map(_fuelFromRow));
  }

  /// Loads fuel records from the database into the synchronous cache. Call
  /// once after construction (e.g. in `State.initState`) before reading
  /// `records`.
  Future<void> load() => _loadCache();

  domain.FuelRecord _fuelFromRow(FuelRecord row) => domain.FuelRecord(
        id: row.id,
        vehicleId: row.vehicleId,
        litres: row.litres,
        cost: row.cost,
        odometer: row.odometer,
      );

  FuelRecordsCompanion _fuelCompanion(domain.FuelRecord record) =>
      FuelRecordsCompanion(
        id: Value(record.id),
        vehicleId: Value(record.vehicleId),
        litres: Value(record.litres),
        cost: Value(record.cost),
        odometer: Value(record.odometer),
        filledAt: Value(DateTime.now()),
      );

  /// Returns all fuel records (synchronous cache). Call `load()` first.
  List<domain.FuelRecord> get records => List.unmodifiable(_cache);

  /// Returns all fuel records from the database (async, always fresh).
  Future<List<domain.FuelRecord>> get recordsAsync async {
    await _initialized;
    final rows = await _db.select(_db.fuelRecords).get();
    return rows.map(_fuelFromRow).toList();
  }

  /// Inserts or replaces a fuel record by id.
  Future<void> upsertRecord(domain.FuelRecord record) async {
    await _initialized;
    await _db.into(_db.fuelRecords).insert(
      _fuelCompanion(record),
      mode: InsertMode.replace,
    );
    await _loadCache();
  }

  /// Adds a new fuel record, generating a unique id.
  Future<void> addRecord({
    required String vehicleId,
    required double litres,
    required double cost,
    required double odometer,
  }) async {
    await _initialized;
    if (!litres.isFinite ||
        litres <= 0 ||
        !cost.isFinite ||
        cost < 0 ||
        !odometer.isFinite ||
        odometer < 0) {
      return;
    }

    final existing = _cache;
    final id = 'fuel-${existing.length + 1}';
    await _db.into(_db.fuelRecords).insert(
      FuelRecordsCompanion(
        id: Value(id),
        vehicleId: Value(vehicleId),
        litres: Value(litres),
        cost: Value(cost),
        odometer: Value(odometer),
        filledAt: Value(DateTime.now()),
      ),
    );
    await _loadCache();
  }
}
