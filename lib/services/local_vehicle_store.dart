import '../models/vehicle.dart';

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

  String get label => '$manufacturer $model ($year)';

  Vehicle toVehicle(String id, {String? name}) => Vehicle(
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
      type: VehicleType.car,
      manufacturer: 'Toyota',
      model: 'Corolla',
      year: 2024,
      engine: '1.8L petrol',
      fuelType: 'Petrol',
      tankCapacityLitres: 50,
      referenceConsumption: 6.7),
  VehiclePreset(
      id: 'ford-ranger',
      type: VehicleType.pickup,
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
      type: VehicleType.truck,
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
      type: VehicleType.motorcycle,
      manufacturer: 'Honda',
      model: 'CB500',
      year: 2024,
      engine: '471cc petrol',
      fuelType: 'Petrol',
      tankCapacityLitres: 17.1,
      referenceConsumption: 3.5),
  VehiclePreset(
      id: 'mercedes-sprinter',
      type: VehicleType.van,
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
      type: VehicleType.bus,
      manufacturer: 'Volvo',
      model: '7900',
      year: 2024,
      engine: '7.7L diesel',
      fuelType: 'Diesel',
      tankCapacityLitres: 300,
      referenceConsumption: 32,
      seatingCapacity: 95),
];

class LocalVehicleStore {
  LocalVehicleStore()
      : _vehicles = [
          vehiclePresets.first.toVehicle('vehicle-1'),
        ];

  final List<Vehicle> _vehicles;

  List<Vehicle> get vehicles => List.unmodifiable(_vehicles);

  void addVehicle(String name, {VehiclePreset? preset}) {
    final trimmedName = name.trim();
    if (trimmedName.isEmpty) return;

    final selectedPreset = preset ?? vehiclePresets.first;
    _vehicles.add(selectedPreset.toVehicle(
      'vehicle-${_vehicles.length + 1}',
      name: trimmedName,
    ));
  }
}
