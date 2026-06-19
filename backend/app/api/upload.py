from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse
import pandas as pd
import io
from app.services.validator import DatasetValidator
from app.services.demo_data import get_demo_dataset_csv
from app.schemas.dataset import ValidationResult

router = APIRouter()

@router.post("/upload", response_model=ValidationResult)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")
    
    validator = DatasetValidator(df)
    result = validator.validate()
    return result

@router.get("/demo/{dataset_name}")
async def get_demo_dataset(dataset_name: str):
    csv_str = get_demo_dataset_csv(dataset_name)
    if not csv_str:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return PlainTextResponse(csv_str, media_type="text/csv")

@router.post("/chunk")
async def chunk_dataset(file: UploadFile = File(...), chunk_size: int = 1000):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")
    
    total_records = len(df)
    chunks = []
    
    for i in range(0, total_records, chunk_size):
        chunk_df = df.iloc[i:i + chunk_size]
        chunks.append({
            "chunk_index": i // chunk_size,
            "start_row": i,
            "end_row": min(i + chunk_size, total_records),
            "records": len(chunk_df),
            "size_bytes": chunk_df.memory_usage(deep=True).sum()
        })
        
    return {
        "original_file": file.filename,
        "total_records": total_records,
        "chunk_count": len(chunks),
        "chunk_size": chunk_size,
        "chunks": chunks
    }
