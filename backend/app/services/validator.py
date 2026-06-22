import pandas as pd
import numpy as np
import re
from typing import List, Dict, Any, Tuple
from app.schemas.dataset import ValidationResult, DatasetHealth, ErrorDetail, CorrectionSuggestion

class DatasetValidator:
    def __init__(self, df: pd.DataFrame, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Apply mappings if present
        mappings = {v: k for k, v in self.config.get('mappings', {}).items() if v}
        if mappings:
            df = df.rename(columns=mappings)
            # Deduplicate columns to prevent ambiguous Series errors
            df = df.loc[:, ~df.columns.duplicated()]
            
        self.df = df.replace({float('nan'): None, np.nan: None})
        self.total_rows = len(df)
        self.errors: List[ErrorDetail] = []
        self.corrections: List[CorrectionSuggestion] = []
        
    def _detect_schema(self) -> Dict[str, str]:
        schema = {}
        for col in self.df.columns:
            dtype = str(self.df[col].dtype)
            if 'int' in dtype:
                schema[col] = 'Integer'
            elif 'float' in dtype:
                schema[col] = 'Float'
            else:
                schema[col] = 'String'
                # Simple PII inference
                col_lower = col.lower()
                if 'name' in col_lower or 'email' in col_lower or 'phone' in col_lower or 'ssn' in col_lower:
                    schema[col] = 'String (PII Detected)'
        return schema

    def _validate_dates(self):
        if 'transaction_date' in self.df.columns:
            for idx, val in self.df['transaction_date'].items():
                if pd.isna(val) or str(val).strip() == '':
                    self.errors.append(ErrorDetail(row_index=idx, column='transaction_date', value=val, error_type='Missing Value', message='Transaction date is missing.', severity='high'))
                    continue
                
                val_str = str(val)
                # ISO Format Check YYYY-MM-DD
                if not re.match(r'^\d{4}-\d{2}-\d{2}$', val_str):
                    self.errors.append(ErrorDetail(row_index=idx, column='transaction_date', value=val, error_type='Invalid Format', message='Date must be in YYYY-MM-DD format.', severity='medium'))
                    
                    # Heuristic correction
                    if '/' in val_str:
                        parts = val_str.split('/')
                        if len(parts) == 3:
                            # if US format MM/DD/YYYY
                            if len(parts[2]) == 4:
                                suggested = f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
                                self.corrections.append(CorrectionSuggestion(row_index=idx, column='transaction_date', original_value=val, suggested_value=suggested, confidence_score=0.85))

    def _validate_phones(self):
        if 'phone_number' in self.df.columns:
            for idx, val in self.df['phone_number'].items():
                if pd.isna(val) or str(val).strip() == '':
                    continue
                val_str = str(val)
                if not val_str.startswith('+'):
                    self.errors.append(ErrorDetail(row_index=idx, column='phone_number', value=val, error_type='Format Error', message='Phone number missing country code.', severity='medium'))
                    
                    # Basic correction suggestion if we can guess country from a country column
                    country = str(self.df.at[idx, 'country']) if 'country' in self.df.columns else ''
                    suggested = val_str
                    if country == 'USA':
                        suggested = '+1-' + val_str
                    elif country == 'UK':
                        suggested = '+44-' + val_str
                    elif country == 'India':
                        suggested = '+91-' + val_str
                    elif country == 'Singapore':
                        suggested = '+65-' + val_str
                    
                    if suggested != val_str:
                         self.corrections.append(CorrectionSuggestion(row_index=idx, column='phone_number', original_value=val, suggested_value=suggested, confidence_score=0.9))

    def _validate_duplicates(self):
        duplicate_mask = self.df.duplicated(keep='first')
        # Limit to 100 to prevent payload blowing up and LocalStorage quota exceeded
        for idx in duplicate_mask[duplicate_mask].index[:100]:
            self.errors.append(ErrorDetail(
                row_index=idx, 
                column='Row', 
                value='[Duplicate Data]', 
                error_type='Duplicate Record', 
                message='This entire row is a duplicate of a previous entry.', 
                severity='high'
            ))

    def _validate_missing(self):
        for col in self.df.columns:
            if col not in ['transaction_date']: # Dates are handled separately
                missing_mask = self.df[col].isna() | (self.df[col].astype(str).str.strip() == '')
                # Limit to 100 per column to prevent payload blowing up
                for idx in missing_mask[missing_mask].index[:100]:
                    self.errors.append(ErrorDetail(
                        row_index=idx, 
                        column=col, 
                        value='[Empty]', 
                        error_type='Missing Value', 
                        message=f'Field {col} is missing or empty.', 
                        severity='medium'
                    ))

    def _validate_outliers(self):
        if 'amount' in self.df.columns:
            # Convert to numeric, coerce errors to NaN
            amounts = pd.to_numeric(self.df['amount'], errors='coerce')
            if len(amounts.dropna()) > 2:
                mean = amounts.mean()
                std = amounts.std()
                if std > 0:
                    z_scores = (amounts - mean) / std
                    outliers = z_scores[abs(z_scores) > 3]
                    for idx, z in outliers.items():
                        self.errors.append(ErrorDetail(
                            row_index=idx,
                            column='amount',
                            value=self.df.at[idx, 'amount'],
                            error_type='Statistical Anomaly',
                            message=f'Amount is {abs(z):.1f} standard deviations from the mean.',
                            severity='high'
                        ))

    def validate(self) -> ValidationResult:
        rules = self.config.get('rules', {})
        check_dates = rules.get('date_time', True)
        check_phones = rules.get('phone_numbers', True)
        check_duplicates = rules.get('duplicate_ids', True)
        check_missing = rules.get('required_fields', True)

        # 1. Health checks
        duplicate_count = int(self.df.duplicated().sum()) if check_duplicates else 0
        missing_count = int(self.df.isna().sum().sum()) if check_missing else 0
        countries = self.df['country'].dropna().unique().tolist() if 'country' in self.df.columns else []
        
        if check_dates: self._validate_dates()
        if check_phones: self._validate_phones()
        if check_duplicates: self._validate_duplicates()
        if check_missing: self._validate_missing()
        
        # Always run statistical anomaly detection
        self._validate_outliers()

        # Calculate score
        max_errors = self.total_rows * len(self.df.columns)
        error_count = len(self.errors) + missing_count + duplicate_count
        quality_score = 100.0 if max_errors == 0 else max_errors
        quality_score = max(0, 100.0 - (error_count / (self.total_rows + 1) * 20)) # Heuristic scoring

        health = DatasetHealth(
            total_records=self.total_rows,
            columns=len(self.df.columns),
            countries_detected=countries,
            duplicate_count=duplicate_count,
            missing_values_count=missing_count,
            quality_score=round(quality_score, 1)
        )

        insights = []
        if duplicate_count > 0:
            insights.append(f"Detected {duplicate_count} duplicate records accounting for {(duplicate_count/self.total_rows)*100:.1f}% of data.")
        if len(self.errors) > 0:
            insights.append(f"Found {len(self.errors)} validation errors. Applying suggested corrections could improve quality score.")
            
        analytics = {}
        if 'payment_mode' in self.df.columns:
            counts = self.df['payment_mode'].value_counts()
            analytics['payment_mode_distribution'] = [{"name": str(k), "value": int(v)} for k, v in counts.items()]
            
        if 'country' in self.df.columns:
            counts = self.df['country'].value_counts()
            analytics['country_distribution'] = [{"name": str(k), "value": int(v)} for k, v in counts.items()]
            
        pii_cols = [c for c, t in self._detect_schema().items() if 'PII' in t]
        if pii_cols:
            insights.append(f"Security Warning: Detected {len(pii_cols)} columns containing potential Personally Identifiable Information (PII).")
            analytics['pii_columns'] = pii_cols

        return ValidationResult(
            health=health,
            errors=self.errors,
            corrections=self.corrections,
            insights=insights,
            schema_detected=self._detect_schema(),
            analytics=analytics
        )
