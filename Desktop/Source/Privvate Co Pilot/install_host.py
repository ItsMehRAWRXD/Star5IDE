import json
import os
import sys

def get_install_path():
    if sys.platform.startswith("linux"):
        return os.path.join(os.path.expanduser('~'), '.config/google-chrome/NativeMessagingHosts')
    elif sys.platform.startswith("darwin"):
        return os.path.join(os.path.expanduser('~'), 'Library/Application Support/Google/Chrome/NativeMessagingHosts')
    elif sys.platform.startswith("win"):
        return None # Windows requires a registry entry, handled separately

def install_manifest(manifest_path):
    path = get_install_path()
    if path:
        if not os.path.exists(path):
            os.makedirs(path)
        with open(os.path.join(path, "com.my_company.my_application.json"), "w") as f:
            f.write(json.dumps(get_manifest(manifest_path)))
        print("Manifest installed successfully.")
    else:
        print("Install manifest manually on Windows via registry.")

def get_manifest(host_path):
    return {
        "name": "com.my_company.my_application",
        "description": "Custom desktop AI helper (Python)",
        "path": os.path.abspath(host_path),
        "type": "stdio",
        "allowed_origins": [
            # Replace with your Chrome extension ID
            "chrome-extension://knldjmfmopnpolahpmmgbagdohdnhkik/"
        ]
    }

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    host_path = os.path.join(script_dir, "nm_host.py")
    install_manifest(host_path)

