# backend/app/routes/admin.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, Build, db

bp = Blueprint('admin', __name__, url_prefix='/admin')

@bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user = User.query.get(get_jwt_identity())
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'role': u.role,
        'build_count': len(u.builds)
    } for u in users])

@bp.route('/builds', methods=['GET'])
@jwt_required()
def get_all_builds():
    current_user = User.query.get(get_jwt_identity())
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    page = request.args.get('page', 1, type=int)
    builds = Build.query.order_by(Build.created_at.desc()).paginate(page=page, per_page=20)
    
    return jsonify({
        'builds': [{
            'id': b.id,
            'username': b.user.username,
            'filename': b.filename,
            'status': b.status,
            'detection_rate': b.detection_rate,
            'created_at': b.created_at.isoformat()
        } for b in builds.items],
        'total': builds.total,
        'pages': builds.pages
    })