import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { useStore } from './store/useStore';
import { useZoom } from './hooks/useZoom';
import { useWindowManager } from './hooks/useWindowManager';
import { useAIBench } from './hooks/useAIBench';
import { useSecurity } from './hooks/useSecurity';

// Components
import MainIDE from './components/MainIDE';
import AIBench from './components/AIBench';
import WindowManager from './components/WindowManager';
import CustomizationPanel from './components/CustomizationPanel';
import ZoomControls from './components/ZoomControls';
import StatusBar from './components/StatusBar';
import LoadingScreen from './components/LoadingScreen';

// Global Styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    overflow: hidden;
    font-family: ${props => props.theme.fonts.primary};
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  #root {
    height: 100vh;
    width: 100vw;
    position: relative;
    overflow: hidden;
  }

  /* Prevent memory leaks and hijacking */
  .no-memory {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Zoom container */
  .zoom-container {
    transform-origin: top left;
    transition: transform 0.2s ease;
  }

  /* Custom scrollbars */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.scrollbarTrack};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.scrollbarThumb};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.scrollbarThumbHover};
  }

  /* Selection styles */
  ::selection {
    background: ${props => props.theme.colors.selection};
    color: ${props => props.theme.colors.selectionText};
  }

  /* Focus styles */
  *:focus {
    outline: 2px solid ${props => props.theme.colors.focus};
    outline-offset: 2px;
  }

  /* Animation classes */
  .fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  .slide-up {
    animation: slideUp 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Main App Container
const AppContainer = styled.div`
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
`;

// Zoom Container
const ZoomContainer = styled.div`
  transform-origin: top left;
  transition: transform 0.2s ease;
  height: 100%;
  width: 100%;
`;

// Main Content Area
const MainContent = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
`;

// Top Bar
const TopBar = styled.div`
  height: 40px;
  background: ${props => props.theme.colors.topBar};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 1000;
  -webkit-app-region: drag;
`;

// Content Area
const ContentArea = styled.div`
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
`;

// Sidebar
const Sidebar = styled(motion.div)`
  width: 300px;
  background: ${props => props.theme.colors.sidebar};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  z-index: 100;
`;

// Main IDE Area
const IDEArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

// AI Bench Area
const AIBenchArea = styled(motion.div)`
  width: 400px;
  background: ${props => props.theme.colors.aiBench};
  border-left: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  z-index: 100;
`;

// Floating Controls
const FloatingControls = styled.div`
  position: fixed;
  top: 50px;
  right: 20px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

function App() {
  // State management
  const {
    theme,
    zoom,
    windows,
    aiCopilots,
    isLoaded,
    setTheme,
    setZoom,
    addWindow,
    removeWindow,
    updateWindow,
    addAICopilot,
    removeAICopilot,
    updateAICopilot
  } = useStore();

  // Custom hooks
  const { zoomLevel, setZoomLevel, zoomIn, zoomOut, resetZoom } = useZoom();
  const { 
    createWindow, 
    closeWindow, 
    moveWindow, 
    resizeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow
  } = useWindowManager();
  
  const {
    aiBenchVisible,
    toggleAIBench,
    addAIToBench,
    removeAIFromBench,
    getAvailableAIs,
    getActiveAIs
  } = useAIBench();

  const { 
    isSecure,
    clearMemory,
    preventHijacking,
    validateSession
  } = useSecurity();

  // Refs
  const appRef = useRef(null);
  const zoomContainerRef = useRef(null);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Security initialization
        await preventHijacking();
        await validateSession();
        
        // Clear any existing memory
        await clearMemory();
        
        // Initialize default AI copilots (20 per user)
        const defaultAIs = Array.from({ length: 20 }, (_, i) => ({
          id: `ai-${i + 1}`,
          name: `Copilot ${i + 1}`,
          type: 'assistant',
          status: 'idle',
          capabilities: ['code', 'debug', 'review', 'optimize'],
          specialization: ['javascript', 'python', 'cpp', 'rust', 'go'][i % 5],
          isActive: false,
          currentTask: null,
          performance: {
            tasksCompleted: 0,
            averageResponseTime: 0,
            accuracy: 95 + Math.random() * 5
          }
        }));

        // Add all AIs to the bench
        defaultAIs.forEach(ai => addAIToBench(ai));
        
        // Create initial windows
        createWindow({
          id: 'main-editor',
          title: 'Main Editor',
          type: 'editor',
          content: '// Welcome to ScreenPilot++ IDE\n// Start coding with your AI copilots!',
          position: { x: 100, y: 100 },
          size: { width: 800, height: 600 },
          isActive: true
        });

        createWindow({
          id: 'file-explorer',
          title: 'File Explorer',
          type: 'explorer',
          content: null,
          position: { x: 50, y: 50 },
          size: { width: 300, height: 400 },
          isActive: false
        });

        // Set loaded state
        setTimeout(() => {
          // App is ready
        }, 1000);

      } catch (error) {
        console.error('App initialization failed:', error);
      }
    };

    initializeApp();
  }, []);

  // Handle zoom changes
  useEffect(() => {
    if (zoomContainerRef.current) {
      zoomContainerRef.current.style.transform = `scale(${zoomLevel})`;
    }
  }, [zoomLevel]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Zoom controls
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            resetZoom();
            break;
          case 'b':
            e.preventDefault();
            toggleAIBench();
            break;
          case 'n':
            e.preventDefault();
            createWindow({
              id: `window-${Date.now()}`,
              title: 'New Window',
              type: 'editor',
              content: '',
              position: { x: 200, y: 200 },
              size: { width: 600, height: 400 }
            });
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom, toggleAIBench, createWindow]);

  // Handle window events
  const handleWindowClose = useCallback((windowId) => {
    closeWindow(windowId);
  }, [closeWindow]);

  const handleWindowMove = useCallback((windowId, position) => {
    moveWindow(windowId, position);
  }, [moveWindow]);

  const handleWindowResize = useCallback((windowId, size) => {
    resizeWindow(windowId, size);
  }, [resizeWindow]);

  const handleWindowFocus = useCallback((windowId) => {
    focusWindow(windowId);
  }, [focusWindow]);

  // Handle AI copilot events
  const handleAIActivate = useCallback((aiId) => {
    const ai = getAvailableAIs().find(a => a.id === aiId);
    if (ai) {
      updateAICopilot(aiId, { isActive: true, status: 'active' });
    }
  }, [getAvailableAIs, updateAICopilot]);

  const handleAIDeactivate = useCallback((aiId) => {
    updateAICopilot(aiId, { isActive: false, status: 'idle' });
  }, [updateAICopilot]);

  // Handle theme changes
  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme);
  }, [setTheme]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <AppContainer ref={appRef} className="no-memory">
          <ZoomContainer ref={zoomContainerRef}>
            <MainContent>
              {/* Top Bar */}
              <TopBar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h1 style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    🚀 ScreenPilot++ IDE
                  </h1>
                  <span style={{ fontSize: '12px', opacity: 0.7 }}>
                    {getActiveAIs().length} AI Copilots Active
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={toggleAIBench}
                    style={{
                      padding: '6px 12px',
                      background: aiBenchVisible ? theme.colors.primary : theme.colors.button,
                      color: theme.colors.buttonText,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    AI Bench ({getAvailableAIs().length})
                  </button>
                  
                  <CustomizationPanel onThemeChange={handleThemeChange} />
                </div>
              </TopBar>

              {/* Content Area */}
              <ContentArea>
                {/* Sidebar */}
                <AnimatePresence>
                  {windows.some(w => w.type === 'explorer') && (
                    <Sidebar
                      initial={{ x: -300 }}
                      animate={{ x: 0 }}
                      exit={{ x: -300 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div style={{ padding: '16px' }}>
                        <h3>File Explorer</h3>
                        {/* File tree will go here */}
                      </div>
                    </Sidebar>
                  )}
                </AnimatePresence>

                {/* Main IDE Area */}
                <IDEArea>
                  <WindowManager
                    windows={windows}
                    onClose={handleWindowClose}
                    onMove={handleWindowMove}
                    onResize={handleWindowResize}
                    onFocus={handleWindowFocus}
                  />
                </IDEArea>

                {/* AI Bench */}
                <AnimatePresence>
                  {aiBenchVisible && (
                    <AIBenchArea
                      initial={{ x: 400 }}
                      animate={{ x: 0 }}
                      exit={{ x: 400 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AIBench
                        ais={getAvailableAIs()}
                        onActivate={handleAIActivate}
                        onDeactivate={handleAIDeactivate}
                        onAddAI={addAIToBench}
                        onRemoveAI={removeAIFromBench}
                      />
                    </AIBenchArea>
                  )}
                </AnimatePresence>
              </ContentArea>

              {/* Status Bar */}
              <StatusBar
                zoomLevel={zoomLevel}
                activeWindows={windows.filter(w => w.isActive).length}
                activeAIs={getActiveAIs().length}
                totalAIs={getAvailableAIs().length}
              />
            </MainContent>
          </ZoomContainer>

          {/* Floating Controls */}
          <FloatingControls>
            <ZoomControls
              zoomLevel={zoomLevel}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetZoom={resetZoom}
            />
          </FloatingControls>
        </AppContainer>
      </ThemeProvider>
    </DndProvider>
  );
}

export default App;