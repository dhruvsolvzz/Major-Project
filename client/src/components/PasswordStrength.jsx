import React from 'react';

const PasswordStrength = ({ password }) => {
    const getStrength = () => {
        if (!password) return { level: 0, text: '', color: '' };

        let strength = 0;

        // Length check
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Character variety
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        // Return strength rating
        if (strength <= 2) return { level: 1, text: 'Weak', color: 'bg-red-500' };
        if (strength <= 4) return { level: 2, text: 'Fair', color: 'bg-orange-500' };
        if (strength <= 5) return { level: 3, text: 'Good', color: 'bg-yellow-500' };
        return { level: 4, text: 'Strong', color: 'bg-green-500' };
    };

    const strength = getStrength();

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${level <= strength.level ? strength.color : 'bg-slate-200'
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${strength.level === 1 ? 'text-red-600' :
                    strength.level === 2 ? 'text-orange-600' :
                        strength.level === 3 ? 'text-yellow-600' :
                            'text-green-600'
                }`}>
                Password strength: {strength.text}
            </p>
            {strength.level < 3 && (
                <p className="text-xs text-slate-500 mt-1">
                    💡 Tip: Use a mix of letters, numbers, and symbols
                </p>
            )}
        </div>
    );
};

export default PasswordStrength;
