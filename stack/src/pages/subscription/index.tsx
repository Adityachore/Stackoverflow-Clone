import React from "react";
import Mainlayout from "@/layout/Mainlayout";
import { subscribe } from "@/lib/api";
import { toast } from "react-toastify";
import { Check } from "lucide-react";

/**
 * Plans data
 */
const PLANS = [
    {
        id: "bronze",
        name: "Bronze",
        price: "₹100/mo",
        limit: "5 Questions/Day",
        features: ["Basic Support", "Standard Visibility"]
    },
    {
        id: "silver",
        name: "Silver",
        price: "₹300/mo",
        limit: "10 Questions/Day",
        features: ["Priority Support", "High Visibility", "Profile Badge"]
    },
    {
        id: "gold",
        name: "Gold",
        price: "₹1000/mo",
        limit: "Unlimited Questions",
        features: ["24/7 Support", "Top Visibility", "Gold Profile Badge", "Ad-free"]
    }
];

const SubscriptionPage = () => {

    const handleSubscribe = async (planId: string) => {
        try {
            const { data } = await subscribe({ plan: planId });
            toast.success(data.message);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Subscription failed. Check payment window (10-11 AM IST).");
        }
    };

    return (
        <Mainlayout>
            <div className="max-w-5xl mx-auto p-6">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-4">Upgrade Your Plan</h1>
                    <p className="text-gray-600">Choose a plan that fits your needs.
                        <br /><span className="text-sm bg-yellow-100 px-2 py-1 rounded mt-2 inline-block">Note: Payment window is 10:00 AM - 11:00 AM IST daily.</span>
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {PLANS.map((plan) => (
                        <div key={plan.id} className={`border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative ${plan.id === 'gold' ? 'border-yellow-400 bg-yellow-50' : 'bg-white'}`}>
                            {plan.id === 'gold' && (
                                <div className="absolute top-0 right-0 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                    RECOMMENDED
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-2 uppercase tracking-wide text-gray-700">{plan.name}</h3>
                            <div className="text-3xl font-bold mb-4 text-blue-600">{plan.price}</div>
                            <div className="mb-6 font-medium text-gray-900 border-b pb-4">
                                {plan.limit}
                            </div>

                            <ul className="mb-8 space-y-3">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center text-sm text-gray-600">
                                        <Check className="w-4 h-4 mr-2 text-green-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                className={`w-full py-2 rounded-lg font-bold transition-colors ${plan.id === 'gold'
                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                Subscribe Now
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Mainlayout>
    );
};

export default SubscriptionPage;
