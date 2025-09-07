#!/usr/bin/env python3
"""
ZenCrypto Payload Extractor
Extracts encrypted payloads from ZenCrypto stub executables.
Works on Windows, Linux, and macOS with stock CPython.

Usage: python extract_payload.py <packed.exe> <outfile>
Example: python extract_payload.py calc_stub.exe payload.bin
"""

import sys
import struct
import pathlib

def extract_payload(path_in, path_out):
    """Extract encrypted payload from a ZenCrypto stub executable."""
    try:
        # Read the entire file
        blob = pathlib.Path(path_in).read_bytes()
        print(f"Read {len(blob)} bytes from {path_in}")
        
        # Find the ZEN_RESOURCES marker
        marker = b'ZEN_RESOURCES'
        off = blob.find(marker)
        if off == -1:
            raise ValueError("ZEN_RESOURCES marker not found")
        
        print(f"Found marker at offset: {off}")
        off += len(marker)
        
        # Extract encrypted data length and data
        if off + 4 > len(blob):
            raise ValueError("File truncated - cannot read data length")
        
        (data_len,) = struct.unpack_from('<I', blob, off)
        off += 4
        print(f"Encrypted data size: {data_len} bytes")
        
        if off + data_len > len(blob):
            raise ValueError("File truncated - cannot read encrypted data")
        
        encrypted_data = blob[off:off + data_len]
        off += data_len
        
        # Skip key (length + data)
        if off + 4 > len(blob):
            raise ValueError("File truncated - cannot read key length")
        
        (key_len,) = struct.unpack_from('<I', blob, off)
        off += 4
        print(f"Key size: {key_len} bytes")
        
        if off + key_len > len(blob):
            raise ValueError("File truncated - cannot read key")
        
        key = blob[off:off + key_len]
        off += key_len
        
        # Skip IV (length + data)
        if off + 4 > len(blob):
            raise ValueError("File truncated - cannot read IV length")
        
        (iv_len,) = struct.unpack_from('<I', blob, off)
        off += 4
        print(f"IV size: {iv_len} bytes")
        
        if off + iv_len > len(blob):
            raise ValueError("File truncated - cannot read IV")
        
        iv = blob[off:off + iv_len]
        off += iv_len
        
        # Verify end marker
        end_marker = b'END_ZEN_RESOURCES'
        if off + len(end_marker) > len(blob):
            raise ValueError("File truncated - cannot read end marker")
        
        if blob[off:off + len(end_marker)] != end_marker:
            raise ValueError("END_ZEN_RESOURCES marker mismatch")
        
        print("End marker verified successfully")
        
        # Write the encrypted data to output file
        pathlib.Path(path_out).write_bytes(encrypted_data)
        print(f"Successfully extracted {len(encrypted_data)} bytes to: {path_out}")
        print(f"Key: {key.hex()}")
        print(f"IV: {iv.hex()}")
        print("Note: This is encrypted data. Decrypt with AES-256-CBC using the key/IV above.")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    if len(sys.argv) != 3:
        print("Usage: python extract_payload.py <packed.exe> <outfile>")
        print("Example: python extract_payload.py calc_stub.exe payload.bin")
        sys.exit(1)
    
    path_in = sys.argv[1]
    path_out = sys.argv[2]
    
    if not pathlib.Path(path_in).exists():
        print(f"Error: Input file '{path_in}' not found")
        sys.exit(1)
    
    print("ZenCrypto Python Payload Extractor")
    print(f"Input: {path_in}")
    print(f"Output: {path_out}")
    print("-" * 50)
    
    if extract_payload(path_in, path_out):
        print("Extraction completed successfully!")
        sys.exit(0)
    else:
        print("Extraction failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
