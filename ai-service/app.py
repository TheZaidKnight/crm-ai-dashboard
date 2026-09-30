import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

def create_model(window_size):
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(16, activation='relu', input_shape=(window_size,)),
        tf.keras.layers.Dense(8, activation='relu'),
        tf.keras.layers.Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    return model

@app.route('/api/forecast', methods=['POST'])
def forecast():
    try:
        body = request.get_json()
        if not body or 'data' not in body:
            return jsonify({"error": "Missing 'data' in request body"}), 400
        
        data = body['data']
        periods = body.get('periods', 3)

        if not isinstance(data, list) or len(data) < 4:
            return jsonify({"error": "'data' must be a list of at least 4 numbers"}), 400
            
        data_arr = np.array(data, dtype=np.float32)
        
        # Manual Min-Max Scaling
        data_min = np.min(data_arr)
        data_max = np.max(data_arr)
        
        if data_max == data_min:
            scaled_data = np.zeros_like(data_arr)
        else:
            scaled_data = (data_arr - data_min) / (data_max - data_min)
            
        # Prepare sliding window data
        window_size = min(3, len(data) - 1)
        X, y = [], []
        for i in range(len(scaled_data) - window_size):
            X.append(scaled_data[i:i+window_size])
            y.append(scaled_data[i+window_size])
            
        X = np.array(X)
        y = np.array(y)
        
        # Train model
        model = create_model(window_size)
        model.fit(X, y, epochs=10, verbose=0)
        
        # Generate predictions iteratively
        current_window = scaled_data[-window_size:]
        predictions = []
        
        for _ in range(periods):
            pred_input = current_window.reshape(1, window_size)
            pred = model.predict(pred_input, verbose=0)[0][0]
            predictions.append(pred)
            current_window = np.append(current_window[1:], pred)
            
        # Inverse transform
        if data_max == data_min:
            forecast_result = np.full(periods, float(data_min)).tolist()
        else:
            forecast_result = [float((p * (data_max - data_min)) + data_min) for p in predictions]
            
        # Get model summary
        string_list = []
        model.summary(print_fn=lambda x: string_list.append(x))
        model_summary = "\n".join(string_list)
        
        return jsonify({
            "historical": data,
            "forecast": forecast_result,
            "periods": periods,
            "model_summary": model_summary
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
