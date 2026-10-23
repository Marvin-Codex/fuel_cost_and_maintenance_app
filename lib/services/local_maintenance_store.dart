import 'dart:convert';

import 'package:drift/drift.dart';

import '../database/app_database.dart';
import '../models/maintenance_record.dart' as domain;

/// Drift-backed persistent store for maintenance records. All operations are
/// asynchronous and survive app restarts.
class LocalMaintenanceStore {
  LocalMaintenanceStore(this._db) : _initialized = Future<void>.value();

  final AppDatabase _db;
  final Future<void> _initialized;
  final List<domain.MaintenanceRecord> _cache = [];

  Future<void> _loadCache() async {
    await _initialized;
    final rows = await _db.select(_db.maintenanceRecords).get();
    _cache
      ..clear()
      ..addAll(rows.map(_recordFromRow));
  }

  /// Loads maintenance records from the database into the synchronous cache.
  /// Call once after construction (e.g. in `State.initState`) before reading
  /// `records`.
  Future<void> load() => _loadCache();

  domain.MaintenanceRecord _recordFromRow(MaintenanceRecord row) =>
      domain.MaintenanceRecord(
        id: row.id,
        vehicleId: row.vehicleId,
        serviceType: row.serviceType,
        serviceDate: row.serviceDate,
        odometerKm: row.odometerKm,
        cost: row.cost,
        partsReplaced: (jsonDecode(row.partsReplaced) as List?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        technician: row.technician,
        serviceCenter: row.serviceCenter,
        notes: row.notes,
      );

  MaintenanceRecordsCompanion _recordCompanion(
      domain.MaintenanceRecord record) =>
      MaintenanceRecordsCompanion(
        id: Value(record.id),
        vehicleId: Value(record.vehicleId),
        serviceType: Value(record.serviceType),
        serviceDate: Value(record.serviceDate),
        odometerKm: Value(record.odometerKm),
        cost: Value(record.cost),
        partsReplaced: Value(jsonEncode(record.partsReplaced)),
        technician: Value(record.technician),
        serviceCenter: Value(record.serviceCenter),
        notes: Value(record.notes),
      );

  /// Returns all maintenance records (synchronous cache). Call `load()` first.
  List<domain.MaintenanceRecord> get records => List.unmodifiable(_cache);

  /// Returns all maintenance records from the database (async, always fresh).
  Future<List<domain.MaintenanceRecord>> get recordsAsync async {
    await _initialized;
    final rows = await _db.select(_db.maintenanceRecords).get();
    return rows.map(_recordFromRow).toList();
  }

  /// Inserts or replaces a maintenance record by id.
  Future<void> upsertRecord(domain.MaintenanceRecord record) async {
    await _initialized;
    await _db.into(_db.maintenanceRecords).insert(
      _recordCompanion(record),
      mode: InsertMode.replace,
    );
    await _loadCache();
  }

  /// Adds a new maintenance record.
  Future<void> addRecord(domain.MaintenanceRecord record) async {
    await _initialized;
    await _db.into(_db.maintenanceRecords).insert(_recordCompanion(record));
    await _loadCache();
  }
}
