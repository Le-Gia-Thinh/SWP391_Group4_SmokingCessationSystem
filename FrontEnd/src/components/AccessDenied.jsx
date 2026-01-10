import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AccessDenied = ({ requiredRole, currentRole }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-600 mb-4">
                        You don't have permission to access this page.
                    </p>

                    {requiredRole && currentRole && (
                        <div className="bg-gray-100 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Required Role:</span> {requiredRole}
                            </p>
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Current Role:</span> {currentRole}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Go Back
                    </button>

                    {user?.role === 'coach' ? (
                        <button
                            onClick={() => navigate('/coach-dashboard')}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Go to Coach Dashboard
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/user-dashboard')}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Go to User Dashboard
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/')}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied; 