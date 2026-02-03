
(function () {
    window.Sidebar = ({
        students,
        unassigned,
        onImport,
        onUpdateStudent,
        onDeleteStudent, // New
        onClearRoster,   // New
        onEdit,
        roomConfig,
        onUpdateConfig,
        onGenerate,
        onFillTestStudents // New
    }) => {
        const [tab, setTab] = React.useState('roster'); // roster | settings
        const [importText, setImportText] = React.useState('');
        // Removed editingId state

        const handleImport = () => {
            const lines = importText.split('\n').filter(n => n.trim().length > 0);
            // Check if first line is a header (contains "name" and ",")
            // If so, skip it. But simplest is to just assume raw data if it looks like a name.

            const newNames = [];
            lines.forEach(line => {
                // Heuristic: Is it CSV?
                if (line.includes(',')) {
                    // Start parsing
                    // Format: Name, Gender (M/F), Level (1-3)
                    // If just Name, then it takes defaults
                    const parts = line.split(',').map(s => s.trim());
                    // We need to return OBJECTS or just names? The prop is onImport(names) - wait, App.jsx expects names (strings).
                    // Refactor required: I should modify App.jsx handleImport to accept Objects OR Strings.
                    // Or I can just pass objects here if I change the prop expectation?
                    // Actually, let's keep it robust. If I pass objects, App.jsx needs to handle it.
                    // Let's modify App.jsx handleImport first? No, I can't do parallel edits.
                    // I will change this to return a list of Objects { name, gender, level } 
                    // AND I must update App.jsx to handle that.

                    // Actually, I can't change App.jsx logic here. 
                    // Let's assume onImport can handle objects. 
                    // Wait, I just edited App.jsx. Let's check handleImport there.
                    // Current App.jsx handleImport:
                    // const handleImport = (names) => { const newStudents = names.map(name => ({ ... })); }
                    // It expects STRINGS.

                    // I need to update App.jsx FIRST to handle objects. 
                    // But I already closed App.jsx task.

                    // Plan B: I will update Sidebar to parse, but I need to re-open App.jsx later?
                    // No, I can fix App.jsx handleImport in the next "Refactor" step if needed.
                    // Or, I can do a sneaky trick: `onImport` is just a function. 
                    // If I pass [{name: 'Bob', ...}] instead of ['Bob'] and map over it...
                    // App.jsx: names.map(name => ({ ... name: name ... })) -> { name: {name:'Bob'} } -> garbage.

                    // I MUST Update App.jsx logic first or accept that I cannot release this feature yet.
                    // Wait, I can pass a special structure? No.

                    // Let's just create names for now, and handle CSV *parsing* in App.jsx? 
                    // No, UI should parse.

                    // Okay, I will modify Sidebar to emit structured data, and then I will immediately Fix App.jsx in next step.
                    // This file Replace is for Sidebar.

                    newNames.push({
                        name: parts[0],
                        gender: parts[1] ? (parts[1].toUpperCase().startsWith('B') || parts[1].toUpperCase().startsWith('M') || parts[1].toUpperCase().startsWith('G') ? parts[1].charAt(0).toUpperCase() : 'O') : 'O',
                        // Map 'Boy' -> 'M', 'Girl' -> 'F', 'Gutt' -> 'M', 'Jente' -> 'F' ?
                        // Let's support M/F/B/G/J/G
                        level: parts[2] ? parseInt(parts[2]) : 2
                    });
                } else {
                    newNames.push({ name: line, gender: 'O', level: 2 });
                }
            });

            if (newNames.length) onImport(newNames);
            setImportText('');
        };

        return (
            <div className="w-80 flex flex-col bg-white border-r border-slate-200 h-screen overflow-hidden print:hidden fixed left-0 top-0 bottom-0 z-40">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h1 className="font-bold text-slate-800 flex items-center gap-2">
                        <window.Icon name="layout-grid" className="text-brand-600" />
                        Classroom
                    </h1>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setTab('roster')} className={`p-1.5 rounded-md transition-all ${tab === 'roster' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`}><window.Icon name="users" size={16} /></button>
                        <button onClick={() => setTab('settings')} className={`p-1.5 rounded-md transition-all ${tab === 'settings' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`}><window.Icon name="settings-2" size={16} /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {tab === 'roster' ? (
                        <div className="p-4 space-y-6">
                            {/* Generator Action */}
                            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 shadow-sm">
                                <button onClick={onGenerate} className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2">
                                    <window.Icon name="wand-2" size={18} />
                                    Generate Plan
                                </button>
                            </div>

                            {/* Import */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><window.Icon name="user-plus" size={12} /> Bulk Add Students</h3>
                                <div className="relative group">
                                    <textarea
                                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none transition-all focus:bg-white"
                                        rows="3"
                                        placeholder="Paste names here (one per line)..."
                                        value={importText}
                                        onChange={e => setImportText(e.target.value)}
                                    />
                                    <button
                                        onClick={handleImport}
                                        disabled={!importText.trim()}
                                        className="absolute bottom-2 right-2 p-1.5 bg-white text-brand-600 rounded-md shadow-sm border border-slate-100 hover:bg-brand-50 disabled:opacity-50 transition-all"
                                        title="Add Students"
                                    >
                                        <window.Icon name="plus" size={16} />
                                    </button>
                                </div>

                                {/* Fill Test Students */}
                                <button
                                    onClick={onFillTestStudents}
                                    className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    title="Generate random students to fill the classroom"
                                >
                                    <window.Icon name="users" size={14} /> Fill with Test Students
                                </button>
                            </div>

                            {/* Unassigned List */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                                    <span>Roster ({unassigned.length}/{students.length})</span>
                                    {students.length > 0 && (
                                        <button
                                            onClick={() => { if (confirm('Delete ALL students? This cannot be undone.')) onClearRoster(); }}
                                            className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </h3>
                                <div className="space-y-2 min-h-[100px] pb-10"
                                    onDragOver={e => e.preventDefault()}
                                >
                                    {unassigned.map(s => (
                                        <div
                                            key={s.id}
                                            draggable="true"
                                            className="cursor-grab active:cursor-grabbing relative group"
                                            onDragStart={e => {
                                                e.dataTransfer.setData('type', 'sidebar_student');
                                                e.dataTransfer.setData('studentId', s.id);
                                            }}
                                        >
                                            <window.StudentCard
                                                student={s}
                                                onEdit={() => onEdit(s.id)}
                                            />
                                            <button
                                                onClick={() => { if (confirm('Delete student?')) onDeleteStudent(s.id); }}
                                                className="absolute top-2 right-2 p-1 bg-white text-slate-400 hover:text-red-500 rounded shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all z-10"
                                                title="Delete Student"
                                            >
                                                <window.Icon name="trash-2" size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {unassigned.length === 0 && students.length > 0 && <div className="text-center py-4 text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-dashed">All students seated</div>}
                                    {students.length === 0 && <div className="text-center py-4 text-slate-400 text-xs italic">No students yet. Import some!</div>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-6">
                            {/* Room Config */}
                            <section>
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><window.Icon name="grid-3x3" size={16} /> Room Dimensions</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1 font-medium">Rows</label>
                                        <input type="number" min="1" max="20" value={roomConfig.rows} onChange={e => onUpdateConfig('rows', +e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1 font-medium">Columns</label>
                                        <input type="number" min="1" max="20" value={roomConfig.cols} onChange={e => onUpdateConfig('cols', +e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-400 text-center">Total Seats: {roomConfig.rows * roomConfig.cols}</div>
                            </section>

                            <section>
                                <label className="block text-xs text-slate-500 font-bold mb-2 uppercase tracking-wider">Grouping Style</label>
                                <select
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={roomConfig.grouping}
                                    onChange={e => onUpdateConfig('grouping', e.target.value)}
                                >
                                    <option value="None">Standard Grid</option>
                                    <option value="Pairs">Pairs (2)</option>
                                    <option value="Groups of 4">Islands (Group of 4)</option>
                                </select>
                            </section>
                        </div>
                    )}
                </div>
                {/* Modal Removed from here */}
            </div>
        );
    };
})();
