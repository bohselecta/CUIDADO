export default function Download() {
  const useCases = [
    {
      role: "Developers",
      useCase: "Local AI apps",
      value: "Drop-in backend for adaptive assistants that don't require cloud APIs"
    },
    {
      role: "Designers", 
      useCase: "Creative tools",
      value: "Build apps with contextual AI that remembers tone and style"
    },
    {
      role: "Researchers",
      useCase: "Civic experiments", 
      value: "Model community intelligence via PAGI nodes"
    },
    {
      role: "Entrepreneurs",
      useCase: "Products / startups",
      value: "Foundation for local-first AI companies"
    }
  ];

  return (
    <main className="min-h-screen bg-cuidado-gradient text-cuidado-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold font-display">Download the Engine</h1>
          <p className="text-cuidado-white/80 max-w-2xl mx-auto">
            Run CUIDADO locally or fork on GitHub. The engine is designed to be embedded 
            in communities, applications, and creative workflows where AI serves as a true partner.
          </p>
        </div>

        <section className="bg-cuidado-iron/30 border border-cuidado-white/10 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-cuidado-bronze mb-6 text-center">Get Started</h2>
          <div className="flex justify-center gap-4">
            <a 
              href="https://github.com/pagihall/cuidado" 
              className="bg-cuidado-white text-cuidado-obsidian px-6 py-3 rounded-lg hover:shadow-deep transition-all duration-smooth font-semibold"
            >
              GitHub Repository
            </a>
            <a 
              href="https://ollama.com" 
              className="border border-cuidado-white/30 px-6 py-3 rounded-lg hover:border-cuidado-teal transition-all duration-smooth font-semibold"
            >
              Download Ollama
            </a>
          </div>
        </section>

        <section className="bg-cuidado-iron/30 border border-cuidado-white/10 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-cuidado-bronze mb-6">Why CUIDADO Matters</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cuidado-white/10">
                  <th className="text-left py-3 px-4 font-semibold text-cuidado-bronze">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-cuidado-bronze">Use Case</th>
                  <th className="text-left py-3 px-4 font-semibold text-cuidado-bronze">Value</th>
                </tr>
              </thead>
              <tbody>
                {useCases.map((item, index) => (
                  <tr key={index} className="border-b border-cuidado-white/5">
                    <td className="py-3 px-4 font-medium">{item.role}</td>
                    <td className="py-3 px-4 text-cuidado-white/90">{item.useCase}</td>
                    <td className="py-3 px-4 text-sm opacity-80">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-cuidado-iron/30 border border-cuidado-white/10 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-cuidado-bronze mb-4">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-cuidado-teal">Local-First Architecture</h3>
              <p className="text-sm opacity-80">
                Runs entirely on your machine via Ollama or GPU acceleration. 
                Your thoughts, your data, your control.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-cuidado-teal">Behavioral Intelligence</h3>
              <p className="text-sm opacity-80">
                Learns from interaction patterns, feedback, and outcomes to build 
                an evolving sense of care and context.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-cuidado-teal">Modular Ethics</h3>
              <p className="text-sm opacity-80">
                Every instance runs from editable YAML constitutions, personas, 
                and tone models for transparent alignment.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-cuidado-teal">Civic Integration</h3>
              <p className="text-sm opacity-80">
                Powers Pagi Hall's community intelligence and can be embedded 
                in civic applications and workflows.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-cuidado-bronze">Ready to Get Started?</h2>
          <div className="flex justify-center gap-4">
            <a 
              href="/cuidado/docs" 
              className="bg-cuidado-bronze text-cuidado-obsidian px-6 py-3 rounded-lg hover:shadow-glow transition-all duration-smooth"
            >
              Read the Docs
            </a>
            <a 
              href="/cuidado/chat" 
              className="border border-cuidado-white/30 px-6 py-3 rounded-lg hover:border-cuidado-teal transition-all duration-smooth"
            >
              Try the Assistant
            </a>
          </div>
        </section>

        <footer className="text-center text-xs opacity-60 pt-8">
          <p>Part of the Pagi Hall ecosystem — A quiet internet inside a villa</p>
        </footer>
      </div>
    </main>
  );
}
