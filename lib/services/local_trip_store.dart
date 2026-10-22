import '../models/trip.dart';

class LocalTripStore {
  final List<Trip> _trips = [];

  List<Trip> get trips => List.unmodifiable(_trips);

  void upsertTrip(Trip trip) {
    final index = _trips.indexWhere((t) => t.id == trip.id);
    if (index >= 0) {
      _trips[index] = trip;
    } else {
      _trips.add(trip);
    }
  }

  void addTrip(Trip trip) => _trips.add(trip);

  void removeTrip(String id) => _trips.removeWhere((t) => t.id == id);
}
