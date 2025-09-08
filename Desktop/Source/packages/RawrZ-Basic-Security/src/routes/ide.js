const express = require('express');
const router = express.Router();
const customCompiler = require('../services/customCompiler');
const { logger } = require('../utils/logger');
const { formatResponse, generateUUID } = require('../utils/helpers');

// Compile code endpoint
router.post('/compile', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        const { sourceCode, language, options = {} } = req.body;
        
        if (!sourceCode || !language) {
            return res.status(400).json(formatResponse(false, null, 'Source code and language are required', 400));
        }
        
        logger.info('IDE compilation request', { requestId, language, codeLength: sourceCode.length });
        
        const result = await customCompiler.compileCode(sourceCode, language, options);
        
        res.json(formatResponse(true, result, 'Compilation completed'));
        
    } catch (error) {
        logger.error('IDE compilation error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Run code endpoint
router.post('/run', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        const { sourceCode, language, input = '' } = req.body;
        
        if (!sourceCode || !language) {
            return res.status(400).json(formatResponse(false, null, 'Source code and language are required', 400));
        }
        
        logger.info('IDE execution request', { requestId, language });
        
        // First compile the code
        const compileResult = await customCompiler.compileCode(sourceCode, language);
        
        if (!compileResult.success) {
            return res.json(formatResponse(false, compileResult, 'Compilation failed'));
        }
        
        // Then run the compiled code
        const runResult = await customCompiler.runCode(compileResult.executable, language, input);
        
        res.json(formatResponse(true, {
            compilation: compileResult,
            execution: runResult
        }, 'Code execution completed'));
        
    } catch (error) {
        logger.error('IDE execution error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Analyze code endpoint
router.post('/analyze', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        const { sourceCode, language } = req.body;
        
        if (!sourceCode || !language) {
            return res.status(400).json(formatResponse(false, null, 'Source code and language are required', 400));
        }
        
        logger.info('IDE analysis request', { requestId, language });
        
        const analysis = await customCompiler.analyzeCode(sourceCode, language);
        
        res.json(formatResponse(true, analysis, 'Code analysis completed'));
        
    } catch (error) {
        logger.error('IDE analysis error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Get supported languages
router.get('/languages', (req, res) => {
    try {
        const languages = customCompiler.getSupportedLanguages();
        const languageInfo = {};
        
        languages.forEach(lang => {
            languageInfo[lang] = customCompiler.getLanguageInfo(lang);
        });
        
        res.json(formatResponse(true, {
            languages,
            languageInfo
        }, 'Supported languages retrieved'));
        
    } catch (error) {
        logger.error('Language info error', { error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Format code endpoint
router.post('/format', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        const { sourceCode, language } = req.body;
        
        if (!sourceCode || !language) {
            return res.status(400).json(formatResponse(false, null, 'Source code and language are required', 400));
        }
        
        logger.info('IDE formatting request', { requestId, language });
        
        // Simple code formatting (basic indentation)
        const formatted = formatCode(sourceCode, language);
        
        res.json(formatResponse(true, {
            original: sourceCode,
            formatted: formatted,
            changes: sourceCode !== formatted
        }, 'Code formatting completed'));
        
    } catch (error) {
        logger.error('IDE formatting error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Get code templates
router.get('/templates/:language', (req, res) => {
    try {
        const { language } = req.params;
        const templates = getCodeTemplates(language);
        
        res.json(formatResponse(true, templates, 'Code templates retrieved'));
        
    } catch (error) {
        logger.error('Template retrieval error', { error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Helper function to format code
function formatCode(sourceCode, language) {
    const lines = sourceCode.split('\n');
    let formatted = [];
    let indentLevel = 0;
    const indentSize = 4;
    
    lines.forEach(line => {
        const trimmed = line.trim();
        
        if (!trimmed) {
            formatted.push('');
            return;
        }
        
        // Decrease indent for closing braces
        if (trimmed === '}' || trimmed === ']' || trimmed === ')') {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add indented line
        const indent = ' '.repeat(indentLevel * indentSize);
        formatted.push(indent + trimmed);
        
        // Increase indent for opening braces
        if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
            indentLevel++;
        }
    });
    
    return formatted.join('\n');
}

// Helper function to get code templates
function getCodeTemplates(language) {
    const templates = {
        'cpp': {
            'hello-world': `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
            'class': `#include <iostream>
#include <string>

class MyClass {
private:
    std::string name;
    
public:
    MyClass(const std::string& n) : name(n) {}
    
    void display() {
        std::cout << "Name: " << name << std::endl;
    }
};

int main() {
    MyClass obj("RawrZ IDE");
    obj.display();
    return 0;
}`,
            'algorithm': `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9};
    
    std::sort(numbers.begin(), numbers.end());
    
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    return 0;
}`
        },
        'js': {
            'hello-world': `console.log("Hello, World!");`,
            'class': `class MyClass {
    constructor(name) {
        this.name = name;
    }
    
    display() {
        console.log(\`Name: \${this.name}\`);
    }
}

const obj = new MyClass("RawrZ IDE");
obj.display();`,
            'async': `async function fetchData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error:', error);
    }
}

fetchData();`
        },
        'py': {
            'hello-world': `print("Hello, World!")`,
            'class': `class MyClass:
    def __init__(self, name):
        self.name = name
    
    def display(self):
        print(f"Name: {self.name}")

obj = MyClass("RawrZ IDE")
obj.display()`,
            'algorithm': `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = bubble_sort(numbers)
print(sorted_numbers)`
        }
    };
    
    return templates[language] || {};
}

module.exports = router;
