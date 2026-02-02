import React from 'react';
import { FaCheck } from 'react-icons/fa';

const StepIndicator = ({ steps, currentStep, userType = 'donor' }) => {
    const isDonor = userType === 'donor';

    // Theme configuration
    const theme = {
        gradient: isDonor ? 'from-red-500 to-pink-600' : 'from-orange-500 to-red-600',
        text: isDonor ? 'text-red-600' : 'text-orange-600',
        border: isDonor ? 'border-red-500' : 'border-orange-500'
    };

    return (
        <div className="mb-12">
            <div className="flex justify-between items-center relative">
                {/* Background line connecting all steps */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 rounded-full" style={{ left: '24px', right: '24px' }}>
                    {/* Animated colored progress line */}
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-in-out bg-gradient-to-r ${theme.gradient}`}
                        style={{
                            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
                        }}
                    />
                </div>

                {/* Steps */}
                {steps.map((step) => {
                    const isCompleted = step.number < currentStep;
                    const isCurrent = step.number === currentStep;

                    return (
                        <div key={step.number} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isCompleted
                                        ? `bg-gradient-to-r ${theme.gradient} border-transparent text-white scale-110 shadow-lg`
                                        : isCurrent
                                            ? `bg-white ${theme.border} ${theme.text} scale-125 shadow-xl`
                                            : 'bg-white border-slate-200 text-slate-400'
                                    }`}
                            >
                                {isCompleted ? <FaCheck className="w-5 h-5" /> : step.icon}
                            </div>
                            <div className={`mt-3 font-semibold text-sm transition-all duration-300 ${isCurrent ? `${theme.text} translate-y-0` : 'text-slate-500 translate-y-1'
                                }`}>
                                {step.title}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;
