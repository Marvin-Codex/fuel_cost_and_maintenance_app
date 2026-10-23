import 'package:drift/drift.dart';

import '../database/app_database.dart';
import '../models/vehicle.dart' as domain;

class VehiclePreset {
  const VehiclePreset({
    required this.id,
    required this.type,
    required this.manufacturer,
    required this.model,
    required this.year,
    required this.engine,
    required this.fuelType,
    required this.tankCapacityLitres,
    required this.referenceConsumption,
    this.seatingCapacity,
    this.payloadCapacityKg,
  });

  final String id;
  final domain.VehicleType type;
  final String manufacturer;
  final String model;
  final int year;
  final String engine;
  final String fuelType;
  final double tankCapacityLitres;
  final double referenceConsumption;
  final int? seatingCapacity;
  final double? payloadCapacityKg;

  String get label => '$manufacturer $model ($year)';

  domain.Vehicle toVehicle(String id, {String? name}) => domain.Vehicle(
        id: id,
        name: name ?? label,
        type: type,
        manufacturer: manufacturer,
        model: model,
        year: year,
        engine: engine,
        fuelType: fuelType,
        tankCapacityLitres: tankCapacityLitres,
        referenceConsumption: referenceConsumption,
        seatingCapacity: seatingCapacity,
        payloadCapacityKg: payloadCapacityKg,
      );
}

const vehiclePresets = [
  VehiclePreset(
      id: 'toyota-corolla',
      type: domain.VehicleType.car,
      manufacturer: 'Toyota',
      model: 'Corolla',
      year: 2024,
      engine: '1.8L petrol',
      fuelType: 'Petrol',
      tankCapacityLitres: 50,
      referenceConsumption: 6.7),
  VehiclePreset(
      id: 'ford-ranger',
      type: domain.VehicleType.pickup,
      manufacturer: 'Ford',
      model: 'Ranger',
      year: 2024,
      engine: '2.0L diesel',
      fuelType: 'Diesel',
      tankCapacityLitres: 80,
      referenceConsumption: 8.5,
      payloadCapacityKg: 1100),
  VehiclePreset(
      id: 'toyota-hilux',
      type: domain.VehicleType.truck,
      manufacturer: 'Toyota',
      model: 'Hilux',
      year: 2024,
      engine: '2.8L diesel',
      fuelType: 'Diesel',
      tankCapacityLitres: 80,
      referenceConsumption: 9.5,
      payloadCapacityKg: 1000),
  VehiclePreset(
      id: 'honda-cb500',
      type: domain.VehicleType.motorcycle,
      manufacturer: 'Honda',
      model: 'CB500',
      year: 2024,
      engine: '471cc petrol',
      fuelType: 'Petrol',
      tankCapacityLitres: 17.1,
      referenceConsumption: 3.5),
  VehiclePreset(
      id: 'mercedes-sprinter',
      type: domain.VehicleType.van,
      manufacturer: 'Mercedes-Benz',
      model: 'Sprinter',
      year: 2024,
      engine: '2.0L diesel',
      fuelType: 'Diesel',
      tankCapacityLitres: 71,
      referenceConsumption: 10.2,
      payloadCapacityKg: 1400),
  VehiclePreset(
      id: 'volvo-7900',
      type: domain.VehicleType.bus,
      manufacturer: 'Volvo',
      model: '7900',
      year: 2024,
      engine: '7.7L diesel',
      fuelType: 'Diesel',
      tankCapacityLitres: 300,
      referenceConsumption: 32,
      seatingCapacity: 95),
];

/// Drift-backed persistent store for vehicles. All operations are asynchronous
/// and survive app restarts. Falls back to the in-memory preset vehicle on
/// first launch if the database is empty.
class LocalVehicleStore {
  LocalVehicleStore(this._db) : _initialized = Future<void>.value() {
    // Seed the default vehicle if the database is empty.
    _initialized.then((_) async {
      final existing = await _db.select(_db.vehicles).get();
      if (existing.isEmpty) {
        await upsertVehicle(vehiclePresets.first.toVehicle('vehicle-1'));
      }
      _loadCache();
    });
  }

  final AppDatabase _db;
  final Future<void> _initialized;
  final List<domain.Vehicle> _cache = [];

  Future<void> _loadCache() async {
    await _initialized;
    final rows = await _db.select(_db.vehicles).get();
    _cache
      ..clear()
      ..addAll(rows.map(_vehicleFromRow));
  }

  /// Loads vehicles from the database into the synchronous cache. Call once
  /// after construction (e.g. in `State.initState`) before reading `vehicles`.
  Future<void> load() => _loadCache();

  domain.Vehicle _vehicleFromRow(Vehicle row) => domain.Vehicle(
        id: row.id,
        name: row.name,
        type: _parseVehicleType(row.type),
        manufacturer: row.manufacturer,
        model: row.model,
        year: row.year,
        engine: row.engine,
        fuelType: row.fuelType,
        tankCapacityLitres: row.tankCapacityLitres,
        referenceConsumption: row.referenceConsumption,
        seatingCapacity: row.seatingCapacity,
        payloadCapacityKg: row.payloadCapacityKg,
      );

  domain.VehicleType _parseVehicleType(String value) {
    try {
      return domain.VehicleType.values.firstWhere((e) => e.name == value);
    } catch (_) {
      return domain.VehicleType.car;
    }
  }

  VehiclesCompanion _vehicleCompanion(domain.Vehicle vehicle) =>
      VehiclesCompanion(
        id: Value(vehicle.id),
        name: Value(vehicle.name),
        type: Value(vehicle.type.name),
        manufacturer: Value(vehicle.manufacturer),
        model: Value(vehicle.model),
        year: Value(vehicle.year),
        engine: Value(vehicle.engine),
        fuelType: Value(vehicle.fuelType),
        tankCapacityLitres: Value(vehicle.tankCapacityLitres),
        referenceConsumption: Value(vehicle.referenceConsumption),
        seatingCapacity: Value(vehicle.seatingCapacity),
        payloadCapacityKg: Value(vehicle.payloadCapacityKg),
      );

  /// Returns all vehicles (synchronous cache). Call `load()` first.
  List<domain.Vehicle> get vehicles => List.unmodifiable(_cache);

  /// Returns all vehicles from the database (async, always fresh).
  Future<List<domain.Vehicle>> get vehiclesAsync async {
    await _initialized;
    final rows = await _db.select(_db.vehicles).get();
    return rows.map(_vehicleFromRow).toList();
  }

  /// Inserts or replaces a vehicle by id.
  Future<void> upsertVehicle(domain.Vehicle vehicle) async {
    await _initialized;
    await _db.into(_db.vehicles).insert(
      _vehicleCompanion(vehicle),
      mode: InsertMode.replace,
    );
    await _loadCache();
  }

  /// Adds a new vehicle from a preset, generating a unique id.
  Future<void> addVehicle(String name, {VehiclePreset? preset}) async {
    await _initialized;
    final trimmedName = name.trim();
    if (trimmedName.isEmpty) return;

    final all = _cache;
    final selectedPreset = preset ?? vehiclePresets.first;
    await upsertVehicle(selectedPreset.toVehicle(
      'vehicle-${all.length + 1}',
      name: trimmedName,
    ));
  }
}
