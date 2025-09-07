from flask import Flask, Blueprint, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid
import os
import shutil
import json

# Initialize Flask app
app = Flask(__name__)

# Database Configuration - Use Neon PostgreSQL in production
database_url = os.environ.get('DATABASE_URL', 'sqlite:///crypting_saas.db')
if database_url.startswith('postgresql://'):
    # Ensure SSL is required for Neon
    if 'sslmode=require' not in database_url:
        database_url += '?sslmode=require'

app.config["SECRET_KEY"] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get('JWT_SECRET', 'jwt-secret-key-change-in-production')
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max

# CORS Configuration for Netlify
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,https://precious-cat-89543d.netlify.app').split(',')

# Ensure upload directory exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, origins=cors_origins)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default="client")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    builds = db.relationship("Build", backref="user", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Build(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_size = db.Column(db.Integer)
    crypted_size = db.Column(db.Integer)
    status = db.Column(db.String(20), default="processing")
    detection_rate = db.Column(db.Float)
    stub_config = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    download_url = db.Column(db.String(255))

# Create database tables
with app.app_context():
    db.create_all()

# Routes
@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
    
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400
    
    # First user becomes admin
    is_admin = User.query.count() == 0
    
    user = User(
        username=data["username"],
        email=data["email"],
        role="admin" if is_admin else "client"
    )
    user.set_password(data["password"])
    
    db.session.add(user)
    db.session.commit()
    
    token = create_access_token(identity=user.id)
    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    })

@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data["username"]).first()
    
    if user and user.check_password(data["password"]):
        token = create_access_token(identity=user.id)
        return jsonify({
            "success": True,
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        })
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/v1/crypt", methods=["POST"])
@jwt_required()
def crypt_file():
    user_id = get_jwt_identity()
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    config = request.form.get("config", "{}")
    
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    # Generate unique build ID
    build_id = str(uuid.uuid4())
    
    # Save and process file
    filename = f"{build_id}_{file.filename}"
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)
    
    # For now, just copy the file as "crypted" (placeholder)
    # In production, this would call your RawrZ C++ stub engine
    crypted_filename = f"crypted_{build_id}_{file.filename}"
    crypted_file_path = os.path.join(app.config["UPLOAD_FOLDER"], crypted_filename)
    shutil.copy2(file_path, crypted_file_path)
    
    # Save build record
    build = Build(
        user_id=user_id,
        filename=file.filename,
        original_size=os.path.getsize(file_path),
        crypted_size=os.path.getsize(crypted_file_path),
        status="completed",
        stub_config=config,
        download_url=f"/api/v1/download/{build_id}"
    )
    db.session.add(build)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "build_id": build_id,
        "download_url": f"/api/v1/download/{build_id}"
    })

@app.route("/api/v1/download/<build_id>", methods=["GET"])
@jwt_required()
def download_file(build_id):
    user_id = get_jwt_identity()
    build = Build.query.filter_by(id=build_id).first()
    
    if not build or build.user_id != user_id:
        return jsonify({"error": "File not found"}), 404
    
    crypted_filename = f"crypted_{build_id}_{build.filename}"
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], crypted_filename)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    return send_file(file_path, as_attachment=True, download_name=f"crypted_{build.filename}")

@app.route("/api/v1/builds", methods=["GET"])
@jwt_required()
def get_user_builds():
    user_id = get_jwt_identity()
    builds = Build.query.filter_by(user_id=user_id).order_by(Build.created_at.desc()).all()
    
    return jsonify([{
        "id": b.id,
        "filename": b.filename,
        "status": b.status,
        "created_at": b.created_at.isoformat(),
        "download_url": b.download_url
    } for b in builds])

@app.route("/")
def home():
    return jsonify({
        "message": "Crypting SaaS Platform API",
        "status": "running",
        "endpoints": {
            "auth": "/auth/register, /auth/login",
            "api": "/api/v1/crypt, /api/v1/builds, /api/v1/download/<id>"
        }
    })

if __name__ == "__main__":
    print("🚀 Starting Crypting SaaS Platform...")
    print("📊 API will be available at: http://localhost:5000")
    print("🔐 First user to register will become admin")
    app.run(host="0.0.0.0", port=5000, debug=True)
