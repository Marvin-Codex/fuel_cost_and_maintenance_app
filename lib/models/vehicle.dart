enum VehicleType { car, truck, motorcycle, bus, van, suv, pickup, utility }

extension VehicleTypeLabel on VehicleType {
  String get label => switch (this) {
        VehicleType.car => 'Car',
        VehicleType.truck => 'Truck',
        VehicleType.motorcycle => 'Motorcycle',
        VehicleType.bus => 'Bus',
        VehicleType.van => 'Van',
        VehicleType.suv => 'SUV',
        VehicleType.pickup => 'Pickup',
        VehicleType.utility => 'Utility vehicle',
      };
}

class Vehicle {
  const Vehicle({
    required this.id,
    required this.name,
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
  final String name;
  final VehicleType type;
  final String manufacturer;
  final String model;
  final int year;
  final String engine;
  final String fuelType;
  final double tankCapacityLitres;
  final double referenceConsumption;
  final int? seatingCapacity;
  final double? payloadCapacityKg;

  String get specificationSummary =>
      '$year $manufacturer $model • ${referenceConsumption.toStringAsFixed(1)} L/100 km • ${tankCapacityLitres.toStringAsFixed(0)} L tank';

  double get estimatedRangeKm =>
      tankCapacityLitres / referenceConsumption * 100;

  double fullTankCost(double pricePerLitre) =>
      tankCapacityLitres * pricePerLitre;
}
