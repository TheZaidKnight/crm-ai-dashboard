# AI Forecasting Microservice

AI Forecasting Microservice for the CRM Dashboard.

## Setup
```bash
pip install -r requirements.txt
```

## Run
Development:
```bash
python app.py
```

Production:
```bash
gunicorn app:app -b 0.0.0.0:5001
```

## API Endpoints
- `GET /api/health`: Health check, returns `{"status": "healthy"}`
- `POST /api/forecast`: Generates revenue forecasts.
  - Body: `{ "data": [1000, 1200, ...], "periods": 3 }`
  - Returns: `{ "historical": [...], "forecast": [...], "periods": 3, "model_summary": "..." }`

**Note:** TensorFlow requires Python 3.9 - 3.12.
