import { useNavigate } from 'react-router-dom';

export default function UpgradePlan() {
    const navigate = useNavigate();

    const businessPlans = [
        {
            name: "1 month Go",
            price: "1,499",
            desc: "Expanded administrative seats and data logs",
            btnText: "Upgrade Team",
            accent: "border-slate-800",
            btnBg: "bg-white hover:bg-slate-100 text-slate-900 border border-slate-200"
        },
        {
            name: "3 months Plus",
            price: "5,999",
            desc: "Complete multi-branch monitoring infrastructure",
            btnText: "Upgrade Growth",
            popular: true,
            accent: "border-fuchsia-700/60 shadow-lg shadow-fuchsia-900/5",
            btnBg: "bg-indigo-600 hover:bg-indigo-700 text-white"
        },
        {
            name: "6 months Pro",
            price: "24,999",
            desc: "Enterprise custom integrations and dedicated channels",
            btnText: "Upgrade Corporate",
            accent: "border-slate-800",
            btnBg: "bg-white hover:bg-slate-100 text-slate-900 border border-slate-200"
        }
    ];

    const handleProcessCheckout = async (planName, amount) => {
        const rawCachedData = localStorage.getItem('pendingAdminData');

        if (!rawCachedData) {
            alert("⚠️ Registration session expired. Please return to the Signup page and fill out the form again.");
            navigate('/admin/signup');
            return;
        }

        const pendingPayload = JSON.parse(rawCachedData);

        try {
            // 👇 YAHAN CHANGE KIYA HAI: Removed 
            const res = await fetch('/api/auth/register-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingPayload)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to finalize corporate registration.");

            alert(`🎉 Success! Account created for ${pendingPayload.companyName}.\nPlan: ${planName} (₹${amount})`);

            localStorage.removeItem('pendingAdminData');
            localStorage.setItem('hasPaidTier', 'true');

            navigate('/');

        } catch (err) {
            alert(`❌ Registration Failure: ${err.message}`);
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 md:p-8 font-sans text-white select-none">
            <button
                type="button"
                onClick={() => navigate('/admin/signup')}
                className="absolute top-6 right-6 w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-all text-sm font-bold bg-zinc-900/40"
            >
                ✕
            </button>

            <div className="w-full max-w-5xl space-y-8 animate-fadeIn">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-100">Select Business Plan</h1>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Enterprise infrastructure tiers scaled for operational management</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {businessPlans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`bg-zinc-900/90 rounded-3xl p-6 md:p-8 border flex flex-col justify-between space-y-8 transition-transform hover:scale-[1.01] ${plan.accent}`}
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-xl font-black tracking-tight text-zinc-100">{plan.name}</h2>
                                    {plan.popular && (
                                        <span className="text-[9px] font-black tracking-widest bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-900/50 px-2.5 py-1 rounded-full uppercase">
                                            Popular
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-baseline font-mono">
                                        <span className="text-xl font-bold text-zinc-300">₹</span>
                                        <span className="text-4xl font-black text-white tracking-tight pl-0.5">{plan.price}</span>
                                    </div>
                                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                                        INR / Billing Cycle (inclusive of GST)
                                    </span>
                                </div>

                                <p className="text-sm font-medium text-zinc-400 leading-relaxed normal-case pt-2">
                                    {plan.desc}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleProcessCheckout(plan.name, plan.price)}
                                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${plan.btnBg}`}
                            >
                                {plan.btnText}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}