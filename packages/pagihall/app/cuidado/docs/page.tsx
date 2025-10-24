export default function Docs() {
  return (
    <main className="min-h-screen bg-cuidado-gradient text-cuidado-white p-8 space-y-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold font-display mb-6">CUIDADO Quickstart</h1>
        
        <div className="space-y-6">
          <section className="bg-cuidado-iron/30 border border-cuidado-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-cuidado-bronze mb-4">Setup Instructions</h2>
            <ol className="list-decimal ml-6 space-y-3 text-sm">
              <li>
                Install <a href="https://ollama.com" className="text-cuidado-teal hover:text-cuidado-bronze transition-colors underline">Ollama</a> for your platform
              </li>
              <li>
                Run <code className="bg-cuidado-obsidian text-cuidado-white px-2 py-1 rounded font-mono text-xs">ollama pull gemma3:4b-instruct-q4</code>
              </li>
              <li>
                Clone the repository: <code className="bg-cuidado-obsidian text-cuidado-white px-2 py-1 rounded font-mono text-xs">git clone https://github.com/pagihall/cuidado</code>
              </li>
              <li>
                Install dependencies: <code className="bg-cuidado-obsidian text-cuidado-white px-2 py-1 rounded font-mono text-xs">pnpm install</code>
              </li>
              <li>
                Start the development server: <code className="bg-cuidado-obsidian text-cuidado-white px-2 py-1 rounded font-mono text-xs">pnpm dev</code>
              </li>
            </ol>
          </section>

          <section className="bg-cuidado-iron/30 border border-cuidado-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-cuidado-bronze mb-4">Usage</h2>
            <p className="text-sm opacity-80 mb-3">
              Once running, visit <code className="bg-cuidado-obsidian text-cuidado-white px-2 py-1 rounded font-mono text-xs">http://localhost:3000/cuidado/chat</code> to use your local assistant.
            </p>
            <p className="text-sm opacity-80">
              The assistant will use your local Ollama model and maintain conversation context through behavioral memory.
            </p>
          </section>

          <section className="bg-cuidado-iron/30 border border-cuidado-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-cuidado-bronze mb-4">Configuration</h2>
            <p className="text-sm opacity-80 mb-3">
              CUIDADO can be configured through environment variables and YAML policy files:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-sm opacity-80">
              <li><code className="font-mono text-xs">MODEL_PRIMARY</code> - Primary Ollama model name</li>
              <li><code className="font-mono text-xs">EMBED_MODEL</code> - Embedding model for retrieval</li>
              <li><code className="font-mono text-xs">TEMP</code> - Temperature for model responses</li>
              <li><code className="font-mono text-xs">src/policy/persona.yaml</code> - AI personality and behavior</li>
            </ul>
          </section>

          <section className="bg-cuidado-iron/30 border border-cuidado-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-cuidado-bronze mb-4">Features</h2>
            <ul className="list-disc ml-6 space-y-2 text-sm opacity-80">
              <li><strong>Behavioral Memory:</strong> Learns from interaction patterns and feedback</li>
              <li><strong>Local Retrieval:</strong> Uses embeddings to find relevant context</li>
              <li><strong>Safety Systems:</strong> Built-in content filtering and ethical guidelines</li>
              <li><strong>Streaming Responses:</strong> Real-time token streaming for responsive UX</li>
              <li><strong>Constitutional AI:</strong> Governed by editable policy files</li>
            </ul>
          </section>

          <div className="text-center pt-6">
            <a 
              href="/cuidado/chat" 
              className="bg-cuidado-bronze text-cuidado-obsidian px-6 py-3 rounded-lg hover:shadow-glow transition-all duration-smooth inline-block"
            >
              Try the Assistant
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
