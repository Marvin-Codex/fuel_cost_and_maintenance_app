class MaintenanceRecord {
  const MaintenanceRecord({
    required this.id,
    required this.vehicleId,
    required this.serviceType,
    required this.serviceDate,
    required this.odometerKm,
    required this.cost,
    this.partsReplaced = const [],
    this.technician = '',
    this.serviceCenter = '',
    this.notes = '',
  });

  final String id;
  final String vehicleId;
  final String serviceType;
  final DateTime serviceDate;
  final int odometerKm;
  final double cost;
  final List<String> partsReplaced;
  final String technician;
  final String serviceCenter;
  final String notes;

  Map<String, dynamic> toJson() => {
        'vehicle': vehicleId,
        'service_type': serviceType,
        'service_date': serviceDate.toIso8601String().split('T').first,
        'odometer_km': odometerKm,
        'cost': cost,
        'parts_replaced': partsReplaced,
        'technician': technician,
        'service_center': serviceCenter,
        'notes': notes,
      };

  factory MaintenanceRecord.fromJson(String id, Map<String, dynamic> json) {
    DateTime parseDate(dynamic v) {
      if (v is DateTime) return v;
      return DateTime.tryParse('$v')?.toLocal() ?? DateTime.now();
    }

    final parts = (json['parts_replaced'] as List?) ?? const [];
    return MaintenanceRecord(
      id: id,
      vehicleId: (json['vehicle'] ?? json['vehicle_id'] ?? '').toString(),
      serviceType: (json['service_type'] ?? '').toString(),
      serviceDate: parseDate(json['service_date']),
      odometerKm: int.tryParse('${json['odometer_km']}') ?? 0,
      cost: double.tryParse('${json['cost']}') ?? 0,
      partsReplaced: parts.map((e) => e.toString()).toList(),
      technician: (json['technician'] ?? '').toString(),
      serviceCenter: (json['service_center'] ?? '').toString(),
      notes: (json['notes'] ?? '').toString(),
    );
  }
}
