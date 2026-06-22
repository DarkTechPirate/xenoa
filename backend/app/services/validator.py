import pandas as pd
import numpy as np
import re
from typing import List, Dict, Any
from app.schemas.dataset import ValidationResult, DatasetHealth, ErrorDetail, CorrectionSuggestion

COUNTRY_DIAL_CODES: Dict[str, str] = {
    'USA': '+1', 'UK': '+44', 'India': '+91', 'Singapore': '+65',
    'Canada': '+1', 'Australia': '+61', 'Germany': '+49', 'France': '+33',
    'Japan': '+81', 'China': '+86', 'Brazil': '+55', 'Mexico': '+52',
}

COUNTRY_CURRENCY: Dict[str, str] = {
    'USA': 'USD', 'UK': 'GBP', 'India': 'INR', 'Singapore': 'SGD',
    'Canada': 'CAD', 'Australia': 'AUD', 'Germany': 'EUR', 'France': 'EUR',
    'Japan': 'JPY', 'Brazil': 'BRL', 'Mexico': 'MXN',
}


class DatasetValidator:
    def __init__(self, df: pd.DataFrame, config: Dict[str, Any] = None):
        self.config = config or {}

        # Apply column mappings if provided
        mappings = {v: k for k, v in self.config.get('mappings', {}).items() if v}
        if mappings:
            df = df.rename(columns=mappings)
            df = df.loc[:, ~df.columns.duplicated()]

        self.df = df.replace({float('nan'): None, np.nan: None})
        self.total_rows = len(df)
        self.errors: List[ErrorDetail] = []
        self.corrections: List[CorrectionSuggestion] = []
        
    def _detect_schema(self) -> Dict[str, str]:
        schema = {}
        for col in self.df.columns:
            dtype = str(self.df[col].dtype)
            col_lower = col.lower()
            if 'int' in dtype:
                schema[col] = 'Integer'
            elif 'float' in dtype:
                schema[col] = 'Float'
            else:
                if any(kw in col_lower for kw in ('email', 'mail')):
                    schema[col] = 'Email (PII Detected)'
                elif any(kw in col_lower for kw in ('phone', 'mobile', 'tel')):
                    schema[col] = 'String (PII Detected)'
                elif any(kw in col_lower for kw in ('name', 'first_name', 'last_name', 'full_name', 'ssn', 'passport')):
                    schema[col] = 'String (PII Detected)'
                elif any(kw in col_lower for kw in ('date', 'time', 'created_at', 'updated_at')):
                    schema[col] = 'Date'
                elif any(kw in col_lower for kw in ('amount', 'price', 'total', 'cost', 'fee', 'balance')):
                    schema[col] = 'Currency Amount'
                elif any(kw in col_lower for kw in ('currency', 'curr')):
                    schema[col] = 'Currency Code'
                elif any(kw in col_lower for kw in ('id', 'order_id', 'transaction_id', 'ref')):
                    schema[col] = 'Identifier'
                elif any(kw in col_lower for kw in ('country', 'region', 'nation')):
                    schema[col] = 'String (Country)'
                elif any(kw in col_lower for kw in ('mode', 'method', 'type', 'status', 'category')):
                    schema[col] = 'Enum/Category'
                else:
                    schema[col] = 'String'
        return schema

    def _validate_dates(self):
        if 'transaction_date' not in self.df.columns:
            return

        for idx, val in self.df['transaction_date'].items():
            if val is None or str(val).strip() in ('', 'nan', 'None', 'NaN', 'null', 'NULL'):
                self.errors.append(ErrorDetail(
                    row_index=idx, column='transaction_date', value='[Empty]',
                    error_type='Missing Date',
                    message='Transaction date is empty or missing.',
                    severity='high',
                    category='date_format',
                    explanation='A missing transaction date prevents accurate financial reporting, tax reconciliation, and audit trail compliance. Most payment processors will reject records without a valid date.',
                    fix_hint='Enter the correct date in YYYY-MM-DD format (e.g., 2023-10-15). Check source records or bank statements to retrieve the original date.'
                ))
                continue

            val_str = str(val).strip()

            if re.match(r'^\d{4}-\d{2}-\d{2}$', val_str):
                # Correct format — validate calendar values
                parts = val_str.split('-')
                month, day = int(parts[1]), int(parts[2])
                if month < 1 or month > 12:
                    self.errors.append(ErrorDetail(
                        row_index=idx, column='transaction_date', value=val,
                        error_type='Invalid Date Value',
                        message=f'Month {month} is not valid — must be between 01 and 12.',
                        severity='high',
                        category='date_format',
                        explanation=f'Month "{month}" does not exist in any calendar. This is typically caused by the day and month being transposed during data entry.',
                        fix_hint=f'Correct the month to a valid value (01–12). Check whether the day and month are swapped in "{val_str}".'
                    ))
                elif day < 1 or day > 31:
                    self.errors.append(ErrorDetail(
                        row_index=idx, column='transaction_date', value=val,
                        error_type='Invalid Date Value',
                        message=f'Day {day} is out of range — must be between 01 and 31.',
                        severity='high',
                        category='date_format',
                        explanation=f'No month has {day} days. This is a data entry error that will fail type validation in payment and ERP systems.',
                        fix_hint='Verify the correct date from the source record and update it to a valid YYYY-MM-DD value.'
                    ))
                # else: valid date

            elif re.match(r'^\d{1,2}/\d{1,2}/\d{4}$', val_str):
                # US format MM/DD/YYYY
                parts = val_str.split('/')
                suggested = f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
                self.errors.append(ErrorDetail(
                    row_index=idx, column='transaction_date', value=val,
                    error_type='Wrong Date Format',
                    message=f'"{val_str}" uses MM/DD/YYYY (US format). Expected YYYY-MM-DD.',
                    severity='medium',
                    category='date_format',
                    explanation='The US date format (MM/DD/YYYY) is ambiguous — systems in Europe and Asia will swap the month and day, producing incorrect timestamps and broken date-range queries.',
                    fix_hint=f'Reformat to ISO 8601: "{suggested}". This format is globally unambiguous and accepted by all major systems.'
                ))
                self.corrections.append(CorrectionSuggestion(
                    row_index=idx, column='transaction_date',
                    original_value=val, suggested_value=suggested,
                    confidence_score=0.90,
                    reason=f'Detected US date format (MM/DD/YYYY) and converted to ISO 8601 YYYY-MM-DD.'
                ))

            elif re.match(r'^\d{4}/\d{2}/\d{2}$', val_str):
                # YYYY/MM/DD with slashes
                suggested = val_str.replace('/', '-')
                self.errors.append(ErrorDetail(
                    row_index=idx, column='transaction_date', value=val,
                    error_type='Wrong Date Separator',
                    message=f'"{val_str}" uses slashes instead of dashes.',
                    severity='medium',
                    category='date_format',
                    explanation='Slashes in dates break regex-based validation in most APIs and database import tools, even though the date values themselves are correct.',
                    fix_hint=f'Replace slashes with dashes: "{suggested}".'
                ))
                self.corrections.append(CorrectionSuggestion(
                    row_index=idx, column='transaction_date',
                    original_value=val, suggested_value=suggested,
                    confidence_score=0.98,
                    reason='Replaced slashes with dashes to produce valid ISO 8601 format.'
                ))

            elif re.match(r'^\d{2}-\d{2}-\d{4}$', val_str):
                # Likely European DD-MM-YYYY
                parts = val_str.split('-')
                suggested = f"{parts[2]}-{parts[1]}-{parts[0]}"
                self.errors.append(ErrorDetail(
                    row_index=idx, column='transaction_date', value=val,
                    error_type='Wrong Date Format',
                    message=f'"{val_str}" appears to use DD-MM-YYYY (European format). Expected YYYY-MM-DD.',
                    severity='medium',
                    category='date_format',
                    explanation='European date format (DD-MM-YYYY) causes incorrect sorting in time-series reports and will be misread by systems expecting ISO 8601.',
                    fix_hint=f'Reformat to ISO 8601: "{suggested}".'
                ))
                self.corrections.append(CorrectionSuggestion(
                    row_index=idx, column='transaction_date',
                    original_value=val, suggested_value=suggested,
                    confidence_score=0.80,
                    reason='Detected European DD-MM-YYYY format and converted to YYYY-MM-DD.'
                ))

            else:
                self.errors.append(ErrorDetail(
                    row_index=idx, column='transaction_date', value=val,
                    error_type='Unrecognized Date Format',
                    message=f'"{val_str}" could not be parsed into any known date format.',
                    severity='high',
                    category='date_format',
                    explanation='Unrecognized date formats are stored as raw text, which breaks date-range filters, chronological sorting, and all time-based analytics.',
                    fix_hint='Convert to the standard YYYY-MM-DD format (e.g., "2023-10-15").'
                ))

    def _validate_phones(self):
        if 'phone_number' not in self.df.columns:
            return

        for idx, val in self.df['phone_number'].items():
            if val is None or str(val).strip() in ('', 'nan', 'None', 'NaN', 'null', 'NULL'):
                continue

            val_str = str(val).strip()

            if not val_str.startswith('+'):
                country = str(self.df.at[idx, 'country']) if 'country' in self.df.columns else ''
                dial_code = COUNTRY_DIAL_CODES.get(country, '')
                country_hint = f' For {country}, the country code is {dial_code}.' if dial_code else ' International format: +[country code][number].'

                self.errors.append(ErrorDetail(
                    row_index=idx, column='phone_number', value=val,
                    error_type='Missing Country Code',
                    message=f'"{val_str}" has no international country code (e.g., +1, +44, +91).',
                    severity='medium',
                    category='phone_format',
                    explanation='Phone numbers without a country code cannot be used for international calls, SMS verification, or matched against global customer records in CRM systems.',
                    fix_hint=f'Add the international dialling prefix.{country_hint}'
                ))

                if dial_code:
                    self.corrections.append(CorrectionSuggestion(
                        row_index=idx, column='phone_number',
                        original_value=val, suggested_value=f"{dial_code}-{val_str}",
                        confidence_score=0.90,
                        reason=f'Added {country} country code ({dial_code}) based on the "country" column value.'
                    ))
            else:
                # Has country code — check E.164 digit count (8–15 digits)
                digits_only = re.sub(r'\D', '', val_str)
                if len(digits_only) < 8:
                    self.errors.append(ErrorDetail(
                        row_index=idx, column='phone_number', value=val,
                        error_type='Phone Too Short',
                        message=f'"{val_str}" has only {len(digits_only)} digits — too short to be valid.',
                        severity='medium',
                        category='phone_format',
                        explanation='No valid phone number in any country has fewer than 8 digits. A segment is likely missing — possibly the area code or subscriber number was cut off.',
                        fix_hint='Verify the complete number from the source record. A typical international number has 10–15 digits including the country code.'
                    ))
                elif len(digits_only) > 15:
                    self.errors.append(ErrorDetail(
                        row_index=idx, column='phone_number', value=val,
                        error_type='Phone Too Long',
                        message=f'"{val_str}" has {len(digits_only)} digits — exceeds the 15-digit ITU-T E.164 limit.',
                        severity='low',
                        category='phone_format',
                        explanation='International phone numbers cannot exceed 15 digits per the ITU-T E.164 standard. Extra digits may be formatting characters accidentally included.',
                        fix_hint='Remove any extra characters, spaces, or symbols. Correct format: +[country code][subscriber number].'
                    ))

    def _validate_duplicates(self):
        duplicate_mask = self.df.duplicated(keep='first')
        for idx in duplicate_mask[duplicate_mask].index[:100]:
            self.errors.append(ErrorDetail(
                row_index=idx,
                column='Row',
                value='[Duplicate Data]',
                error_type='Duplicate Record',
                message=f'Row {idx + 1} is an exact copy of a previous row.',
                severity='high',
                category='duplicate',
                explanation='Duplicate records directly cause double-counted revenue in financial reports, duplicate customer outreach, and inflated transaction volumes in analytics dashboards.',
                fix_hint='Remove this row unless the repeated transaction is intentional (e.g., a legitimate retry). Verify against source records to confirm it is truly a duplicate.'
            ))

    def _validate_missing(self):
        empty_markers = {'', 'none', 'nan', 'null', 'n/a', 'na', '-', 'undefined'}
        for col in self.df.columns:
            if col == 'transaction_date':
                continue  # Handled with richer messages separately
            missing_mask = self.df[col].isna() | self.df[col].astype(str).str.strip().str.lower().isin(empty_markers)
            for idx in missing_mask[missing_mask].index[:100]:
                self.errors.append(ErrorDetail(
                    row_index=idx,
                    column=col,
                    value='[Empty]',
                    error_type='Missing Value',
                    message=f'The "{col}" field is empty.',
                    severity='medium',
                    category='missing_value',
                    explanation=f'An empty "{col}" field will fail API validation in downstream systems, cause NULL errors in database pipelines, and create gaps in any report that depends on this column.',
                    fix_hint=f'Fill in the correct value for "{col}". If the data is genuinely unavailable, agree on a system-wide placeholder (e.g., "N/A" for text fields or "0" for numeric fields).'
                ))

    def _validate_amounts(self):
        if 'amount' not in self.df.columns:
            return

        amounts = pd.to_numeric(self.df['amount'], errors='coerce')

        # Non-numeric values
        for idx, val in self.df['amount'].items():
            if val is None or str(val).strip() == '':
                continue
            try:
                float(str(val))
            except (ValueError, TypeError):
                self.errors.append(ErrorDetail(
                    row_index=idx, column='amount', value=val,
                    error_type='Non-Numeric Amount',
                    message=f'Amount "{val}" contains non-numeric characters.',
                    severity='high',
                    category='data_type',
                    explanation='Non-numeric amounts cause arithmetic failures in financial calculations, prevent SUM/AVG aggregations in reports, and will be rejected by most database type constraints.',
                    fix_hint='Remove currency symbols, commas, and letters. Use a plain decimal number (e.g., "150.00" instead of "$150.00" or "150,00").'
                ))

        # Semantic amount checks
        for idx, amount in amounts.items():
            if amount is None or pd.isna(amount):
                continue
            if amount < 0:
                self.errors.append(ErrorDetail(
                    row_index=idx, column='amount', value=self.df.at[idx, 'amount'],
                    error_type='Negative Amount',
                    message=f'Amount {amount:.2f} is negative.',
                    severity='high',
                    category='data_quality',
                    explanation='Negative transaction amounts are unusual in payment datasets. This may be a refund coded incorrectly, a sign error in the source system, or a data entry mistake.',
                    fix_hint='If this is a refund or credit, use a separate "transaction_type" column (e.g., "refund") and keep the amount positive — the standard in most financial systems.'
                ))
            elif amount == 0:
                self.errors.append(ErrorDetail(
                    row_index=idx, column='amount', value=self.df.at[idx, 'amount'],
                    error_type='Zero Amount',
                    message='Amount is zero — likely a test record or data entry error.',
                    severity='low',
                    category='data_quality',
                    explanation='Zero-value transactions are rarely valid in live payment datasets. They often indicate test records, failed authorizations, or accidental entries.',
                    fix_hint='Verify whether this is a real transaction. Remove test or placeholder rows before importing into production systems.'
                ))

        # Statistical outlier detection
        if len(amounts.dropna()) > 4:
            mean = amounts.mean()
            std = amounts.std()
            if std > 0:
                z_scores = (amounts - mean) / std
                for idx, z in z_scores.dropna().items():
                    if abs(z) > 3:
                        direction = 'above' if z > 0 else 'below'
                        self.errors.append(ErrorDetail(
                            row_index=idx, column='amount',
                            value=self.df.at[idx, 'amount'],
                            error_type='Statistical Anomaly',
                            message=f'Amount is {abs(z):.1f} std deviations {direction} the mean ({mean:.2f}).',
                            severity='medium',
                            category='statistical_anomaly',
                            explanation=f'This amount is {abs(z):.1f} standard deviations {"above" if z > 0 else "below"} the dataset average of {mean:.2f}. While it may be legitimate, such outliers are a common indicator of data entry errors or fraud.',
                            fix_hint=f'Cross-check against the original invoice or bank statement. If correct, flag it for compliance review. The average transaction in this dataset is {mean:.2f}.'
                        ))

    def _validate_currency_country(self):
        if 'currency' not in self.df.columns or 'country' not in self.df.columns:
            return

        for idx, row in self.df.iterrows():
            country = str(row.get('country') or '').strip()
            currency = str(row.get('currency') or '').strip()
            if country in COUNTRY_CURRENCY and currency and currency != COUNTRY_CURRENCY[country]:
                expected = COUNTRY_CURRENCY[country]
                self.errors.append(ErrorDetail(
                    row_index=idx, column='currency', value=currency,
                    error_type='Currency / Country Mismatch',
                    message=f'{country} transactions should use {expected}, but found "{currency}".',
                    severity='medium',
                    category='data_quality',
                    explanation=f'A transaction from {country} is expected to use {expected}. Using {currency} will cause incorrect exchange rate calculations and may trigger compliance flags in payment systems.',
                    fix_hint=f'Change the currency to "{expected}" for {country} transactions. If this is intentionally a foreign-currency transaction, update the "country" field to match.'
                ))

    def validate(self) -> ValidationResult:
        rules = self.config.get('rules', {})
        check_dates = rules.get('date_time', True)
        check_phones = rules.get('phone_numbers', True)
        check_duplicates = rules.get('duplicate_ids', True)
        check_missing = rules.get('required_fields', True)

        duplicate_count = int(self.df.duplicated().sum()) if check_duplicates else 0
        missing_count = int(self.df.isna().sum().sum()) if check_missing else 0
        countries = self.df['country'].dropna().unique().tolist() if 'country' in self.df.columns else []

        if check_dates:
            self._validate_dates()
        if check_phones:
            self._validate_phones()
        if check_duplicates:
            self._validate_duplicates()
        if check_missing:
            self._validate_missing()
        self._validate_amounts()
        self._validate_currency_country()

        # Error breakdown by category
        error_breakdown: Dict[str, int] = {}
        for e in self.errors:
            error_breakdown[e.category] = error_breakdown.get(e.category, 0) + 1

        # Quality score weighted by severity
        high_count = sum(1 for e in self.errors if e.severity == 'high')
        medium_count = sum(1 for e in self.errors if e.severity == 'medium')
        low_count = sum(1 for e in self.errors if e.severity == 'low')
        total_cells = max(self.total_rows * len(self.df.columns), 1)
        penalty = (high_count * 3 + medium_count * 1.5 + low_count * 0.5 + duplicate_count * 2) / total_cells * 100
        quality_score = round(max(0.0, 100.0 - penalty), 1)

        health = DatasetHealth(
            total_records=self.total_rows,
            columns=len(self.df.columns),
            countries_detected=countries,
            duplicate_count=duplicate_count,
            missing_values_count=missing_count,
            quality_score=quality_score,
            error_breakdown=error_breakdown
        )

        # Dynamic, specific insights
        insights: List[str] = []
        if duplicate_count > 0:
            pct = (duplicate_count / self.total_rows) * 100
            insights.append(f"Detected {duplicate_count} duplicate record{'s' if duplicate_count > 1 else ''} ({pct:.1f}% of data) — remove them to avoid double-counting in reports and billing.")

        date_errors = error_breakdown.get('date_format', 0)
        if date_errors > 0:
            insights.append(f"{date_errors} date formatting issue{'s' if date_errors > 1 else ''} found — inconsistent formats break time-series analytics, API integrations, and chronological sorting.")

        phone_errors = error_breakdown.get('phone_format', 0)
        if phone_errors > 0:
            insights.append(f"{phone_errors} phone number{'s are' if phone_errors > 1 else ' is'} invalid — missing country codes or incorrect lengths prevent use in CRM systems and international contact routing.")

        anomalies = error_breakdown.get('statistical_anomaly', 0)
        if anomalies > 0:
            insights.append(f"{anomalies} statistical {'anomalies' if anomalies > 1 else 'anomaly'} detected in transaction amounts — review for potential data entry errors or fraud signals.")

        dq_errors = error_breakdown.get('data_quality', 0)
        if dq_errors > 0:
            insights.append(f"{dq_errors} data quality issue{'s' if dq_errors > 1 else ''} found — including negative amounts or currency/country mismatches that will affect financial calculations.")

        type_errors = error_breakdown.get('data_type', 0)
        if type_errors > 0:
            insights.append(f"{type_errors} field{'s contain' if type_errors > 1 else ' contains'} wrong data types — non-numeric amounts will cause arithmetic failures in downstream pipelines.")

        pii_cols = [c for c, t in self._detect_schema().items() if 'PII' in t]
        if pii_cols:
            insights.append(f"PII Alert: {len(pii_cols)} column{'s contain' if len(pii_cols) > 1 else ' contains'} personal data ({', '.join(pii_cols)}) — enable Anonymize on Export to comply with GDPR/CCPA before sharing.")

        analytics: Dict[str, Any] = {}
        if 'payment_mode' in self.df.columns:
            counts = self.df['payment_mode'].value_counts()
            analytics['payment_mode_distribution'] = [{"name": str(k), "value": int(v)} for k, v in counts.items()]

        if 'country' in self.df.columns:
            counts = self.df['country'].value_counts()
            analytics['country_distribution'] = [{"name": str(k), "value": int(v)} for k, v in counts.items()]

        if pii_cols:
            analytics['pii_columns'] = pii_cols

        return ValidationResult(
            health=health,
            errors=self.errors,
            corrections=self.corrections,
            insights=insights,
            schema_detected=self._detect_schema(),
            analytics=analytics
        )
