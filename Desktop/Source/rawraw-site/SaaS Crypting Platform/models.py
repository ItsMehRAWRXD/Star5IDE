# backend/app/models.py
from datetime import datetime
from . import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default='client')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    builds = db.relationship('Build', backref='user', lazy=True)

class Build(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_size = db.Column(db.Integer)
    crypted_size = db.Column(db.Integer)
    status = db.Column(db.String(20), default='processing')
    detection_rate = db.Column(db.Float)
    stub_config = db.Column(db.JSON)  # Stores obfuscation settings
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    download_url = db.Column(db.String(255))