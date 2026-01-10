import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleSelector = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedRole, setSelectedRole] = useState('');

    const handleRoleSelect = (role) => {
        setSelectedRole(role);

        // Redirect dựa trên role được chọn
        if (role === 'coach') {
            navigate('/coach-dashboard');
        } else {
            navigate('/user-dashboard');
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Chọn vai trò của bạn
                    </h2>
                    <p className="text-gray-600">
                        Xin chào {user.name}! Vui lòng chọn vai trò bạn muốn sử dụng.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* User Role Option */}
                    <button
                        onClick={() => handleRoleSelect('user')}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${selectedRole === 'user'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">User</h3>
                                <p className="text-sm text-gray-600">
                                    Theo dõi tiến độ cai thuốc lá của bạn
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Coach Role Option - chỉ hiển thị nếu user có quyền coach */}
                    {user.role === 'coach' && (
                        <button
                            onClick={() => handleRoleSelect('coach')}
                            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${selectedRole === 'coach'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg mr-4">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Coach</h3>
                                    <p className="text-sm text-gray-600">
                                        Quản lý học viên và kế hoạch cai thuốc lá
                                    </p>
                                </div>
                            </div>
                        </button>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleSelector; 