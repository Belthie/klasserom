
(function () {
    const defaultStudents = window.Utils.MOCK_NAMES.map(name => ({
        id: window.Utils.generateId(),
        name,
        constraints: [], // 'lock_front', 'lock_back'
        enemies: [], // IDs
        buddies: []
    }));

    window.App = () => {
        const [students, setStudents] = React.useState(defaultStudents);
        const [roomConfig, setRoomConfig] = React.useState({ rows: 5, cols: 6, grouping: 'Rows' });
        const [layout, setLayout] = React.useState([]); // Array of student IDs or null
        const [viewMode, setViewMode] = React.useState('editor'); // editor | projector
        const [score, setScore] = React.useState(null); // { violations: [] }

        // Initialize Layout
        React.useEffect(() => {
            const size = roomConfig.rows * roomConfig.cols;
            setLayout(prev => {
                const newLayout = new Array(size).fill(null);
                // Preserve previous positions if possible?
                // For now, reset or naive copy.
                // Simpler: Just resize and keep indices.
                for (let i = 0; i < Math.min(prev.length, size); i++) {
                    newLayout[i] = prev[i];
                }
                // If shrinking, assigned students fall back to unassigned implicitly (calc below)
                return newLayout;
            });
        }, [roomConfig.rows, roomConfig.cols]);

        // Helpers
        const getStudent = (id) => students.find(s => s.id === id);

        // Computed
        const assignedIds = new Set(layout.filter(id => id !== null));
        const unassigned = students.filter(s => !assignedIds.has(s.id));

        // Actions
        const handleImport = (names) => {
            const newStudents = names.map(name => ({
                id: window.Utils.generateId(),
                name,
                constraints: [],
                enemies: [],
                buddies: []
            }));
            setStudents(prev => [...prev, ...newStudents]);
        };

        const handleUpdateStudent = (id, updates) => {
            setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        };

        const handleGenerate = () => {
            // Run Algorithm
            // We need to pass full student objects for logic
            const roster = [...students];
            const newLayoutObjects = window.SeatingAlgorithm.generate(roster, roomConfig);
            // Algorithm returns objects. Convert to IDs.
            const newLayoutIds = newLayoutObjects.map(s => s ? s.id : null);
            setLayout(newLayoutIds);

            // Check Score
            const evalResult = window.SeatingAlgorithm.evaluate(newLayoutObjects, roomConfig);
            setScore(evalResult);
        };

        const handleSwap = (idx1, idx2) => {
            setLayout(prev => {
                const next = [...prev];
                [next[idx1], next[idx2]] = [next[idx2], next[idx1]];
                return next;
            });
            // Clear score as it might be stale/invalid check requires re-run
            // or we re-run verify immediately?
            // Let's re-run verify in effect or just clear.
            setScore(null);
        };

        const handleAssign = (studentId, index) => {
            setLayout(prev => {
                const next = [...prev];
                // Check if studentId is already somewhere else?
                const oldIndex = next.indexOf(studentId);
                if (oldIndex !== -1) next[oldIndex] = null; // Remove from old

                // If target occupied, move occupant to unassigned (or swap if coming from sidebar? Unassigned -> Seat usually means overwrite or swap. Let's Swap if source was sidebar? No, sidebar has no index.
                // If target occupied, the occupant goes to unassigned.
                // next[index] = studentId.
                next[index] = studentId;
                return next;
            });
            setScore(null);
        };

        const generatePDF = async () => {
            const element = document.getElementById('seating-draw-area');
            const canvas = await window.html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new window.jspdf.jsPDF('l', 'mm', 'a4');
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save('seating-chart.pdf');
        };

        return (
            <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
                {/* Sidebar */}
                <div className={`${viewMode === 'projector' ? 'hidden' : 'block'}`}>
                    <window.Sidebar
                        students={students}
                        unassigned={unassigned}
                        onImport={handleImport}
                        onUpdateStudent={handleUpdateStudent}
                        roomConfig={roomConfig}
                        onUpdateConfig={(k, v) => setRoomConfig(p => ({ ...p, [k]: v }))}
                        onGenerate={handleGenerate}
                    />
                </div>

                {/* Main Content */}
                <div className={`flex-1 flex flex-col h-full relative ${viewMode === 'projector' ? 'pl-0' : 'pl-80'}`}>
                    {/* Toolbar */}
                    <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 shrink-0 z-20 print:hidden">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
                                Class 10A
                            </h2>
                            {score && score.violations.length === 0 && (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                    <window.Icon name="check-circle" size={14} /> Rules Met
                                </span>
                            )}
                            {score && score.violations.length > 0 && (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                    <window.Icon name="alert-circle" size={14} /> {score.violations.length} Violation(s)
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-4">
                                <button onClick={() => setViewMode('editor')} className={`gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${viewMode === 'editor' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <window.Icon name="layout" size={16} /> Editor
                                </button>
                                <button onClick={() => setViewMode('projector')} className={`gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${viewMode === 'projector' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <window.Icon name="monitor" size={16} /> Projector
                                </button>
                            </div>

                            <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors" title="Print">
                                <window.Icon name="printer" size={20} />
                            </button>
                            <button onClick={generatePDF} className="px-4 py-2 bg-slate-800 text-white font-medium text-sm rounded-lg hover:bg-slate-700 hover:shadow shadow-sm transition-all flex items-center gap-2">
                                <window.Icon name="download" size={16} /> Export PDF
                            </button>
                        </div>
                    </header>

                    {/* Canvas Area */}
                    <main className="flex-1 overflow-auto bg-slate-50/50 p-8 relative flex flex-col items-center">
                        <div id="seating-draw-area" className="w-full max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[600px] print:p-0 print:border-none print:shadow-none">
                            {/* Front of Room Indicator */}
                            <div className="w-full h-8 mb-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em] border border-dashed border-slate-300">
                                Front of Room (Teacher's Desk)
                            </div>

                            <window.GridMap
                                layout={layout.map(id => getStudent(id) || null)}
                                roomConfig={roomConfig}
                                students={students}
                                onSwap={handleSwap}
                                onAssign={handleAssign}
                                selection={score ? score.violations.map(v => layout.indexOf(v.student.id)) : []} // Map violation objects back to indices?
                            // Actually violation has student object.
                            />
                        </div>
                    </main>
                </div>
            </div>
        );
    };
})();
