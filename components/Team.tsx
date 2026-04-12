const partners = [
  {
    initials: "PN",
    name: "Piyush Nimse",
    role: "Founding Partner — Tax & Finance",
    qualification: "Tax & Finance Consultant",
    description:
      "Specialises in Income Tax advisory, GST reconciliation, TDS compliance, forensic accounting, and handling tax notices & assessments. 950+ cases handled across India.",
    phone: "+91 75073 54141",
    email: "associate.piyush.nimse@gmail.com",
  },
  {
    initials: "SC",
    name: "C.A. Sourabh Chavan",
    role: "Audit & Advisory Partner",
    qualification: "Chartered Accountant (ACA)",
    description:
      "7+ years of practice specialising in Statutory Audit, Tax Litigation, and Business Advisory for Manufacturing, Service, and Startup sectors.",
    phone: "+91 84214 65966",
    email: "ccassociates2024@gmail.com",
  },
];

export default function Team() {
  return (
    <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
      {partners.map((p) => (
        <div
          key={p.initials}
          className="bg-white rounded-2xl border border-purple-100 p-6
                     hover:shadow-lg hover:shadow-purple-100/60 hover:-translate-y-1
                     transition-all duration-200"
        >
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center mb-4">
            <span className="text-xl font-semibold text-white">{p.initials}</span>
          </div>

          {/* Gold accent */}
          <div className="w-8 h-0.5 bg-gold-500 mb-3" />

          {/* Name */}
          <h3 className="text-base font-semibold text-[#26215C]">{p.name}</h3>

          {/* Role */}
          <p className="text-sm text-purple-600 font-medium mb-1">{p.role}</p>

          {/* Credential badge */}
          <span className="inline-block text-xs bg-purple-50 text-purple-800 border
                           border-purple-100 rounded-lg px-2 py-0.5 mb-3">
            {p.qualification}
          </span>

          {/* Description */}
          <p className="text-sm text-[#7F77DD] leading-relaxed mb-4">{p.description}</p>

          {/* Contact */}
          <div className="space-y-1 text-xs text-[#7F77DD]">
            <div>📞 {p.phone}</div>
            <div>✉️ {p.email}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
