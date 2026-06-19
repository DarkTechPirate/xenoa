from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
import pandas as pd
import io
import json
import psutil
import sys
import os

# Add the app directory to the python path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.validator import DatasetValidator
from app.services.demo_data import get_demo_dataset_csv

app = Flask(__name__)
CORS(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    cpu_percent = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    return jsonify({
        "status": "ok",
        "cpu_percent": cpu_percent,
        "memory_percent": mem.percent
    })

@app.route("/api/upload", methods=["POST"])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"detail": "No file uploaded"}), 400
    
    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({"detail": "Only CSV files are allowed."}), 400
    
    try:
        content = file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        return jsonify({"detail": f"Error reading CSV: {str(e)}"}), 400
        
    config = {}
    config_str = request.form.get('config')
    if config_str:
        try:
            config = json.loads(config_str)
        except:
            pass
            
    # Check Server Load
    cpu_load = psutil.cpu_percent(interval=0.1)
    mem_load = psutil.virtual_memory().percent
    server_stressed = cpu_load > 85 or mem_load > 85
            
    # Check if chunking is enabled and required, OR if server is stressed
    chunk_config = config.get('chunkConfig', {})
    is_chunking_enabled = chunk_config.get('enableChunking')
    threshold = chunk_config.get('thresholdRows', 100000)
    chunk_size = chunk_config.get('chunkSize', 50000)
    
    if server_stressed and len(df) > 5000:
        # Force chunking on high load
        is_chunking_enabled = True
        threshold = 0
        chunk_size = 5000
        
    if is_chunking_enabled and len(df) > threshold:
        # Create chunks
            chunks = []
            for i in range(0, len(df), chunk_size):
                chunk_df = df.iloc[i:i + chunk_size]
                chunk_buffer = io.StringIO()
                chunk_df.to_csv(chunk_buffer, index=False)
                
                chunks.append({
                    "chunk_index": i // chunk_size + 1,
                    "row_count": len(chunk_df),
                    "size_bytes": len(chunk_buffer.getvalue().encode('utf-8'))
                })
                
            return jsonify({
                "is_chunked": True,
                "original_file": file.filename,
                "total_records": len(df),
                "chunk_count": len(chunks),
                "chunk_size": chunk_size,
                "chunks": chunks,
                "server_stressed": server_stressed,
                "message": "Server load is high. Auto-chunking engaged." if server_stressed else f"File exceeded {threshold} rows and was split into {len(chunks)} chunks."
            })
    
    validator = DatasetValidator(df, config)
    result = validator.validate()
    
    # Convert Pydantic models to dict if they are pydantic models
    # Wait, in Python 3.14 the Pydantic schemas failed to build so they might crash if imported.
    # Let's see if we can just return the data structure directly.
    # Since validator uses Pydantic in its signature, it might crash.
    # Actually, if we couldn't install Pydantic, the validator import will fail.
    # Let's redefine validator here to use pure dicts instead of Pydantic.
    return jsonify(result.model_dump() if hasattr(result, "model_dump") else result.dict())

@app.route("/api/demo/<dataset_name>", methods=["GET"])
def get_demo_dataset(dataset_name):
    csv_str = get_demo_dataset_csv(dataset_name)
    if not csv_str:
        return jsonify({"detail": "Dataset not found"}), 404
    
    response = make_response(csv_str)
    response.headers["Content-Type"] = "text/csv"
    return response

@app.route("/api/chunk", methods=["POST"])
def chunk_dataset():
    if 'file' not in request.files:
        return jsonify({"detail": "No file uploaded"}), 400
    
    file = request.files['file']
    chunk_size = int(request.form.get("chunk_size", 1000))
    
    if not file.filename.endswith('.csv'):
        return jsonify({"detail": "Only CSV files are allowed."}), 400
    
    try:
        content = file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        return jsonify({"detail": f"Error reading CSV: {str(e)}"}), 400
    
    total_records = len(df)
    chunks = []
    
    for i in range(0, total_records, chunk_size):
        chunk_df = df.iloc[i:i + chunk_size]
        chunks.append({
            "chunk_index": i // chunk_size,
            "start_row": i,
            "end_row": min(i + chunk_size, total_records),
            "records": len(chunk_df),
            "size_bytes": int(chunk_df.memory_usage(deep=True).sum())
        })
        
    return jsonify({
        "original_file": file.filename,
        "total_records": total_records,
        "chunk_count": len(chunks),
        "chunk_size": chunk_size,
        "chunks": chunks
    })

@app.route("/api/export", methods=["POST"])
def export_dataset():
    if 'file' not in request.files:
        return jsonify({"detail": "No file uploaded"}), 400
    
    file = request.files['file']
    config_str = request.form.get('config')
    corrections_str = request.form.get('corrections')
    anonymize = request.form.get('anonymize', 'false').lower() == 'true'
    
    config = json.loads(config_str) if config_str else {}
    corrections = json.loads(corrections_str) if corrections_str else []
    
    try:
        content = file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        return jsonify({"detail": f"Error reading CSV: {str(e)}"}), 400
        
    mappings = {v: k for k, v in config.get('mappings', {}).items() if v}
    if mappings:
        df = df.rename(columns=mappings)
        
    for correction in corrections:
        row_idx = correction.get('row_index')
        col = correction.get('column')
        val = correction.get('suggested_value')
        if row_idx is not None and col in df.columns:
            df.at[row_idx, col] = val
            
    if anonymize:
        # Re-detect schema to find PII columns
        validator = DatasetValidator(df)
        schema = validator._detect_schema()
        pii_cols = [c for c, t in schema.items() if 'PII' in t]
        
        for col in pii_cols:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: f"{str(x)[0]}***{str(x)[-1]}" if len(str(x)) > 2 else "***")
                
    csv_out = io.StringIO()
    df.to_csv(csv_out, index=False)
    
    response = make_response(csv_out.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=cleaned_dataset.csv"
    response.headers["Content-Type"] = "text/csv"
    return response

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)
