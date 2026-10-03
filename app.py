import sys
import os
from flask import Flask, request, jsonify, session, redirect, send_from_directory

# Add pipeline to python path so we can import rag_pipeline
sys.path.append(os.path.join(os.path.dirname(__file__), 'pipeline'))
from rag_pipeline import ask_question

app = Flask(__name__, static_folder='frontend', static_url_path='')
app.secret_key = 'super_secret_development_key' # For session management

# --- Routes for Frontend HTML ---

@app.route('/')
def index():
    if 'username' in session:
        return redirect('/chat.html')
    return redirect('/login.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('frontend', path)

# --- API Endpoints ---

@app.route('/api/auth/login/', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    # Hardcoded test credentials
    if username == 'admin' and password == 'admin':
        session['username'] = username
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/auth/me/', methods=['GET'])
def get_me():
    if 'username' in session:
        return jsonify({"username": session['username']})
    else:
        return jsonify({"error": "Unauthorized"}), 401

@app.route('/api/auth/logout/', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({"success": True})

@app.route('/api/chat/', methods=['POST'])
def chat():
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    question = data.get('question')

    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        # Call the existing RAG pipeline
        result = ask_question(question)
        return jsonify({
            "success": True,
            "answer": result.get("answer", ""),
            "sources": result.get("sources", [])
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app
    app.run(port=5000, debug=True)
