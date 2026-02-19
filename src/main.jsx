
// Bootstrap
(function () {
    const mount = () => {
        try {
            if (window.App && window.ReactDOM && window.Navbar && window.GridMap) {
                const root = window.ReactDOM.createRoot(document.getElementById('root'));
                root.render(
                    <React.StrictMode>
                        <ErrorBoundary>
                            <window.App />
                        </ErrorBoundary>
                    </React.StrictMode>
                );
            } else {
                setTimeout(mount, 50);
            }
        } catch (e) {
            document.body.innerHTML = `<div style="padding:20px;color:red"><h1>Critical Error</h1><pre>${e.message}</pre><button onclick="localStorage.clear();location.reload()">Reset Data</button></div>`;
        }
    };

    class ErrorBoundary extends React.Component {
        constructor(props) { super(props); this.state = { hasError: false, error: null }; }
        static getDerivedStateFromError(error) { return { hasError: true, error }; }
        componentDidCatch(error, errorInfo) { console.error(error, errorInfo); }
        render() {
            if (this.state.hasError) {
                return (
                    <div className="p-10 flex flex-col items-center justify-center h-screen bg-red-50 text-red-900">
                        <h1 className="text-3xl font-bold mb-4">Noe gikk galt 😢</h1>
                        <pre className="bg-white p-4 rounded border border-red-200 mb-6 text-sm overflow-auto max-w-2xl">{this.state.error?.message}</pre>
                        <button
                            onClick={() => { localStorage.clear(); location.reload(); }}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
                        >
                            Slett data og start på nytt
                        </button>
                    </div>
                );
            }
            return this.props.children;
        }
    }

    mount();
})();
