import 'package:drift/drift.dart';

import '../database/app_database.dart';
import '../models/trip.dart' as domain;

/// Drift-backed persistent store for trips. All operations are asynchronous
/// and survive app restarts.
class LocalTripStore {
  LocalTripStore(this._db) : _initialized = Future<void>.value();

  final AppDatabase _db;
  final Future<void> _initialized;
  final List<domain.Trip> _cache = [];

  Future<void> _loadCache() async {
    await _initialized;
    final rows = await _db.select(_db.trips).get();
    _cache
      ..clear()
      ..addAll(rows.map(_tripFromRow));
  }

  /// Loads trips from the database into the synchronous cache. Call once
  /// after construction (e.g. in `State.initState`) before reading `trips`.
  Future<void> load() => _loadCache();

  domain.Trip _tripFromRow(Trip row) => domain.Trip(
        id: row.id,
        vehicleId: row.vehicleId,
        startLocation: row.startLocation,
        destination: row.destination,
        startedAt: row.startedAt,
        endedAt: row.endedAt,
        distanceKm: row.distanceKm,
        startOdometerKm: row.startOdometerKm,
        endOdometerKm: row.endOdometerKm,
        fuelConsumedLiters: row.fuelConsumedLiters,
        fuelPricePerLiter: row.fuelPricePerLiter,
        notes: row.notes,
        clientId: row.clientId,
      );

  TripsCompanion _tripCompanion(domain.Trip trip) => TripsCompanion(
        id: Value(trip.id),
        vehicleId: Value(trip.vehicleId),
        startLocation: Value(trip.startLocation),
        destination: Value(trip.destination),
        startedAt: Value(trip.startedAt),
        endedAt: Value(trip.endedAt),
        distanceKm: Value(trip.distanceKm),
        startOdometerKm: Value(trip.startOdometerKm),
        endOdometerKm: Value(trip.endOdometerKm),
        fuelConsumedLiters: Value(trip.fuelConsumedLiters),
        fuelPricePerLiter: Value(trip.fuelPricePerLiter),
        notes: Value(trip.notes),
        clientId: Value(trip.clientId),
      );

  /// Returns all trips (synchronous cache). Call `load()` first.
  List<domain.Trip> get trips => List.unmodifiable(_cache);

  /// Returns all trips from the database (async, always fresh).
  Future<List<domain.Trip>> get tripsAsync async {
    await _initialized;
    final rows = await _db.select(_db.trips).get();
    return rows.map(_tripFromRow).toList();
  }

  /// Inserts or replaces a trip by id.
  Future<void> upsertTrip(domain.Trip trip) async {
    await _initialized;
    await _db.into(_db.trips).insert(
      _tripCompanion(trip),
      mode: InsertMode.replace,
    );
    await _loadCache();
  }

  /// Adds a new trip.
  Future<void> addTrip(domain.Trip trip) async {
    await _initialized;
    await _db.into(_db.trips).insert(_tripCompanion(trip));
    await _loadCache();
  }

  /// Removes a trip by id.
  Future<void> removeTrip(String id) async {
    await _initialized;
    await _db.customStatement('DELETE FROM trips WHERE id = ?', [id]);
    await _loadCache();
  }
}
