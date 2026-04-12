export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center pt-16">
      <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100
                      flex items-center justify-center mb-6 shadow-sm">
        <span className="text-2xl font-semibold text-purple-600">404</span>
      </div>
      <div className="w-8 h-0.5 bg-gold-500 mb-6" />
      <h1 className="text-2xl font-semibold text-[#26215C] mb-3">Page not found</h1>
      <p className="text-[#7F77DD] text-sm mb-8 max-w-sm leading-relaxed">
        The page you are looking for may have moved or no longer exists.
        Try navigating from the homepage.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <a
          href="/"
          className="bg-purple-600 text-white hover:bg-purple-800 rounded-xl
                     px-5 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm"
        >
          Go to homepage
        </a>
        <a
          href="/services"
          className="bg-purple-50 text-purple-800 border border-purple-200
                     hover:bg-purple-100 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
        >
          View services
        </a>
        <a
          href="/contact"
          className="text-purple-600 hover:text-purple-800 text-sm
                     underline-offset-4 hover:underline self-center transition-colors duration-150"
        >
          Contact us
        </a>
      </div>
    </main>
  );
}
