import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../services/api_service.dart';

class PlanTripPage extends StatefulWidget {
  const PlanTripPage({super.key, required this.api});
  final ApiService api;
  @override
  State<PlanTripPage> createState() => _PlanTripPageState();
}

class _PlanTripPageState extends State<PlanTripPage> {
  final TextEditingController _originController = TextEditingController(text: '-1.2921, 36.8219');
  final TextEditingController _destinationController = TextEditingController(text: '-1.2864, 36.8172');
  bool _loading = false;
  String? _error;
  List<_RouteOption> _routes = const [];
  int _selectedIndex = 0;
  final MapController _mapController = MapController();
  @override
  void dispose() {
    _originController.dispose();
    _destinationController.dispose();
    super.dispose();
  }

  Future<void> _plan() async {
    final origin = _parse(_originController.text);
    final destination = _parse(_destinationController.text);
    if (origin == null || destination == null) {
      setState(() => _error = 'Enter coordinates as "lat, lon".');
      return;
    }
    setState(() { _loading = true; _error = null; _routes = const []; });
    final coordinates = '${origin.longitude.toStringAsFixed(6)},${origin.latitude.toStringAsFixed(6)};${destination.longitude.toStringAsFixed(6)},${destination.latitude.toStringAsFixed(6)}';
    try {
      final data = await widget.api.planRoute(coordinates, alternatives: true);
      if (data == null) { setState(() { _loading = false; _error = 'Could not plan route.'; }); return; }
      final routes = (data['routes'] as List?) ?? const [];
      final parsed = routes.map((r) {
        final route = r as Map<String, dynamic>;
        final geometry = route['geometry'] as Map<String, dynamic>?;
        final coords = (geometry?['coordinates'] as List?) ?? const [];
        final points = coords.map((c) { final pair = c as List; return LatLng((pair[1] as num).toDouble(), (pair[0] as num).toDouble()); }).toList();
        return _RouteOption(points: points, distanceKm: ((route['distance'] as num?)?.toDouble() ?? 0) / 1000, durationMin: ((route['duration'] as num?)?.toDouble() ?? 0) / 60);
      }).toList();
      setState(() { _loading = false; _routes = parsed; _selectedIndex = 0; });
      if (parsed.isNotEmpty && parsed.first.points.isNotEmpty) {
        _mapController.fitCamera(CameraFit.coordinates(coordinates: parsed.first.points, padding: const EdgeInsets.all(40)));
      }
    } catch (e) {
      setState(() { _loading = false; _error = 'Route failed: $e'; });
    }
  }

  LatLng? _parse(String value) {
    final parts = value.split(',');
    if (parts.length != 2) return null;
    final lat = double.tryParse(parts[0].trim());
    final lon = double.tryParse(parts[1].trim());
    if (lat == null || lon == null) return null;
    return LatLng(lat, lon);
  }

  @override
  Widget build(BuildContext context) {
    final selected = _routes.isNotEmpty ? _routes[_selectedIndex] : null;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Plan a trip', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text('Compare routes and pick the best one.'),
        const SizedBox(height: 12),
        TextField(controller: _originController, decoration: const InputDecoration(labelText: 'Origin (lat, lon)')),
        const SizedBox(height: 8),
        TextField(controller: _destinationController, decoration: const InputDecoration(labelText: 'Destination (lat, lon)')),
        const SizedBox(height: 12),
        FilledButton.icon(onPressed: _loading ? null : _plan, icon: const Icon(Icons.route_outlined), label: Text(_loading ? 'Planning…' : 'Plan route')),
        if (_error != null) ...[const SizedBox(height: 8), Text(_error!, style: const TextStyle(color: Colors.red))],
        const SizedBox(height: 12),
        SizedBox(
          height: 320,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: FlutterMap(
              mapController: _mapController,
              options: const MapOptions(initialCenter: LatLng(-1.2921, 36.8219), initialZoom: 12),
              children: [
                TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'fuel_cost_and_maintenance_app'),
                PolylineLayer(polylines: [for (int i = 0; i < _routes.length; i++) Polyline(points: _routes[i].points, strokeWidth: i == _selectedIndex ? 5 : 3, color: i == _selectedIndex ? const Color(0xFF0C5B55) : Colors.grey)]),
                if (selected != null && selected.points.isNotEmpty)
                  MarkerLayer(markers: [
                    Marker(point: selected.points.first, width: 40, height: 40, child: const Icon(Icons.place, color: Colors.green, size: 32)),
                    Marker(point: selected.points.last, width: 40, height: 40, child: const Icon(Icons.flag, color: Colors.red, size: 32)),
                  ]),
              ],
            ),
          ),
        ),
        if (_routes.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text('Alternatives', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          for (int i = 0; i < _routes.length; i++)
            Card(
              color: i == _selectedIndex ? const Color(0xFFE6F2F0) : null,
              child: ListTile(
                onTap: () => setState(() => _selectedIndex = i),
                leading: CircleAvatar(child: Text('${i + 1}')),
                title: Text('Route ${i + 1}'),
                subtitle: Text('${_routes[i].distanceKm.toStringAsFixed(1)} km • ${_routes[i].durationMin.toStringAsFixed(0)} min'),
                trailing: i == _selectedIndex ? const Icon(Icons.check_circle, color: Color(0xFF0C5B55)) : null,
              ),
            ),
        ],
      ],
    );
  }
}

class _RouteOption {
  const _RouteOption({required this.points, required this.distanceKm, required this.durationMin});
  final List<LatLng> points;
  final double distanceKm;
  final double durationMin;
}

