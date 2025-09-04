import express from "express";
import {
  findCarMarkers,
  applyPatches,
  executePatched,
  generateRandomPatches,
  validatePatch,
  PatchResult
} from "../patch/carPatcher";

const router = express.Router();

/**
 * Find Car(); markers in source code
 */
router.post('/find-markers', (req, res) => {
  try {
    const { sourceCode } = req.body;
    
    if (!sourceCode) {
      return res.status(400).json({ error: 'Source code is required' });
    }
    
    const markers = findCarMarkers(sourceCode);
    
    res.json({
      success: true,
      markers,
      count: markers.length
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to find markers',
      details: error.message
    });
  }
});

/**
 * Apply patches to source code (preview only, no execution)
 */
router.post('/apply-patches', (req, res) => {
  try {
    const { sourceCode, patches } = req.body;
    
    if (!sourceCode || !patches || !Array.isArray(patches)) {
      return res.status(400).json({ 
        error: 'Source code and patches array are required' 
      });
    }
    
    // Validate each patch for security
    for (const patch of patches) {
      const validation = validatePatch(patch);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid patch code',
          details: validation.reason,
          patch
        });
      }
    }
    
    const result = applyPatches(sourceCode, patches);
    
    res.json({
      success: true,
      result: {
        originalCode: result.originalCode,
        patchedCode: result.patchedCode,
        patchPoints: result.patchPoints,
        patches: result.patches
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to apply patches',
      details: error.message
    });
  }
});

/**
 * Execute patched code in isolated VM
 */
router.post('/execute-patched', (req, res) => {
  try {
    const { sourceCode, patches, context = {} } = req.body;
    
    if (!sourceCode || !patches || !Array.isArray(patches)) {
      return res.status(400).json({ 
        error: 'Source code and patches array are required' 
      });
    }
    
    // Validate each patch for security
    for (const patch of patches) {
      const validation = validatePatch(patch);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid patch code',
          details: validation.reason,
          patch
        });
      }
    }
    
    const result = executePatched(sourceCode, patches, context);
    
    res.json({
      success: true,
      result: {
        originalCode: result.originalCode,
        patchedCode: result.patchedCode,
        patchPoints: result.patchPoints,
        patches: result.patches,
        executionResult: result.executionResult,
        error: result.error
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to execute patched code',
      details: error.message
    });
  }
});

/**
 * Generate random patches for testing/demo
 */
router.post('/generate-patches', (req, res) => {
  try {
    const { count = 3 } = req.body;
    
    if (count > 10) {
      return res.status(400).json({ 
        error: 'Maximum 10 patches allowed' 
      });
    }
    
    const patches = generateRandomPatches(count);
    
    res.json({
      success: true,
      patches,
      count: patches.length
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate patches',
      details: error.message
    });
  }
});

/**
 * Validate patch code for security
 */
router.post('/validate-patch', (req, res) => {
  try {
    const { patchCode } = req.body;
    
    if (!patchCode) {
      return res.status(400).json({ error: 'Patch code is required' });
    }
    
    const validation = validatePatch(patchCode);
    
    res.json({
      success: true,
      validation
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to validate patch',
      details: error.message
    });
  }
});

/**
 * Demo endpoint with Car(); markers
 */
router.get('/demo-code', (req, res) => {
  const demoCode = `
function demoFunction() {
  console.log("Starting demo function");
  Car();
  
  const data = { message: "Hello World" };
  Car();
  
  console.log("Demo function completed");
  Car();
  
  return data;
}

// Execute the demo
demoFunction();
`.trim();

  res.json({
    success: true,
    demoCode,
    markers: findCarMarkers(demoCode)
  });
});

export default router;