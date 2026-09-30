import 'package:flutter/material.dart';

import 'models/fuel_record.dart';
import 'models/vehicle.dart';
import 'services/local_vehicle_store.dart';
import 'services/local_fuel_store.dart';

const supportedCurrencies = ['UGX', 'USD', 'EUR', 'GBP', 'KES', 'TZS'];

void main() => runApp(const FuelMaintenanceApp());

class FuelMaintenanceApp extends StatelessWidget {
  const FuelMaintenanceApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Fuel and Maintenance',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0C5B55)),
          scaffoldBackgroundColor: const Color(0xFFF4F7F5),
          useMaterial3: true,
        ),
        home: const DashboardPage(),
      );
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  int _selectedIndex = 0;
  double _fuelPricePerLitre = 1.50;
  String _currency = 'UGX';
  final LocalVehicleStore _vehicleStore = LocalVehicleStore();
  final LocalFuelStore _fuelStore = LocalFuelStore();

  void _showFuelPriceDialog() {
    final controller = TextEditingController(
      text: _fuelPricePerLitre.toStringAsFixed(2),
    );
    var selectedCurrency = _currency;
    showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Settings'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedCurrency,
                decoration: const InputDecoration(labelText: 'Currency'),
                items: supportedCurrencies
                    .map((currency) => DropdownMenuItem(
                          value: currency,
                          child: Text(currency),
                        ))
                    .toList(),
                onChanged: (currency) {
                  if (currency != null) {
                    setDialogState(() => selectedCurrency = currency);
                  }
                },
              ),
              TextField(
                controller: controller,
                autofocus: true,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Price per litre',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                final price = double.tryParse(controller.text.trim());
                if (price != null && price > 0) {
                  setState(() {
                    _fuelPricePerLitre = price;
                    _currency = selectedCurrency;
                  });
                  Navigator.pop(context);
                }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddVehicleDialog() {
    final controller = TextEditingController();
    VehiclePreset selectedPreset = vehiclePresets.first;
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add vehicle'),
        content: StatefulBuilder(
          builder: (context, setDialogState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<VehiclePreset>(
                value: selectedPreset,
                decoration: const InputDecoration(labelText: 'Vehicle preset'),
                items: vehiclePresets
                    .map((preset) => DropdownMenuItem(
                          value: preset,
                          child: Text('${preset.type.label}: ${preset.label}'),
                        ))
                    .toList(),
                onChanged: (preset) {
                  if (preset != null) {
                    setDialogState(() => selectedPreset = preset);
                    controller.text = preset.label;
                  }
                },
              ),
              TextField(
                controller: controller,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'Vehicle name',
                  hintText: 'e.g. Ford Ranger',
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '${selectedPreset.engine} • ${selectedPreset.fuelType} • ${selectedPreset.tankCapacityLitres.toStringAsFixed(0)} L tank',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              final name = controller.text.trim();
              if (name.isNotEmpty) {
                setState(() =>
                    _vehicleStore.addVehicle(name, preset: selectedPreset));
              }
              Navigator.pop(context);
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _showAddFuelDialog() {
    final litres = TextEditingController();
    final cost = TextEditingController();
    final odometer = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log fuel purchase'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
              controller: litres,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Litres')),
          TextField(
              controller: cost,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Cost')),
          TextField(
              controller: odometer,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Odometer')),
        ]),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              final litresValue = double.tryParse(litres.text);
              final costValue = double.tryParse(cost.text);
              final odometerValue = double.tryParse(odometer.text);
              if (litresValue != null &&
                  litresValue > 0 &&
                  costValue != null &&
                  costValue >= 0 &&
                  odometerValue != null &&
                  odometerValue >= 0) {
                setState(() => _fuelStore.addRecord(
                    vehicleId: _vehicleStore.vehicles.first.id,
                    litres: litresValue,
                    cost: costValue,
                    odometer: odometerValue));
                Navigator.pop(context);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _DashboardContent(
        vehicleCount: _vehicleStore.vehicles.length,
        fuelCount: _fuelStore.records.length,
        totalFuelCost: FuelRecord.totalCost(_fuelStore.records),
        averageFuelCostPerLitre:
            FuelRecord.averageCostPerLitre(_fuelStore.records),
        currency: _currency,
      ),
      _VehiclesContent(
        vehicles: _vehicleStore.vehicles,
        fuelPricePerLitre: _fuelPricePerLitre,
        currency: _currency,
        onAdd: _showAddVehicleDialog,
      ),
      _FuelContent(
        records: _fuelStore.records,
        currency: _currency,
        onAdd: _showAddFuelDialog,
      ),
      const _SimpleSection(
          icon: Icons.build_outlined,
          title: 'Maintenance',
          description:
              'Track service history and upcoming maintenance reminders.'),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fuel and Maintenance'),
        actions: [
          IconButton(
              tooltip: 'Settings',
              onPressed: _showFuelPriceDialog,
              icon: const Icon(Icons.settings_outlined))
        ],
      ),
      body: SafeArea(child: pages[_selectedIndex]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) =>
            setState(() => _selectedIndex = index),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard),
              label: 'Overview'),
          NavigationDestination(
              icon: Icon(Icons.directions_car_outlined),
              selectedIcon: Icon(Icons.directions_car),
              label: 'Vehicles'),
          NavigationDestination(
              icon: Icon(Icons.local_gas_station_outlined),
              selectedIcon: Icon(Icons.local_gas_station),
              label: 'Fuel'),
          NavigationDestination(
              icon: Icon(Icons.build_outlined),
              selectedIcon: Icon(Icons.build),
              label: 'Service'),
        ],
      ),
      floatingActionButton: _selectedIndex == 1
          ? FloatingActionButton.extended(
              onPressed: _showAddVehicleDialog,
              icon: const Icon(Icons.add),
              label: const Text('Vehicle'))
          : _selectedIndex == 2
              ? FloatingActionButton.extended(
                  onPressed: _showAddFuelDialog,
                  icon: const Icon(Icons.add),
                  label: const Text('Fuel'))
              : null,
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent(
      {required this.vehicleCount,
      required this.fuelCount,
      required this.totalFuelCost,
      required this.averageFuelCostPerLitre,
      required this.currency});

  final int vehicleCount;
  final int fuelCount;
  final double totalFuelCost;
  final double averageFuelCostPerLitre;
  final String currency;

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Good morning',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('Your vehicle costs at a glance',
              style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 20),
          Card(
            color: Theme.of(context).colorScheme.primary,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(children: [
                const Icon(Icons.insights, color: Colors.white, size: 34),
                const SizedBox(width: 16),
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Text(
                          '$vehicleCount vehicle${vehicleCount == 1 ? '' : 's'} tracked',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(
                          fuelCount == 0
                              ? 'Add your first fuel record to start seeing trends.'
                              : '$fuelCount fuel record${fuelCount == 1 ? '' : 's'} stored offline.',
                          style: const TextStyle(color: Colors.white70)),
                    ])),
              ]),
            ),
          ),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(
              child: _MetricCard(
                label: 'Recorded fuel cost',
                value: '$currency ${totalFuelCost.toStringAsFixed(2)}',
                icon: Icons.payments_outlined,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MetricCard(
                label: 'Average cost/litre',
                value: averageFuelCostPerLitre == 0
                    ? '--'
                    : '$currency ${averageFuelCostPerLitre.toStringAsFixed(2)}',
                icon: Icons.speed_outlined,
              ),
            ),
          ]),
          const SizedBox(height: 24),
          Text('Next actions',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const ListTile(
              leading: Icon(Icons.local_gas_station_outlined),
              title: Text('Log a fuel purchase'),
              subtitle: Text('Keep your consumption history accurate.')),
          const ListTile(
              leading: Icon(Icons.event_note_outlined),
              title: Text('Schedule maintenance'),
              subtitle: Text('Never miss an important service interval.')),
        ],
      );
}

class _FuelContent extends StatelessWidget {
  const _FuelContent({
    required this.records,
    required this.currency,
    required this.onAdd,
  });
  final List<FuelRecord> records;
  final String currency;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Fuel records',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(records.isEmpty
              ? 'No fuel purchases recorded yet.'
              : '${records.length} purchase${records.length == 1 ? '' : 's'} stored locally.'),
          const SizedBox(height: 16),
          ...records.reversed.map(
            (record) => Card(
              child: ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.local_gas_station_outlined),
                ),
                title: Text(
                  '${record.litres.toStringAsFixed(1)} L • $currency ${record.cost.toStringAsFixed(2)}',
                ),
                subtitle: Text(
                  'Odometer: ${record.odometer.toStringAsFixed(0)} km • '
                  '$currency ${record.costPerLitre.toStringAsFixed(2)} per litre',
                ),
              ),
            ),
          ),
          if (records.isNotEmpty) const SizedBox(height: 8),
          OutlinedButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add),
              label: const Text('Log a fuel purchase')),
        ],
      );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard(
      {required this.label, required this.value, required this.icon});
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 12),
            Text(value,
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold)),
            Text(label),
          ]),
        ),
      );
}

class _VehiclesContent extends StatelessWidget {
  const _VehiclesContent({
    required this.vehicles,
    required this.fuelPricePerLitre,
    required this.currency,
    required this.onAdd,
  });
  final List<Vehicle> vehicles;
  final double fuelPricePerLitre;
  final String currency;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Vehicles',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Your locally available vehicle records.'),
          const SizedBox(height: 16),
          ...vehicles.map((vehicle) => Card(
                child: ListTile(
                  leading: CircleAvatar(
                    child: Icon(_vehicleIcon(vehicle.type)),
                  ),
                  title: Text(vehicle.name),
                  subtitle: Text(
                    '${vehicle.type.label} • ${vehicle.engine}\n'
                    '${vehicle.specificationSummary}\n'
                    'Estimated range: ${vehicle.estimatedRangeKm.toStringAsFixed(0)} km '
                    '• Full tank: $currency ${vehicle.fullTankCost(fuelPricePerLitre).toStringAsFixed(2)}',
                  ),
                  isThreeLine: true,
                  trailing: const Icon(Icons.chevron_right),
                ),
              )),
          const SizedBox(height: 12),
          OutlinedButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add),
              label: const Text('Add another vehicle')),
        ],
      );
}

IconData _vehicleIcon(VehicleType type) => switch (type) {
      VehicleType.motorcycle => Icons.two_wheeler,
      VehicleType.bus => Icons.directions_bus_outlined,
      VehicleType.truck || VehicleType.pickup => Icons.local_shipping_outlined,
      VehicleType.van => Icons.airport_shuttle_outlined,
      _ => Icons.directions_car_outlined,
    };

class _SimpleSection extends StatelessWidget {
  const _SimpleSection(
      {required this.icon, required this.title, required this.description});
  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, size: 56, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 16),
            Text(title,
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(description, textAlign: TextAlign.center),
          ]),
        ),
      );
}
