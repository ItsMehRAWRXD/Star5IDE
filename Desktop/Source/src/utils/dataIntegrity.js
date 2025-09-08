// RawrZ Security Platform - Data Integrity & Validation System
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');
const { reverseTracer } = require('./reverseTracer');

class DataIntegrityValidator {
    constructor() {
        this.checksums = new Map();
        this.validationLog = [];
        this.preEncryptionSnapshots = new Map();
        this.postEncryptionSnapshots = new Map();
        this.malformityPatterns = new Map();
        
        // Known malformity patterns
        this.knownPatterns = {
            'ROE_FONT_CORRUPTION': /ROE.*font|font.*ROE/i,
            'ENCODING_ISSUES': /[^\x00-\x7F]/g,
            'MENU_CORRUPTION': /menu.*corrupt|corrupt.*menu/i,
            'JSON_MALFORMED': /[{}[\]]/g,
            'UNICODE_ISSUES': /[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g
        };
    }

    // CRC32 checksum calculation
    calculateCRC32(data) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
        const crc = require('crc32');
        return crc(buffer).toString(16);
    }

    // SHA256 checksum for stronger validation
    calculateSHA256(data) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    // Validate data before encryption
    validateBeforeEncryption(data, options = {}) {
        const validation = {
            timestamp: new Date().toISOString(),
            operation: 'pre-encryption',
            valid: true,
            errors: [],
            warnings: [],
            checksums: {}
        };

        try {
            // Check if data exists
            if (!data) {
                validation.valid = false;
                validation.errors.push('No data provided for encryption');
                return validation;
            }

            // Calculate checksums
            validation.checksums.crc32 = this.calculateCRC32(data);
            validation.checksums.sha256 = this.calculateSHA256(data);
            validation.checksums.size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf8');

            // Check for malformed data
            if (typeof data === 'string') {
                // Check for null bytes
                if (data.includes('\0')) {
                    validation.warnings.push('Data contains null bytes');
                }

                // Check for invalid UTF-8 sequences
                try {
                    Buffer.from(data, 'utf8').toString('utf8');
                } catch (e) {
                    validation.valid = false;
                    validation.errors.push('Invalid UTF-8 sequence detected');
                }

                // Check for suspicious patterns
                const suspiciousPatterns = [
                    /<script[^>]*>/gi,
                    /javascript:/gi,
                    /data:text\/html/gi,
                    /eval\s*\(/gi,
                    /document\./gi
                ];

                suspiciousPatterns.forEach((pattern, index) => {
                    if (pattern.test(data)) {
                        validation.warnings.push(`Suspicious pattern detected: ${pattern.source}`);
                    }
                });
            }

            // Check data size limits
            if (validation.checksums.size > 100 * 1024 * 1024) { // 100MB limit
                validation.warnings.push('Large data size detected (>100MB)');
            }

            // Store checksum for post-encryption validation
            this.checksums.set(validation.checksums.crc32, {
                original: data,
                timestamp: validation.timestamp,
                size: validation.checksums.size
            });

        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Validation error: ${error.message}`);
        }

        this.validationLog.push(validation);
        return validation;
    }

    // Validate data after encryption
    validateAfterEncryption(originalData, encryptedData, options = {}) {
        const validation = {
            timestamp: new Date().toISOString(),
            operation: 'post-encryption',
            valid: true,
            errors: [],
            warnings: [],
            checksums: {}
        };

        try {
            // Calculate checksums for encrypted data
            validation.checksums.encrypted_crc32 = this.calculateCRC32(encryptedData);
            validation.checksums.encrypted_sha256 = this.calculateSHA256(encryptedData);
            validation.checksums.encrypted_size = Buffer.isBuffer(encryptedData) ? encryptedData.length : Buffer.byteLength(encryptedData, 'utf8');

            // Verify encryption actually occurred
            if (originalData === encryptedData) {
                validation.valid = false;
                validation.errors.push('Data was not encrypted - input equals output');
            }

            // Check if encrypted data is different from original
            const originalCRC = this.calculateCRC32(originalData);
            if (validation.checksums.encrypted_crc32 === originalCRC) {
                validation.valid = false;
                validation.errors.push('Encrypted data has same CRC32 as original');
            }

            // Check for proper encryption characteristics
            if (typeof encryptedData === 'string') {
                // Check for base64 encoding
                const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
                if (!base64Pattern.test(encryptedData)) {
                    validation.warnings.push('Encrypted data does not appear to be base64 encoded');
                }

                // Check for entropy (encrypted data should have high entropy)
                const entropy = this.calculateEntropy(encryptedData);
                if (entropy < 4.0) {
                    validation.warnings.push(`Low entropy detected in encrypted data: ${entropy.toFixed(2)}`);
                }
            }

            // Verify size change (encrypted data should be different size)
            const originalSize = Buffer.isBuffer(originalData) ? originalData.length : Buffer.byteLength(originalData, 'utf8');
            if (validation.checksums.encrypted_size === originalSize) {
                validation.warnings.push('Encrypted data has same size as original');
            }

        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Post-encryption validation error: ${error.message}`);
        }

        this.validationLog.push(validation);
        return validation;
    }

    // Calculate entropy of data
    calculateEntropy(data) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
        const frequencies = {};
        
        for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i];
            frequencies[byte] = (frequencies[byte] || 0) + 1;
        }

        let entropy = 0;
        const length = buffer.length;
        
        for (const freq of Object.values(frequencies)) {
            const probability = freq / length;
            entropy -= probability * Math.log2(probability);
        }

        return entropy;
    }

    // Validate API request data
    validateAPIRequest(req, res, next) {
        const validation = {
            timestamp: new Date().toISOString(),
            operation: 'api-request',
            valid: true,
            errors: [],
            warnings: [],
            checksums: {}
        };

        try {
            // Check request body
            if (req.body) {
                const bodyString = JSON.stringify(req.body);
                validation.checksums.request_crc32 = this.calculateCRC32(bodyString);
                validation.checksums.request_sha256 = this.calculateSHA256(bodyString);
                validation.checksums.request_size = Buffer.byteLength(bodyString, 'utf8');

                // Check for malformed JSON
                try {
                    JSON.parse(bodyString);
                } catch (e) {
                    validation.valid = false;
                    validation.errors.push('Malformed JSON in request body');
                }

                // Check for suspicious content
                if (bodyString.includes('eval(') || bodyString.includes('Function(')) {
                    validation.warnings.push('Suspicious JavaScript code detected in request');
                }
            }

            // Check request headers
            const headers = JSON.stringify(req.headers);
            validation.checksums.headers_crc32 = this.calculateCRC32(headers);

            // Check for missing required headers
            if (!req.headers['content-type'] && req.method === 'POST') {
                validation.warnings.push('Missing Content-Type header for POST request');
            }

            // Log validation
            this.validationLog.push(validation);

            // Add validation info to request
            req.dataIntegrity = validation;

            next();

        } catch (error) {
            validation.valid = false;
            validation.errors.push(`API validation error: ${error.message}`);
            this.validationLog.push(validation);
            
            res.status(400).json({
                error: 'Request validation failed',
                details: validation.errors,
                timestamp: validation.timestamp
            });
        }
    }

    // Validate API response data
    validateAPIResponse(data, options = {}) {
        const validation = {
            timestamp: new Date().toISOString(),
            operation: 'api-response',
            valid: true,
            errors: [],
            warnings: [],
            checksums: {}
        };

        try {
            // Calculate response checksums
            const responseString = JSON.stringify(data);
            validation.checksums.response_crc32 = this.calculateCRC32(responseString);
            validation.checksums.response_sha256 = this.calculateSHA256(responseString);
            validation.checksums.response_size = Buffer.byteLength(responseString, 'utf8');

            // Check for proper JSON structure
            try {
                JSON.parse(responseString);
            } catch (e) {
                validation.valid = false;
                validation.errors.push('Invalid JSON in response');
            }

            // Check for required response fields
            if (data.status === undefined) {
                validation.warnings.push('Response missing status field');
            }

            // Check response size
            if (validation.checksums.response_size > 10 * 1024 * 1024) { // 10MB limit
                validation.warnings.push('Large response size detected (>10MB)');
            }

        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Response validation error: ${error.message}`);
        }

        this.validationLog.push(validation);
        return validation;
    }

    // Validate file integrity
    validateFile(filePath) {
        const validation = {
            timestamp: new Date().toISOString(),
            operation: 'file-validation',
            valid: true,
            errors: [],
            warnings: [],
            checksums: {}
        };

        try {
            if (!fs.existsSync(filePath)) {
                validation.valid = false;
                validation.errors.push(`File not found: ${filePath}`);
                return validation;
            }

            const stats = fs.statSync(filePath);
            validation.checksums.file_size = stats.size;
            validation.checksums.file_modified = stats.mtime.toISOString();

            // Read file and calculate checksums
            const fileBuffer = fs.readFileSync(filePath);
            validation.checksums.file_crc32 = this.calculateCRC32(fileBuffer);
            validation.checksums.file_sha256 = this.calculateSHA256(fileBuffer);

            // Check for empty file
            if (stats.size === 0) {
                validation.warnings.push('File is empty');
            }

            // Check for suspicious file extensions
            const ext = path.extname(filePath).toLowerCase();
            const suspiciousExts = ['.exe', '.bat', '.cmd', '.scr', '.pif'];
            if (suspiciousExts.includes(ext)) {
                validation.warnings.push(`Suspicious file extension: ${ext}`);
            }

        } catch (error) {
            validation.valid = false;
            validation.errors.push(`File validation error: ${error.message}`);
        }

        this.validationLog.push(validation);
        return validation;
    }

    // Get validation log
    getValidationLog() {
        return this.validationLog;
    }

    // Clear validation log
    clearValidationLog() {
        this.validationLog = [];
        this.checksums.clear();
    }

    // Detect malformities in data
    detectMalformities(data) {
        const malformities = [];
        const dataStr = data.toString();

        // Check for known malformity patterns
        for (const [patternName, pattern] of Object.entries(this.knownPatterns)) {
            if (pattern.test(dataStr)) {
                malformities.push({
                    type: patternName,
                    severity: this.getSeverityLevel(patternName),
                    description: `Malformity pattern detected: ${patternName}`,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Check for encoding issues
        if (this.detectEncodingCorruption(dataStr)) {
            malformities.push({
                type: 'ENCODING_CORRUPTION',
                severity: 'HIGH',
                description: 'Character encoding corruption detected',
                timestamp: new Date().toISOString()
            });
        }

        // Check for null bytes
        if (dataStr.includes('\x00')) {
            malformities.push({
                type: 'NULL_BYTES',
                severity: 'MEDIUM',
                description: 'Null bytes found in data',
                timestamp: new Date().toISOString()
            });
        }

        // Check for control characters
        const controlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
        const matches = dataStr.match(controlChars);
        if (matches) {
            malformities.push({
                type: 'CONTROL_CHARACTERS',
                severity: 'LOW',
                description: `Control characters found: ${matches.length}`,
                timestamp: new Date().toISOString()
            });
        }

        return malformities;
    }

    // Detect encoding corruption
    detectEncodingCorruption(data) {
        try {
            const buffer = Buffer.from(data, 'utf8');
            const roundTrip = buffer.toString('utf8');
            return roundTrip !== data;
        } catch (error) {
            return true;
        }
    }

    // Get severity level for malformity type
    getSeverityLevel(patternType) {
        const severityMap = {
            'ROE_FONT_CORRUPTION': 'CRITICAL',
            'MENU_CORRUPTION': 'HIGH',
            'ENCODING_CORRUPTION': 'HIGH',
            'ENCODING_ISSUES': 'MEDIUM',
            'NULL_BYTES': 'MEDIUM',
            'CONTROL_CHARACTERS': 'LOW',
            'JSON_MALFORMED': 'MEDIUM',
            'UNICODE_ISSUES': 'LOW'
        };
        return severityMap[patternType] || 'UNKNOWN';
    }

    // Pre-encryption integrity check with malformity detection
    async preEncryptionCheck(data, operationId) {
        const checksums = {
            crc32: this.calculateCRC32(data),
            sha256: this.calculateSHA256(data),
            size: Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf8')
        };
        
        const malformities = this.detectMalformities(data);
        
        this.preEncryptionSnapshots.set(operationId, {
            data: data.toString(),
            checksums,
            malformities,
            timestamp: Date.now()
        });

        // Track operation in reverse tracer
        reverseTracer.trackOperation('PRE_ENCRYPTION_CHECK', `Operation ${operationId}`, data);

        if (malformities.length > 0) {
            logger.error(`🚨 PRE-ENCRYPTION MALFORMITIES DETECTED: ${operationId}`);
            malformities.forEach(m => {
                logger.error(`  - ${m.type} (${m.severity}): ${m.description}`);
                reverseTracer.recordCorruption(
                    'preEncryption', 
                    m.description, 
                    null, 
                    m.type
                );
            });
        }

        return { checksums, malformities };
    }

    // Post-encryption integrity check with malformity detection
    async postEncryptionCheck(encryptedData, operationId) {
        const checksums = {
            crc32: this.calculateCRC32(encryptedData),
            sha256: this.calculateSHA256(encryptedData),
            size: Buffer.isBuffer(encryptedData) ? encryptedData.length : Buffer.byteLength(encryptedData, 'utf8')
        };
        
        const malformities = this.detectMalformities(encryptedData);
        
        this.postEncryptionSnapshots.set(operationId, {
            data: encryptedData.toString(),
            checksums,
            malformities,
            timestamp: Date.now()
        });

        // Track operation in reverse tracer
        reverseTracer.trackOperation('POST_ENCRYPTION_CHECK', `Operation ${operationId}`, encryptedData);

        // Compare with pre-encryption state
        const preSnapshot = this.preEncryptionSnapshots.get(operationId);
        if (preSnapshot) {
            const comparison = this.comparePrePostEncryption(preSnapshot, {
                data: encryptedData.toString(),
                checksums,
                malformities,
                timestamp: Date.now()
            });

            if (comparison.issues.length > 0) {
                logger.error(`🚨 ENCRYPTION PROCESS CORRUPTION: ${operationId}`);
                comparison.issues.forEach(issue => {
                    logger.error(`  - ${issue}`);
                    reverseTracer.recordCorruption(
                        'encryptionProcess', 
                        issue, 
                        null, 
                        'ENCRYPTION_CORRUPTION'
                    );
                });
            }
        }

        if (malformities.length > 0) {
            logger.error(`🚨 POST-ENCRYPTION MALFORMITIES DETECTED: ${operationId}`);
            malformities.forEach(m => {
                logger.error(`  - ${m.type} (${m.severity}): ${m.description}`);
                reverseTracer.recordCorruption(
                    'postEncryption', 
                    m.description, 
                    null, 
                    m.type
                );
            });
        }

        return { checksums, malformities };
    }

    // Compare pre and post encryption states
    comparePrePostEncryption(preSnapshot, postSnapshot) {
        const issues = [];

        // Check if new malformities were introduced
        const preMalformityTypes = preSnapshot.malformities.map(m => m.type);
        const postMalformityTypes = postSnapshot.malformities.map(m => m.type);
        const newMalformities = postMalformityTypes.filter(type => !preMalformityTypes.includes(type));

        if (newMalformities.length > 0) {
            issues.push(`New malformities introduced: ${newMalformities.join(', ')}`);
        }

        // Check for data length anomalies
        const preLength = preSnapshot.data.length;
        const postLength = postSnapshot.data.length;
        const lengthRatio = postLength / preLength;

        if (lengthRatio < 0.5 || lengthRatio > 2.0) {
            issues.push(`Suspicious length change: ${preLength} -> ${postLength} (ratio: ${lengthRatio.toFixed(2)})`);
        }

        return { issues };
    }

    // Generate integrity report
    generateIntegrityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalValidations: this.validationLog.length,
            validOperations: this.validationLog.filter(v => v.valid).length,
            failedOperations: this.validationLog.filter(v => !v.valid).length,
            warnings: this.validationLog.filter(v => v.warnings.length > 0).length,
            checksums: Object.fromEntries(this.checksums),
            recentValidations: this.validationLog.slice(-10),
            preEncryptionSnapshots: this.preEncryptionSnapshots.size,
            postEncryptionSnapshots: this.postEncryptionSnapshots.size,
            malformitySummary: this.getMalformitySummary(),
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    // Get malformity summary
    getMalformitySummary() {
        const summary = {};
        
        for (const [id, snapshot] of this.preEncryptionSnapshots) {
            snapshot.malformities.forEach(m => {
                if (!summary[m.type]) {
                    summary[m.type] = { count: 0, severity: m.severity };
                }
                summary[m.type].count++;
            });
        }
        
        for (const [id, snapshot] of this.postEncryptionSnapshots) {
            snapshot.malformities.forEach(m => {
                if (!summary[m.type]) {
                    summary[m.type] = { count: 0, severity: m.severity };
                }
                summary[m.type].count++;
            });
        }
        
        return summary;
    }

    // Generate recommendations based on malformities
    generateRecommendations() {
        const recommendations = [];
        const summary = this.getMalformitySummary();
        
        if (summary['ROE_FONT_CORRUPTION']) {
            recommendations.push('CRITICAL: Investigate ROE font corruption - check UI rendering pipeline and character encoding');
        }
        
        if (summary['MENU_CORRUPTION']) {
            recommendations.push('HIGH: Investigate menu corruption - check menu rendering and data flow');
        }
        
        if (summary['ENCODING_CORRUPTION']) {
            recommendations.push('HIGH: Review character encoding handling in data processing pipeline');
        }
        
        if (summary['CONTROL_CHARACTERS']) {
            recommendations.push('MEDIUM: Implement data sanitization to remove control characters');
        }
        
        return recommendations;
    }

    // Clean up old snapshots
    cleanupSnapshots() {
        const cutoff = Date.now() - 300000; // 5 minutes
        
        for (const [id, snapshot] of this.preEncryptionSnapshots) {
            if (snapshot.timestamp < cutoff) {
                this.preEncryptionSnapshots.delete(id);
            }
        }
        
        for (const [id, snapshot] of this.postEncryptionSnapshots) {
            if (snapshot.timestamp < cutoff) {
                this.postEncryptionSnapshots.delete(id);
            }
        }
    }
}

// Create singleton instance
const dataIntegrityValidator = new DataIntegrityValidator();

// Cleanup snapshots every 5 minutes
setInterval(() => {
    dataIntegrityValidator.cleanupSnapshots();
}, 300000);

module.exports = {
    DataIntegrityValidator,
    dataIntegrityValidator,
    // Convenience functions
    validateBeforeEncryption: (data, options) => dataIntegrityValidator.validateBeforeEncryption(data, options),
    validateAfterEncryption: (original, encrypted, options) => dataIntegrityValidator.validateAfterEncryption(original, encrypted, options),
    validateAPIRequest: (req, res, next) => dataIntegrityValidator.validateAPIRequest(req, res, next),
    validateAPIResponse: (data, options) => dataIntegrityValidator.validateAPIResponse(data, options),
    validateFile: (filePath) => dataIntegrityValidator.validateFile(filePath),
    getIntegrityReport: () => dataIntegrityValidator.generateIntegrityReport(),
    // New malformity detection functions
    preEncryptionCheck: (data, operationId) => dataIntegrityValidator.preEncryptionCheck(data, operationId),
    postEncryptionCheck: (encryptedData, operationId) => dataIntegrityValidator.postEncryptionCheck(encryptedData, operationId),
    detectMalformities: (data) => dataIntegrityValidator.detectMalformities(data),
    getMalformitySummary: () => dataIntegrityValidator.getMalformitySummary()
};
