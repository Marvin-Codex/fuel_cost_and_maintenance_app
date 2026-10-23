import 'package:flutter/material.dart';

import '../models/maintenance_record.dart';
import '../models/vehicle.dart';
import '../services/access.dart';
import '../services/local_maintenance_store.dart';

class MaintenancePage extends StatefulWidget {
  const MaintenancePage({
    super.key,
    required this.store,
    required this.vehicles,
    required this.access,
    required this.onChanged,
  });

  final LocalMaintenanceStore store;
  final List<Vehicle> vehicles;
  final Access access;
  final VoidCallback onChanged;

  @override
  State<MaintenancePage> createState() => _MaintenancePageState();
}

class _MaintenancePageState extends State<MaintenancePage> {
  Future<void> _add() async {
    if (!widget.access.canLogMaintenance) return;
    final serviceTypeController = TextEditingController();
    final odometerController = TextEditingController();
    final costController = TextEditingController();
    final notesController = TextEditingController();
    String? vehicleId = widget.vehicles.isNotEmpty ? widget.vehicles.first.id : null;
    DateTime serviceDate = DateTime.now();

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Log service'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.vehicles.isNotEmpty)
                  DropdownButtonFormField<String>(
                    value: vehicleId,
                    items: widget.vehicles
                        .map((v) => DropdownMenuItem(value: v.id, child: Text(v.name)))
                        .toList(),
                    onChanged: (v) => setDialogState(() => vehicleId = v),
                    decoration: const InputDecoration(labelText: 'Vehicle'),
                  ),
                TextField(
                  controller: serviceTypeController,
                  decoration: const InputDecoration(labelText: 'Service type'),
                ),
                TextField(
                  controller: odometerController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Odometer (km)'),
                ),
                TextField(
                  controller: costController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Cost'),
                ),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(labelText: 'Notes'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            FilledButton(
              onPressed: () {
                final record = MaintenanceRecord(
                  id: 'maintenance-${DateTime.now().millisecondsSinceEpoch}',
                  vehicleId: vehicleId ?? '',
                  serviceType: serviceTypeController.text.trim().isEmpty
                      ? 'Service'
                      : serviceTypeController.text.trim(),
                  serviceDate: serviceDate,
                  odometerKm: int.tryParse(odometerController.text.trim()) ?? 0,
                  cost: double.tryParse(costController.text.trim()) ?? 0,
                  notes: notesController.text.trim(),
                );
                widget.store.addRecord(record);
                widget.onChanged();
                Navigator.pop(context);
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final records = widget.store.records.reversed.toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Maintenance', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text('Track service history and upcoming reminders.'),
        const SizedBox(height: 12),
        if (widget.access.canLogMaintenance)
          FilledButton.icon(
            onPressed: _add,
            icon: const Icon(Icons.build_outlined),
            label: const Text('Log service'),
          ),
        const SizedBox(height: 16),
        if (records.isEmpty)
          const Text('No service records yet.')
        else
          for (final record in records)
            Card(
              child: ListTile(
                leading: const Icon(Icons.build),
                title: Text(record.serviceType),
                subtitle: Text(
                  '${record.serviceDate.toLocal().toString().split(' ').first} • '
                  '${record.odometerKm} km • ${record.cost.toStringAsFixed(2)}',
                ),
              ),
            ),
      ],
    );
  }
}
