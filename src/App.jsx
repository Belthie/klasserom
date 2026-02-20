
(function () {
    // Default student gen helper
    const generateDefaultStudents = () => {
        if (!window.Utils || !window.Utils.MOCK_NAMES) return [];
        return window.Utils.MOCK_NAMES.map(name => ({
            id: window.Utils.generateId(),
            name,
            constraints: [], // 'lock_front', 'lock_back'
            enemies: [], // IDs
            buddies: [],
            level: 2,
            gender: 'O'
        }));
    };

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
                    students: generateDefaultStudents(),
                    roomConfig: { rows: 5, cols: 6, grouping: 'None', enableGenderBalance: false, enableAcademicDiversity: false, enableSameGender: false },
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

        const [activeTab, setActiveTab] = React.useState('students'); // students | room | seating | groups
        const [editingId, setEditingId] = React.useState(null); // For student edit modal
        const [showTutorial, setShowTutorial] = React.useState(false);
        const [isStudentMode, setIsStudentMode] = React.useState(false);

        // --- Persistence Effect ---
        React.useEffect(() => {
            localStorage.setItem('klasserom_data', JSON.stringify(classrooms));
        }, [classrooms]);

        // --- Derived State (Active Class) ---
        const activeClass = classrooms[activeClassId] || Object.values(classrooms)[0];
        const students = activeClass.students || [];
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

        // Initialize Layout Sync
        React.useEffect(() => {
            const size = roomConfig.rows * roomConfig.cols;
            if (layout.length !== size) {
                const newLayout = new Array(size).fill(null);
                for (let i = 0; i < Math.min(layout.length, size); i++) {
                    newLayout[i] = layout[i];
                }
                updateActiveClass({ layout: newLayout });
            }
        }, [roomConfig.rows, roomConfig.cols]);

        // --- Actions ---

        // Class Management
        const handleAddClass = () => {
            const name = prompt("Navn på ny klasse:", "Ny klasse");
            if (name === null) return; // User cancelled

            const newId = window.Utils.generateId();
            setClassrooms(prev => ({
                ...prev,
                [newId]: {
                    id: newId,
                    name: name.trim() || "Ny klasse",
                    students: [],
                    roomConfig: { rows: 5, cols: 6, grouping: 'None', enableGenderBalance: false, enableAcademicDiversity: false, enableSameGender: false },
                    layout: [],
                    score: null,
                    history: []
                }
            }));
            setActiveClassId(newId);
        };

        const handleResetClass = () => {
            if (confirm("Er du sikker på at du vil NULLSTILLE denne klassen? Dette sletter alle elever og oppsett.")) {
                updateActiveClass({
                    students: [],
                    layout: new Array(roomConfig.rows * roomConfig.cols).fill(null),
                    score: null,
                    history: [],
                    undoStack: [],
                    redoStack: [],
                    pickedHistory: [],
                    customGroups: []
                });
            }
        };

        const handleRenameClass = (idToRename, currentName) => {
            const newName = prompt("Skriv inn nytt navn på klassen:", currentName);
            if (!newName || newName.trim() === "") return;

            setClassrooms(prev => ({
                ...prev,
                [idToRename]: { ...prev[idToRename], name: newName.trim() }
            }));
        };

        const handleDeleteClass = (idToDelete) => {
            if (Object.keys(classrooms).length <= 1) {
                alert("Du må ha minst én klasse.");
                return;
            }

            const classToDelete = classrooms[idToDelete];
            if (!confirm(`Er du sikker på at du vil slette klassen "${classToDelete.name}"? Dette kan ikke angres.`)) {
                return;
            }

            const newClassrooms = { ...classrooms };
            delete newClassrooms[idToDelete];
            setClassrooms(newClassrooms);

            if (activeClassId === idToDelete) {
                setActiveClassId(Object.keys(newClassrooms)[0]);
            }
        };

        // Import/Export
        // Import/Export
        const handleExportClass = async () => {
            const encrypted = window.Security.encrypt(activeClass);
            if (!encrypted) {
                alert("Kunne ikke kryptere data.");
                return;
            }
            const fileName = `${activeClass.name || "classroom"}.secure.json`;

            try {
                // Try File System Access API for "Save As" dialog
                if (window.showSaveFilePicker) {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'SmartPlass Fil',
                            accept: { 'application/json': ['.json'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(encrypted);
                    await writable.close();
                    return;
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.warn("SaveFilePicker failed, falling back to download.", err);
                } else {
                    return; // User cancelled
                }
            }

            // Fallback
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(encrypted);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", fileName);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        };

        // --- Undo/Redo Logic ---
        const saveHistory = () => {
            const currentSnapshot = {
                layout: [...activeClass.layout],
                students: [...activeClass.students], // Deep copy needed? students are objects. Shallow copy of array is usually enough if we replace objects on update.
                customGroups: [...(activeClass.customGroups || [])],
                score: activeClass.score
            };

            const newUndoStack = [...(activeClass.undoStack || [])];
            newUndoStack.push(currentSnapshot);
            if (newUndoStack.length > 5) newUndoStack.shift(); // Keep max 5

            updateActiveClass({ undoStack: newUndoStack, redoStack: [] });
        };

        const handleUndo = () => {
            const undoStack = activeClass.undoStack || [];
            if (undoStack.length === 0) return;

            const previous = undoStack[undoStack.length - 1];
            const newUndoStack = undoStack.slice(0, -1);

            const currentSnapshot = {
                layout: activeClass.layout,
                students: activeClass.students,
                customGroups: activeClass.customGroups,
                score: activeClass.score
            };
            const newRedoStack = [currentSnapshot, ...(activeClass.redoStack || [])];

            updateActiveClass({
                ...previous,
                undoStack: newUndoStack,
                redoStack: newRedoStack
            });
        };

        const handleRedo = () => {
            const redoStack = activeClass.redoStack || [];
            if (redoStack.length === 0) return;

            const next = redoStack[0];
            const newRedoStack = redoStack.slice(1);

            const currentSnapshot = {
                layout: activeClass.layout,
                students: activeClass.students,
                customGroups: activeClass.customGroups,
                score: activeClass.score
            };
            const newUndoStack = [...(activeClass.undoStack || []), currentSnapshot];
            if (newUndoStack.length > 5) newUndoStack.shift();

            updateActiveClass({
                ...next,
                undoStack: newUndoStack,
                redoStack: newRedoStack
            });
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
                    const imported = window.Security.decrypt(e.target.result);
                    if (!imported) return;

                    if (!imported.id || !imported.roomConfig) {
                        alert("Ugyldig filstruktur");
                        return;
                    }

                    // MIGRATION / SANITIZATION
                    // Ensure all new fields exist to prevent crashes
                    const migrated = {
                        ...imported,
                        roomConfig: {
                            rows: 5, cols: 6, grouping: 'None',
                            enableGenderBalance: false, enableAcademicDiversity: false, enableSameGender: false,
                            ...imported.roomConfig
                        },
                        customGroups: imported.customGroups || [], // Helper for manual grouping
                        history: [], // Reset algo history
                        undoStack: [], // Reset undo
                        redoStack: [], // Reset redo
                        pickedHistory: imported.pickedHistory || [],
                        future: undefined, // Cleanup old if exists
                        students: (imported.students || []).map(s => ({
                            ...s,
                            constraints: s.constraints || [],
                            enemies: s.enemies || [],
                            buddies: s.buddies || []
                        }))
                    };

                    const newId = window.Utils.generateId();
                    const newClass = { ...migrated, id: newId, name: migrated.name };
                    setClassrooms(prev => ({
                        ...prev,
                        [newId]: newClass
                    }));
                    setActiveClassId(newId);
                    alert("Klasse importert!");
                } catch (err) {
                    console.error(err);
                    alert("Kunne ikke importere filen");
                }
            };
            reader.readAsText(file);
            event.target.value = null;
        };

        // Student Handlers
        const handleImportStudents = (items) => {
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
            if (updates._openEdit) {
                setEditingId(id);
                return;
            }
            const newStudents = students.map(s => s.id === id ? { ...s, ...updates } : s);
            updateActiveClass({ students: newStudents });
        };

        const handleDeleteStudent = (id) => {
            if (!confirm("Slett denne eleven?")) return;
            const nextStudents = students.filter(s => s.id !== id);
            const nextLayout = layout.map(sid => sid === id ? null : sid);
            updateActiveClass({ students: nextStudents, layout: nextLayout });
        };

        const handleClearRoster = () => {
            if (confirm("Slett ALLE elever?")) {
                updateActiveClass({ students: [], layout: new Array(layout.length).fill(null), score: null });
            }
        };

        // Layout / Generator Handlers
        const handleGenerate = () => {
            saveHistory();
            let newHistory = [...activeClass.history];
            if (layout.some(id => id !== null)) {
                newHistory.unshift({ date: Date.now(), layout: [...layout] });
                if (newHistory.length > 10) newHistory.pop();
            }

            const roster = [...students];
            // Treat furniture voids as "used" spots if needed, but GridMap handles voids differently based on implementation.
            // Current GridMap doesn't seem to support explicit "Void" type in layout array yet, purely index based.
            // We'll rely on existing algorithm.

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
            saveHistory();
            const next = [...layout];
            [next[idx1], next[idx2]] = [next[idx2], next[idx1]];
            updateActiveClass({ layout: next, score: null });
        };

        const handleAssign = (studentId, index) => {
            saveHistory();
            const next = [...layout];
            const oldIndex = next.indexOf(studentId);
            if (oldIndex !== -1) next[oldIndex] = null;
            next[index] = studentId;
            updateActiveClass({ layout: next, score: null });
        };

        const handleFurnitureClick = (index) => {
            saveHistory();
            // Toggle "Void" state logic? 
            // In the original app, there was no explicit "Void" logic in the layout array, it was just null.
            // But dragging "Empty" created a group. 
            // We will simplify: If clicking a desk, we create a VOID group for it.

            // Note: This logic depends on how GridMap renders voids.
            // Let's implement a simple toggle: If index is in a "VoidGroup", remove it. Else add it.
            const voidGroups = (activeClass.customGroups || []).filter(g => g.type === 'void');
            const otherGroups = (activeClass.customGroups || []).filter(g => g.type !== 'void');

            let newVoidGroupIds = [];
            voidGroups.forEach(g => newVoidGroupIds.push(...g.ids));

            if (newVoidGroupIds.includes(index)) {
                // Remove from void
                newVoidGroupIds = newVoidGroupIds.filter(id => id !== index);
            } else {
                // Add to void
                newVoidGroupIds.push(index);
                // Also remove any student sitting there
                if (layout[index]) {
                    const nextLayout = [...layout];
                    nextLayout[index] = null;
                    updateActiveClass({ layout: nextLayout });
                }
            }

            // Reconstruct void group
            const newVoidGroup = {
                id: 'void-group-master',
                type: 'void',
                color: 'transparent',
                ids: newVoidGroupIds
            };

            // If newVoidGroupIds is empty, we don't need the group, but keeping it simple
            updateActiveClass({
                customGroups: [...otherGroups, newVoidGroup]
            });
        };

        // Custom Grouping Logic
        const handleCreateGroup = (indices) => {
            saveHistory();
            // Filter out void groups to count actual visible groups for coloring
            const existingManualGroups = (activeClass.customGroups || []).filter(g => g.type === 'manual');

            // Cycle through palette
            // Cycle through palette
            const palette = [
                'bg-red-100 border-red-200', 'bg-orange-100 border-orange-200', 'bg-amber-100 border-amber-200',
                'bg-yellow-100 border-yellow-200', 'bg-lime-100 border-lime-200', 'bg-green-100 border-green-200',
                'bg-emerald-100 border-emerald-200', 'bg-teal-100 border-teal-200', 'bg-cyan-100 border-cyan-200',
                'bg-sky-100 border-sky-200', 'bg-blue-100 border-blue-200', 'bg-indigo-100 border-indigo-200',
                'bg-violet-100 border-violet-200', 'bg-purple-100 border-purple-200', 'bg-fuchsia-100 border-fuchsia-200',
                'bg-pink-100 border-pink-200', 'bg-rose-100 border-rose-200'
            ];
            const color = palette[existingManualGroups.length % palette.length];

            const newGroup = {
                id: window.Utils.generateId(),
                type: 'manual',
                color: color,
                ids: indices
            };

            // Clean up overlaps
            const otherGroups = (activeClass.customGroups || []).filter(g => {
                return g.type === 'void'; // keep voids
            }).filter(g => !g.ids.some(id => indices.includes(id)));

            // Add back other manual groups that didn't overlap (wait, previous logic was removing ALL manual groups? No, filtering logic was a bit weird)
            // Let's do it properly:
            // We want to KEEP existing manual groups, but REMOVE any indices that are now in the New Group.
            // Actually, simply appending is usually fine if GridMap respects priority (Last one wins?), 
            // but for cleaner data we should remove the stolen indices from old groups.

            const cleanOldGroups = (activeClass.customGroups || []).map(g => {
                if (g.type === 'void') return g; // Voids are separate
                // Remove stolen ids
                const newIds = g.ids.filter(id => !indices.includes(id));
                if (newIds.length === 0) return null; // Group is empty
                return { ...g, ids: newIds };
            }).filter(Boolean); // Remote nulls

            updateActiveClass({ customGroups: [...cleanOldGroups, newGroup] });
        };

        const handleClearGroups = () => {
            saveHistory();
            // Keep voids? User might want to clear only manual groups.
            const voids = (activeClass.customGroups || []).filter(g => g.type === 'void');
            updateActiveClass({ customGroups: voids });
        };

        const handlePickStudent = (studentId) => {
            // Note: We don't necessarily need undo/redo for this, as it's a transient session thing usually?
            // User might want to "Undo" a pick?
            // Let's safeHistory it anyway to be safe? 
            // Actually, if it's just a history log, maybe we don't clear redo stack?
            // Let's keep it simple: It updates state, so we should probably treat it as a state change.
            // But usually "Undo" is for layout changes. Undoing a "Pick" might be confusing if it reverts layout too (if they happened to change layout).
            // Let's just update `pickedHistory` without `saveHistory()` for now, to keep it lightweight.
            updateActiveClass({ pickedHistory: [...(activeClass.pickedHistory || []), studentId] });
        };

        const handleResetPickHistory = () => {
            updateActiveClass({ pickedHistory: [] });
        };

        return (
            <div className={`flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden print:h-auto print:overflow-visible ${isStudentMode ? 'bg-slate-900 border-none print:bg-white' : 'print:bg-white'}`}>
                {/* Navbar */}
                <window.Navbar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    activeClass={activeClass}
                    classrooms={classrooms}
                    onChangeClass={setActiveClassId}
                    onAddClass={handleAddClass}
                    onExport={handleExportClass}
                    onLoad={handleImportClassTrigger}
                    onReset={handleResetClass}
                    onDeleteClass={handleDeleteClass}
                    onRenameClass={handleRenameClass}
                    onOpenTutorial={() => setShowTutorial(true)}
                    isStudentMode={isStudentMode}
                    onToggleStudentMode={(mode) => {
                        setIsStudentMode(mode);
                        if (mode) setActiveTab('room');
                    }}
                />

                {/* Hidden File Input for Import */}
                <input type="file" id="import-file-input" className="hidden" accept=".json" onChange={handleImportClassFile} />

                {/* Main Content Area */}
                <main className="flex-1 relative overflow-hidden">
                    {activeTab === 'students' && !isStudentMode && (
                        <window.StudentsTab
                            students={students}
                            onImport={handleImportStudents}
                            onUpdateStudent={handleUpdateStudent}
                            onDeleteStudent={handleDeleteStudent}
                            onClearRoster={handleClearRoster}
                        />
                    )}

                    {activeTab === 'room' && (
                        <window.RoomTab
                            // Configuration & Layout
                            classTitle={activeClass.name}
                            roomConfig={roomConfig}
                            onUpdateConfig={(updates) => updateActiveClass({ roomConfig: { ...roomConfig, ...updates } })}
                            layout={layout}

                            // Data
                            students={students}
                            score={score}
                            customGroups={activeClass.customGroups}

                            // Tools/Actions
                            onFurnitureClick={handleFurnitureClick}
                            onCreateGroup={handleCreateGroup}
                            onClearGroups={handleClearGroups}
                            onGenerate={handleGenerate}
                            onSwap={handleSwap}
                            onAssign={handleAssign}
                            onEdit={(id) => handleUpdateStudent(id, { _openEdit: true })}

                            // History
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={(activeClass.undoStack || []).length > 0}
                            canRedo={(activeClass.redoStack || []).length > 0}

                            // Random Picker
                            pickedHistory={activeClass.pickedHistory || []}
                            onPickStudent={handlePickStudent}
                            onResetPickHistory={handleResetPickHistory}

                            // View Mode (Passed down)
                            isStudentMode={isStudentMode}
                        />
                    )}

                    {activeTab === 'groups' && (
                        <div className={`w-full h-full overflow-auto p-8 ${isStudentMode ? 'bg-slate-900' : ''}`}>
                            <window.GroupGenerator students={students} title={activeClass.name} isStudentMode={isStudentMode} />
                        </div>
                    )}

                    {activeTab === 'random' && (
                        <window.RandomStudentTab
                            students={students}
                            pickedHistory={activeClass.pickedHistory || []}
                            onPickStudent={handlePickStudent}
                            onResetPickHistory={handleResetPickHistory}
                        />
                    )}
                </main>

                {/* Edit Student Modal (Re-used existing logic but isolated) */}
                {editingId && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                            {(() => {
                                const s = students.find(x => x.id === editingId);
                                if (!s) return null;
                                // Simple form - recreating the essence of the previous sidebar edit form
                                return (
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold">Rediger {s.name}</h3>
                                            <button onClick={() => setEditingId(null)}><window.Icon name="x" /></button>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Basic Info */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kjønn</label>
                                                    <select
                                                        value={s.gender || 'O'}
                                                        onChange={(e) => handleUpdateStudent(s.id, { gender: e.target.value })}
                                                        className="w-full p-2 border rounded text-sm bg-white"
                                                    >
                                                        <option value="O">Ukjent</option>
                                                        <option value="M">Gutt</option>
                                                        <option value="F">Jente</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Faglig nivå</label>
                                                    <select
                                                        value={s.level || 2}
                                                        onChange={(e) => handleUpdateStudent(s.id, { level: parseInt(e.target.value) })}
                                                        className="w-full p-2 border rounded text-sm bg-white"
                                                    >
                                                        <option value={1}>Trenger støtte</option>
                                                        <option value={2}>Middels</option>
                                                        <option value={3}>Sterk</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Relasjoner</label>
                                                <p className="text-xs text-slate-400 mb-2">Velg hvem denne eleven ønsker å sitte med (Hjerte) eller bør unngå (Stopp).</p>

                                                <div className="flex gap-2 mb-2">
                                                    <select className="w-full p-2 border rounded text-sm" onChange={e => {
                                                        if (e.target.value) handleUpdateStudent(s.id, { buddies: [...s.buddies, e.target.value] });
                                                        e.target.value = "";
                                                    }}>
                                                        <option value="">+ Legg til ønske (Bestevenn)</option>
                                                        {students.filter(x => x.id !== s.id && !s.buddies.includes(x.id)).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {s.buddies.map(id => (
                                                        <span key={id} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                                                            <window.Icon name="heart" size={10} /> {students.find(x => x.id === id)?.name}
                                                            <button onClick={() => handleUpdateStudent(s.id, { buddies: s.buddies.filter(b => b !== id) })}>×</button>
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="flex gap-2 mb-2">
                                                    <select className="w-full p-2 border rounded text-sm" onChange={e => {
                                                        if (e.target.value) handleUpdateStudent(s.id, { enemies: [...s.enemies, e.target.value] });
                                                        e.target.value = "";
                                                    }}>
                                                        <option value="">+ Legg til person å unngå</option>
                                                        {students.filter(x => x.id !== s.id && !s.enemies.includes(x.id)).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {s.enemies.map(id => (
                                                        <span key={id} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-1">
                                                            <window.Icon name="ban" size={10} /> {students.find(x => x.id === id)?.name}
                                                            <button onClick={() => handleUpdateStudent(s.id, { enemies: s.enemies.filter(b => b !== id) })}>×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Låsing</label>
                                                <div className="space-y-1">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={s.constraints.includes('lock_front')} onChange={e => {
                                                            const newC = s.constraints.filter(x => x !== 'lock_front');
                                                            if (e.target.checked) newC.push('lock_front');
                                                            handleUpdateStudent(s.id, { constraints: newC });
                                                        }} />
                                                        Lås til første rad
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={s.constraints.includes('lock_back')} onChange={e => {
                                                            const newC = s.constraints.filter(x => x !== 'lock_back');
                                                            if (e.target.checked) newC.push('lock_back');
                                                            handleUpdateStudent(s.id, { constraints: newC });
                                                        }} />
                                                        Lås til bakerste rad
                                                    </label>

                                                    {/* Lock to current seat */}
                                                    {(() => {
                                                        const currentSeat = layout.indexOf(s.id);
                                                        if (currentSeat === -1 && (s.lockedSeat === undefined || s.lockedSeat === null)) return null;

                                                        // If already locked to a seat that they are NOT in, we still show the option to keep or unlock it.
                                                        // But typically we want to lock to WHERE THEY ARE.

                                                        const lockedSeatVal = s.lockedSeat;
                                                        const seatToDisplay = lockedSeatVal !== undefined && lockedSeatVal !== null ? lockedSeatVal : currentSeat;

                                                        return (
                                                            <label className="flex items-center gap-2 text-sm text-indigo-700 font-medium">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={lockedSeatVal !== undefined && lockedSeatVal !== null}
                                                                    onChange={e => {
                                                                        if (e.target.checked) {
                                                                            // Lock to current seat position
                                                                            if (currentSeat !== -1) {
                                                                                handleUpdateStudent(s.id, { lockedSeat: currentSeat });
                                                                            }
                                                                        } else {
                                                                            // Unlock
                                                                            handleUpdateStudent(s.id, { lockedSeat: null });
                                                                        }
                                                                    }}
                                                                />
                                                                Lås til nåværende pult (Plass {seatToDisplay + 1})
                                                            </label>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-4 border-t flex justify-end">
                                            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Ferdig</button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
                {/* Tutorial Modal */}
                {showTutorial && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTutorial(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800">Videoopplæring</h3>
                                <button onClick={() => setShowTutorial(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <window.Icon name="x" size={20} />
                                </button>
                            </div>
                            <div className="flex-1 bg-black aspect-video flex items-center justify-center relative">
                                <video
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                    src="https://mellemstrand.net/klasserom/video/smartplass.mp4"
                                >
                                    Din nettleser støtter ikke videoavspilling.
                                </video>
                            </div>
                            <div className="p-6 bg-white">
                                <p className="text-slate-600 text-sm">
                                    Her kan du se hvordan du bruker SmartPlass.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };
})();
