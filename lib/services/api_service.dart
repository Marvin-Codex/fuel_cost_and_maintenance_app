import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ApiService {
  ApiService({String? baseUrl}) : _baseUrl = (baseUrl ?? _defaultBaseUrl).replaceAll(RegExp(r'/$'), '');
  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8000',
  );

  final String _baseUrl;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  String? _activeWorkspaceId;

  void setActiveWorkspace(String? id) {
    _activeWorkspaceId = (id == null || id.isEmpty) ? null : id;
  }

  String get baseUrl => _baseUrl;

  Future<String?> getToken() => _storage.read(key: 'access_token');

  Future<void> setToken(String? token) async {
    if (token == null || token.isEmpty) {
      await _storage.delete(key: 'access_token');
    } else {
      await _storage.write(key: 'access_token', value: token);
    }
  }

  Future<Map<String, String>> _headers({bool json = true}) async {
    final headers = <String, String>{};
    if (json) headers['Content-Type'] = 'application/json';
    final token = await getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    if (_activeWorkspaceId != null) {
      headers['X-Workspace'] = _activeWorkspaceId!;
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, String>? query]) {
    final p = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$_baseUrl$p').replace(queryParameters: query);
  }

  Future<Map<String, dynamic>?> login(String username, String password) async {
    final res = await http.post(
      _uri('/api/v1/auth/login/'),
      headers: await _headers(),
      body: jsonEncode({'username': username, 'password': password}),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final access = data['access'] as String?;
      if (access != null) await setToken(access);
      return data;
    }
    return null;
  }

  Future<Map<String, dynamic>?> getAccess() async {
    final res = await http.get(
      _uri('/api/v1/auth/me/access/'),
      headers: await _headers(json: false),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      if (data is List && data.isNotEmpty) {
        return data.first as Map<String, dynamic>;
      }
      if (data is Map<String, dynamic>) {
        if (data['results'] is List && (data['results'] as List).isNotEmpty) {
          return (data['results'] as List).first as Map<String, dynamic>;
        }
        return data;
      }
    }
    return null;
  }

  Future<List<Map<String, dynamic>>> listVehicles() async {
    return _list('/api/v1/vehicles/');
  }

  Future<Map<String, dynamic>?> createVehicle(Map<String, dynamic> body) async {
    return _create('/api/v1/vehicles/', body);
  }

  Future<List<Map<String, dynamic>>> listFuel({String? vehicle}) async {
    final q = vehicle == null ? null : {'vehicle': vehicle};
    return _list('/api/v1/fuel/', q);
  }

  Future<Map<String, dynamic>?> createFuel(Map<String, dynamic> body) async {
    return _create('/api/v1/fuel/', body);
  }

  Future<List<Map<String, dynamic>>> listTrips({String? vehicle}) async {
    return _list('/api/v1/trips/', vehicle == null ? null : {'vehicle': vehicle});
  }

  Future<Map<String, dynamic>?> createTrip(Map<String, dynamic> body) async {
    return _create('/api/v1/trips/', body);
  }

  Future<List<Map<String, dynamic>>> listMaintenance({String? vehicle}) async {
    return _list('/api/v1/maintenance-records/', vehicle == null ? null : {'vehicle': vehicle});
  }

  Future<Map<String, dynamic>?> createMaintenance(Map<String, dynamic> body) async {
    return _create('/api/v1/maintenance-records/', body);
  }

  Future<Map<String, dynamic>?> planRoute(String coordinates,
      {bool alternatives = true}) async {
    final res = await http.get(
      _uri('/api/v1/route/', {
        'coordinates': coordinates,
        'alternatives': alternatives ? 'true' : 'false',
      }),
      headers: await _headers(json: false),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    return null;
  }

  Future<List<Map<String, dynamic>>> _list(String path,
      [Map<String, String>? query]) async {
    final res = await http.get(
      _uri(path, query),
      headers: await _headers(json: false),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      if (data is List) {
        return data.cast<Map<String, dynamic>>();
      }
      if (data is Map<String, dynamic> && data['results'] is List) {
        return (data['results'] as List).cast<Map<String, dynamic>>();
      }
    }
    return const [];
  }

  Future<Map<String, dynamic>?> _create(
      String path, Map<String, dynamic> body) async {
    final res = await http.post(
      _uri(path),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    return null;
  }
}
