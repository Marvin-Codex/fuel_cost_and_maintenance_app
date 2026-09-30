class FuelRecord {
  const FuelRecord({
    required this.id,
    required this.vehicleId,
    required this.litres,
    required this.cost,
    required this.odometer,
  });

  final String id;
  final String vehicleId;
  final double litres;
  final double cost;
  final double odometer;

  double get costPerLitre => litres > 0 ? cost / litres : 0;

  static double totalCost(Iterable<FuelRecord> records) => records.fold(
        0,
        (total, record) =>
            total +
            (record.cost.isFinite && record.cost >= 0 ? record.cost : 0),
      );

  static double averageCostPerLitre(Iterable<FuelRecord> records) {
    var litres = 0.0;
    var cost = 0.0;
    for (final record in records) {
      if (record.litres > 0 &&
          record.litres.isFinite &&
          record.cost >= 0 &&
          record.cost.isFinite) {
        litres += record.litres;
        cost += record.cost;
      }
    }
    return litres > 0 ? cost / litres : 0;
  }
}
