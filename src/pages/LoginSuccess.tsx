import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loader from '../components/Loader';

const LoginSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            // We use window.location.href to force a full reload and trigger AuthProvider's initAuth
            window.location.href = '/';
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader />
        </div>
    );
};

export default LoginSuccess;
