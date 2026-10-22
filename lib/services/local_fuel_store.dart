import '../models/fuel_record.dart';

class LocalFuelStore {
  final List<FuelRecord> _records = [];

  List<FuelRecord> get records => List.unmodifiable(_records);

  void upsertRecord(FuelRecord record) {
    final index = _records.indexWhere((r) => r.id == record.id);
    if (index >= 0) {
      _records[index] = record;
    } else {
      _records.add(record);
    }
  }

  void addRecord({
    required String vehicleId,
    required double litres,
    required double cost,
    required double odometer,
  }) {
    if (!litres.isFinite ||
        litres <= 0 ||
        !cost.isFinite ||
        cost < 0 ||
        !odometer.isFinite ||
        odometer < 0) {
      return;
    }

    _records.add(FuelRecord(
      id: 'fuel-${_records.length + 1}',
      vehicleId: vehicleId,
      litres: litres,
      cost: cost,
      odometer: odometer,
    ));
  }
}
