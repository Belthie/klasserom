
(function () {
    const defaultStudents = window.Utils.MOCK_NAMES.map(name => ({
        id: window.Utils.generateId(),
        name,
        constraints: [], // 'lock_front', 'lock_back'
        enemies: [], // IDs
        buddies: []
    }));

    window.App = () => {
        // --- State Initialization (Persistence) ---
        const [classrooms, setClassrooms] = React.useState(() => {
            try {
                const saved = localStorage.getItem('klasserom_data');
                if (saved) return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to load saved data", e);
            }
            const firstId = window.Utils.generateId();
            return {
                [firstId]: {
                    id: firstId,
                    name: '10A',
                    students: defaultStudents,
                    roomConfig: { rows: 5, cols: 6, grouping: 'None' },
                    customGroups: [], // { ids: [], color: string }
                    layout: [],
                    score: null,
                    history: []
                }
            };
        });

        const [activeClassId, setActiveClassId] = React.useState(() => {
            return Object.keys(classrooms)[0];
        });

        const [editingId, setEditingId] = React.useState(null);
        const [viewMode, setViewMode] = React.useState('editor'); // editor | projector
        const [isGroupingMode, setIsGroupingMode] = React.useState(false);
        const [selectedSeats, setSelectedSeats] = React.useState([]);

        // --- Persistence Effect ---
        React.useEffect(() => {
            localStorage.setItem('klasserom_data', JSON.stringify(classrooms));
        }, [classrooms]);

        // --- Derived State (Active Class) ---
        const activeClass = classrooms[activeClassId];
        const students = activeClass.students;
        const roomConfig = activeClass.roomConfig;
        const layout = activeClass.layout;
        const score = activeClass.score;

        // --- Helpers for State Updates ---
        const updateActiveClass = (updates) => {
            setClassrooms(prev => ({
                ...prev,
                [activeClassId]: { ...prev[activeClassId], ...updates }
            }));
        };

        // Initialize Layout (Legacy Effect logic adapted)
        React.useEffect(() => {
            const size = roomConfig.rows * roomConfig.cols;
            if (layout.length !== size) {
                const newLayout = new Array(size).fill(null);
                for (let i = 0; i < Math.min(layout.length, size); i++) {
                    newLayout[i] = layout[i];
                }
                updateActiveClass({ layout: newLayout });
            }
        }, [roomConfig.rows, roomConfig.cols]); // Only trigger if dims change

        // Helpers
        const getStudent = (id) => students.find(s => s.id === id);
        const assignedIds = new Set(layout.filter(id => id !== null));
        const unassigned = students.filter(s => !assignedIds.has(s.id));

        // --- Actions ---

        // Multi-Class Actions
        const handleAddClass = () => {
            const newId = window.Utils.generateId();
            setClassrooms(prev => ({
                ...prev,
                [newId]: {
                    id: newId,
                    name: `New Class`, // User can rename later
                    students: [],
                    roomConfig: { rows: 5, cols: 6, grouping: 'None' },
                    layout: [],
                    score: null,
                    history: []
                }
            }));
            setActiveClassId(newId);
        };

        const handleResetClass = () => {
            if (confirm("Are you sure you want to completely RESET this class? This will wipe all students, rules, and layout.")) {
                updateActiveClass({
                    students: [],
                    layout: new Array(roomConfig.rows * roomConfig.cols).fill(null),
                    score: null,
                    history: [],
                    customGroups: []
                });
            }
        };

        const handleExportClass = () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeClass));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `${activeClass.name || "classroom"}_backup.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        };

        const handleImportClassTrigger = () => {
            document.getElementById('import-file-input').click();
        };

        const handleImportClassFile = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (!imported.id || !imported.roomConfig) {
                        alert("Invalid Class File");
                        return;
                    }
                    const newId = window.Utils.generateId();
                    const newClass = { ...imported, id: newId, name: `${imported.name} (Imported)` };
                    setClassrooms(prev => ({
                        ...prev,
                        [newId]: newClass
                    }));
                    setActiveClassId(newId);
                } catch (err) {
                    console.error(err);
                    alert("Failed to import file");
                }
            };
            reader.readAsText(file);
            // Reset input
            event.target.value = null;
        };

        const handleDeleteClass = (idToDelete) => {
            if (Object.keys(classrooms).length <= 1) return; // Prevent deleting last
            const newClassrooms = { ...classrooms };
            delete newClassrooms[idToDelete];
            setClassrooms(newClassrooms);
            if (activeClassId === idToDelete) {
                setActiveClassId(Object.keys(newClassrooms)[0]);
            }
        };

        const handleImport = (items) => {
            const newStudents = items.map(item => {
                const isString = typeof item === 'string';
                return {
                    id: window.Utils.generateId(),
                    name: isString ? item : item.name,
                    constraints: [],
                    enemies: [],
                    buddies: [],
                    gender: isString ? 'O' : (item.gender || 'O'),
                    level: isString ? 2 : (item.level || 2)
                };
            });
            updateActiveClass({ students: [...students, ...newStudents] });
        };

        const handleUpdateStudent = (id, updates) => {
            const newStudents = students.map(s => s.id === id ? { ...s, ...updates } : s);
            updateActiveClass({ students: newStudents });
        };

        const handleGenerate = () => {
            // 1. Archive current layout to history (if valid)
            let newHistory = [...activeClass.history];
            if (layout.some(id => id !== null)) {
                newHistory.unshift({ date: Date.now(), layout: [...layout] });
                if (newHistory.length > 10) newHistory.pop(); // Keep last 10
            }

            const roster = [...students];
            // 2. Generate new, passing history for avoidance AND customGroups for void seats
            const newLayoutObjects = window.SeatingAlgorithm.generate(roster, { ...roomConfig, history: newHistory }, activeClass.customGroups || []);
            const newLayoutIds = newLayoutObjects.map(s => s ? s.id : null);

            const evalResult = window.SeatingAlgorithm.evaluate(newLayoutObjects, { ...roomConfig, history: newHistory });

            updateActiveClass({
                layout: newLayoutIds,
                score: evalResult,
                history: newHistory
            });
        };

        const handleSwap = (idx1, idx2) => {
            const next = [...layout];
            [next[idx1], next[idx2]] = [next[idx2], next[idx1]];
            updateActiveClass({ layout: next, score: null }); // Invalidate score
        };

        const handleAssign = (studentId, index) => {
            const next = [...layout];
            const oldIndex = next.indexOf(studentId);
            if (oldIndex !== -1) next[oldIndex] = null; // Remove from old
            next[index] = studentId;
            updateActiveClass({ layout: next, score: null });
        };

        const handleDeleteStudent = (id) => {
            const nextStudents = students.filter(s => s.id !== id);
            const nextLayout = layout.map(sid => sid === id ? null : sid);
            updateActiveClass({ students: nextStudents, layout: nextLayout });
        };

        const handleClearRoster = () => {
            updateActiveClass({ students: [], layout: new Array(layout.length).fill(null), score: null });
        };

        const handleClearLayout = () => {
            if (confirm('Clear current seating arrangement? (Students will move to roster)')) {
                updateActiveClass({ layout: new Array(layout.length).fill(null), score: null });
            }
        };

        // --- Manual Grouping Handlers ---
        const handleToggleDetails = (idx) => {
            // In grouping mode, toggle selection
            if (selectedSeats.includes(idx)) {
                setSelectedSeats(prev => prev.filter(i => i !== idx));
            } else {
                setSelectedSeats(prev => [...prev, idx]);
            }
        };

        const handleCreateGroup = (type = 'color') => {
            if (selectedSeats.length === 0) return;

            let color = '';
            if (type === 'color') {
                const colors = [
                    'bg-blue-100 border-blue-200', 'bg-green-100 border-green-200',
                    'bg-orange-100 border-orange-200', 'bg-purple-100 border-purple-200',
                    'bg-pink-100 border-pink-200', 'bg-teal-100 border-teal-200'
                ];
                color = colors[(activeClass.customGroups || []).length % colors.length];
            }

            const newGroup = {
                id: window.Utils.generateId(),
                type: type, // 'color' or 'void'
                color,
                ids: [...selectedSeats]
            };

            // Remove selected seats from any existing manual groups (Override behavior)
            const existingGroupsFn = (groups) => {
                if (!groups) return [];
                return groups.map(g => ({
                    ...g,
                    ids: g.ids.filter(id => !selectedSeats.includes(id))
                })).filter(g => g.ids.length > 0); // Clean up empty groups
            };

            // If creating a VOID group, we should also remove any students currently in those seats
            if (type === 'void') {
                const currentLayout = [...activeClass.layout];
                let changed = false;
                selectedSeats.forEach(idx => {
                    if (currentLayout[idx]) {
                        currentLayout[idx] = null; // Move student back to roster implicitly (by removing from layout)
                        changed = true;
                    }
                });
                if (changed) {
                    updateActiveClass({ layout: currentLayout });
                }
            }

            updateActiveClass({
                customGroups: [...existingGroupsFn(activeClass.customGroups), newGroup]
            });
            setSelectedSeats([]);
        };

        const handleClearGroups = () => {
            if (confirm("Remove all manual groups?")) {
                updateActiveClass({ customGroups: [] });
            }
        };

        const handleFillTestStudents = () => {
            const currentCount = students.length;
            const capacity = roomConfig.rows * roomConfig.cols;
            if (currentCount >= capacity) {
                alert("Classroom is already full!");
                return;
            }

            const needed = capacity - currentCount;
            if (!confirm(`Generate ${needed} test students to fill the room?`)) return;

            const newStudents = new Array(needed).fill(null).map((_, i) => ({
                id: window.Utils.generateId(),
                name: `Student ${currentCount + i + 1}`,
                constraints: [],
                enemies: [],
                buddies: [],
                gender: Math.random() > 0.5 ? 'M' : 'F',
                level: 2
            }));

            updateActiveClass({ students: [...students, ...newStudents] });
        };

        const generatePDF = async () => {
            const element = document.getElementById('seating-draw-area');
            const canvas = await window.html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new window.jspdf.jsPDF('l', 'mm', 'a4');
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save(`${activeClass.name || 'seating-chart'}.pdf`);
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
                        onDeleteStudent={handleDeleteStudent}
                        onClearRoster={handleClearRoster}
                        onEdit={(id) => setEditingId(id)}
                        roomConfig={roomConfig}
                        onUpdateConfig={(k, v) => updateActiveClass({ roomConfig: { ...roomConfig, [k]: v } })}
                        onGenerate={handleGenerate}
                        onFillTestStudents={handleFillTestStudents}
                    />
                </div>

                {/* Main Content */}
                <div className={`flex-1 flex flex-col h-full relative ${viewMode === 'projector' ? 'pl-0' : 'pl-80'}`}>
                    {/* Toolbar */}
                    <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 shrink-0 z-20 print:hidden">
                        <div className="flex items-center gap-4">
                            {/* Class Switcher */}
                            <div className="relative group">
                                <button className="flex items-center gap-2 text-xl font-bold bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                                    <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">{activeClass.name}</span> <window.Icon name="chevron-down" size={16} className="text-slate-400" />
                                </button>
                                <div className="absolute top-full left-0 pt-2 w-56 z-50 hidden group-hover:block">
                                    <div className="bg-white rounded-lg shadow-xl border border-slate-100 p-2">
                                        <div className="mb-2 pb-2 border-b border-slate-100">
                                            <input
                                                type="text"
                                                value={activeClass.name}
                                                onChange={(e) => updateActiveClass({ name: e.target.value })}
                                                className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:border-brand-500 outline-none font-bold"
                                                placeholder="Class Name"
                                            />
                                        </div>
                                        <ul className="space-y-1 max-h-48 overflow-y-auto">
                                            {Object.values(classrooms).map(c => (
                                                <li key={c.id}>
                                                    <button
                                                        onClick={() => setActiveClassId(c.id)}
                                                        className={`w-full text-left px-2 py-1.5 rounded text-sm flex justify-between items-center ${activeClassId === c.id ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                                                    >
                                                        {c.name}
                                                        {Object.keys(classrooms).length > 1 && (
                                                            <span onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }} className="text-slate-300 hover:text-red-500 px-1">×</span>
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-1">
                                            <button onClick={handleAddClass} className="w-full text-xs font-bold text-center py-2 bg-slate-50 hover:bg-slate-100 text-brand-600 rounded border border-dashed border-brand-200">
                                                + New Class
                                            </button>
                                            <div className="grid grid-cols-2 gap-1 mt-1">
                                                <button onClick={handleExportClass} className="text-xs py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded flex items-center justify-center gap-1" title="Save Class to File">
                                                    <window.Icon name="download" size={12} /> Save
                                                </button>
                                                <button onClick={handleImportClassTrigger} className="text-xs py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded flex items-center justify-center gap-1" title="Load Class from File">
                                                    <window.Icon name="upload" size={12} /> Load
                                                </button>
                                                <input type="file" id="import-file-input" className="hidden" accept=".json" onChange={handleImportClassFile} />
                                            </div>
                                            <button onClick={handleResetClass} className="w-full mt-1 text-xs py-1.5 text-red-500 hover:bg-red-50 rounded flex items-center justify-center gap-1 font-medium">
                                                <window.Icon name="rotate-ccw" size={12} /> Reset Current Class
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleClearLayout}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Remove all students from seating"
                            >
                                <window.Icon name="eraser" size={14} /> Clear Seats
                            </button>

                            {score && score.violations.length === 0 && (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                    <window.Icon name="check-circle" size={14} /> Rules Met
                                </span>
                            )}
                            {score && score.violations.length > 0 && (
                                <div className="relative group">
                                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100 cursor-help">
                                        <window.Icon name="alert-circle" size={14} /> {score.violations.length} Violation(s)
                                    </span>
                                    {/* Tooltip Dropdown */}
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-red-100 p-3 z-50 hidden group-hover:block">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b pb-1">Issues Found</h4>
                                        <ul className="space-y-1">
                                            {score.violations.map((v, i) => (
                                                <li key={i} className="text-xs text-red-600 flex items-start gap-1.5 leading-tight">
                                                    <window.Icon name="x-circle" size={12} className="shrink-0 mt-0.5" />
                                                    <span>
                                                        {v.type === 'separation' && `Separation: ${v.student.name} near ${v.with?.name}`}
                                                        {/* Add other types if needed */}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            <div className="h-6 w-px bg-slate-300 mx-2"></div>

                            <div className="flex items-center gap-2">
                                {!isGroupingMode ? (
                                    <button
                                        onClick={() => { setIsGroupingMode(true); updateActiveClass({ roomConfig: { ...roomConfig, grouping: 'None' } }); }}
                                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <window.Icon name="layers" size={14} /> Group
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                        <span className="text-xs font-bold text-indigo-700 mr-2">Select Seats: {selectedSeats.length}</span>
                                        <button
                                            onClick={() => handleCreateGroup('color')}
                                            disabled={selectedSeats.length === 0}
                                            className="px-2 py-1 text-xs bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Group
                                        </button>
                                        <button
                                            onClick={() => handleCreateGroup('void')}
                                            disabled={selectedSeats.length === 0}
                                            className="px-2 py-1 text-xs bg-slate-600 text-white rounded shadow-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Mark selected seats as empty space"
                                        >
                                            <window.Icon name="ban" size={12} className="inline mr-1" /> Empty
                                        </button>
                                        <button
                                            onClick={() => { setIsGroupingMode(false); setSelectedSeats([]); }}
                                            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                                        >
                                            Done
                                        </button>
                                        {(activeClass.customGroups || []).length > 0 && (
                                            <button
                                                onClick={handleClearGroups}
                                                className="ml-2 px-2 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 flex items-center gap-1"
                                                title="Clear All Groups"
                                            >
                                                <window.Icon name="trash-2" size={12} /> Clear Groups
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

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
                                onEdit={(id) => setEditingId(id)}
                                selection={isGroupingMode ? selectedSeats : []}
                                violationIndices={!isGroupingMode && score ? score.violations.map(v => layout.indexOf(v.student.id)) : []}
                                onToggleSelection={isGroupingMode ? handleToggleDetails : null}
                                customGroups={activeClass.customGroups || []}
                            />
                        </div>
                    </main>
                </div>

                {/* Global Edit Modal */}
                {editingId && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                            {(() => {
                                const s = students.find(x => x.id === editingId);
                                if (!s) return null;
                                return (
                                    <div>
                                        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
                                                    {s.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{s.name}</h3>
                                                    <p className="text-xs text-slate-500">Edit Settings</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><window.Icon name="x" size={20} /></button>
                                        </div>
                                        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Student Profile</label>
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div>
                                                        <label className="block text-[10px] text-slate-500 font-medium mb-1">Gender</label>
                                                        <select
                                                            value={s.gender || 'O'}
                                                            onChange={e => handleUpdateStudent(s.id, { gender: e.target.value })}
                                                            className="w-full p-2 border border-slate-200 rounded text-sm bg-white outline-none focus:border-brand-500"
                                                        >
                                                            <option value="O">Other/Unspecified</option>
                                                            <option value="M">Boy</option>
                                                            <option value="F">Girl</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-slate-500 font-medium mb-1">Academic Level</label>
                                                        <select
                                                            value={s.level || 2}
                                                            onChange={e => handleUpdateStudent(s.id, { level: parseInt(e.target.value) })}
                                                            className="w-full p-2 border border-slate-200 rounded text-sm bg-white outline-none focus:border-brand-500"
                                                        >
                                                            <option value={1}>Needs Support (1)</option>
                                                            <option value={2}>Average (2)</option>
                                                            <option value={3}>High Achiever (3)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Zone Constraints</label>
                                                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    {(() => {
                                                        const currentSeatIdx = layout.indexOf(s.id);
                                                        const isSeated = currentSeatIdx !== -1;
                                                        return (
                                                            <>
                                                                <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-brand-600">
                                                                    <input type="checkbox" checked={s.constraints.includes('lock_front')}
                                                                        onChange={e => {
                                                                            let newC = s.constraints.filter(x => x !== 'lock_front' && x !== 'lock_back');
                                                                            if (e.target.checked) newC.push('lock_front');
                                                                            handleUpdateStudent(s.id, { constraints: newC });
                                                                        }}
                                                                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                                                                    Lock to Front Row
                                                                </label>
                                                                <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-brand-600">
                                                                    <input type="checkbox" checked={s.constraints.includes('lock_back')}
                                                                        onChange={e => {
                                                                            let newC = s.constraints.filter(x => x !== 'lock_front' && x !== 'lock_back');
                                                                            if (e.target.checked) newC.push('lock_back');
                                                                            handleUpdateStudent(s.id, { constraints: newC });
                                                                        }}
                                                                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                                                                    Lock to Back Row
                                                                </label>

                                                                {isSeated && (
                                                                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-brand-600 border-t border-slate-100 pt-2 mt-2">
                                                                        <input type="checkbox" checked={s.lockedSeat === currentSeatIdx}
                                                                            onChange={e => {
                                                                                handleUpdateStudent(s.id, { lockedSeat: e.target.checked ? currentSeatIdx : null });
                                                                            }}
                                                                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                                                                        Lock to Seat #{currentSeatIdx + 1}
                                                                    </label>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Social</label>

                                                {/* Buddies */}
                                                <div className="mb-4">
                                                    <div className="text-xs text-slate-500 mb-2 font-medium">Sit close/next to (Buddies):</div>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full p-2.5 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                                                            onChange={e => {
                                                                if (e.target.value && !s.buddies?.includes(e.target.value)) {
                                                                    handleUpdateStudent(s.id, { buddies: [...(s.buddies || []), e.target.value] });
                                                                }
                                                                e.target.value = "";
                                                            }}
                                                        >
                                                            <option value="">+ Add Buddy</option>
                                                            {students.filter(x => x.id !== s.id && !(s.buddies || []).includes(x.id)).map(o => (
                                                                <option key={o.id} value={o.id}>{o.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-3 top-3 pointer-events-none text-slate-400"><window.Icon name="chevron-down" size={16} /></div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(s.buddies || []).map(bId => {
                                                            const b = students.find(x => x.id === bId);
                                                            return (
                                                                <span key={bId} className="flex items-center gap-1 bg-green-50 border border-green-100 text-green-700 pl-2 pr-1 py-1 rounded-full text-xs font-medium">
                                                                    <window.Icon name="heart" size={12} className="text-green-400" />
                                                                    {b?.name || 'Unknown'}
                                                                    <button onClick={() => handleUpdateStudent(s.id, { buddies: s.buddies.filter(x => x !== bId) })} className="p-0.5 hover:bg-green-200 rounded-full ml-1"><window.Icon name="x" size={12} /></button>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Enemies */}
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-2 font-medium">Avoid (Enemies):</div>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full p-2.5 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                                                            onChange={e => {
                                                                if (e.target.value && !s.enemies?.includes(e.target.value)) {
                                                                    handleUpdateStudent(s.id, { enemies: [...(s.enemies || []), e.target.value] });
                                                                }
                                                                e.target.value = "";
                                                            }}
                                                        >
                                                            <option value="">+ Add Person to Avoid</option>
                                                            {students.filter(x => x.id !== s.id && !(s.enemies || []).includes(x.id)).map(o => (
                                                                <option key={o.id} value={o.id}>{o.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                                                            <window.Icon name="chevron-down" size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(s.enemies || []).map(enId => {
                                                            const en = students.find(x => x.id === enId);
                                                            return (
                                                                <span key={enId} className="flex items-center gap-1 bg-red-50 border border-red-100 text-red-700 pl-2 pr-1 py-1 rounded-full text-xs font-medium">
                                                                    <window.Icon name="ban" size={12} className="text-red-400" />
                                                                    {en?.name || 'Unknown'}
                                                                    <button onClick={() => handleUpdateStudent(s.id, { enemies: s.enemies.filter(x => x !== enId) })} className="p-0.5 hover:bg-red-200 rounded-full ml-1"><window.Icon name="x" size={12} /></button>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
                                            <button
                                                onClick={() => {
                                                    if (confirm("Clear all rules (locks, buddies, enemies) for this student?")) {
                                                        handleUpdateStudent(s.id, { constraints: [], buddies: [], enemies: [], lockedSeat: null });
                                                    }
                                                }}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                                            >
                                                <window.Icon name="trash-2" size={12} /> Clear Rules
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-100 shadow-sm">Done</button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        );
    };
})();
