import React, { useState } from 'react';
import { forgotPassword } from '../../lib/api';
import { useRouter } from 'next/router';
import Link from 'next/link';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const { data } = await forgotPassword({ email, mobile });
            setMessage(data.message);
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Forgot Password?</h2>
                <p className="text-center text-gray-600 mb-6 text-sm">Recover your account using email or phone</p>

                {message && (
                    <div className={`mb-4 p-4 rounded-lg ${message.includes("Warning") ? "bg-yellow-50 border border-yellow-200 text-yellow-800" : "bg-green-50 border border-green-200 text-green-800"}`}>
                        <p className="font-semibold">{message.includes("Warning") ? "⚠️ " : "✓ "}{message}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                        <p className="font-semibold">❌ {error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Mobile (Optional - Task 2)</label>
                        <input
                            type="tel"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            placeholder="+91 XXXXX XXXXX"
                        />
                        <p className="text-xs text-gray-500 mt-1">If you provide phone number, you can receive OTP verification</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (!email && !mobile)}
                        className={`w-full text-white p-3 rounded-lg font-bold transition ${
                            loading || (!email && !mobile)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                        }`}
                    >
                        {loading ? 'Processing...' : 'Reset Password'}
                    </button>

                    <div className="mt-4 text-center">
                        <Link href="/auth" className="text-blue-600 hover:underline text-sm">
                            ← Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
