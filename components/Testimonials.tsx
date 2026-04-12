const testimonials = [
  {
    name: "Mukund Kulkarni",
    location: "Thermax Chowk, Pune",
    service: "Income Tax Notice",
    quote: "Handled my income tax notice professionally and resolved it smoothly.",
  },
  {
    name: "Yogesh Zaware",
    location: "Chakan",
    role: "Former Union Leader, Mahindra & Mahindra Chakan",
    service: "Litigation",
    quote: "Strong understanding of litigation matters. Very reliable advisor.",
  },
  {
    name: "Nirmala Sawant",
    location: "",
    service: "Property Tax & Capital Gains",
    quote: "Clear guidance on property taxation and capital gains. Highly recommended.",
  },
  {
    name: "Pravin Patil",
    location: "",
    service: "Income Tax Filing",
    quote: "Manages tax consultation and filings for our entire group efficiently.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Testimonials() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {testimonials.map((t) => (
        <div
          key={t.name}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm
                     hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-100/60
                     transition-all duration-200"
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center
                          justify-center text-sm font-semibold mb-3">
            {initials(t.name)}
          </div>

          {/* Stars */}
          <div className="text-gold-500 text-xs mb-2">★★★★★</div>

          {/* Quote */}
          <p className="text-sm text-[#26215C] leading-relaxed italic mb-3">
            &ldquo;{t.quote}&rdquo;
          </p>

          {/* Name + location */}
          <p className="text-sm font-semibold text-purple-800">{t.name}</p>
          {t.role && <p className="text-xs text-[#7F77DD] leading-snug">{t.role}</p>}
          {t.location && <p className="text-xs text-[#7F77DD]">{t.location}</p>}

          {/* Service badge */}
          <span className="inline-block mt-2 text-xs bg-purple-50 text-purple-600
                           rounded-md px-2 py-0.5">
            {t.service}
          </span>
        </div>
      ))}
    </div>
  );
}
