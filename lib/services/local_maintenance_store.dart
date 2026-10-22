import '../models/maintenance_record.dart';

class LocalMaintenanceStore {
  final List<MaintenanceRecord> _records = [];

  List<MaintenanceRecord> get records => List.unmodifiable(_records);

  void upsertRecord(MaintenanceRecord record) {
    final index = _records.indexWhere((r) => r.id == record.id);
    if (index >= 0) {
      _records[index] = record;
    } else {
      _records.add(record);
    }
  }

  void addRecord(MaintenanceRecord record) => _records.add(record);
}
