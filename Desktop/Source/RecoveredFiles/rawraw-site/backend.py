# backend/app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    from .routes import auth, builds, admin, api
    app.register_blueprint(auth.bp)
    app.register_blueprint(builds.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(api.bp)
    
    return app