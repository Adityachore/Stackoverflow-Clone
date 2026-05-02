import React, { useState, useEffect } from "react";
import Mainlayout from "@/layout/Mainlayout";
import { subscribe, getSubscriptionStatus, createSubscriptionOrder } from "@/lib/api";
import { toast } from "react-toastify";
import { Check, Crown, Sparkles, Zap, Clock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

/**
 * Plans data
 */
const PLANS = [
    {
        id: "free",
        name: "Free",
        price: "₹0/mo",
        limit: "1 Question/Day",
        features: ["Community Support", "Basic Features"],
        color: "gray"
    },
    {
        id: "bronze",
        name: "Bronze",
        price: "₹100/mo",
        limit: "5 Questions/Day",
        features: ["Basic Support", "Standard Visibility", "Email Notifications"],
        color: "amber"
    },
    {
        id: "silver",
        name: "Silver",
        price: "₹300/mo",
        limit: "10 Questions/Day",
        features: ["Priority Support", "High Visibility", "Profile Badge", "Analytics Dashboard"],
        color: "slate"
    },
    {
        id: "gold",
        name: "Gold",
        price: "₹1000/mo",
        limit: "Unlimited Questions",
        features: ["24/7 Support", "Top Visibility", "Gold Profile Badge", "Ad-free Experience", "Early Access Features"],
        color: "yellow"
    }
];

const SubscriptionPage = () => {
    const { user } = useAuth();
    const [currentPlan, setCurrentPlan] = useState<string>("free");
    const [loading, setLoading] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const { data } = await getSubscriptionStatus();
                setSubscriptionStatus(data);
                setCurrentPlan(data.subscription?.plan || 'free');
            } catch (err) {
                // Not logged in or error
            }
        };
        if (user) fetchStatus();
    }, [user]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubscribe = async (planId: string) => {
        if (planId === 'free') {
            toast.info("You are already on the Free plan.");
            return;
        }
        
        if (!user) {
            toast.error("Please login to subscribe.");
            return;
        }

        setLoading(true);
        try {
            // 1. Create order on backend
            const { data: orderData } = await createSubscriptionOrder({ plan: planId });
            
            // 2. Load Razorpay script
            const res = await loadRazorpayScript();
            if (!res) {
                toast.error("Razorpay SDK failed to load. Are you online?");
                setLoading(false);
                return;
            }

            // 3. Open Razorpay Checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "StackOverflow Clone",
                description: `${planId.toUpperCase()} Plan Subscription`,
                order_id: orderData.orderId,
                handler: async (response: any) => {
                    try {
                        setLoading(true);
                        // 4. Verify payment on backend
                        const { data: verifyData } = await subscribe({
                            plan: planId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        
                        toast.success(verifyData.message);
                        setCurrentPlan(planId);
                        setSubscriptionStatus(verifyData);
                    } catch (err: any) {
                        toast.error(err.response?.data?.message || "Payment verification failed.");
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: "#f48024",
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    }
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (err: any) {
            const message = err.response?.data?.message || "Subscription failed.";
            if (message.includes("10:00 AM")) {
                toast.error(`⏰ ${message}`);
            } else if (message.includes("keys not configured")) {
                // Fallback for mock payment if backend is in mock mode
                try {
                    const { data } = await subscribe({ plan: planId });
                    toast.success(data.message + " (Mock Payment)");
                    setCurrentPlan(planId);
                    setSubscriptionStatus(data);
                } catch (mockErr: any) {
                    toast.error(mockErr.response?.data?.message || "Mock subscription failed.");
                }
            } else {
                toast.error(message);
            }
        } finally {
            // Loading is handled by handler or ondismiss
            if (planId === 'free') setLoading(false); 
        }
    };

    const getIcon = (planId: string) => {
        switch(planId) {
            case 'gold': return <Crown className="w-6 h-6 text-yellow-500" />;
            case 'silver': return <Sparkles className="w-6 h-6 text-gray-400" />;
            case 'bronze': return <Zap className="w-6 h-6 text-amber-600" />;
            default: return null;
        }
    };

    return (
        <Mainlayout>
            <div className="max-w-6xl mx-auto p-6">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Choose Your Plan</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Upgrade to ask more questions and unlock premium features.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-lg text-sm">
                        <Clock className="w-4 h-4" />
                        <span><strong>Payment Window:</strong> 10:00 AM - 11:00 AM IST daily</span>
                    </div>
                </div>

                {subscriptionStatus && currentPlan !== 'free' && (
                    <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-center">
                        <p className="text-green-800 dark:text-green-300">
                            ✅ You are currently on the <strong className="uppercase">{currentPlan}</strong> plan.
                            {subscriptionStatus.subscription?.validUntil && (
                                <span> Valid until: {new Date(subscriptionStatus.subscription.validUntil).toLocaleDateString()}</span>
                            )}
                        </p>
                    </div>
                )}

                <div className="grid md:grid-cols-4 gap-6">
                    {PLANS.map((plan) => {
                        const isCurrentPlan = currentPlan === plan.id;
                        const isGold = plan.id === 'gold';
                        
                        return (
                            <div 
                                key={plan.id} 
                                className={`relative border rounded-xl p-6 transition-all duration-300 ${
                                    isGold 
                                        ? 'border-yellow-400 bg-gradient-to-b from-yellow-50 dark:from-yellow-900/20 to-white dark:to-gray-800 shadow-lg scale-105' 
                                        : isCurrentPlan 
                                            ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                                            : 'bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-md'
                                }`}
                            >
                                {isGold && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        BEST VALUE
                                    </div>
                                )}
                                
                                {isCurrentPlan && (
                                    <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        CURRENT
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-4">
                                    {getIcon(plan.id)}
                                    <h3 className="text-xl font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200">
                                        {plan.name}
                                    </h3>
                                </div>

                                <div className={`text-3xl font-bold mb-2 ${isGold ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {plan.price}
                                </div>

                                <div className="mb-6 font-medium text-gray-900 dark:text-white border-b dark:border-gray-700 pb-4">
                                    {plan.limit}
                                </div>

                                <ul className="mb-8 space-y-3">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                            <Check className={`w-4 h-4 mr-2 ${isGold ? 'text-yellow-500' : 'text-green-500'}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={loading || isCurrentPlan || plan.id === 'free'}
                                    className={`w-full py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isGold
                                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                            : isCurrentPlan
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                                                : plan.id === 'free'
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                    {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Default' : 'Subscribe Now'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>📧 Invoice will be sent to your registered email after successful payment.</p>
                    <p className="mt-2">Need help? Contact support@stackoverflow-clone.com</p>
                </div>
            </div>
        </Mainlayout>
    );
};

export default SubscriptionPage;
