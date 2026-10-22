import '../models/fuel_record.dart';
import '../models/maintenance_record.dart';
import '../models/trip.dart';
import '../models/vehicle.dart';
import '../services/local_fuel_store.dart';
import '../services/local_maintenance_store.dart';
import '../services/local_trip_store.dart';
import '../services/local_vehicle_store.dart';
import 'api_service.dart';

class SyncService {
  SyncService(this.api);

  final ApiService api;

  final Set<String> _syncedFuelIds = <String>{};
  final Set<String> _syncedTripIds = <String>{};
  final Set<String> _syncedMaintenanceIds = <String>{};

  Future<void> sync({
    required void Function(Map<String, dynamic>) onAccess,
    required LocalVehicleStore vehicleStore,
    required LocalFuelStore fuelStore,
    required LocalTripStore tripStore,
    required LocalMaintenanceStore maintenanceStore,
  }) async {
    final token = await api.getToken();
    if (token == null || token.isEmpty) return;

    // Access snapshot.
    try {
      final snapshot = await api.getAccess();
      if (snapshot != null) {
        final active = snapshot['active_workspace']?.toString();
        if (active != null) api.setActiveWorkspace(active);
        onAccess(snapshot);
      }
    } catch (_) {
      // Keep last known rights.
    }

    // Pull vehicles.
    try {
      final rows = await api.listVehicles();
      for (final row in rows) {
        final id = row['id']?.toString();
        if (id == null) continue;
        final already = vehicleStore.vehicles.any((v) => v.id == id);
        if (already) continue;
        final v = Vehicle(
          id: id,
          name: (row['name'] ?? '').toString(),
          type: VehicleType.car,
          manufacturer: (row['make'] ?? '').toString(),
          model: (row['model'] ?? '').toString(),
          year: (row['year'] is int)
              ? row['year'] as int
              : int.tryParse('${row['year']}') ?? 2024,
          engine: '',
          fuelType: (row['fuel_type'] ?? 'petrol').toString(),
          tankCapacityLitres: 50,
          referenceConsumption: 6.7,
        );
        vehicleStore.upsertVehicle(v);
      }
    } catch (_) {
      // Offline: keep local data.
    }

    // Pull fuel records.
    try {
      final rows = await api.listFuel();
      for (final row in rows) {
        final id = row['id']?.toString();
        if (id == null) continue;
        final already = fuelStore.records.any((r) => r.id == id);
        if (already) continue;
        final r = FuelRecord(
          id: id,
          vehicleId: (row['vehicle'] ?? '').toString(),
          litres: double.tryParse('${row['quantity_liters']}') ?? 0,
          cost: double.tryParse('${row['total_cost']}') ?? 0,
          odometer: double.tryParse('${row['odometer_km']}') ?? 0,
        );
        fuelStore.upsertRecord(r);
      }
    } catch (_) {
      // Offline: keep local data.
    }

    // Push local fuel records not yet synced.
    try {
      for (final record in fuelStore.records) {
        if (_syncedFuelIds.contains(record.id)) continue;
        if (record.id.startsWith('fuel-')) {
          final created = await api.createFuel({
            'vehicle': record.vehicleId,
            'date': DateTime.now().toIso8601String().split('T').first,
            'odometer_km': record.odometer.round(),
            'quantity_liters': record.litres,
            'unit_price': record.costPerLitre,
            'fuel_type': 'petrol',
            'is_full_tank': false,
          });
          if (created != null) {
            _syncedFuelIds.add(record.id);
          }
        }
      }
    } catch (_) {
      // Retry on next sync.
    }

    // Pull trips.
    try {
      final rows = await api.listTrips();
      for (final row in rows) {
        final id = row['id']?.toString();
        if (id == null) continue;
        final already = tripStore.trips.any((t) => t.id == id);
        if (already) continue;
        tripStore.upsertTrip(Trip.fromJson(id, row));
      }
    } catch (_) {
      // Offline: keep local data.
    }

    // Push local trips not yet synced.
    try {
      for (final trip in tripStore.trips) {
        if (_syncedTripIds.contains(trip.id)) continue;
        if (trip.id.startsWith('trip-')) {
          final created = await api.createTrip(trip.toJson());
          if (created != null) {
            _syncedTripIds.add(trip.id);
          }
        }
      }
    } catch (_) {
      // Retry on next sync.
    }

    // Pull maintenance records.
    try {
      final rows = await api.listMaintenance();
      for (final row in rows) {
        final id = row['id']?.toString();
        if (id == null) continue;
        final already = maintenanceStore.records.any((r) => r.id == id);
        if (already) continue;
        maintenanceStore.upsertRecord(MaintenanceRecord.fromJson(id, row));
      }
    } catch (_) {
      // Offline: keep local data.
    }

    // Push local maintenance records not yet synced.
    try {
      for (final record in maintenanceStore.records) {
        if (_syncedMaintenanceIds.contains(record.id)) continue;
        if (record.id.startsWith('maintenance-')) {
          final created = await api.createMaintenance(record.toJson());
          if (created != null) {
            _syncedMaintenanceIds.add(record.id);
          }
        }
      }
    } catch (_) {
      // Retry on next sync.
    }
  }
}
