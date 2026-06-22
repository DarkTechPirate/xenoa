from typing import List, Optional, Dict, Any

class ValidationRule:
    def __init__(self, field: str, rule_type: str, params: Optional[Dict[str, Any]] = None):
        self.field = field
        self.rule_type = rule_type
        self.params = params

class ErrorDetail:
    def __init__(self, row_index: int, column: str, value: Any, error_type: str, message: str, severity: str,
                 category: str = '', explanation: str = '', fix_hint: str = ''):
        self.row_index = row_index
        self.column = column
        self.value = value
        self.error_type = error_type
        self.message = message
        self.severity = severity
        self.category = category
        self.explanation = explanation
        self.fix_hint = fix_hint

class CorrectionSuggestion:
    def __init__(self, row_index: int, column: str, original_value: Any, suggested_value: Any, confidence_score: float, reason: str = ''):
        self.row_index = row_index
        self.column = column
        self.original_value = original_value
        self.suggested_value = suggested_value
        self.confidence_score = confidence_score
        self.reason = reason

class DatasetHealth:
    def __init__(self, total_records: int, columns: int, countries_detected: List[str], duplicate_count: int, missing_values_count: int, quality_score: float, error_breakdown: Dict[str, int] = None):
        self.total_records = total_records
        self.columns = columns
        self.countries_detected = countries_detected
        self.duplicate_count = duplicate_count
        self.missing_values_count = missing_values_count
        self.quality_score = quality_score
        self.error_breakdown = error_breakdown or {}

class ValidationResult:
    def __init__(self, health: DatasetHealth, errors: List[ErrorDetail], corrections: List[CorrectionSuggestion], insights: List[str], schema_detected: Dict[str, str], analytics: Dict[str, Any] = None):
        self.health = health
        self.errors = errors
        self.corrections = corrections
        self.insights = insights
        self.schema_detected = schema_detected
        self.analytics = analytics or {}
        
    def dict(self):
        return {
            "health": self.health.__dict__,
            "errors": [e.__dict__ for e in self.errors],
            "corrections": [c.__dict__ for c in self.corrections],
            "insights": self.insights,
            "schema_detected": self.schema_detected,
            "analytics": self.analytics
        }
