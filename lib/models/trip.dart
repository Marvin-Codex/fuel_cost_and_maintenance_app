class Trip {
  const Trip({
    required this.id,
    required this.vehicleId,
    required this.startLocation,
    required this.destination,
    required this.startedAt,
    required this.endedAt,
    required this.distanceKm,
    this.startOdometerKm,
    this.endOdometerKm,
    this.fuelConsumedLiters,
    this.fuelPricePerLiter,
    this.notes = '',
    this.clientId,
  });

  final String id;
  final String vehicleId;
  final String startLocation;
  final String destination;
  final DateTime startedAt;
  final DateTime endedAt;
  final double distanceKm;
  final int? startOdometerKm;
  final int? endOdometerKm;
  final double? fuelConsumedLiters;
  final double? fuelPricePerLiter;
  final String notes;
  final String? clientId;

  double get fuelCost =>
      (fuelConsumedLiters ?? 0) * (fuelPricePerLiter ?? 0);

  int get durationSeconds => endedAt.difference(startedAt).inSeconds;

  double? get averageSpeedKmh {
    final hours = durationSeconds / 3600.0;
    if (hours <= 0) return null;
    return distanceKm / hours;
  }

  Map<String, dynamic> toJson() => {
        'vehicle': vehicleId,
        'start_location': startLocation,
        'destination': destination,
        'started_at': startedAt.toUtc().toIso8601String(),
        'ended_at': endedAt.toUtc().toIso8601String(),
        'distance_km': distanceKm,
        'start_odometer_km': startOdometerKm,
        'end_odometer_km': endOdometerKm,
        'fuel_consumed_liters': fuelConsumedLiters,
        'fuel_price_per_liter': fuelPricePerLiter,
        'notes': notes,
        'client_id': clientId,
      };

  factory Trip.fromJson(String id, Map<String, dynamic> json) {
    DateTime parseDate(dynamic v) {
      if (v is DateTime) return v;
      return DateTime.tryParse('$v')?.toLocal() ?? DateTime.now();
    }

    return Trip(
      id: id,
      vehicleId: (json['vehicle'] ?? json['vehicle_id'] ?? '').toString(),
      startLocation: (json['start_location'] ?? '').toString(),
      destination: (json['destination'] ?? '').toString(),
      startedAt: parseDate(json['started_at']),
      endedAt: parseDate(json['ended_at']),
      distanceKm: double.tryParse('${json['distance_km']}') ?? 0,
      startOdometerKm: int.tryParse('${json['start_odometer_km']}'),
      endOdometerKm: int.tryParse('${json['end_odometer_km']}'),
      fuelConsumedLiters: double.tryParse('${json['fuel_consumed_liters']}'),
      fuelPricePerLiter: double.tryParse('${json['fuel_price_per_liter']}'),
      notes: (json['notes'] ?? '').toString(),
      clientId: json['client_id']?.toString(),
    );
  }
}
