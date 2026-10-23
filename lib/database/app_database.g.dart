// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $VehiclesTable extends Vehicles with TableInfo<$VehiclesTable, Vehicle> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $VehiclesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 200),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
      'type', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 50),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _manufacturerMeta =
      const VerificationMeta('manufacturer');
  @override
  late final GeneratedColumn<String> manufacturer = GeneratedColumn<String>(
      'manufacturer', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _modelMeta = const VerificationMeta('model');
  @override
  late final GeneratedColumn<String> model = GeneratedColumn<String>(
      'model', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _yearMeta = const VerificationMeta('year');
  @override
  late final GeneratedColumn<int> year = GeneratedColumn<int>(
      'year', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _engineMeta = const VerificationMeta('engine');
  @override
  late final GeneratedColumn<String> engine = GeneratedColumn<String>(
      'engine', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _fuelTypeMeta =
      const VerificationMeta('fuelType');
  @override
  late final GeneratedColumn<String> fuelType = GeneratedColumn<String>(
      'fuel_type', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 50),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _tankCapacityLitresMeta =
      const VerificationMeta('tankCapacityLitres');
  @override
  late final GeneratedColumn<double> tankCapacityLitres =
      GeneratedColumn<double>('tank_capacity_litres', aliasedName, false,
          type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _referenceConsumptionMeta =
      const VerificationMeta('referenceConsumption');
  @override
  late final GeneratedColumn<double> referenceConsumption =
      GeneratedColumn<double>('reference_consumption', aliasedName, false,
          type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _seatingCapacityMeta =
      const VerificationMeta('seatingCapacity');
  @override
  late final GeneratedColumn<int> seatingCapacity = GeneratedColumn<int>(
      'seating_capacity', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _payloadCapacityKgMeta =
      const VerificationMeta('payloadCapacityKg');
  @override
  late final GeneratedColumn<double> payloadCapacityKg =
      GeneratedColumn<double>('payload_capacity_kg', aliasedName, true,
          type: DriftSqlType.double, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        name,
        type,
        manufacturer,
        model,
        year,
        engine,
        fuelType,
        tankCapacityLitres,
        referenceConsumption,
        seatingCapacity,
        payloadCapacityKg
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'vehicles';
  @override
  VerificationContext validateIntegrity(Insertable<Vehicle> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
          _typeMeta, type.isAcceptableOrUnknown(data['type']!, _typeMeta));
    } else if (isInserting) {
      context.missing(_typeMeta);
    }
    if (data.containsKey('manufacturer')) {
      context.handle(
          _manufacturerMeta,
          manufacturer.isAcceptableOrUnknown(
              data['manufacturer']!, _manufacturerMeta));
    } else if (isInserting) {
      context.missing(_manufacturerMeta);
    }
    if (data.containsKey('model')) {
      context.handle(
          _modelMeta, model.isAcceptableOrUnknown(data['model']!, _modelMeta));
    } else if (isInserting) {
      context.missing(_modelMeta);
    }
    if (data.containsKey('year')) {
      context.handle(
          _yearMeta, year.isAcceptableOrUnknown(data['year']!, _yearMeta));
    } else if (isInserting) {
      context.missing(_yearMeta);
    }
    if (data.containsKey('engine')) {
      context.handle(_engineMeta,
          engine.isAcceptableOrUnknown(data['engine']!, _engineMeta));
    } else if (isInserting) {
      context.missing(_engineMeta);
    }
    if (data.containsKey('fuel_type')) {
      context.handle(_fuelTypeMeta,
          fuelType.isAcceptableOrUnknown(data['fuel_type']!, _fuelTypeMeta));
    } else if (isInserting) {
      context.missing(_fuelTypeMeta);
    }
    if (data.containsKey('tank_capacity_litres')) {
      context.handle(
          _tankCapacityLitresMeta,
          tankCapacityLitres.isAcceptableOrUnknown(
              data['tank_capacity_litres']!, _tankCapacityLitresMeta));
    } else if (isInserting) {
      context.missing(_tankCapacityLitresMeta);
    }
    if (data.containsKey('reference_consumption')) {
      context.handle(
          _referenceConsumptionMeta,
          referenceConsumption.isAcceptableOrUnknown(
              data['reference_consumption']!, _referenceConsumptionMeta));
    } else if (isInserting) {
      context.missing(_referenceConsumptionMeta);
    }
    if (data.containsKey('seating_capacity')) {
      context.handle(
          _seatingCapacityMeta,
          seatingCapacity.isAcceptableOrUnknown(
              data['seating_capacity']!, _seatingCapacityMeta));
    }
    if (data.containsKey('payload_capacity_kg')) {
      context.handle(
          _payloadCapacityKgMeta,
          payloadCapacityKg.isAcceptableOrUnknown(
              data['payload_capacity_kg']!, _payloadCapacityKgMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Vehicle map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Vehicle(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      type: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}type'])!,
      manufacturer: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}manufacturer'])!,
      model: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}model'])!,
      year: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}year'])!,
      engine: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}engine'])!,
      fuelType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}fuel_type'])!,
      tankCapacityLitres: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}tank_capacity_litres'])!,
      referenceConsumption: attachedDatabase.typeMapping.read(
          DriftSqlType.double,
          data['${effectivePrefix}reference_consumption'])!,
      seatingCapacity: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}seating_capacity']),
      payloadCapacityKg: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}payload_capacity_kg']),
    );
  }

  @override
  $VehiclesTable createAlias(String alias) {
    return $VehiclesTable(attachedDatabase, alias);
  }
}

class Vehicle extends DataClass implements Insertable<Vehicle> {
  final String id;
  final String name;
  final String type;
  final String manufacturer;
  final String model;
  final int year;
  final String engine;
  final String fuelType;
  final double tankCapacityLitres;
  final double referenceConsumption;
  final int? seatingCapacity;
  final double? payloadCapacityKg;
  const Vehicle(
      {required this.id,
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
      this.payloadCapacityKg});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['type'] = Variable<String>(type);
    map['manufacturer'] = Variable<String>(manufacturer);
    map['model'] = Variable<String>(model);
    map['year'] = Variable<int>(year);
    map['engine'] = Variable<String>(engine);
    map['fuel_type'] = Variable<String>(fuelType);
    map['tank_capacity_litres'] = Variable<double>(tankCapacityLitres);
    map['reference_consumption'] = Variable<double>(referenceConsumption);
    if (!nullToAbsent || seatingCapacity != null) {
      map['seating_capacity'] = Variable<int>(seatingCapacity);
    }
    if (!nullToAbsent || payloadCapacityKg != null) {
      map['payload_capacity_kg'] = Variable<double>(payloadCapacityKg);
    }
    return map;
  }

  VehiclesCompanion toCompanion(bool nullToAbsent) {
    return VehiclesCompanion(
      id: Value(id),
      name: Value(name),
      type: Value(type),
      manufacturer: Value(manufacturer),
      model: Value(model),
      year: Value(year),
      engine: Value(engine),
      fuelType: Value(fuelType),
      tankCapacityLitres: Value(tankCapacityLitres),
      referenceConsumption: Value(referenceConsumption),
      seatingCapacity: seatingCapacity == null && nullToAbsent
          ? const Value.absent()
          : Value(seatingCapacity),
      payloadCapacityKg: payloadCapacityKg == null && nullToAbsent
          ? const Value.absent()
          : Value(payloadCapacityKg),
    );
  }

  factory Vehicle.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Vehicle(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      type: serializer.fromJson<String>(json['type']),
      manufacturer: serializer.fromJson<String>(json['manufacturer']),
      model: serializer.fromJson<String>(json['model']),
      year: serializer.fromJson<int>(json['year']),
      engine: serializer.fromJson<String>(json['engine']),
      fuelType: serializer.fromJson<String>(json['fuelType']),
      tankCapacityLitres:
          serializer.fromJson<double>(json['tankCapacityLitres']),
      referenceConsumption:
          serializer.fromJson<double>(json['referenceConsumption']),
      seatingCapacity: serializer.fromJson<int?>(json['seatingCapacity']),
      payloadCapacityKg:
          serializer.fromJson<double?>(json['payloadCapacityKg']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'type': serializer.toJson<String>(type),
      'manufacturer': serializer.toJson<String>(manufacturer),
      'model': serializer.toJson<String>(model),
      'year': serializer.toJson<int>(year),
      'engine': serializer.toJson<String>(engine),
      'fuelType': serializer.toJson<String>(fuelType),
      'tankCapacityLitres': serializer.toJson<double>(tankCapacityLitres),
      'referenceConsumption': serializer.toJson<double>(referenceConsumption),
      'seatingCapacity': serializer.toJson<int?>(seatingCapacity),
      'payloadCapacityKg': serializer.toJson<double?>(payloadCapacityKg),
    };
  }

  Vehicle copyWith(
          {String? id,
          String? name,
          String? type,
          String? manufacturer,
          String? model,
          int? year,
          String? engine,
          String? fuelType,
          double? tankCapacityLitres,
          double? referenceConsumption,
          Value<int?> seatingCapacity = const Value.absent(),
          Value<double?> payloadCapacityKg = const Value.absent()}) =>
      Vehicle(
        id: id ?? this.id,
        name: name ?? this.name,
        type: type ?? this.type,
        manufacturer: manufacturer ?? this.manufacturer,
        model: model ?? this.model,
        year: year ?? this.year,
        engine: engine ?? this.engine,
        fuelType: fuelType ?? this.fuelType,
        tankCapacityLitres: tankCapacityLitres ?? this.tankCapacityLitres,
        referenceConsumption: referenceConsumption ?? this.referenceConsumption,
        seatingCapacity: seatingCapacity.present
            ? seatingCapacity.value
            : this.seatingCapacity,
        payloadCapacityKg: payloadCapacityKg.present
            ? payloadCapacityKg.value
            : this.payloadCapacityKg,
      );
  Vehicle copyWithCompanion(VehiclesCompanion data) {
    return Vehicle(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      type: data.type.present ? data.type.value : this.type,
      manufacturer: data.manufacturer.present
          ? data.manufacturer.value
          : this.manufacturer,
      model: data.model.present ? data.model.value : this.model,
      year: data.year.present ? data.year.value : this.year,
      engine: data.engine.present ? data.engine.value : this.engine,
      fuelType: data.fuelType.present ? data.fuelType.value : this.fuelType,
      tankCapacityLitres: data.tankCapacityLitres.present
          ? data.tankCapacityLitres.value
          : this.tankCapacityLitres,
      referenceConsumption: data.referenceConsumption.present
          ? data.referenceConsumption.value
          : this.referenceConsumption,
      seatingCapacity: data.seatingCapacity.present
          ? data.seatingCapacity.value
          : this.seatingCapacity,
      payloadCapacityKg: data.payloadCapacityKg.present
          ? data.payloadCapacityKg.value
          : this.payloadCapacityKg,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Vehicle(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('manufacturer: $manufacturer, ')
          ..write('model: $model, ')
          ..write('year: $year, ')
          ..write('engine: $engine, ')
          ..write('fuelType: $fuelType, ')
          ..write('tankCapacityLitres: $tankCapacityLitres, ')
          ..write('referenceConsumption: $referenceConsumption, ')
          ..write('seatingCapacity: $seatingCapacity, ')
          ..write('payloadCapacityKg: $payloadCapacityKg')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      name,
      type,
      manufacturer,
      model,
      year,
      engine,
      fuelType,
      tankCapacityLitres,
      referenceConsumption,
      seatingCapacity,
      payloadCapacityKg);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Vehicle &&
          other.id == this.id &&
          other.name == this.name &&
          other.type == this.type &&
          other.manufacturer == this.manufacturer &&
          other.model == this.model &&
          other.year == this.year &&
          other.engine == this.engine &&
          other.fuelType == this.fuelType &&
          other.tankCapacityLitres == this.tankCapacityLitres &&
          other.referenceConsumption == this.referenceConsumption &&
          other.seatingCapacity == this.seatingCapacity &&
          other.payloadCapacityKg == this.payloadCapacityKg);
}

class VehiclesCompanion extends UpdateCompanion<Vehicle> {
  final Value<String> id;
  final Value<String> name;
  final Value<String> type;
  final Value<String> manufacturer;
  final Value<String> model;
  final Value<int> year;
  final Value<String> engine;
  final Value<String> fuelType;
  final Value<double> tankCapacityLitres;
  final Value<double> referenceConsumption;
  final Value<int?> seatingCapacity;
  final Value<double?> payloadCapacityKg;
  final Value<int> rowid;
  const VehiclesCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.type = const Value.absent(),
    this.manufacturer = const Value.absent(),
    this.model = const Value.absent(),
    this.year = const Value.absent(),
    this.engine = const Value.absent(),
    this.fuelType = const Value.absent(),
    this.tankCapacityLitres = const Value.absent(),
    this.referenceConsumption = const Value.absent(),
    this.seatingCapacity = const Value.absent(),
    this.payloadCapacityKg = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  VehiclesCompanion.insert({
    required String id,
    required String name,
    required String type,
    required String manufacturer,
    required String model,
    required int year,
    required String engine,
    required String fuelType,
    required double tankCapacityLitres,
    required double referenceConsumption,
    this.seatingCapacity = const Value.absent(),
    this.payloadCapacityKg = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        name = Value(name),
        type = Value(type),
        manufacturer = Value(manufacturer),
        model = Value(model),
        year = Value(year),
        engine = Value(engine),
        fuelType = Value(fuelType),
        tankCapacityLitres = Value(tankCapacityLitres),
        referenceConsumption = Value(referenceConsumption);
  static Insertable<Vehicle> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? type,
    Expression<String>? manufacturer,
    Expression<String>? model,
    Expression<int>? year,
    Expression<String>? engine,
    Expression<String>? fuelType,
    Expression<double>? tankCapacityLitres,
    Expression<double>? referenceConsumption,
    Expression<int>? seatingCapacity,
    Expression<double>? payloadCapacityKg,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      if (manufacturer != null) 'manufacturer': manufacturer,
      if (model != null) 'model': model,
      if (year != null) 'year': year,
      if (engine != null) 'engine': engine,
      if (fuelType != null) 'fuel_type': fuelType,
      if (tankCapacityLitres != null)
        'tank_capacity_litres': tankCapacityLitres,
      if (referenceConsumption != null)
        'reference_consumption': referenceConsumption,
      if (seatingCapacity != null) 'seating_capacity': seatingCapacity,
      if (payloadCapacityKg != null) 'payload_capacity_kg': payloadCapacityKg,
      if (rowid != null) 'rowid': rowid,
    });
  }

  VehiclesCompanion copyWith(
      {Value<String>? id,
      Value<String>? name,
      Value<String>? type,
      Value<String>? manufacturer,
      Value<String>? model,
      Value<int>? year,
      Value<String>? engine,
      Value<String>? fuelType,
      Value<double>? tankCapacityLitres,
      Value<double>? referenceConsumption,
      Value<int?>? seatingCapacity,
      Value<double?>? payloadCapacityKg,
      Value<int>? rowid}) {
    return VehiclesCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      manufacturer: manufacturer ?? this.manufacturer,
      model: model ?? this.model,
      year: year ?? this.year,
      engine: engine ?? this.engine,
      fuelType: fuelType ?? this.fuelType,
      tankCapacityLitres: tankCapacityLitres ?? this.tankCapacityLitres,
      referenceConsumption: referenceConsumption ?? this.referenceConsumption,
      seatingCapacity: seatingCapacity ?? this.seatingCapacity,
      payloadCapacityKg: payloadCapacityKg ?? this.payloadCapacityKg,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (manufacturer.present) {
      map['manufacturer'] = Variable<String>(manufacturer.value);
    }
    if (model.present) {
      map['model'] = Variable<String>(model.value);
    }
    if (year.present) {
      map['year'] = Variable<int>(year.value);
    }
    if (engine.present) {
      map['engine'] = Variable<String>(engine.value);
    }
    if (fuelType.present) {
      map['fuel_type'] = Variable<String>(fuelType.value);
    }
    if (tankCapacityLitres.present) {
      map['tank_capacity_litres'] = Variable<double>(tankCapacityLitres.value);
    }
    if (referenceConsumption.present) {
      map['reference_consumption'] =
          Variable<double>(referenceConsumption.value);
    }
    if (seatingCapacity.present) {
      map['seating_capacity'] = Variable<int>(seatingCapacity.value);
    }
    if (payloadCapacityKg.present) {
      map['payload_capacity_kg'] = Variable<double>(payloadCapacityKg.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('VehiclesCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('manufacturer: $manufacturer, ')
          ..write('model: $model, ')
          ..write('year: $year, ')
          ..write('engine: $engine, ')
          ..write('fuelType: $fuelType, ')
          ..write('tankCapacityLitres: $tankCapacityLitres, ')
          ..write('referenceConsumption: $referenceConsumption, ')
          ..write('seatingCapacity: $seatingCapacity, ')
          ..write('payloadCapacityKg: $payloadCapacityKg, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FuelRecordsTable extends FuelRecords
    with TableInfo<$FuelRecordsTable, FuelRecord> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FuelRecordsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _vehicleIdMeta =
      const VerificationMeta('vehicleId');
  @override
  late final GeneratedColumn<String> vehicleId = GeneratedColumn<String>(
      'vehicle_id', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('REFERENCES vehicles (id)'));
  static const VerificationMeta _litresMeta = const VerificationMeta('litres');
  @override
  late final GeneratedColumn<double> litres = GeneratedColumn<double>(
      'litres', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _costMeta = const VerificationMeta('cost');
  @override
  late final GeneratedColumn<double> cost = GeneratedColumn<double>(
      'cost', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _odometerMeta =
      const VerificationMeta('odometer');
  @override
  late final GeneratedColumn<double> odometer = GeneratedColumn<double>(
      'odometer', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _filledAtMeta =
      const VerificationMeta('filledAt');
  @override
  late final GeneratedColumn<DateTime> filledAt = GeneratedColumn<DateTime>(
      'filled_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns =>
      [id, vehicleId, litres, cost, odometer, filledAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'fuel_records';
  @override
  VerificationContext validateIntegrity(Insertable<FuelRecord> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('vehicle_id')) {
      context.handle(_vehicleIdMeta,
          vehicleId.isAcceptableOrUnknown(data['vehicle_id']!, _vehicleIdMeta));
    } else if (isInserting) {
      context.missing(_vehicleIdMeta);
    }
    if (data.containsKey('litres')) {
      context.handle(_litresMeta,
          litres.isAcceptableOrUnknown(data['litres']!, _litresMeta));
    } else if (isInserting) {
      context.missing(_litresMeta);
    }
    if (data.containsKey('cost')) {
      context.handle(
          _costMeta, cost.isAcceptableOrUnknown(data['cost']!, _costMeta));
    } else if (isInserting) {
      context.missing(_costMeta);
    }
    if (data.containsKey('odometer')) {
      context.handle(_odometerMeta,
          odometer.isAcceptableOrUnknown(data['odometer']!, _odometerMeta));
    } else if (isInserting) {
      context.missing(_odometerMeta);
    }
    if (data.containsKey('filled_at')) {
      context.handle(_filledAtMeta,
          filledAt.isAcceptableOrUnknown(data['filled_at']!, _filledAtMeta));
    } else if (isInserting) {
      context.missing(_filledAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  FuelRecord map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FuelRecord(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      vehicleId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}vehicle_id'])!,
      litres: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}litres'])!,
      cost: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}cost'])!,
      odometer: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}odometer'])!,
      filledAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}filled_at'])!,
    );
  }

  @override
  $FuelRecordsTable createAlias(String alias) {
    return $FuelRecordsTable(attachedDatabase, alias);
  }
}

class FuelRecord extends DataClass implements Insertable<FuelRecord> {
  final String id;
  final String vehicleId;
  final double litres;
  final double cost;
  final double odometer;
  final DateTime filledAt;
  const FuelRecord(
      {required this.id,
      required this.vehicleId,
      required this.litres,
      required this.cost,
      required this.odometer,
      required this.filledAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['vehicle_id'] = Variable<String>(vehicleId);
    map['litres'] = Variable<double>(litres);
    map['cost'] = Variable<double>(cost);
    map['odometer'] = Variable<double>(odometer);
    map['filled_at'] = Variable<DateTime>(filledAt);
    return map;
  }

  FuelRecordsCompanion toCompanion(bool nullToAbsent) {
    return FuelRecordsCompanion(
      id: Value(id),
      vehicleId: Value(vehicleId),
      litres: Value(litres),
      cost: Value(cost),
      odometer: Value(odometer),
      filledAt: Value(filledAt),
    );
  }

  factory FuelRecord.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FuelRecord(
      id: serializer.fromJson<String>(json['id']),
      vehicleId: serializer.fromJson<String>(json['vehicleId']),
      litres: serializer.fromJson<double>(json['litres']),
      cost: serializer.fromJson<double>(json['cost']),
      odometer: serializer.fromJson<double>(json['odometer']),
      filledAt: serializer.fromJson<DateTime>(json['filledAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'vehicleId': serializer.toJson<String>(vehicleId),
      'litres': serializer.toJson<double>(litres),
      'cost': serializer.toJson<double>(cost),
      'odometer': serializer.toJson<double>(odometer),
      'filledAt': serializer.toJson<DateTime>(filledAt),
    };
  }

  FuelRecord copyWith(
          {String? id,
          String? vehicleId,
          double? litres,
          double? cost,
          double? odometer,
          DateTime? filledAt}) =>
      FuelRecord(
        id: id ?? this.id,
        vehicleId: vehicleId ?? this.vehicleId,
        litres: litres ?? this.litres,
        cost: cost ?? this.cost,
        odometer: odometer ?? this.odometer,
        filledAt: filledAt ?? this.filledAt,
      );
  FuelRecord copyWithCompanion(FuelRecordsCompanion data) {
    return FuelRecord(
      id: data.id.present ? data.id.value : this.id,
      vehicleId: data.vehicleId.present ? data.vehicleId.value : this.vehicleId,
      litres: data.litres.present ? data.litres.value : this.litres,
      cost: data.cost.present ? data.cost.value : this.cost,
      odometer: data.odometer.present ? data.odometer.value : this.odometer,
      filledAt: data.filledAt.present ? data.filledAt.value : this.filledAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FuelRecord(')
          ..write('id: $id, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('litres: $litres, ')
          ..write('cost: $cost, ')
          ..write('odometer: $odometer, ')
          ..write('filledAt: $filledAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, vehicleId, litres, cost, odometer, filledAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FuelRecord &&
          other.id == this.id &&
          other.vehicleId == this.vehicleId &&
          other.litres == this.litres &&
          other.cost == this.cost &&
          other.odometer == this.odometer &&
          other.filledAt == this.filledAt);
}

class FuelRecordsCompanion extends UpdateCompanion<FuelRecord> {
  final Value<String> id;
  final Value<String> vehicleId;
  final Value<double> litres;
  final Value<double> cost;
  final Value<double> odometer;
  final Value<DateTime> filledAt;
  final Value<int> rowid;
  const FuelRecordsCompanion({
    this.id = const Value.absent(),
    this.vehicleId = const Value.absent(),
    this.litres = const Value.absent(),
    this.cost = const Value.absent(),
    this.odometer = const Value.absent(),
    this.filledAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FuelRecordsCompanion.insert({
    required String id,
    required String vehicleId,
    required double litres,
    required double cost,
    required double odometer,
    required DateTime filledAt,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        vehicleId = Value(vehicleId),
        litres = Value(litres),
        cost = Value(cost),
        odometer = Value(odometer),
        filledAt = Value(filledAt);
  static Insertable<FuelRecord> custom({
    Expression<String>? id,
    Expression<String>? vehicleId,
    Expression<double>? litres,
    Expression<double>? cost,
    Expression<double>? odometer,
    Expression<DateTime>? filledAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (vehicleId != null) 'vehicle_id': vehicleId,
      if (litres != null) 'litres': litres,
      if (cost != null) 'cost': cost,
      if (odometer != null) 'odometer': odometer,
      if (filledAt != null) 'filled_at': filledAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FuelRecordsCompanion copyWith(
      {Value<String>? id,
      Value<String>? vehicleId,
      Value<double>? litres,
      Value<double>? cost,
      Value<double>? odometer,
      Value<DateTime>? filledAt,
      Value<int>? rowid}) {
    return FuelRecordsCompanion(
      id: id ?? this.id,
      vehicleId: vehicleId ?? this.vehicleId,
      litres: litres ?? this.litres,
      cost: cost ?? this.cost,
      odometer: odometer ?? this.odometer,
      filledAt: filledAt ?? this.filledAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (vehicleId.present) {
      map['vehicle_id'] = Variable<String>(vehicleId.value);
    }
    if (litres.present) {
      map['litres'] = Variable<double>(litres.value);
    }
    if (cost.present) {
      map['cost'] = Variable<double>(cost.value);
    }
    if (odometer.present) {
      map['odometer'] = Variable<double>(odometer.value);
    }
    if (filledAt.present) {
      map['filled_at'] = Variable<DateTime>(filledAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FuelRecordsCompanion(')
          ..write('id: $id, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('litres: $litres, ')
          ..write('cost: $cost, ')
          ..write('odometer: $odometer, ')
          ..write('filledAt: $filledAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $TripsTable extends Trips with TableInfo<$TripsTable, Trip> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TripsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _vehicleIdMeta =
      const VerificationMeta('vehicleId');
  @override
  late final GeneratedColumn<String> vehicleId = GeneratedColumn<String>(
      'vehicle_id', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('REFERENCES vehicles (id)'));
  static const VerificationMeta _startLocationMeta =
      const VerificationMeta('startLocation');
  @override
  late final GeneratedColumn<String> startLocation = GeneratedColumn<String>(
      'start_location', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 200),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _destinationMeta =
      const VerificationMeta('destination');
  @override
  late final GeneratedColumn<String> destination = GeneratedColumn<String>(
      'destination', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 200),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _startedAtMeta =
      const VerificationMeta('startedAt');
  @override
  late final GeneratedColumn<DateTime> startedAt = GeneratedColumn<DateTime>(
      'started_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _endedAtMeta =
      const VerificationMeta('endedAt');
  @override
  late final GeneratedColumn<DateTime> endedAt = GeneratedColumn<DateTime>(
      'ended_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _distanceKmMeta =
      const VerificationMeta('distanceKm');
  @override
  late final GeneratedColumn<double> distanceKm = GeneratedColumn<double>(
      'distance_km', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _startOdometerKmMeta =
      const VerificationMeta('startOdometerKm');
  @override
  late final GeneratedColumn<int> startOdometerKm = GeneratedColumn<int>(
      'start_odometer_km', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _endOdometerKmMeta =
      const VerificationMeta('endOdometerKm');
  @override
  late final GeneratedColumn<int> endOdometerKm = GeneratedColumn<int>(
      'end_odometer_km', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _fuelConsumedLitersMeta =
      const VerificationMeta('fuelConsumedLiters');
  @override
  late final GeneratedColumn<double> fuelConsumedLiters =
      GeneratedColumn<double>('fuel_consumed_liters', aliasedName, true,
          type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _fuelPricePerLiterMeta =
      const VerificationMeta('fuelPricePerLiter');
  @override
  late final GeneratedColumn<double> fuelPricePerLiter =
      GeneratedColumn<double>('fuel_price_per_liter', aliasedName, true,
          type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _clientIdMeta =
      const VerificationMeta('clientId');
  @override
  late final GeneratedColumn<String> clientId = GeneratedColumn<String>(
      'client_id', aliasedName, true,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 0, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        vehicleId,
        startLocation,
        destination,
        startedAt,
        endedAt,
        distanceKm,
        startOdometerKm,
        endOdometerKm,
        fuelConsumedLiters,
        fuelPricePerLiter,
        notes,
        clientId
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'trips';
  @override
  VerificationContext validateIntegrity(Insertable<Trip> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('vehicle_id')) {
      context.handle(_vehicleIdMeta,
          vehicleId.isAcceptableOrUnknown(data['vehicle_id']!, _vehicleIdMeta));
    } else if (isInserting) {
      context.missing(_vehicleIdMeta);
    }
    if (data.containsKey('start_location')) {
      context.handle(
          _startLocationMeta,
          startLocation.isAcceptableOrUnknown(
              data['start_location']!, _startLocationMeta));
    } else if (isInserting) {
      context.missing(_startLocationMeta);
    }
    if (data.containsKey('destination')) {
      context.handle(
          _destinationMeta,
          destination.isAcceptableOrUnknown(
              data['destination']!, _destinationMeta));
    } else if (isInserting) {
      context.missing(_destinationMeta);
    }
    if (data.containsKey('started_at')) {
      context.handle(_startedAtMeta,
          startedAt.isAcceptableOrUnknown(data['started_at']!, _startedAtMeta));
    } else if (isInserting) {
      context.missing(_startedAtMeta);
    }
    if (data.containsKey('ended_at')) {
      context.handle(_endedAtMeta,
          endedAt.isAcceptableOrUnknown(data['ended_at']!, _endedAtMeta));
    } else if (isInserting) {
      context.missing(_endedAtMeta);
    }
    if (data.containsKey('distance_km')) {
      context.handle(
          _distanceKmMeta,
          distanceKm.isAcceptableOrUnknown(
              data['distance_km']!, _distanceKmMeta));
    } else if (isInserting) {
      context.missing(_distanceKmMeta);
    }
    if (data.containsKey('start_odometer_km')) {
      context.handle(
          _startOdometerKmMeta,
          startOdometerKm.isAcceptableOrUnknown(
              data['start_odometer_km']!, _startOdometerKmMeta));
    }
    if (data.containsKey('end_odometer_km')) {
      context.handle(
          _endOdometerKmMeta,
          endOdometerKm.isAcceptableOrUnknown(
              data['end_odometer_km']!, _endOdometerKmMeta));
    }
    if (data.containsKey('fuel_consumed_liters')) {
      context.handle(
          _fuelConsumedLitersMeta,
          fuelConsumedLiters.isAcceptableOrUnknown(
              data['fuel_consumed_liters']!, _fuelConsumedLitersMeta));
    }
    if (data.containsKey('fuel_price_per_liter')) {
      context.handle(
          _fuelPricePerLiterMeta,
          fuelPricePerLiter.isAcceptableOrUnknown(
              data['fuel_price_per_liter']!, _fuelPricePerLiterMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('client_id')) {
      context.handle(_clientIdMeta,
          clientId.isAcceptableOrUnknown(data['client_id']!, _clientIdMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Trip map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Trip(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      vehicleId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}vehicle_id'])!,
      startLocation: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}start_location'])!,
      destination: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}destination'])!,
      startedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}started_at'])!,
      endedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}ended_at'])!,
      distanceKm: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}distance_km'])!,
      startOdometerKm: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}start_odometer_km']),
      endOdometerKm: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}end_odometer_km']),
      fuelConsumedLiters: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}fuel_consumed_liters']),
      fuelPricePerLiter: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}fuel_price_per_liter']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes'])!,
      clientId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}client_id']),
    );
  }

  @override
  $TripsTable createAlias(String alias) {
    return $TripsTable(attachedDatabase, alias);
  }
}

class Trip extends DataClass implements Insertable<Trip> {
  final String id;
  final String vehicleId;
  final String startLocation;
  final String destination;
  final DateTime startedAt;
  final DateTime endedAt;
  final double distanceKm;
  final int? startOdometerKm;
  final int? endOdometerKm;
  final double? fuelConsumedLiters;
  final double? fuelPricePerLiter;
  final String notes;
  final String? clientId;
  const Trip(
      {required this.id,
      required this.vehicleId,
      required this.startLocation,
      required this.destination,
      required this.startedAt,
      required this.endedAt,
      required this.distanceKm,
      this.startOdometerKm,
      this.endOdometerKm,
      this.fuelConsumedLiters,
      this.fuelPricePerLiter,
      required this.notes,
      this.clientId});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['vehicle_id'] = Variable<String>(vehicleId);
    map['start_location'] = Variable<String>(startLocation);
    map['destination'] = Variable<String>(destination);
    map['started_at'] = Variable<DateTime>(startedAt);
    map['ended_at'] = Variable<DateTime>(endedAt);
    map['distance_km'] = Variable<double>(distanceKm);
    if (!nullToAbsent || startOdometerKm != null) {
      map['start_odometer_km'] = Variable<int>(startOdometerKm);
    }
    if (!nullToAbsent || endOdometerKm != null) {
      map['end_odometer_km'] = Variable<int>(endOdometerKm);
    }
    if (!nullToAbsent || fuelConsumedLiters != null) {
      map['fuel_consumed_liters'] = Variable<double>(fuelConsumedLiters);
    }
    if (!nullToAbsent || fuelPricePerLiter != null) {
      map['fuel_price_per_liter'] = Variable<double>(fuelPricePerLiter);
    }
    map['notes'] = Variable<String>(notes);
    if (!nullToAbsent || clientId != null) {
      map['client_id'] = Variable<String>(clientId);
    }
    return map;
  }

  TripsCompanion toCompanion(bool nullToAbsent) {
    return TripsCompanion(
      id: Value(id),
      vehicleId: Value(vehicleId),
      startLocation: Value(startLocation),
      destination: Value(destination),
      startedAt: Value(startedAt),
      endedAt: Value(endedAt),
      distanceKm: Value(distanceKm),
      startOdometerKm: startOdometerKm == null && nullToAbsent
          ? const Value.absent()
          : Value(startOdometerKm),
      endOdometerKm: endOdometerKm == null && nullToAbsent
          ? const Value.absent()
          : Value(endOdometerKm),
      fuelConsumedLiters: fuelConsumedLiters == null && nullToAbsent
          ? const Value.absent()
          : Value(fuelConsumedLiters),
      fuelPricePerLiter: fuelPricePerLiter == null && nullToAbsent
          ? const Value.absent()
          : Value(fuelPricePerLiter),
      notes: Value(notes),
      clientId: clientId == null && nullToAbsent
          ? const Value.absent()
          : Value(clientId),
    );
  }

  factory Trip.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Trip(
      id: serializer.fromJson<String>(json['id']),
      vehicleId: serializer.fromJson<String>(json['vehicleId']),
      startLocation: serializer.fromJson<String>(json['startLocation']),
      destination: serializer.fromJson<String>(json['destination']),
      startedAt: serializer.fromJson<DateTime>(json['startedAt']),
      endedAt: serializer.fromJson<DateTime>(json['endedAt']),
      distanceKm: serializer.fromJson<double>(json['distanceKm']),
      startOdometerKm: serializer.fromJson<int?>(json['startOdometerKm']),
      endOdometerKm: serializer.fromJson<int?>(json['endOdometerKm']),
      fuelConsumedLiters:
          serializer.fromJson<double?>(json['fuelConsumedLiters']),
      fuelPricePerLiter:
          serializer.fromJson<double?>(json['fuelPricePerLiter']),
      notes: serializer.fromJson<String>(json['notes']),
      clientId: serializer.fromJson<String?>(json['clientId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'vehicleId': serializer.toJson<String>(vehicleId),
      'startLocation': serializer.toJson<String>(startLocation),
      'destination': serializer.toJson<String>(destination),
      'startedAt': serializer.toJson<DateTime>(startedAt),
      'endedAt': serializer.toJson<DateTime>(endedAt),
      'distanceKm': serializer.toJson<double>(distanceKm),
      'startOdometerKm': serializer.toJson<int?>(startOdometerKm),
      'endOdometerKm': serializer.toJson<int?>(endOdometerKm),
      'fuelConsumedLiters': serializer.toJson<double?>(fuelConsumedLiters),
      'fuelPricePerLiter': serializer.toJson<double?>(fuelPricePerLiter),
      'notes': serializer.toJson<String>(notes),
      'clientId': serializer.toJson<String?>(clientId),
    };
  }

  Trip copyWith(
          {String? id,
          String? vehicleId,
          String? startLocation,
          String? destination,
          DateTime? startedAt,
          DateTime? endedAt,
          double? distanceKm,
          Value<int?> startOdometerKm = const Value.absent(),
          Value<int?> endOdometerKm = const Value.absent(),
          Value<double?> fuelConsumedLiters = const Value.absent(),
          Value<double?> fuelPricePerLiter = const Value.absent(),
          String? notes,
          Value<String?> clientId = const Value.absent()}) =>
      Trip(
        id: id ?? this.id,
        vehicleId: vehicleId ?? this.vehicleId,
        startLocation: startLocation ?? this.startLocation,
        destination: destination ?? this.destination,
        startedAt: startedAt ?? this.startedAt,
        endedAt: endedAt ?? this.endedAt,
        distanceKm: distanceKm ?? this.distanceKm,
        startOdometerKm: startOdometerKm.present
            ? startOdometerKm.value
            : this.startOdometerKm,
        endOdometerKm:
            endOdometerKm.present ? endOdometerKm.value : this.endOdometerKm,
        fuelConsumedLiters: fuelConsumedLiters.present
            ? fuelConsumedLiters.value
            : this.fuelConsumedLiters,
        fuelPricePerLiter: fuelPricePerLiter.present
            ? fuelPricePerLiter.value
            : this.fuelPricePerLiter,
        notes: notes ?? this.notes,
        clientId: clientId.present ? clientId.value : this.clientId,
      );
  Trip copyWithCompanion(TripsCompanion data) {
    return Trip(
      id: data.id.present ? data.id.value : this.id,
      vehicleId: data.vehicleId.present ? data.vehicleId.value : this.vehicleId,
      startLocation: data.startLocation.present
          ? data.startLocation.value
          : this.startLocation,
      destination:
          data.destination.present ? data.destination.value : this.destination,
      startedAt: data.startedAt.present ? data.startedAt.value : this.startedAt,
      endedAt: data.endedAt.present ? data.endedAt.value : this.endedAt,
      distanceKm:
          data.distanceKm.present ? data.distanceKm.value : this.distanceKm,
      startOdometerKm: data.startOdometerKm.present
          ? data.startOdometerKm.value
          : this.startOdometerKm,
      endOdometerKm: data.endOdometerKm.present
          ? data.endOdometerKm.value
          : this.endOdometerKm,
      fuelConsumedLiters: data.fuelConsumedLiters.present
          ? data.fuelConsumedLiters.value
          : this.fuelConsumedLiters,
      fuelPricePerLiter: data.fuelPricePerLiter.present
          ? data.fuelPricePerLiter.value
          : this.fuelPricePerLiter,
      notes: data.notes.present ? data.notes.value : this.notes,
      clientId: data.clientId.present ? data.clientId.value : this.clientId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Trip(')
          ..write('id: $id, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('startLocation: $startLocation, ')
          ..write('destination: $destination, ')
          ..write('startedAt: $startedAt, ')
          ..write('endedAt: $endedAt, ')
          ..write('distanceKm: $distanceKm, ')
          ..write('startOdometerKm: $startOdometerKm, ')
          ..write('endOdometerKm: $endOdometerKm, ')
          ..write('fuelConsumedLiters: $fuelConsumedLiters, ')
          ..write('fuelPricePerLiter: $fuelPricePerLiter, ')
          ..write('notes: $notes, ')
          ..write('clientId: $clientId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      vehicleId,
      startLocation,
      destination,
      startedAt,
      endedAt,
      distanceKm,
      startOdometerKm,
      endOdometerKm,
      fuelConsumedLiters,
      fuelPricePerLiter,
      notes,
      clientId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Trip &&
          other.id == this.id &&
          other.vehicleId == this.vehicleId &&
          other.startLocation == this.startLocation &&
          other.destination == this.destination &&
          other.startedAt == this.startedAt &&
          other.endedAt == this.endedAt &&
          other.distanceKm == this.distanceKm &&
          other.startOdometerKm == this.startOdometerKm &&
          other.endOdometerKm == this.endOdometerKm &&
          other.fuelConsumedLiters == this.fuelConsumedLiters &&
          other.fuelPricePerLiter == this.fuelPricePerLiter &&
          other.notes == this.notes &&
          other.clientId == this.clientId);
}

class TripsCompanion extends UpdateCompanion<Trip> {
  final Value<String> id;
  final Value<String> vehicleId;
  final Value<String> startLocation;
  final Value<String> destination;
  final Value<DateTime> startedAt;
  final Value<DateTime> endedAt;
  final Value<double> distanceKm;
  final Value<int?> startOdometerKm;
  final Value<int?> endOdometerKm;
  final Value<double?> fuelConsumedLiters;
  final Value<double?> fuelPricePerLiter;
  final Value<String> notes;
  final Value<String?> clientId;
  final Value<int> rowid;
  const TripsCompanion({
    this.id = const Value.absent(),
    this.vehicleId = const Value.absent(),
    this.startLocation = const Value.absent(),
    this.destination = const Value.absent(),
    this.startedAt = const Value.absent(),
    this.endedAt = const Value.absent(),
    this.distanceKm = const Value.absent(),
    this.startOdometerKm = const Value.absent(),
    this.endOdometerKm = const Value.absent(),
    this.fuelConsumedLiters = const Value.absent(),
    this.fuelPricePerLiter = const Value.absent(),
    this.notes = const Value.absent(),
    this.clientId = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TripsCompanion.insert({
    required String id,
    required String vehicleId,
    required String startLocation,
    required String destination,
    required DateTime startedAt,
    required DateTime endedAt,
    required double distanceKm,
    this.startOdometerKm = const Value.absent(),
    this.endOdometerKm = const Value.absent(),
    this.fuelConsumedLiters = const Value.absent(),
    this.fuelPricePerLiter = const Value.absent(),
    this.notes = const Value.absent(),
    this.clientId = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        vehicleId = Value(vehicleId),
        startLocation = Value(startLocation),
        destination = Value(destination),
        startedAt = Value(startedAt),
        endedAt = Value(endedAt),
        distanceKm = Value(distanceKm);
  static Insertable<Trip> custom({
    Expression<String>? id,
    Expression<String>? vehicleId,
    Expression<String>? startLocation,
    Expression<String>? destination,
    Expression<DateTime>? startedAt,
    Expression<DateTime>? endedAt,
    Expression<double>? distanceKm,
    Expression<int>? startOdometerKm,
    Expression<int>? endOdometerKm,
    Expression<double>? fuelConsumedLiters,
    Expression<double>? fuelPricePerLiter,
    Expression<String>? notes,
    Expression<String>? clientId,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (vehicleId != null) 'vehicle_id': vehicleId,
      if (startLocation != null) 'start_location': startLocation,
      if (destination != null) 'destination': destination,
      if (startedAt != null) 'started_at': startedAt,
      if (endedAt != null) 'ended_at': endedAt,
      if (distanceKm != null) 'distance_km': distanceKm,
      if (startOdometerKm != null) 'start_odometer_km': startOdometerKm,
      if (endOdometerKm != null) 'end_odometer_km': endOdometerKm,
      if (fuelConsumedLiters != null)
        'fuel_consumed_liters': fuelConsumedLiters,
      if (fuelPricePerLiter != null) 'fuel_price_per_liter': fuelPricePerLiter,
      if (notes != null) 'notes': notes,
      if (clientId != null) 'client_id': clientId,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TripsCompanion copyWith(
      {Value<String>? id,
      Value<String>? vehicleId,
      Value<String>? startLocation,
      Value<String>? destination,
      Value<DateTime>? startedAt,
      Value<DateTime>? endedAt,
      Value<double>? distanceKm,
      Value<int?>? startOdometerKm,
      Value<int?>? endOdometerKm,
      Value<double?>? fuelConsumedLiters,
      Value<double?>? fuelPricePerLiter,
      Value<String>? notes,
      Value<String?>? clientId,
      Value<int>? rowid}) {
    return TripsCompanion(
      id: id ?? this.id,
      vehicleId: vehicleId ?? this.vehicleId,
      startLocation: startLocation ?? this.startLocation,
      destination: destination ?? this.destination,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      distanceKm: distanceKm ?? this.distanceKm,
      startOdometerKm: startOdometerKm ?? this.startOdometerKm,
      endOdometerKm: endOdometerKm ?? this.endOdometerKm,
      fuelConsumedLiters: fuelConsumedLiters ?? this.fuelConsumedLiters,
      fuelPricePerLiter: fuelPricePerLiter ?? this.fuelPricePerLiter,
      notes: notes ?? this.notes,
      clientId: clientId ?? this.clientId,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (vehicleId.present) {
      map['vehicle_id'] = Variable<String>(vehicleId.value);
    }
    if (startLocation.present) {
      map['start_location'] = Variable<String>(startLocation.value);
    }
    if (destination.present) {
      map['destination'] = Variable<String>(destination.value);
    }
    if (startedAt.present) {
      map['started_at'] = Variable<DateTime>(startedAt.value);
    }
    if (endedAt.present) {
      map['ended_at'] = Variable<DateTime>(endedAt.value);
    }
    if (distanceKm.present) {
      map['distance_km'] = Variable<double>(distanceKm.value);
    }
    if (startOdometerKm.present) {
      map['start_odometer_km'] = Variable<int>(startOdometerKm.value);
    }
    if (endOdometerKm.present) {
      map['end_odometer_km'] = Variable<int>(endOdometerKm.value);
    }
    if (fuelConsumedLiters.present) {
      map['fuel_consumed_liters'] = Variable<double>(fuelConsumedLiters.value);
    }
    if (fuelPricePerLiter.present) {
      map['fuel_price_per_liter'] = Variable<double>(fuelPricePerLiter.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (clientId.present) {
      map['client_id'] = Variable<String>(clientId.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TripsCompanion(')
          ..write('id: $id, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('startLocation: $startLocation, ')
          ..write('destination: $destination, ')
          ..write('startedAt: $startedAt, ')
          ..write('endedAt: $endedAt, ')
          ..write('distanceKm: $distanceKm, ')
          ..write('startOdometerKm: $startOdometerKm, ')
          ..write('endOdometerKm: $endOdometerKm, ')
          ..write('fuelConsumedLiters: $fuelConsumedLiters, ')
          ..write('fuelPricePerLiter: $fuelPricePerLiter, ')
          ..write('notes: $notes, ')
          ..write('clientId: $clientId, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $MaintenanceRecordsTable extends MaintenanceRecords
    with TableInfo<$MaintenanceRecordsTable, MaintenanceRecord> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MaintenanceRecordsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _vehicleIdMeta =
      const VerificationMeta('vehicleId');
  @override
  late final GeneratedColumn<String> vehicleId = GeneratedColumn<String>(
      'vehicle_id', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('REFERENCES vehicles (id)'));
  static const VerificationMeta _serviceTypeMeta =
      const VerificationMeta('serviceType');
  @override
  late final GeneratedColumn<String> serviceType = GeneratedColumn<String>(
      'service_type', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _serviceDateMeta =
      const VerificationMeta('serviceDate');
  @override
  late final GeneratedColumn<DateTime> serviceDate = GeneratedColumn<DateTime>(
      'service_date', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _odometerKmMeta =
      const VerificationMeta('odometerKm');
  @override
  late final GeneratedColumn<int> odometerKm = GeneratedColumn<int>(
      'odometer_km', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _costMeta = const VerificationMeta('cost');
  @override
  late final GeneratedColumn<double> cost = GeneratedColumn<double>(
      'cost', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _partsReplacedMeta =
      const VerificationMeta('partsReplaced');
  @override
  late final GeneratedColumn<String> partsReplaced = GeneratedColumn<String>(
      'parts_replaced', aliasedName, false,
      additionalChecks: GeneratedColumn.checkTextLength(
          minTextLength: 0, maxTextLength: 2000),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _technicianMeta =
      const VerificationMeta('technician');
  @override
  late final GeneratedColumn<String> technician = GeneratedColumn<String>(
      'technician', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 0, maxTextLength: 200),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _serviceCenterMeta =
      const VerificationMeta('serviceCenter');
  @override
  late final GeneratedColumn<String> serviceCenter = GeneratedColumn<String>(
      'service_center', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 0, maxTextLength: 200),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, false,
      additionalChecks: GeneratedColumn.checkTextLength(
          minTextLength: 0, maxTextLength: 2000),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        vehicleId,
        serviceType,
        serviceDate,
        odometerKm,
        cost,
        partsReplaced,
        technician,
        serviceCenter,
        notes
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'maintenance_records';
  @override
  VerificationContext validateIntegrity(Insertable<MaintenanceRecord> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('vehicle_id')) {
      context.handle(_vehicleIdMeta,
          vehicleId.isAcceptableOrUnknown(data['vehicle_id']!, _vehicleIdMeta));
    } else if (isInserting) {
      context.missing(_vehicleIdMeta);
    }
    if (data.containsKey('service_type')) {
      context.handle(
          _serviceTypeMeta,
          serviceType.isAcceptableOrUnknown(
              data['service_type']!, _serviceTypeMeta));
    } else if (isInserting) {
      context.missing(_serviceTypeMeta);
    }
    if (data.containsKey('service_date')) {
      context.handle(
          _serviceDateMeta,
          serviceDate.isAcceptableOrUnknown(
              data['service_date']!, _serviceDateMeta));
    } else if (isInserting) {
      context.missing(_serviceDateMeta);
    }
    if (data.containsKey('odometer_km')) {
      context.handle(
          _odometerKmMeta,
          odometerKm.isAcceptableOrUnknown(
              data['odometer_km']!, _odometerKmMeta));
    } else if (isInserting) {
      context.missing(_odometerKmMeta);
    }
    if (data.containsKey('cost')) {
      context.handle(
          _costMeta, cost.isAcceptableOrUnknown(data['cost']!, _costMeta));
    } else if (isInserting) {
      context.missing(_costMeta);
    }
    if (data.containsKey('parts_replaced')) {
      context.handle(
          _partsReplacedMeta,
          partsReplaced.isAcceptableOrUnknown(
              data['parts_replaced']!, _partsReplacedMeta));
    } else if (isInserting) {
      context.missing(_partsReplacedMeta);
    }
    if (data.containsKey('technician')) {
      context.handle(
          _technicianMeta,
          technician.isAcceptableOrUnknown(
              data['technician']!, _technicianMeta));
    } else if (isInserting) {
      context.missing(_technicianMeta);
    }
    if (data.containsKey('service_center')) {
      context.handle(
          _serviceCenterMeta,
          serviceCenter.isAcceptableOrUnknown(
              data['service_center']!, _serviceCenterMeta));
    } else if (isInserting) {
      context.missing(_serviceCenterMeta);
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    } else if (isInserting) {
      context.missing(_notesMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  MaintenanceRecord map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MaintenanceRecord(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      vehicleId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}vehicle_id'])!,
      serviceType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}service_type'])!,
      serviceDate: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}service_date'])!,
      odometerKm: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}odometer_km'])!,
      cost: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}cost'])!,
      partsReplaced: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}parts_replaced'])!,
      technician: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}technician'])!,
      serviceCenter: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}service_center'])!,
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes'])!,
    );
  }

  @override
  $MaintenanceRecordsTable createAlias(String alias) {
    return $MaintenanceRecordsTable(attachedDatabase, alias);
  }
}

class MaintenanceRecord extends DataClass
    implements Insertable<MaintenanceRecord> {
  final String id;
  final String vehicleId;
  final String serviceType;
  final DateTime serviceDate;
  final int odometerKm;
  final double cost;
  final String partsReplaced;
  final String technician;
  final String serviceCenter;
  final String notes;
  const MaintenanceRecord(
      {required this.id,
      required this.vehicleId,
      required this.serviceType,
      required this.serviceDate,
      required this.odometerKm,
      required this.cost,
      required this.partsReplaced,
      required this.technician,
      required this.serviceCenter,
      required this.notes});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['vehicle_id'] = Variable<String>(vehicleId);
    map['service_type'] = Variable<String>(serviceType);
    map['service_date'] = Variable<DateTime>(serviceDate);
    map['odometer_km'] = Variable<int>(odometerKm);
    map['cost'] = Variable<double>(cost);
    map['parts_replaced'] = Variable<String>(partsReplaced);
    map['technician'] = Variable<String>(technician);
    map['service_center'] = Variable<String>(serviceCenter);
    map['notes'] = Variable<String>(notes);
    return map;
  }

  MaintenanceRecordsCompanion toCompanion(bool nullToAbsent) {
    return MaintenanceRecordsCompanion(
      id: Value(id),
      vehicleId: Value(vehicleId),
      serviceType: Value(serviceType),
      serviceDate: Value(serviceDate),
      odometerKm: Value(odometerKm),
      cost: Value(cost),
      partsReplaced: Value(partsReplaced),
      technician: Value(technician),
      serviceCenter: Value(serviceCenter),
      notes: Value(notes),
    );
  }

  factory MaintenanceRecord.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MaintenanceRecord(
      id: serializer.fromJson<String>(json['id']),
      vehicleId: serializer.fromJson<String>(json['vehicleId']),
      serviceType: serializer.fromJson<String>(json['serviceType']),
      serviceDate: serializer.fromJson<DateTime>(json['serviceDate']),
      odometerKm: serializer.fromJson<int>(json['odometerKm']),
      cost: serializer.fromJson<double>(json['cost']),
      partsReplaced: serializer.fromJson<String>(json['partsReplaced']),
      technician: serializer.fromJson<String>(json['technician']),
      serviceCenter: serializer.fromJson<String>(json['serviceCenter']),
      notes: serializer.fromJson<String>(json['notes']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'vehicleId': serializer.toJson<String>(vehicleId),
      'serviceType': serializer.toJson<String>(serviceType),
      'serviceDate': serializer.toJson<DateTime>(serviceDate),
      'odometerKm': serializer.toJson<int>(odometerKm),
      'cost': serializer.toJson<double>(cost),
      'partsReplaced': serializer.toJson<String>(partsReplaced),
      'technician': serializer.toJson<String>(technician),
      'serviceCenter': serializer.toJson<String>(serviceCenter),
      'notes': serializer.toJson<String>(notes),
    };
  }

  MaintenanceRecord copyWith(
          {String? id,
          String? vehicleId,
          String? serviceType,
          DateTime? serviceDate,
          int? odometerKm,
          double? cost,
          String? partsReplaced,
          String? technician,
          String? serviceCenter,
          String? notes}) =>
      MaintenanceRecord(
        id: id ?? this.id,
        vehicleId: vehicleId ?? this.vehicleId,
        serviceType: serviceType ?? this.serviceType,
        serviceDate: serviceDate ?? this.serviceDate,
        odometerKm: odometerKm ?? this.odometerKm,
        cost: cost ?? this.cost,
        partsReplaced: partsReplaced ?? this.partsReplaced,
        technician: technician ?? this.technician,
        serviceCenter: serviceCenter ?? this.serviceCenter,
        notes: notes ?? this.notes,
      );
  MaintenanceRecord copyWithCompanion(MaintenanceRecordsCompanion data) {
    return MaintenanceRecord(
      id: data.id.present ? data.id.value : this.id,
      vehicleId: data.vehicleId.present ? data.vehicleId.value : this.vehicleId,
      serviceType:
          data.serviceType.present ? data.serviceType.value : this.serviceType,
      serviceDate:
          data.serviceDate.present ? data.serviceDate.value : this.serviceDate,
      odometerKm:
          data.odometerKm.present ? data.odometerKm.value : this.odometerKm,
      cost: data.cost.present ? data.cost.value : this.cost,
      partsReplaced: data.partsReplaced.present
          ? data.partsReplaced.value
          : this.partsReplaced,
      technician:
          data.technician.present ? data.technician.value : this.technician,
      serviceCenter: data.serviceCenter.present
          ? data.serviceCenter.value
          : this.serviceCenter,
      notes: data.notes.present ? data.notes.value : this.notes,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MaintenanceRecord(')
          ..write('id: $id, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('serviceType: $serviceType, ')
          ..write('serviceDate: $serviceDate, ')
          ..write('odometerKm: $odometerKm, ')
          ..write('cost: $cost, ')
          ..write('partsReplaced: $partsReplaced, ')
          ..write('technician: $technician, ')
          ..write('serviceCenter: $serviceCenter, ')
          ..write('notes: $notes')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, vehicleId, serviceType, serviceDate,
      odometerKm, cost, partsReplaced, technician, serviceCenter, notes);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MaintenanceRecord &&
          other.id == this.id &&
          other.vehicleId == this.vehicleId &&
          other.serviceType == this.serviceType &&
          other.serviceDate == this.serviceDate &&
          other.odometerKm == this.odometerKm &&
          other.cost == this.cost &&
          other.partsReplaced == this.partsReplaced &&
          other.technician == this.technician &&
          other.serviceCenter == this.serviceCenter &&
          other.notes == this.notes);
}

class MaintenanceRecordsCompanion extends UpdateCompanion<MaintenanceRecord> {
  final Value<String> id;
  final Value<String> vehicleId;
  final Value<String> serviceType;
  final Value<DateTime> serviceDate;
  final Value<int> odometerKm;
  final Value<double> cost;
  final Value<String> partsReplaced;
  final Value<String> technician;
  final Value<String> serviceCenter;
  final Value<String> notes;
  final Value<int> rowid;
  const MaintenanceRecordsCompanion({
    this.id = const Value.absent(),
    this.vehicleId = const Value.absent(),
    this.serviceType = const Value.absent(),
    this.serviceDate = const Value.absent(),
    this.odometerKm = const Value.absent(),
    this.cost = const Value.absent(),
    this.partsReplaced = const Value.absent(),
    this.technician = const Value.absent(),
    this.serviceCenter = const Value.absent(),
    this.notes = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  MaintenanceRecordsCompanion.insert({
    required String id,
    required String vehicleId,
    required String serviceType,
    required DateTime serviceDate,
    required int odometerKm,
    required double cost,
    required String partsReplaced,
    required String technician,
    required String serviceCenter,
    required String notes,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        vehicleId = Value(vehicleId),
        serviceType = Value(serviceType),
        serviceDate = Value(serviceDate),
        odometerKm = Value(odometerKm),
        cost = Value(cost),
        partsReplaced = Value(partsReplaced),
        technician = Value(technician),
        serviceCenter = Value(serviceCenter),
        notes = Value(notes);
  static Insertable<MaintenanceRecord> custom({
    Expression<String>? id,
    Expression<String>? vehicleId,
    Expression<String>? serviceType,
    Expression<DateTime>? serviceDate,
    Expression<int>? odometerKm,
    Expression<double>? cost,
    Expression<String>? partsReplaced,
    Expression<String>? technician,
    Expression<String>? serviceCenter,
    Expression<String>? notes,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (vehicleId != null) 'vehicle_id': vehicleId,
      if (serviceType != null) 'service_type': serviceType,
      if (serviceDate != null) 'service_date': serviceDate,
      if (odometerKm != null) 'odometer_km': odometerKm,
      if (cost != null) 'cost': cost,
      if (partsReplaced != null) 'parts_replaced': partsReplaced,
      if (technician != null) 'technician': technician,
      if (serviceCenter != null) 'service_center': serviceCenter,
      if (notes != null) 'notes': notes,
      if (rowid != null) 'rowid': rowid,
    });
  }

  MaintenanceRecordsCompanion copyWith(
      {Value<String>? id,
      Value<String>? vehicleId,
      Value<String>? serviceType,
      Value<DateTime>? serviceDate,
      Value<int>? odometerKm,
      Value<double>? cost,
      Value<String>? partsReplaced,
      Value<String>? technician,
      Value<String>? serviceCenter,
      Value<String>? notes,
      Value<int>? rowid}) {
    return MaintenanceRecordsCompanion(
      id: id ?? this.id,
      vehicleId: vehicleId ?? this.vehicleId,
      serviceType: serviceType ?? this.serviceType,
      serviceDate: serviceDate ?? this.serviceDate,
      odometerKm: odometerKm ?? this.odometerKm,
      cost: cost ?? this.cost,
      partsReplaced: partsReplaced ?? this.partsReplaced,
      technician: technician ?? this.technician,
      serviceCenter: serviceCenter ?? this.serviceCenter,
      notes: notes ?? this.notes,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (vehicleId.present) {
      map['vehicle_id'] = Variable<String>(vehicleId.value);
    }
    if (serviceType.present) {
      map['service_type'] = Variable<String>(serviceType.value);
    }
    if (serviceDate.present) {
      map['service_date'] = Variable<DateTime>(serviceDate.value);
    }
    if (odometerKm.present) {
      map['odometer_km'] = Variable<int>(odometerKm.value);
    }
    if (cost.present) {
      map['cost'] = Variable<double>(cost.value);
    }
    if (partsReplaced.present) {
      map['parts_replaced'] = Variable<String>(partsReplaced.value);
    }
    if (technician.present) {
      map['technician'] = Variable<String>(technician.value);
    }
    if (serviceCenter.present) {
      map['service_center'] = Variable<String>(serviceCenter.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MaintenanceRecordsCompanion(')
          ..write('id: $id, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('serviceType: $serviceType, ')
          ..write('serviceDate: $serviceDate, ')
          ..write('odometerKm: $odometerKm, ')
          ..write('cost: $cost, ')
          ..write('partsReplaced: $partsReplaced, ')
          ..write('technician: $technician, ')
          ..write('serviceCenter: $serviceCenter, ')
          ..write('notes: $notes, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncQueueTable extends SyncQueue
    with TableInfo<$SyncQueueTable, SyncQueueData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _targetTableMeta =
      const VerificationMeta('targetTable');
  @override
  late final GeneratedColumn<String> targetTable = GeneratedColumn<String>(
      'table_name', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 50),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _recordIdMeta =
      const VerificationMeta('recordId');
  @override
  late final GeneratedColumn<String> recordId = GeneratedColumn<String>(
      'record_id', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 100),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _operationMeta =
      const VerificationMeta('operation');
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
      'operation', aliasedName, false,
      additionalChecks:
          GeneratedColumn.checkTextLength(minTextLength: 1, maxTextLength: 20),
      type: DriftSqlType.string,
      requiredDuringInsert: true);
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<String> payload =
      GeneratedColumn<String>('payload', aliasedName, false,
          additionalChecks: GeneratedColumn.checkTextLength(
            minTextLength: 0,
          ),
          type: DriftSqlType.string,
          requiredDuringInsert: true);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns =>
      [id, targetTable, recordId, operation, payload, createdAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue';
  @override
  VerificationContext validateIntegrity(Insertable<SyncQueueData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('table_name')) {
      context.handle(
          _targetTableMeta,
          targetTable.isAcceptableOrUnknown(
              data['table_name']!, _targetTableMeta));
    } else if (isInserting) {
      context.missing(_targetTableMeta);
    }
    if (data.containsKey('record_id')) {
      context.handle(_recordIdMeta,
          recordId.isAcceptableOrUnknown(data['record_id']!, _recordIdMeta));
    } else if (isInserting) {
      context.missing(_recordIdMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(_operationMeta,
          operation.isAcceptableOrUnknown(data['operation']!, _operationMeta));
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      targetTable: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}table_name'])!,
      recordId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}record_id'])!,
      operation: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}operation'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $SyncQueueTable createAlias(String alias) {
    return $SyncQueueTable(attachedDatabase, alias);
  }
}

class SyncQueueData extends DataClass implements Insertable<SyncQueueData> {
  final int id;
  final String targetTable;
  final String recordId;
  final String operation;
  final String payload;
  final DateTime createdAt;
  const SyncQueueData(
      {required this.id,
      required this.targetTable,
      required this.recordId,
      required this.operation,
      required this.payload,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['table_name'] = Variable<String>(targetTable);
    map['record_id'] = Variable<String>(recordId);
    map['operation'] = Variable<String>(operation);
    map['payload'] = Variable<String>(payload);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  SyncQueueCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueCompanion(
      id: Value(id),
      targetTable: Value(targetTable),
      recordId: Value(recordId),
      operation: Value(operation),
      payload: Value(payload),
      createdAt: Value(createdAt),
    );
  }

  factory SyncQueueData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueData(
      id: serializer.fromJson<int>(json['id']),
      targetTable: serializer.fromJson<String>(json['targetTable']),
      recordId: serializer.fromJson<String>(json['recordId']),
      operation: serializer.fromJson<String>(json['operation']),
      payload: serializer.fromJson<String>(json['payload']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'targetTable': serializer.toJson<String>(targetTable),
      'recordId': serializer.toJson<String>(recordId),
      'operation': serializer.toJson<String>(operation),
      'payload': serializer.toJson<String>(payload),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  SyncQueueData copyWith(
          {int? id,
          String? targetTable,
          String? recordId,
          String? operation,
          String? payload,
          DateTime? createdAt}) =>
      SyncQueueData(
        id: id ?? this.id,
        targetTable: targetTable ?? this.targetTable,
        recordId: recordId ?? this.recordId,
        operation: operation ?? this.operation,
        payload: payload ?? this.payload,
        createdAt: createdAt ?? this.createdAt,
      );
  SyncQueueData copyWithCompanion(SyncQueueCompanion data) {
    return SyncQueueData(
      id: data.id.present ? data.id.value : this.id,
      targetTable:
          data.targetTable.present ? data.targetTable.value : this.targetTable,
      recordId: data.recordId.present ? data.recordId.value : this.recordId,
      operation: data.operation.present ? data.operation.value : this.operation,
      payload: data.payload.present ? data.payload.value : this.payload,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueData(')
          ..write('id: $id, ')
          ..write('targetTable: $targetTable, ')
          ..write('recordId: $recordId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, targetTable, recordId, operation, payload, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueData &&
          other.id == this.id &&
          other.targetTable == this.targetTable &&
          other.recordId == this.recordId &&
          other.operation == this.operation &&
          other.payload == this.payload &&
          other.createdAt == this.createdAt);
}

class SyncQueueCompanion extends UpdateCompanion<SyncQueueData> {
  final Value<int> id;
  final Value<String> targetTable;
  final Value<String> recordId;
  final Value<String> operation;
  final Value<String> payload;
  final Value<DateTime> createdAt;
  const SyncQueueCompanion({
    this.id = const Value.absent(),
    this.targetTable = const Value.absent(),
    this.recordId = const Value.absent(),
    this.operation = const Value.absent(),
    this.payload = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  SyncQueueCompanion.insert({
    this.id = const Value.absent(),
    required String targetTable,
    required String recordId,
    required String operation,
    required String payload,
    required DateTime createdAt,
  })  : targetTable = Value(targetTable),
        recordId = Value(recordId),
        operation = Value(operation),
        payload = Value(payload),
        createdAt = Value(createdAt);
  static Insertable<SyncQueueData> custom({
    Expression<int>? id,
    Expression<String>? targetTable,
    Expression<String>? recordId,
    Expression<String>? operation,
    Expression<String>? payload,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (targetTable != null) 'table_name': targetTable,
      if (recordId != null) 'record_id': recordId,
      if (operation != null) 'operation': operation,
      if (payload != null) 'payload': payload,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  SyncQueueCompanion copyWith(
      {Value<int>? id,
      Value<String>? targetTable,
      Value<String>? recordId,
      Value<String>? operation,
      Value<String>? payload,
      Value<DateTime>? createdAt}) {
    return SyncQueueCompanion(
      id: id ?? this.id,
      targetTable: targetTable ?? this.targetTable,
      recordId: recordId ?? this.recordId,
      operation: operation ?? this.operation,
      payload: payload ?? this.payload,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (targetTable.present) {
      map['table_name'] = Variable<String>(targetTable.value);
    }
    if (recordId.present) {
      map['record_id'] = Variable<String>(recordId.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueCompanion(')
          ..write('id: $id, ')
          ..write('targetTable: $targetTable, ')
          ..write('recordId: $recordId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $VehiclesTable vehicles = $VehiclesTable(this);
  late final $FuelRecordsTable fuelRecords = $FuelRecordsTable(this);
  late final $TripsTable trips = $TripsTable(this);
  late final $MaintenanceRecordsTable maintenanceRecords =
      $MaintenanceRecordsTable(this);
  late final $SyncQueueTable syncQueue = $SyncQueueTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities =>
      [vehicles, fuelRecords, trips, maintenanceRecords, syncQueue];
}

typedef $$VehiclesTableCreateCompanionBuilder = VehiclesCompanion Function({
  required String id,
  required String name,
  required String type,
  required String manufacturer,
  required String model,
  required int year,
  required String engine,
  required String fuelType,
  required double tankCapacityLitres,
  required double referenceConsumption,
  Value<int?> seatingCapacity,
  Value<double?> payloadCapacityKg,
  Value<int> rowid,
});
typedef $$VehiclesTableUpdateCompanionBuilder = VehiclesCompanion Function({
  Value<String> id,
  Value<String> name,
  Value<String> type,
  Value<String> manufacturer,
  Value<String> model,
  Value<int> year,
  Value<String> engine,
  Value<String> fuelType,
  Value<double> tankCapacityLitres,
  Value<double> referenceConsumption,
  Value<int?> seatingCapacity,
  Value<double?> payloadCapacityKg,
  Value<int> rowid,
});

final class $$VehiclesTableReferences
    extends BaseReferences<_$AppDatabase, $VehiclesTable, Vehicle> {
  $$VehiclesTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static MultiTypedResultKey<$FuelRecordsTable, List<FuelRecord>>
      _fuelRecordsRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
          db.fuelRecords,
          aliasName:
              $_aliasNameGenerator(db.vehicles.id, db.fuelRecords.vehicleId));

  $$FuelRecordsTableProcessedTableManager get fuelRecordsRefs {
    final manager = $$FuelRecordsTableTableManager($_db, $_db.fuelRecords)
        .filter((f) => f.vehicleId.id($_item.id));

    final cache = $_typedResult.readTableOrNull(_fuelRecordsRefsTable($_db));
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: cache));
  }

  static MultiTypedResultKey<$TripsTable, List<Trip>> _tripsRefsTable(
          _$AppDatabase db) =>
      MultiTypedResultKey.fromTable(db.trips,
          aliasName: $_aliasNameGenerator(db.vehicles.id, db.trips.vehicleId));

  $$TripsTableProcessedTableManager get tripsRefs {
    final manager = $$TripsTableTableManager($_db, $_db.trips)
        .filter((f) => f.vehicleId.id($_item.id));

    final cache = $_typedResult.readTableOrNull(_tripsRefsTable($_db));
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: cache));
  }

  static MultiTypedResultKey<$MaintenanceRecordsTable, List<MaintenanceRecord>>
      _maintenanceRecordsRefsTable(_$AppDatabase db) =>
          MultiTypedResultKey.fromTable(db.maintenanceRecords,
              aliasName: $_aliasNameGenerator(
                  db.vehicles.id, db.maintenanceRecords.vehicleId));

  $$MaintenanceRecordsTableProcessedTableManager get maintenanceRecordsRefs {
    final manager =
        $$MaintenanceRecordsTableTableManager($_db, $_db.maintenanceRecords)
            .filter((f) => f.vehicleId.id($_item.id));

    final cache =
        $_typedResult.readTableOrNull(_maintenanceRecordsRefsTable($_db));
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: cache));
  }
}

class $$VehiclesTableFilterComposer
    extends Composer<_$AppDatabase, $VehiclesTable> {
  $$VehiclesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get type => $composableBuilder(
      column: $table.type, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get manufacturer => $composableBuilder(
      column: $table.manufacturer, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get model => $composableBuilder(
      column: $table.model, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get year => $composableBuilder(
      column: $table.year, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get engine => $composableBuilder(
      column: $table.engine, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get fuelType => $composableBuilder(
      column: $table.fuelType, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get tankCapacityLitres => $composableBuilder(
      column: $table.tankCapacityLitres,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get referenceConsumption => $composableBuilder(
      column: $table.referenceConsumption,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get seatingCapacity => $composableBuilder(
      column: $table.seatingCapacity,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get payloadCapacityKg => $composableBuilder(
      column: $table.payloadCapacityKg,
      builder: (column) => ColumnFilters(column));

  Expression<bool> fuelRecordsRefs(
      Expression<bool> Function($$FuelRecordsTableFilterComposer f) f) {
    final $$FuelRecordsTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.id,
        referencedTable: $db.fuelRecords,
        getReferencedColumn: (t) => t.vehicleId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$FuelRecordsTableFilterComposer(
              $db: $db,
              $table: $db.fuelRecords,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return f(composer);
  }

  Expression<bool> tripsRefs(
      Expression<bool> Function($$TripsTableFilterComposer f) f) {
    final $$TripsTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.id,
        referencedTable: $db.trips,
        getReferencedColumn: (t) => t.vehicleId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$TripsTableFilterComposer(
              $db: $db,
              $table: $db.trips,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return f(composer);
  }

  Expression<bool> maintenanceRecordsRefs(
      Expression<bool> Function($$MaintenanceRecordsTableFilterComposer f) f) {
    final $$MaintenanceRecordsTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.id,
        referencedTable: $db.maintenanceRecords,
        getReferencedColumn: (t) => t.vehicleId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$MaintenanceRecordsTableFilterComposer(
              $db: $db,
              $table: $db.maintenanceRecords,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return f(composer);
  }
}

class $$VehiclesTableOrderingComposer
    extends Composer<_$AppDatabase, $VehiclesTable> {
  $$VehiclesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get type => $composableBuilder(
      column: $table.type, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get manufacturer => $composableBuilder(
      column: $table.manufacturer,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get model => $composableBuilder(
      column: $table.model, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get year => $composableBuilder(
      column: $table.year, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get engine => $composableBuilder(
      column: $table.engine, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get fuelType => $composableBuilder(
      column: $table.fuelType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get tankCapacityLitres => $composableBuilder(
      column: $table.tankCapacityLitres,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get referenceConsumption => $composableBuilder(
      column: $table.referenceConsumption,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get seatingCapacity => $composableBuilder(
      column: $table.seatingCapacity,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get payloadCapacityKg => $composableBuilder(
      column: $table.payloadCapacityKg,
      builder: (column) => ColumnOrderings(column));
}

class $$VehiclesTableAnnotationComposer
    extends Composer<_$AppDatabase, $VehiclesTable> {
  $$VehiclesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  GeneratedColumn<String> get manufacturer => $composableBuilder(
      column: $table.manufacturer, builder: (column) => column);

  GeneratedColumn<String> get model =>
      $composableBuilder(column: $table.model, builder: (column) => column);

  GeneratedColumn<int> get year =>
      $composableBuilder(column: $table.year, builder: (column) => column);

  GeneratedColumn<String> get engine =>
      $composableBuilder(column: $table.engine, builder: (column) => column);

  GeneratedColumn<String> get fuelType =>
      $composableBuilder(column: $table.fuelType, builder: (column) => column);

  GeneratedColumn<double> get tankCapacityLitres => $composableBuilder(
      column: $table.tankCapacityLitres, builder: (column) => column);

  GeneratedColumn<double> get referenceConsumption => $composableBuilder(
      column: $table.referenceConsumption, builder: (column) => column);

  GeneratedColumn<int> get seatingCapacity => $composableBuilder(
      column: $table.seatingCapacity, builder: (column) => column);

  GeneratedColumn<double> get payloadCapacityKg => $composableBuilder(
      column: $table.payloadCapacityKg, builder: (column) => column);

  Expression<T> fuelRecordsRefs<T extends Object>(
      Expression<T> Function($$FuelRecordsTableAnnotationComposer a) f) {
    final $$FuelRecordsTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.id,
        referencedTable: $db.fuelRecords,
        getReferencedColumn: (t) => t.vehicleId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$FuelRecordsTableAnnotationComposer(
              $db: $db,
              $table: $db.fuelRecords,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return f(composer);
  }

  Expression<T> tripsRefs<T extends Object>(
      Expression<T> Function($$TripsTableAnnotationComposer a) f) {
    final $$TripsTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.id,
        referencedTable: $db.trips,
        getReferencedColumn: (t) => t.vehicleId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$TripsTableAnnotationComposer(
              $db: $db,
              $table: $db.trips,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return f(composer);
  }

  Expression<T> maintenanceRecordsRefs<T extends Object>(
      Expression<T> Function($$MaintenanceRecordsTableAnnotationComposer a) f) {
    final $$MaintenanceRecordsTableAnnotationComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.id,
            referencedTable: $db.maintenanceRecords,
            getReferencedColumn: (t) => t.vehicleId,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                $$MaintenanceRecordsTableAnnotationComposer(
                  $db: $db,
                  $table: $db.maintenanceRecords,
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return f(composer);
  }
}

class $$VehiclesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $VehiclesTable,
    Vehicle,
    $$VehiclesTableFilterComposer,
    $$VehiclesTableOrderingComposer,
    $$VehiclesTableAnnotationComposer,
    $$VehiclesTableCreateCompanionBuilder,
    $$VehiclesTableUpdateCompanionBuilder,
    (Vehicle, $$VehiclesTableReferences),
    Vehicle,
    PrefetchHooks Function(
        {bool fuelRecordsRefs, bool tripsRefs, bool maintenanceRecordsRefs})> {
  $$VehiclesTableTableManager(_$AppDatabase db, $VehiclesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$VehiclesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$VehiclesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$VehiclesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String> type = const Value.absent(),
            Value<String> manufacturer = const Value.absent(),
            Value<String> model = const Value.absent(),
            Value<int> year = const Value.absent(),
            Value<String> engine = const Value.absent(),
            Value<String> fuelType = const Value.absent(),
            Value<double> tankCapacityLitres = const Value.absent(),
            Value<double> referenceConsumption = const Value.absent(),
            Value<int?> seatingCapacity = const Value.absent(),
            Value<double?> payloadCapacityKg = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              VehiclesCompanion(
            id: id,
            name: name,
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
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String name,
            required String type,
            required String manufacturer,
            required String model,
            required int year,
            required String engine,
            required String fuelType,
            required double tankCapacityLitres,
            required double referenceConsumption,
            Value<int?> seatingCapacity = const Value.absent(),
            Value<double?> payloadCapacityKg = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              VehiclesCompanion.insert(
            id: id,
            name: name,
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
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) =>
                  (e.readTable(table), $$VehiclesTableReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: (
              {fuelRecordsRefs = false,
              tripsRefs = false,
              maintenanceRecordsRefs = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [
                if (fuelRecordsRefs) db.fuelRecords,
                if (tripsRefs) db.trips,
                if (maintenanceRecordsRefs) db.maintenanceRecords
              ],
              addJoins: null,
              getPrefetchedDataCallback: (items) async {
                return [
                  if (fuelRecordsRefs)
                    await $_getPrefetchedData(
                        currentTable: table,
                        referencedTable:
                            $$VehiclesTableReferences._fuelRecordsRefsTable(db),
                        managerFromTypedResult: (p0) =>
                            $$VehiclesTableReferences(db, table, p0)
                                .fuelRecordsRefs,
                        referencedItemsForCurrentItem:
                            (item, referencedItems) => referencedItems
                                .where((e) => e.vehicleId == item.id),
                        typedResults: items),
                  if (tripsRefs)
                    await $_getPrefetchedData(
                        currentTable: table,
                        referencedTable:
                            $$VehiclesTableReferences._tripsRefsTable(db),
                        managerFromTypedResult: (p0) =>
                            $$VehiclesTableReferences(db, table, p0).tripsRefs,
                        referencedItemsForCurrentItem:
                            (item, referencedItems) => referencedItems
                                .where((e) => e.vehicleId == item.id),
                        typedResults: items),
                  if (maintenanceRecordsRefs)
                    await $_getPrefetchedData(
                        currentTable: table,
                        referencedTable: $$VehiclesTableReferences
                            ._maintenanceRecordsRefsTable(db),
                        managerFromTypedResult: (p0) =>
                            $$VehiclesTableReferences(db, table, p0)
                                .maintenanceRecordsRefs,
                        referencedItemsForCurrentItem:
                            (item, referencedItems) => referencedItems
                                .where((e) => e.vehicleId == item.id),
                        typedResults: items)
                ];
              },
            );
          },
        ));
}

typedef $$VehiclesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $VehiclesTable,
    Vehicle,
    $$VehiclesTableFilterComposer,
    $$VehiclesTableOrderingComposer,
    $$VehiclesTableAnnotationComposer,
    $$VehiclesTableCreateCompanionBuilder,
    $$VehiclesTableUpdateCompanionBuilder,
    (Vehicle, $$VehiclesTableReferences),
    Vehicle,
    PrefetchHooks Function(
        {bool fuelRecordsRefs, bool tripsRefs, bool maintenanceRecordsRefs})>;
typedef $$FuelRecordsTableCreateCompanionBuilder = FuelRecordsCompanion
    Function({
  required String id,
  required String vehicleId,
  required double litres,
  required double cost,
  required double odometer,
  required DateTime filledAt,
  Value<int> rowid,
});
typedef $$FuelRecordsTableUpdateCompanionBuilder = FuelRecordsCompanion
    Function({
  Value<String> id,
  Value<String> vehicleId,
  Value<double> litres,
  Value<double> cost,
  Value<double> odometer,
  Value<DateTime> filledAt,
  Value<int> rowid,
});

final class $$FuelRecordsTableReferences
    extends BaseReferences<_$AppDatabase, $FuelRecordsTable, FuelRecord> {
  $$FuelRecordsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $VehiclesTable _vehicleIdTable(_$AppDatabase db) =>
      db.vehicles.createAlias(
          $_aliasNameGenerator(db.fuelRecords.vehicleId, db.vehicles.id));

  $$VehiclesTableProcessedTableManager? get vehicleId {
    if ($_item.vehicleId == null) return null;
    final manager = $$VehiclesTableTableManager($_db, $_db.vehicles)
        .filter((f) => f.id($_item.vehicleId!));
    final item = $_typedResult.readTableOrNull(_vehicleIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$FuelRecordsTableFilterComposer
    extends Composer<_$AppDatabase, $FuelRecordsTable> {
  $$FuelRecordsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get litres => $composableBuilder(
      column: $table.litres, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get cost => $composableBuilder(
      column: $table.cost, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get odometer => $composableBuilder(
      column: $table.odometer, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get filledAt => $composableBuilder(
      column: $table.filledAt, builder: (column) => ColumnFilters(column));

  $$VehiclesTableFilterComposer get vehicleId {
    final $$VehiclesTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.vehicleId,
        referencedTable: $db.vehicles,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$VehiclesTableFilterComposer(
              $db: $db,
              $table: $db.vehicles,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$FuelRecordsTableOrderingComposer
    extends Composer<_$AppDatabase, $FuelRecordsTable> {
  $$FuelRecordsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get litres => $composableBuilder(
      column: $table.litres, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get cost => $composableBuilder(
      column: $table.cost, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get odometer => $composableBuilder(
      column: $table.odometer, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get filledAt => $composableBuilder(
      column: $table.filledAt, builder: (column) => ColumnOrderings(column));

  $$VehiclesTableOrderingComposer get vehicleId {
    final $$VehiclesTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.vehicleId,
        referencedTable: $db.vehicles,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$VehiclesTableOrderingComposer(
              $db: $db,
              $table: $db.vehicles,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$FuelRecordsTableAnnotationComposer
    extends Composer<_$AppDatabase, $FuelRecordsTable> {
  $$FuelRecordsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<double> get litres =>
      $composableBuilder(column: $table.litres, builder: (column) => column);

  GeneratedColumn<double> get cost =>
      $composableBuilder(column: $table.cost, builder: (column) => column);

  GeneratedColumn<double> get odometer =>
      $composableBuilder(column: $table.odometer, builder: (column) => column);

  GeneratedColumn<DateTime> get filledAt =>
      $composableBuilder(column: $table.filledAt, builder: (column) => column);

  $$VehiclesTableAnnotationComposer get vehicleId {
    final $$VehiclesTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.vehicleId,
        referencedTable: $db.vehicles,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$VehiclesTableAnnotationComposer(
              $db: $db,
              $table: $db.vehicles,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$FuelRecordsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $FuelRecordsTable,
    FuelRecord,
    $$FuelRecordsTableFilterComposer,
    $$FuelRecordsTableOrderingComposer,
    $$FuelRecordsTableAnnotationComposer,
    $$FuelRecordsTableCreateCompanionBuilder,
    $$FuelRecordsTableUpdateCompanionBuilder,
    (FuelRecord, $$FuelRecordsTableReferences),
    FuelRecord,
    PrefetchHooks Function({bool vehicleId})> {
  $$FuelRecordsTableTableManager(_$AppDatabase db, $FuelRecordsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FuelRecordsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FuelRecordsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FuelRecordsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> vehicleId = const Value.absent(),
            Value<double> litres = const Value.absent(),
            Value<double> cost = const Value.absent(),
            Value<double> odometer = const Value.absent(),
            Value<DateTime> filledAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              FuelRecordsCompanion(
            id: id,
            vehicleId: vehicleId,
            litres: litres,
            cost: cost,
            odometer: odometer,
            filledAt: filledAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String vehicleId,
            required double litres,
            required double cost,
            required double odometer,
            required DateTime filledAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              FuelRecordsCompanion.insert(
            id: id,
            vehicleId: vehicleId,
            litres: litres,
            cost: cost,
            odometer: odometer,
            filledAt: filledAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    $$FuelRecordsTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({vehicleId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins: <
                  T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic>>(state) {
                if (vehicleId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.vehicleId,
                    referencedTable:
                        $$FuelRecordsTableReferences._vehicleIdTable(db),
                    referencedColumn:
                        $$FuelRecordsTableReferences._vehicleIdTable(db).id,
                  ) as T;
                }

                return state;
              },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ));
}

typedef $$FuelRecordsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $FuelRecordsTable,
    FuelRecord,
    $$FuelRecordsTableFilterComposer,
    $$FuelRecordsTableOrderingComposer,
    $$FuelRecordsTableAnnotationComposer,
    $$FuelRecordsTableCreateCompanionBuilder,
    $$FuelRecordsTableUpdateCompanionBuilder,
    (FuelRecord, $$FuelRecordsTableReferences),
    FuelRecord,
    PrefetchHooks Function({bool vehicleId})>;
typedef $$TripsTableCreateCompanionBuilder = TripsCompanion Function({
  required String id,
  required String vehicleId,
  required String startLocation,
  required String destination,
  required DateTime startedAt,
  required DateTime endedAt,
  required double distanceKm,
  Value<int?> startOdometerKm,
  Value<int?> endOdometerKm,
  Value<double?> fuelConsumedLiters,
  Value<double?> fuelPricePerLiter,
  Value<String> notes,
  Value<String?> clientId,
  Value<int> rowid,
});
typedef $$TripsTableUpdateCompanionBuilder = TripsCompanion Function({
  Value<String> id,
  Value<String> vehicleId,
  Value<String> startLocation,
  Value<String> destination,
  Value<DateTime> startedAt,
  Value<DateTime> endedAt,
  Value<double> distanceKm,
  Value<int?> startOdometerKm,
  Value<int?> endOdometerKm,
  Value<double?> fuelConsumedLiters,
  Value<double?> fuelPricePerLiter,
  Value<String> notes,
  Value<String?> clientId,
  Value<int> rowid,
});

final class $$TripsTableReferences
    extends BaseReferences<_$AppDatabase, $TripsTable, Trip> {
  $$TripsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $VehiclesTable _vehicleIdTable(_$AppDatabase db) => db.vehicles
      .createAlias($_aliasNameGenerator(db.trips.vehicleId, db.vehicles.id));

  $$VehiclesTableProcessedTableManager? get vehicleId {
    if ($_item.vehicleId == null) return null;
    final manager = $$VehiclesTableTableManager($_db, $_db.vehicles)
        .filter((f) => f.id($_item.vehicleId!));
    final item = $_typedResult.readTableOrNull(_vehicleIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$TripsTableFilterComposer extends Composer<_$AppDatabase, $TripsTable> {
  $$TripsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get startLocation => $composableBuilder(
      column: $table.startLocation, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get destination => $composableBuilder(
      column: $table.destination, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get startedAt => $composableBuilder(
      column: $table.startedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get endedAt => $composableBuilder(
      column: $table.endedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get distanceKm => $composableBuilder(
      column: $table.distanceKm, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get startOdometerKm => $composableBuilder(
      column: $table.startOdometerKm,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get endOdometerKm => $composableBuilder(
      column: $table.endOdometerKm, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get fuelConsumedLiters => $composableBuilder(
      column: $table.fuelConsumedLiters,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get fuelPricePerLiter => $composableBuilder(
      column: $table.fuelPricePerLiter,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get clientId => $composableBuilder(
      column: $table.clientId, builder: (column) => ColumnFilters(column));

  $$VehiclesTableFilterComposer get vehicleId {
    final $$VehiclesTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.vehicleId,
        referencedTable: $db.vehicles,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$VehiclesTableFilterComposer(
              $db: $db,
              $table: $db.vehicles,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$TripsTableOrderingComposer
    extends Composer<_$AppDatabase, $TripsTable> {
  $$TripsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get startLocation => $composableBuilder(
      column: $table.startLocation,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get destination => $composableBuilder(
      column: $table.destination, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get startedAt => $composableBuilder(
      column: $table.startedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get endedAt => $composableBuilder(
      column: $table.endedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get distanceKm => $composableBuilder(
      column: $table.distanceKm, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get startOdometerKm => $composableBuilder(
      column: $table.startOdometerKm,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get endOdometerKm => $composableBuilder(
      column: $table.endOdometerKm,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get fuelConsumedLiters => $composableBuilder(
      column: $table.fuelConsumedLiters,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get fuelPricePerLiter => $composableBuilder(
      column: $table.fuelPricePerLiter,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get clientId => $composableBuilder(
      column: $table.clientId, builder: (column) => ColumnOrderings(column));

  $$VehiclesTableOrderingComposer get vehicleId {
    final $$VehiclesTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.vehicleId,
        referencedTable: $db.vehicles,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$VehiclesTableOrderingComposer(
              $db: $db,
              $table: $db.vehicles,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$TripsTableAnnotationComposer
    extends Composer<_$AppDatabase, $TripsTable> {
  $$TripsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get startLocation => $composableBuilder(
      column: $table.startLocation, builder: (column) => column);

  GeneratedColumn<String> get destination => $composableBuilder(
      column: $table.destination, builder: (column) => column);

  GeneratedColumn<DateTime> get startedAt =>
      $composableBuilder(column: $table.startedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get endedAt =>
      $composableBuilder(column: $table.endedAt, builder: (column) => column);

  GeneratedColumn<double> get distanceKm => $composableBuilder(
      column: $table.distanceKm, builder: (column) => column);

  GeneratedColumn<int> get startOdometerKm => $composableBuilder(
      column: $table.startOdometerKm, builder: (column) => column);

  GeneratedColumn<int> get endOdometerKm => $composableBuilder(
      column: $table.endOdometerKm, builder: (column) => column);

  GeneratedColumn<double> get fuelConsumedLiters => $composableBuilder(
      column: $table.fuelConsumedLiters, builder: (column) => column);

  GeneratedColumn<double> get fuelPricePerLiter => $composableBuilder(
      column: $table.fuelPricePerLiter, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<String> get clientId =>
      $composableBuilder(column: $table.clientId, builder: (column) => column);

  $$VehiclesTableAnnotationComposer get vehicleId {
    final $$VehiclesTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.vehicleId,
        referencedTable: $db.vehicles,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$VehiclesTableAnnotationComposer(
              $db: $db,
              $table: $db.vehicles,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$TripsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $TripsTable,
    Trip,
    $$TripsTableFilterComposer,
    $$TripsTableOrderingComposer,
    $$TripsTableAnnotationComposer,
    $$TripsTableCreateCompanionBuilder,
    $$TripsTableUpdateCompanionBuilder,
    (Trip, $$TripsTableReferences),
    Trip,
    PrefetchHooks Function({bool vehicleId})> {
  $$TripsTableTableManager(_$AppDatabase db, $TripsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TripsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TripsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TripsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> vehicleId = const Value.absent(),
            Value<String> startLocation = const Value.absent(),
            Value<String> destination = const Value.absent(),
            Value<DateTime> startedAt = const Value.absent(),
            Value<DateTime> endedAt = const Value.absent(),
            Value<double> distanceKm = const Value.absent(),
            Value<int?> startOdometerKm = const Value.absent(),
            Value<int?> endOdometerKm = const Value.absent(),
            Value<double?> fuelConsumedLiters = const Value.absent(),
            Value<double?> fuelPricePerLiter = const Value.absent(),
            Value<String> notes = const Value.absent(),
            Value<String?> clientId = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              TripsCompanion(
            id: id,
            vehicleId: vehicleId,
            startLocation: startLocation,
            destination: destination,
            startedAt: startedAt,
            endedAt: endedAt,
            distanceKm: distanceKm,
            startOdometerKm: startOdometerKm,
            endOdometerKm: endOdometerKm,
            fuelConsumedLiters: fuelConsumedLiters,
            fuelPricePerLiter: fuelPricePerLiter,
            notes: notes,
            clientId: clientId,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String vehicleId,
            required String startLocation,
            required String destination,
            required DateTime startedAt,
            required DateTime endedAt,
            required double distanceKm,
            Value<int?> startOdometerKm = const Value.absent(),
            Value<int?> endOdometerKm = const Value.absent(),
            Value<double?> fuelConsumedLiters = const Value.absent(),
            Value<double?> fuelPricePerLiter = const Value.absent(),
            Value<String> notes = const Value.absent(),
            Value<String?> clientId = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              TripsCompanion.insert(
            id: id,
            vehicleId: vehicleId,
            startLocation: startLocation,
            destination: destination,
            startedAt: startedAt,
            endedAt: endedAt,
            distanceKm: distanceKm,
            startOdometerKm: startOdometerKm,
            endOdometerKm: endOdometerKm,
            fuelConsumedLiters: fuelConsumedLiters,
            fuelPricePerLiter: fuelPricePerLiter,
            notes: notes,
            clientId: clientId,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) =>
                  (e.readTable(table), $$TripsTableReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: ({vehicleId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins: <
                  T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic>>(state) {
                if (vehicleId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.vehicleId,
                    referencedTable: $$TripsTableReferences._vehicleIdTable(db),
                    referencedColumn:
                        $$TripsTableReferences._vehicleIdTable(db).id,
                  ) as T;
                }

                return state;
              },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ));
}

typedef $$TripsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $TripsTable,
    Trip,
    $$TripsTableFilterComposer,
    $$TripsTableOrderingComposer,
    $$TripsTableAnnotationComposer,
    $$TripsTableCreateCompanionBuilder,
    $$TripsTableUpdateCompanionBuilder,
    (Trip, $$TripsTableReferences),
    Trip,
    PrefetchHooks Function({bool vehicleId})>;
typedef $$MaintenanceRecordsTableCreateCompanionBuilder
    = MaintenanceRecordsCompanion Function({
  required String id,
  required String vehicleId,
  required String serviceType,
  required DateTime serviceDate,
  required int odometerKm,
  required double cost,
  required String partsReplaced,
  required String technician,
  required String serviceCenter,
  required String notes,
  Value<int> rowid,
});
typedef $$MaintenanceRecordsTableUpdateCompanionBuilder
    = MaintenanceRecordsCompanion Function({
  Value<String> id,
  Value<String> vehicleId,
  Value<String> serviceType,
  Value<DateTime> serviceDate,
  Value<int> odometerKm,
  Value<double> cost,
  Value<String> partsReplaced,
  Value<String> technician,
  Value<String> serviceCenter,
  Value<String> notes,
  Value<int> rowid,
});

final class $$MaintenanceRecordsTableReferences extends BaseReferences<
    _$AppDatabase, $MaintenanceRecordsTable, MaintenanceRecord> {
  $$MaintenanceRecordsTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static $VehiclesTable _vehicleIdTable(_$AppDatabase db) =>
      db.vehicles.createAlias($_aliasNameGenerator(
          db.maintenanceRecords.vehicleId, db.vehicles.id));

  $$VehiclesTableProcessedTableManager? get vehicleId {
    if ($_item.vehicleId == null) return null;
    final manager = $$VehiclesTableTableManager($_db, $_db.vehicles)
        .filter((f) => f.id($_item.vehicleId!));
    final item = $_typedResult.readTableOrNull(_vehicleIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$MaintenanceRecordsTableFilterComposer
    extends Composer<_$AppDatabase, $MaintenanceRecordsTable> {
  $$MaintenanceRecordsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get serviceType => $composableBuilder(
      column: $table.serviceType, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get serviceDate => $composableBuilder(
      column: $table.serviceDate, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get odometerKm => $composableBuilder(
      column: $table.odometerKm, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get cost => $composableBuilder(
      column: $table.cost, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get partsReplaced => $composableBuilder(
      column: $table.partsReplaced, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get technician => $composableBuilder(
      column: $table.technician, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get serviceCenter => $composableBuilder(
      column: $table.serviceCenter, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnFilters(column));

  $$VehiclesTableFilterComposer get vehicleId {
    final $$VehiclesTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.vehicleId,
        referencedTable: $db.vehicles,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$VehiclesTableFilterComposer(
              $db: $db,
              $table: $db.vehicles,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$MaintenanceRecordsTableOrderingComposer
    extends Composer<_$AppDatabase, $MaintenanceRecordsTable> {
  $$MaintenanceRecordsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get serviceType => $composableBuilder(
      column: $table.serviceType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get serviceDate => $composableBuilder(
      column: $table.serviceDate, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get odometerKm => $composableBuilder(
      column: $table.odometerKm, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get cost => $composableBuilder(
      column: $table.cost, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get partsReplaced => $composableBuilder(
      column: $table.partsReplaced,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get technician => $composableBuilder(
      column: $table.technician, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get serviceCenter => $composableBuilder(
      column: $table.serviceCenter,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnOrderings(column));

  $$VehiclesTableOrderingComposer get vehicleId {
    final $$VehiclesTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.vehicleId,
        referencedTable: $db.vehicles,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$VehiclesTableOrderingComposer(
              $db: $db,
              $table: $db.vehicles,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$MaintenanceRecordsTableAnnotationComposer
    extends Composer<_$AppDatabase, $MaintenanceRecordsTable> {
  $$MaintenanceRecordsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get serviceType => $composableBuilder(
      column: $table.serviceType, builder: (column) => column);

  GeneratedColumn<DateTime> get serviceDate => $composableBuilder(
      column: $table.serviceDate, builder: (column) => column);

  GeneratedColumn<int> get odometerKm => $composableBuilder(
      column: $table.odometerKm, builder: (column) => column);

  GeneratedColumn<double> get cost =>
      $composableBuilder(column: $table.cost, builder: (column) => column);

  GeneratedColumn<String> get partsReplaced => $composableBuilder(
      column: $table.partsReplaced, builder: (column) => column);

  GeneratedColumn<String> get technician => $composableBuilder(
      column: $table.technician, builder: (column) => column);

  GeneratedColumn<String> get serviceCenter => $composableBuilder(
      column: $table.serviceCenter, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  $$VehiclesTableAnnotationComposer get vehicleId {
    final $$VehiclesTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.vehicleId,
        referencedTable: $db.vehicles,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$VehiclesTableAnnotationComposer(
              $db: $db,
              $table: $db.vehicles,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$MaintenanceRecordsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $MaintenanceRecordsTable,
    MaintenanceRecord,
    $$MaintenanceRecordsTableFilterComposer,
    $$MaintenanceRecordsTableOrderingComposer,
    $$MaintenanceRecordsTableAnnotationComposer,
    $$MaintenanceRecordsTableCreateCompanionBuilder,
    $$MaintenanceRecordsTableUpdateCompanionBuilder,
    (MaintenanceRecord, $$MaintenanceRecordsTableReferences),
    MaintenanceRecord,
    PrefetchHooks Function({bool vehicleId})> {
  $$MaintenanceRecordsTableTableManager(
      _$AppDatabase db, $MaintenanceRecordsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$MaintenanceRecordsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$MaintenanceRecordsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$MaintenanceRecordsTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> vehicleId = const Value.absent(),
            Value<String> serviceType = const Value.absent(),
            Value<DateTime> serviceDate = const Value.absent(),
            Value<int> odometerKm = const Value.absent(),
            Value<double> cost = const Value.absent(),
            Value<String> partsReplaced = const Value.absent(),
            Value<String> technician = const Value.absent(),
            Value<String> serviceCenter = const Value.absent(),
            Value<String> notes = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              MaintenanceRecordsCompanion(
            id: id,
            vehicleId: vehicleId,
            serviceType: serviceType,
            serviceDate: serviceDate,
            odometerKm: odometerKm,
            cost: cost,
            partsReplaced: partsReplaced,
            technician: technician,
            serviceCenter: serviceCenter,
            notes: notes,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String vehicleId,
            required String serviceType,
            required DateTime serviceDate,
            required int odometerKm,
            required double cost,
            required String partsReplaced,
            required String technician,
            required String serviceCenter,
            required String notes,
            Value<int> rowid = const Value.absent(),
          }) =>
              MaintenanceRecordsCompanion.insert(
            id: id,
            vehicleId: vehicleId,
            serviceType: serviceType,
            serviceDate: serviceDate,
            odometerKm: odometerKm,
            cost: cost,
            partsReplaced: partsReplaced,
            technician: technician,
            serviceCenter: serviceCenter,
            notes: notes,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    $$MaintenanceRecordsTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({vehicleId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins: <
                  T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic>>(state) {
                if (vehicleId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.vehicleId,
                    referencedTable:
                        $$MaintenanceRecordsTableReferences._vehicleIdTable(db),
                    referencedColumn: $$MaintenanceRecordsTableReferences
                        ._vehicleIdTable(db)
                        .id,
                  ) as T;
                }

                return state;
              },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ));
}

typedef $$MaintenanceRecordsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $MaintenanceRecordsTable,
    MaintenanceRecord,
    $$MaintenanceRecordsTableFilterComposer,
    $$MaintenanceRecordsTableOrderingComposer,
    $$MaintenanceRecordsTableAnnotationComposer,
    $$MaintenanceRecordsTableCreateCompanionBuilder,
    $$MaintenanceRecordsTableUpdateCompanionBuilder,
    (MaintenanceRecord, $$MaintenanceRecordsTableReferences),
    MaintenanceRecord,
    PrefetchHooks Function({bool vehicleId})>;
typedef $$SyncQueueTableCreateCompanionBuilder = SyncQueueCompanion Function({
  Value<int> id,
  required String targetTable,
  required String recordId,
  required String operation,
  required String payload,
  required DateTime createdAt,
});
typedef $$SyncQueueTableUpdateCompanionBuilder = SyncQueueCompanion Function({
  Value<int> id,
  Value<String> targetTable,
  Value<String> recordId,
  Value<String> operation,
  Value<String> payload,
  Value<DateTime> createdAt,
});

class $$SyncQueueTableFilterComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get targetTable => $composableBuilder(
      column: $table.targetTable, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get recordId => $composableBuilder(
      column: $table.recordId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$SyncQueueTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get targetTable => $composableBuilder(
      column: $table.targetTable, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get recordId => $composableBuilder(
      column: $table.recordId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$SyncQueueTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get targetTable => $composableBuilder(
      column: $table.targetTable, builder: (column) => column);

  GeneratedColumn<String> get recordId =>
      $composableBuilder(column: $table.recordId, builder: (column) => column);

  GeneratedColumn<String> get operation =>
      $composableBuilder(column: $table.operation, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$SyncQueueTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SyncQueueTable,
    SyncQueueData,
    $$SyncQueueTableFilterComposer,
    $$SyncQueueTableOrderingComposer,
    $$SyncQueueTableAnnotationComposer,
    $$SyncQueueTableCreateCompanionBuilder,
    $$SyncQueueTableUpdateCompanionBuilder,
    (
      SyncQueueData,
      BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>
    ),
    SyncQueueData,
    PrefetchHooks Function()> {
  $$SyncQueueTableTableManager(_$AppDatabase db, $SyncQueueTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncQueueTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncQueueTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncQueueTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> targetTable = const Value.absent(),
            Value<String> recordId = const Value.absent(),
            Value<String> operation = const Value.absent(),
            Value<String> payload = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
          }) =>
              SyncQueueCompanion(
            id: id,
            targetTable: targetTable,
            recordId: recordId,
            operation: operation,
            payload: payload,
            createdAt: createdAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String targetTable,
            required String recordId,
            required String operation,
            required String payload,
            required DateTime createdAt,
          }) =>
              SyncQueueCompanion.insert(
            id: id,
            targetTable: targetTable,
            recordId: recordId,
            operation: operation,
            payload: payload,
            createdAt: createdAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SyncQueueTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $SyncQueueTable,
    SyncQueueData,
    $$SyncQueueTableFilterComposer,
    $$SyncQueueTableOrderingComposer,
    $$SyncQueueTableAnnotationComposer,
    $$SyncQueueTableCreateCompanionBuilder,
    $$SyncQueueTableUpdateCompanionBuilder,
    (
      SyncQueueData,
      BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>
    ),
    SyncQueueData,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$VehiclesTableTableManager get vehicles =>
      $$VehiclesTableTableManager(_db, _db.vehicles);
  $$FuelRecordsTableTableManager get fuelRecords =>
      $$FuelRecordsTableTableManager(_db, _db.fuelRecords);
  $$TripsTableTableManager get trips =>
      $$TripsTableTableManager(_db, _db.trips);
  $$MaintenanceRecordsTableTableManager get maintenanceRecords =>
      $$MaintenanceRecordsTableTableManager(_db, _db.maintenanceRecords);
  $$SyncQueueTableTableManager get syncQueue =>
      $$SyncQueueTableTableManager(_db, _db.syncQueue);
}
