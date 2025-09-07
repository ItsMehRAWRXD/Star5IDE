// frontend/src/components/FileUpload.jsx
import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [config, setConfig] = useState({
        obfuscationLevel: 'medium',
        antiDebug: true,
        antiVM: true,
        polymorphism: true
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('config', JSON.stringify(config));

        try {
            const response = await axios.post('/api/v1/crypt', formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Handle success
        } catch (error) {
            // Handle error
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">File</label>
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="mt-1 block w-full"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Obfuscation Level</label>
                    <select
                        value={config.obfuscationLevel}
                        onChange={(e) => setConfig({...config, obfuscationLevel: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={config.polymorphism}
                        onChange={(e) => setConfig({...config, polymorphism: e.target.checked})}
                        className="rounded border-gray-300 text-indigo-600"
                    />
                    <label className="ml-2 text-sm text-gray-700">Polymorphic Generation</label>
                </div>
            </div>

            <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
                Crypt File
            </button>
        </form>
    );
};