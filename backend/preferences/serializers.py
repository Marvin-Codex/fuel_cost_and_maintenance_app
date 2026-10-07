from rest_framework import serializers

from .models import UserPreference, default_alert_settings, default_thresholds


class UserPreferenceSerializer(serializers.ModelSerializer):
    dark_mode = serializers.BooleanField(default=True, read_only=True)

    class Meta:
        model = UserPreference
        fields = [
            'alert_settings', 'thresholds', 'units', 'currency', 'language',
            'notifications_enabled', 'dark_mode', 'updated_at',
        ]
        read_only_fields = ['updated_at']

    def validate_alert_settings(self, value):
        defaults = default_alert_settings()
        if not isinstance(value, dict) or set(value) - set(defaults):
            raise serializers.ValidationError('Alert settings contain unsupported keys.')
        if any(not isinstance(enabled, bool) for enabled in value.values()):
            raise serializers.ValidationError('Every alert setting must be true or false.')
        return {**defaults, **value}

    def validate_thresholds(self, value):
        defaults = default_thresholds()
        if not isinstance(value, dict) or set(value) - set(defaults):
            raise serializers.ValidationError('Thresholds contain unsupported keys.')
        merged = {**defaults, **value}
        ranges = {
            'low_fuel_percent': (1, 100),
            'engine_temperature_c': (50, 160),
            'overspeed_kmh': (20, 300),
        }
        for key, (minimum, maximum) in ranges.items():
            threshold = merged[key]
            if isinstance(threshold, bool) or not isinstance(threshold, int):
                raise serializers.ValidationError({key: 'Threshold must be an integer.'})
            if not minimum <= threshold <= maximum:
                raise serializers.ValidationError({
                    key: f'Threshold must be between {minimum} and {maximum}.'
                })
        return merged

    def validate_currency(self, value):
        value = value.upper()
        if len(value) != 3 or not value.isalpha():
            raise serializers.ValidationError('Currency must be a 3-letter code.')
        return value

    def validate_language(self, value):
        if value not in {'en', 'sw'}:
            raise serializers.ValidationError('Supported languages are en and sw.')
        return value
