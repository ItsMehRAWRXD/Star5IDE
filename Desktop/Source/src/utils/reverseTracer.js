// Reverse Tracing System - Find the origin of data corruption and malformities
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('./logger');

class ReverseTracer {
    constructor() {
        this.corruptionLog = [];
        this.encodingHistory = new Map();
        this.dataSnapshots = new Map();
        this.malformityPatterns = new Map();
        this.operationChain = [];
        
        // Known malformity patterns
        this.knownPatterns = {
            'ROE_FONT_CORRUPTION': /ROE.*font|font.*ROE/i,
            'ENCODING_ISSUES': /[^\x00-\x7F]/g,
            'MENU_CORRUPTION': /menu.*corrupt|corrupt.*menu/i,
            'JSON_MALFORMED': /[{}[\]]/g,
            'UNICODE_ISSUES': /[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g
        };
        
        this.initializeTracing();
    }

    initializeTracing() {
        logger.info('🔍 Reverse Tracer initialized - monitoring for malformities');
        this.startGlobalMonitoring();
    }

    // Global monitoring for malformities
    startGlobalMonitoring() {
        // Override console methods to catch malformed output
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            this.checkForMalformities('console.log', args);
            return originalLog.apply(console, args);
        };

        console.error = (...args) => {
            this.checkForMalformities('console.error', args);
            return originalError.apply(console, args);
        };

        console.warn = (...args) => {
            this.checkForMalformities('console.warn', args);
            return originalWarn.apply(console, args);
        };

        // Monitor process events
        process.on('uncaughtException', (error) => {
            this.recordCorruption('uncaughtException', error.message, error.stack);
        });

        process.on('unhandledRejection', (reason) => {
            this.recordCorruption('unhandledRejection', reason.toString());
        });
    }

    // Check for malformities in console output
    checkForMalformities(source, args) {
        const output = args.join(' ');
        
        for (const [patternName, pattern] of Object.entries(this.knownPatterns)) {
            if (pattern.test(output)) {
                this.recordCorruption(source, output, null, patternName);
                logger.error(`🚨 MALFORMITY DETECTED: ${patternName} in ${source}`);
                logger.error(`🚨 Content: ${output}`);
            }
        }

        // Check for encoding issues
        if (this.detectEncodingCorruption(output)) {
            this.recordCorruption(source, output, null, 'ENCODING_CORRUPTION');
        }
    }

    // Detect encoding corruption
    detectEncodingCorruption(data) {
        try {
            // Check for mixed encodings
            const utf8Check = Buffer.from(data, 'utf8').toString('utf8');
            if (utf8Check !== data) {
                return true;
            }

            // Check for invalid Unicode sequences
            const invalidUnicode = /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;
            if (invalidUnicode.test(data)) {
                return true;
            }

            return false;
        } catch (error) {
            return true;
        }
    }

    // Record corruption event
    recordCorruption(source, content, stackTrace = null, patternType = 'UNKNOWN') {
        const corruptionEvent = {
            timestamp: new Date().toISOString(),
            source,
            content: content.substring(0, 500), // Limit content length
            stackTrace,
            patternType,
            operationChain: [...this.operationChain],
            memoryUsage: process.memoryUsage(),
            encoding: this.detectEncoding(content)
        };

        this.corruptionLog.push(corruptionEvent);
        
        // Store in malformity patterns
        if (!this.malformityPatterns.has(patternType)) {
            this.malformityPatterns.set(patternType, []);
        }
        this.malformityPatterns.get(patternType).push(corruptionEvent);

        logger.error(`🚨 CORRUPTION RECORDED: ${patternType} from ${source}`);
        
        // Auto-trace if critical pattern
        if (['ROE_FONT_CORRUPTION', 'MENU_CORRUPTION'].includes(patternType)) {
            this.autoTraceCorruption(corruptionEvent);
        }
    }

    // Auto-trace corruption to find origin
    async autoTraceCorruption(corruptionEvent) {
        logger.info(`🔍 AUTO-TRACING: ${corruptionEvent.patternType}`);
        
        // Check recent operations
        const recentOps = this.operationChain.slice(-10);
        for (const op of recentOps) {
            if (this.isOperationSuspicious(op, corruptionEvent)) {
                logger.error(`🎯 SUSPICIOUS OPERATION FOUND: ${op.type} - ${op.description}`);
                await this.deepTraceOperation(op);
            }
        }

        // Check data snapshots
        await this.checkDataSnapshots(corruptionEvent);
    }

    // Check if operation is suspicious
    isOperationSuspicious(operation, corruptionEvent) {
        const suspiciousTypes = [
            'ENCRYPTION', 'DECRYPTION', 'ENCODING', 'DECODING', 
            'FILE_READ', 'FILE_WRITE', 'API_CALL', 'MENU_RENDER'
        ];
        
        return suspiciousTypes.includes(operation.type) && 
               operation.timestamp > Date.now() - 30000; // Within last 30 seconds
    }

    // Deep trace operation
    async deepTraceOperation(operation) {
        logger.info(`🔍 DEEP TRACING: ${operation.type}`);
        
        try {
            // Check input data
            if (operation.inputData) {
                const inputCorruption = this.detectEncodingCorruption(operation.inputData);
                if (inputCorruption) {
                    logger.error(`🎯 INPUT CORRUPTION FOUND in ${operation.type}`);
                    this.recordCorruption('deepTrace', operation.inputData, null, 'INPUT_CORRUPTION');
                }
            }

            // Check output data
            if (operation.outputData) {
                const outputCorruption = this.detectEncodingCorruption(operation.outputData);
                if (outputCorruption) {
                    logger.error(`🎯 OUTPUT CORRUPTION FOUND in ${operation.type}`);
                    this.recordCorruption('deepTrace', operation.outputData, null, 'OUTPUT_CORRUPTION');
                }
            }

            // Check for data transformation issues
            if (operation.inputData && operation.outputData) {
                const transformationIssue = this.checkTransformationIntegrity(
                    operation.inputData, 
                    operation.outputData, 
                    operation.type
                );
                if (transformationIssue) {
                    logger.error(`🎯 TRANSFORMATION ISSUE: ${transformationIssue}`);
                }
            }
        } catch (error) {
            logger.error(`❌ Deep trace failed: ${error.message}`);
        }
    }

    // Check data transformation integrity
    checkTransformationIntegrity(input, output, operationType) {
        try {
            // For encryption operations
            if (operationType.includes('ENCRYPT')) {
                // Check if output is valid encrypted data
                if (typeof output === 'string' && output.length > 0) {
                    // Basic validation for encrypted data
                    const isValidEncrypted = /^[A-Za-z0-9+/=]+$/.test(output);
                    if (!isValidEncrypted && !output.includes('ROE')) {
                        return 'Invalid encrypted data format';
                    }
                }
            }

            // For encoding operations
            if (operationType.includes('ENCODING')) {
                const inputEncoding = this.detectEncoding(input);
                const outputEncoding = this.detectEncoding(output);
                
                if (inputEncoding !== outputEncoding) {
                    return `Encoding mismatch: ${inputEncoding} -> ${outputEncoding}`;
                }
            }

            return null;
        } catch (error) {
            return `Transformation check failed: ${error.message}`;
        }
    }

    // Detect encoding of data
    detectEncoding(data) {
        try {
            if (Buffer.isBuffer(data)) {
                return 'buffer';
            }
            
            const buffer = Buffer.from(data, 'utf8');
            const utf8String = buffer.toString('utf8');
            
            if (utf8String === data) {
                return 'utf8';
            }
            
            // Check for other encodings
            const latin1String = buffer.toString('latin1');
            if (latin1String === data) {
                return 'latin1';
            }
            
            return 'unknown';
        } catch (error) {
            return 'error';
        }
    }

    // Check data snapshots for corruption
    async checkDataSnapshots(corruptionEvent) {
        for (const [snapshotId, snapshot] of this.dataSnapshots) {
            if (snapshot.timestamp > Date.now() - 60000) { // Last minute
                const corruption = this.detectEncodingCorruption(snapshot.data);
                if (corruption) {
                    logger.error(`🎯 SNAPSHOT CORRUPTION: ${snapshotId}`);
                    this.recordCorruption('snapshotCheck', snapshot.data, null, 'SNAPSHOT_CORRUPTION');
                }
            }
        }
    }

    // Track operation for tracing
    trackOperation(type, description, inputData = null, outputData = null) {
        const operation = {
            timestamp: Date.now(),
            type,
            description,
            inputData: inputData ? inputData.toString().substring(0, 1000) : null,
            outputData: outputData ? outputData.toString().substring(0, 1000) : null,
            memoryUsage: process.memoryUsage()
        };

        this.operationChain.push(operation);
        
        // Keep only last 100 operations
        if (this.operationChain.length > 100) {
            this.operationChain.shift();
        }

        // Create data snapshot for critical operations
        if (['ENCRYPTION', 'DECRYPTION', 'MENU_RENDER'].includes(type)) {
            this.createDataSnapshot(`${type}_${Date.now()}`, inputData || outputData);
        }
    }

    // Create data snapshot
    createDataSnapshot(id, data) {
        this.dataSnapshots.set(id, {
            timestamp: Date.now(),
            data: data ? data.toString() : null,
            encoding: this.detectEncoding(data)
        });

        // Clean old snapshots
        const cutoff = Date.now() - 300000; // 5 minutes
        for (const [snapshotId, snapshot] of this.dataSnapshots) {
            if (snapshot.timestamp < cutoff) {
                this.dataSnapshots.delete(snapshotId);
            }
        }
    }

    // Get corruption report
    getCorruptionReport() {
        const report = {
            totalCorruptions: this.corruptionLog.length,
            patterns: {},
            recentCorruptions: this.corruptionLog.slice(-10),
            operationChain: this.operationChain.slice(-20),
            recommendations: this.generateRecommendations()
        };

        // Group by pattern type
        for (const [patternType, events] of this.malformityPatterns) {
            report.patterns[patternType] = {
                count: events.length,
                lastOccurrence: events[events.length - 1]?.timestamp,
                sources: [...new Set(events.map(e => e.source))]
            };
        }

        return report;
    }

    // Generate recommendations
    generateRecommendations() {
        const recommendations = [];
        
        if (this.malformityPatterns.has('ROE_FONT_CORRUPTION')) {
            recommendations.push('Check font rendering and character encoding in UI components');
        }
        
        if (this.malformityPatterns.has('MENU_CORRUPTION')) {
            recommendations.push('Investigate menu rendering pipeline and data flow');
        }
        
        if (this.malformityPatterns.has('ENCODING_CORRUPTION')) {
            recommendations.push('Review all encoding/decoding operations for consistency');
        }

        return recommendations;
    }

    // Export corruption log
    async exportCorruptionLog() {
        const report = this.getCorruptionReport();
        const filename = `corruption-report-${Date.now()}.json`;
        const filepath = path.join(__dirname, '../../logs', filename);
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        logger.info(`📊 Corruption report exported: ${filepath}`);
        
        return filepath;
    }
}

// Create singleton instance
const reverseTracer = new ReverseTracer();

module.exports = {
    reverseTracer,
    ReverseTracer
};
