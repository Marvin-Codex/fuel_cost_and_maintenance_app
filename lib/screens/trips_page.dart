import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../models/trip.dart';
import '../models/vehicle.dart';
import '../services/access.dart';
import '../services/local_trip_store.dart';

class TripsPage extends StatefulWidget {
  const TripsPage({
    super.key,
    required this.store,
    required this.vehicles,
    required this.access,
    required this.onChanged,
  });

  final LocalTripStore store;
  final List<Vehicle> vehicles;
  final Access access;
  final VoidCallback onChanged;

  @override
  State<TripsPage> createState() => _TripsPageState();
}

class _TripsPageState extends State<TripsPage> {
  bool _tracking = false;
  String? _error;
  final List<Position> _points = [];
  DateTime? _startedAt;
  StreamSubscription<Position>? _subscription;

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  Future<void> _start() async {
    if (!widget.access.canRecordTrip) {
      setState(() => _error = 'Your role cannot record trips.');
      return;
    }
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() => _error = 'Location permission denied.');
        return;
      }
      _points.clear();
      _startedAt = DateTime.now();
      setState(() {
        _tracking = true;
        _error = null;
      });
      _subscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
      ).listen((position) {
        if (_points.isEmpty ||
            Geolocator.distanceBetween(
                  _points.last.latitude,
                  _points.last.longitude,
                  position.latitude,
                  position.longitude,
                ) >
                5) {
          _points.add(position);
        }
      });
    } catch (e) {
      setState(() => _error = 'Could not start tracking: $e');
    }
  }

  Future<void> _stop() async {
    await _subscription?.cancel();
    _subscription = null;
    if (_points.isEmpty || _startedAt == null) {
      setState(() {
        _tracking = false;
        _error = 'No GPS points captured.';
      });
      return;
    }
    double distanceMeters = 0;
    for (int i = 1; i < _points.length; i++) {
      distanceMeters += Geolocator.distanceBetween(
        _points[i - 1].latitude,
        _points[i - 1].longitude,
        _points[i].latitude,
        _points[i].longitude,
      );
    }
    final vehicleId = widget.vehicles.isNotEmpty ? widget.vehicles.first.id : '';
    final trip = Trip(
      id: 'trip-${DateTime.now().millisecondsSinceEpoch}',
      vehicleId: vehicleId,
      startLocation:
          '${_points.first.latitude.toStringAsFixed(6)},${_points.first.longitude.toStringAsFixed(6)}',
      destination:
          '${_points.last.latitude.toStringAsFixed(6)},${_points.last.longitude.toStringAsFixed(6)}',
      startedAt: _startedAt!,
      endedAt: DateTime.now(),
      distanceKm: distanceMeters / 1000.0,
    );
    widget.store.addTrip(trip);
    widget.onChanged();
    setState(() {
      _tracking = false;
      _points.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final trips = widget.store.trips.reversed.toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Trips', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text('Record journeys with GPS and review history.'),
        const SizedBox(height: 12),
        if (_error != null) ...[
          Text(_error!, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 8),
        ],
        FilledButton.icon(
          onPressed: _tracking ? _stop : _start,
          icon: Icon(_tracking ? Icons.stop : Icons.play_arrow),
          label: Text(_tracking ? 'Stop trip' : 'Start trip'),
        ),
        if (_tracking) ...[
          const SizedBox(height: 8),
          Text('Tracking… ${_points.length} points captured'),
        ],
        const SizedBox(height: 16),
        Text('History', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        if (trips.isEmpty)
          const Text('No trips recorded yet.')
        else
          for (final trip in trips)
            Card(
              child: ListTile(
                leading: const Icon(Icons.alt_route),
                title: Text('${trip.startLocation} → ${trip.destination}'),
                subtitle: Text(
                  '${trip.distanceKm.toStringAsFixed(2)} km • '
                  '${(trip.durationSeconds / 60).toStringAsFixed(0)} min',
                ),
              ),
            ),
      ],
    );
  }
}
