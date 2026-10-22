import 'package:flutter/material.dart';

import 'database/app_database.dart' show AppDatabase;
import 'models/fuel_record.dart';
import 'models/vehicle.dart';
import 'screens/maintenance_page.dart';
import 'screens/plan_trip_page.dart';
import 'screens/trips_page.dart';
import 'services/access.dart';
import 'services/api_service.dart';
import 'services/local_fuel_store.dart';
import 'services/local_maintenance_store.dart';
import 'services/local_trip_store.dart';
import 'services/local_vehicle_store.dart';
import 'services/sync_service.dart';

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

  final AppDatabase _appDatabase = AppDatabase();
  late final LocalVehicleStore _vehicleStore =
      LocalVehicleStore(_appDatabase);
  late final LocalFuelStore _fuelStore = LocalFuelStore(_appDatabase);
  late final LocalTripStore _tripStore = LocalTripStore(_appDatabase);
  late final LocalMaintenanceStore _maintenanceStore =
      LocalMaintenanceStore(_appDatabase);

  List<Map<String, dynamic>> _workspaces = const [];
  String? _activeWorkspaceId;

  /// Rights for the workspace currently in use, from the server snapshot.
  ///
  /// Until that snapshot arrives this is `Access.unknown()`, which denies
  /// everything — we never assume a user may do something and take it back.
  Access _access = const Access.unknown();

  final ApiService _api = ApiService();
  late final SyncService _sync = SyncService(_api);
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _loadStores();
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncNow());
  }

  @override
  void dispose() {
    _appDatabase.close();
    super.dispose();
  }

  Future<void> _loadStores() async {
    await _vehicleStore.load();
    await _fuelStore.load();
    await _tripStore.load();
    await _maintenanceStore.load();
    if (mounted) setState(() {});
  }

  Future<void> _syncNow() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    try {
      await _sync.sync(
        onAccess: applyAccessSnapshot,
        vehicleStore: _vehicleStore,
        fuelStore: _fuelStore,
        tripStore: _tripStore,
        maintenanceStore: _maintenanceStore,
      );
    } catch (_) {
      // Offline or auth missing: keep local data.
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  Future<void> _switchWorkspace(String id) async {
    if (id == _activeWorkspaceId) return;
    _api.setActiveWorkspace(id);
    _activeWorkspaceId = id;
    await _syncNow();
  }

  /// Applies the server's access snapshot. If it contains no workspaces,
  /// the last known rights are kept.
  void applyAccessSnapshot(Map<String, dynamic> snapshot) {
    final workspaces = (snapshot['workspaces'] as List?)
            ?.whereType<Map<String, dynamic>>()
            .toList() ??
        const <Map<String, dynamic>>[];
    _workspaces = workspaces;
    _activeWorkspaceId = snapshot['active_workspace']?.toString();
    _api.setActiveWorkspace(_activeWorkspaceId);
    final activeEntry = workspaces.firstWhere(
      (w) =>
          w['workspace'] is Map &&
          (w['workspace'] as Map)['id']?.toString() == _activeWorkspaceId,
      orElse: () =>
          workspaces.isNotEmpty ? workspaces.first : <String, dynamic>{},
    );
    if (activeEntry.isNotEmpty) {
      final entry = Map<String, dynamic>.from(activeEntry);
      entry['is_superuser'] = snapshot['is_superuser'] == true;
      setState(() => _access = Access.fromSnapshot(entry));
    }
  }

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
    if (_vehicleStore.vehicles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add a vehicle first.')),
      );
      return;
    }
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
        access: _access,
        onAdd: _access.canAddVehicle ? _showAddVehicleDialog : null,
      ),
      _FuelContent(
        records: _fuelStore.records,
        currency: _currency,
        access: _access,
        onAdd: _access.canLogFuel ? _showAddFuelDialog : null,
      ),
      PlanTripPage(api: _api),
      TripsPage(
        store: _tripStore,
        vehicles: _vehicleStore.vehicles,
        access: _access,
        onChanged: () => setState(() {}),
      ),
      MaintenancePage(
        store: _maintenanceStore,
        vehicles: _vehicleStore.vehicles,
        access: _access,
        onChanged: () => setState(() {}),
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fuel and Maintenance'),
        actions: [
          if (_workspaces.length > 1)
            PopupMenuButton<String>(
              tooltip: 'Workspace',
              icon: const Icon(Icons.workspaces_outlined),
              onSelected: _switchWorkspace,
              itemBuilder: (context) => _workspaces.map((w) {
                final ws = (w['workspace'] as Map?) ?? {};
                final id = ws['id']?.toString() ?? '';
                final name = ws['name']?.toString() ?? 'Workspace';
                return PopupMenuItem<String>(
                  value: id,
                  child: Text(name),
                );
              }).toList(),
            ),
          IconButton(
              tooltip: 'Sync',
              onPressed: _syncing ? null : _syncNow,
              icon: _syncing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.sync_outlined)),
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
              icon: Icon(Icons.route_outlined),
              selectedIcon: Icon(Icons.route),
              label: 'Plan trip'),
          NavigationDestination(
              icon: Icon(Icons.alt_route_outlined),
              selectedIcon: Icon(Icons.alt_route),
              label: 'Trips'),
          NavigationDestination(
              icon: Icon(Icons.build_outlined),
              selectedIcon: Icon(Icons.build),
              label: 'Maintenance'),
        ],
      ),
      floatingActionButton: _selectedIndex == 1
          ? (_access.canAddVehicle
              ? FloatingActionButton.extended(
                  onPressed: _showAddVehicleDialog,
                  icon: const Icon(Icons.add),
                  label: const Text('Vehicle'))
              : null)
          : _selectedIndex == 2
              ? (_access.canLogFuel
                  ? FloatingActionButton.extended(
                      onPressed: _showAddFuelDialog,
                      icon: const Icon(Icons.add),
                      label: const Text('Fuel'))
                  : null)
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
    required this.access,
    this.onAdd,
  });
  final List<FuelRecord> records;
  final String currency;
  final Access access;

  /// Null when this user's role lacks `fuel.add` — the button is not rendered
  /// at all rather than shown and disabled.
  final VoidCallback? onAdd;

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
          if (onAdd != null)
            OutlinedButton.icon(
                onPressed: onAdd,
                icon: const Icon(Icons.add),
                label: const Text('Log a fuel purchase'))
          else
            const _ReadOnlyMessage(
              message: 'Your role can view fuel records but not log new ones.',
            ),
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
    required this.access,
    this.onAdd,
  });
  final List<Vehicle> vehicles;
  final double fuelPricePerLitre;
  final String currency;
  final Access access;

  /// Null when this user's role lacks `vehicles.add`.
  final VoidCallback? onAdd;

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
          if (onAdd != null)
            OutlinedButton.icon(
                onPressed: onAdd,
                icon: const Icon(Icons.add),
                label: const Text('Add another vehicle'))
          else
            const _ReadOnlyMessage(
              message: 'Your role can view vehicles but not add new ones.',
            ),
        ],
      );
}

/// Shown in place of an add button when the role lacks the permission, so the
/// absence of a button reads as a rule rather than a bug.
class _ReadOnlyMessage extends StatelessWidget {
  const _ReadOnlyMessage({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(Icons.lock_outline,
                size: 16, color: Theme.of(context).colorScheme.outline),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                message,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.outline,
                    ),
              ),
            ),
          ],
        ),
      );
}

IconData _vehicleIcon(VehicleType type) => switch (type) {
      VehicleType.motorcycle => Icons.two_wheeler,
      VehicleType.bus => Icons.directions_bus_outlined,
      VehicleType.truck || VehicleType.pickup => Icons.local_shipping_outlined,
      VehicleType.van => Icons.airport_shuttle_outlined,
      _ => Icons.directions_car_outlined,
    };