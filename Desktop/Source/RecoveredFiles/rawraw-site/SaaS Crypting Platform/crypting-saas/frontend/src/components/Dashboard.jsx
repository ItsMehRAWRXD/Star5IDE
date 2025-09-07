// frontend/src/components/Dashboard.jsx
import React, { useState } from 'react';
import FileUpload from './FileUpload';
import BuildHistory from './BuildHistory';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('upload');

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`ml-8 py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'upload'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Upload File
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`ml-8 py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'history'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Build History
                            </button>
                        </nav>
                    </div>
                    <div className="p-6">
                        {activeTab === 'upload' && <FileUpload />}
                        {activeTab === 'history' && <BuildHistory />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;