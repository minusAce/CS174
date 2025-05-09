from flask import Flask, request, jsonify, render_template
import requests
import sqlite3
from datetime import datetime, timedelta
import json

app = Flask(__name__)
API_KEY = "c3e0f34ed5f9202416092c3b61e72f415c727e35"
DB_NAME = "History.db"


def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS SearchHistory (
id INTEGER PRIMARY KEY AUTOINCREMENT,
ticker TEXT NOT NULL,
timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')
        conn.execute('''CREATE TABLE IF NOT EXISTS CachedStockData (
ticker TEXT PRIMARY KEY,
company_json TEXT,
stock_json TEXT,
last_updated DATETIME
        )''')


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/search')
def search():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "Ticker is required"}), 400

    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        c.execute("SELECT * FROM CachedStockData WHERE ticker = ?", (ticker,))
        row = c.fetchone()

        if row:
            last_updated = datetime.fromisoformat(row["last_updated"])
            if datetime.utcnow() - last_updated < timedelta(minutes=15):
                company = json.loads(row["company_json"])
                stock = json.loads(row["stock_json"])
                c.execute("INSERT INTO SearchHistory (ticker) VALUES (?)", (ticker,))
                conn.commit()
                return jsonify({
                    "company": company,
                    "stock": stock,
                    "served_from_cache": True
                })

        company_url = f"https://api.tiingo.com/tiingo/daily/{ticker}?token={API_KEY}"
        stock_url = f"https://api.tiingo.com/iex/{ticker}?token={API_KEY}"

        company_res = requests.get(company_url)
        stock_res = requests.get(stock_url)

        if company_res.status_code != 200 or stock_res.status_code != 200:
            return jsonify({"error": "Error: No record has been found, please enter a valid symbol."})

        company = company_res.json()
        stock = stock_res.json()[0]

        c.execute('''INSERT OR REPLACE INTO CachedStockData (ticker, company_json, stock_json, last_updated)
                     VALUES (?, ?, ?, ?)''',
                  (ticker, json.dumps(company), json.dumps(stock), datetime.utcnow().isoformat()))

        c.execute("INSERT INTO SearchHistory (ticker) VALUES (?)", (ticker,))
        conn.commit()

        return jsonify({
            "company": company,
            "stock": stock,
            "served_from_cache": False
        })


@app.route('/history')
def history():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT ticker, timestamp FROM SearchHistory ORDER BY timestamp DESC LIMIT 10")
        rows = cursor.fetchall()
    return jsonify([{"ticker": r[0], "timestamp": r[1]} for r in rows])

init_db()
if __name__ == '__main__':
    app.run(debug=True)
