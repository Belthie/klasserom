
(function () {
    window.RoomTab = ({ classTitle, roomConfig, onUpdateConfig, layout, onFurnitureClick, customGroups, onCreateGroup, onClearGroups, students, onImportStudents, onUpdateStudent, onDeleteStudent, onClearRoster, onGenerate, onSwap, onAssign, score, onEdit, onUndo, onRedo, canUndo, canRedo, pickedHistory, onPickStudent, onResetPickHistory, isStudentMode }) => {
        const [activeTool, setActiveTool] = React.useState('students'); // 'students' | 'seating' | 'furniture' | 'group'
        const [selection, setSelection] = React.useState([]);
        const [importText, setImportText] = React.useState('');
        const [showImport, setShowImport] = React.useState(false);
        // isStudentMode passed as prop

        // Safety checks for dependencies
        const GridMap = window.GridMap || (() => <div className="p-4 text-red-500 font-bold bg-red-100 rounded">Error: GridMap component not found. Check console.</div>);
        const Icon = window.Icon || (({ name }) => <span className="text-xs text-red-500">[{name}]</span>);

        if (!window.GridMap) console.error("RoomTab: window.GridMap is undefined");
        if (!window.Icon) console.error("RoomTab: window.Icon is undefined");

        const handleToggleSelection = (index) => {
            if (activeTool !== 'group') return;
            setSelection(prev => {
                if (prev.includes(index)) return prev.filter(i => i !== index);
                return [...prev, index];
            });
        };

        const handleCreateGroup = () => {
            if (selection.length === 0) return;
            onCreateGroup(selection);
            setSelection([]);
        };

        const handleBulkImport = () => {
            if (!importText.trim()) return;
            const lines = importText.split(/\n/).map(s => s.trim()).filter(Boolean);
            if (lines.length > 0) {
                onImportStudents(lines);
                setImportText('');
                setShowImport(false);
            }
        };

        return (
            <div className="flex h-full">
                {/* Sidebar Controls - Hidden on Print */}
                {/* Sidebar Controls - Hidden on Print or Student Mode */}
                {/* Sidebar Controls - Hidden on Print or Student Mode */}
                {!isStudentMode && (
                    <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col h-full overflow-y-auto shrink-0 z-10 print:hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Icon name="layout" size={24} className="text-indigo-600" />
                                Klasserom
                            </h2>
                            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <button
                                    onClick={onUndo}
                                    disabled={!canUndo}
                                    className={`text-sm font-bold transition-all ${canUndo ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-300 cursor-not-allowed'}`}
                                >
                                    Angre
                                </button>
                                <div className="w-px h-3 bg-slate-200"></div>
                                <button
                                    onClick={onRedo}
                                    disabled={!canRedo}
                                    className={`text-sm font-bold transition-all ${canRedo ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-300 cursor-not-allowed'}`}
                                >
                                    Gjør om
                                </button>
                            </div>
                        </div>


                        <div className={`space-y-4 flex-1 flex flex-col min-h-0 transition-opacity duration-300 ${isStudentMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>


                            {/* Tools Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Verktøy</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => { setActiveTool('students'); setSelection([]); }}
                                        className={`flex-1 py-2 text-[10px] font-medium rounded-md transition-all flex flex-col items-center gap-1 ${activeTool === 'students' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                        title="Administrer Elever"
                                    >
                                        <Icon name="users" size={14} />
                                        Elever
                                    </button>
                                    <button
                                        onClick={() => { setActiveTool('seating'); setSelection([]); }}
                                        className={`flex-1 py-2 text-[10px] font-medium rounded-md transition-all flex flex-col items-center gap-1 ${activeTool === 'seating' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Icon name="move" size={14} />
                                        Plassering
                                    </button>
                                    <button
                                        onClick={() => { setActiveTool('furniture'); setSelection([]); }}
                                        className={`flex-1 py-2 text-[10px] font-medium rounded-md transition-all flex flex-col items-center gap-1 ${activeTool === 'furniture' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Icon name="grid" size={14} />
                                        Møblering
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('group')}
                                        className={`flex-1 py-2 text-[10px] font-medium rounded-md transition-all flex flex-col items-center gap-1 ${activeTool === 'group' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Icon name="layers" size={14} />
                                        Grupper
                                    </button>
                                </div>
                            </div>

                            {/* Tool Specific Controls */}
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2 flex-1 flex flex-col min-h-0">
                                {activeTool === 'seating' && (
                                    <div className="space-y-4 mb-6">
                                        <button
                                            onClick={onGenerate}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Icon name="sparkles" size={18} />
                                            Generer Plassering
                                        </button>

                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Regler</h3>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-3 cursor-pointer" title="Systemet vil etter beste evne forsøke å blande gutter og jenter for å unngå rene gutte- eller jenterekker.">
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${roomConfig.enableGenderBalance ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                        {roomConfig.enableGenderBalance && <Icon name="check" size={12} className="text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={roomConfig.enableGenderBalance} onChange={e => {
                                                        onUpdateConfig({
                                                            enableGenderBalance: e.target.checked,
                                                            ...(e.target.checked ? { enableSameGender: false } : {})
                                                        });
                                                    }} />
                                                    <span className="text-sm font-medium text-slate-700">Kjønnsbalanse</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer" title="Systemet vil etter beste evne forsøke å plassere elever med ulike faglige nivåer sammen.">
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${roomConfig.enableAcademicDiversity ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                        {roomConfig.enableAcademicDiversity && <Icon name="check" size={12} className="text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={roomConfig.enableAcademicDiversity} onChange={e => onUpdateConfig({ enableAcademicDiversity: e.target.checked })} />
                                                    <span className="text-sm font-medium text-slate-700">Faglig spredning</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer" title="Systemet vil etter beste evne forsøke å plassere elever av samme kjønn sammen.">
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${roomConfig.enableSameGender ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                        {roomConfig.enableSameGender && <Icon name="check" size={12} className="text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={roomConfig.enableSameGender} onChange={e => {
                                                        onUpdateConfig({
                                                            enableSameGender: e.target.checked,
                                                            ...(e.target.checked ? { enableGenderBalance: false } : {})
                                                        });
                                                    }} />
                                                    <span className="text-sm font-medium text-slate-700">Samme kjønn</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}


                                {activeTool === 'students' && (
                                    <div className="space-y-4 flex flex-col h-full">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onImportStudents(['Ny Elev'])}
                                                className="flex-1 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-2 text-xs"
                                            >
                                                <Icon name="plus" size={14} /> Ny elev
                                            </button>
                                            <button
                                                onClick={() => setShowImport(!showImport)}
                                                className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 text-xs"
                                            >
                                                <Icon name="list" size={14} /> Importer
                                            </button>
                                        </div>

                                        {showImport && (
                                            <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                                <textarea
                                                    value={importText}
                                                    onChange={e => setImportText(e.target.value)}
                                                    className="w-full h-24 p-2 border border-slate-200 rounded text-xs mb-2"
                                                    placeholder="Lim inn liste (ett navn per linje)"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setShowImport(false)} className="text-xs px-3 py-1 text-slate-500">Avbryt</button>
                                                    <button onClick={handleBulkImport} className="text-xs px-3 py-1 bg-indigo-600 text-white rounded">Lagre</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex-1 min-h-[150px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                            {students.length === 0 ? (
                                                <div className="text-center p-4 text-xs text-slate-500 bg-slate-50 rounded border border-dashed">
                                                    Ingen elever lagt til
                                                </div>
                                            ) : (
                                                students.map((val) => (
                                                    <div key={val.id} className="flex flex-col bg-white border border-slate-100 rounded-lg p-2 hover:border-slate-300">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <input
                                                                type="text"
                                                                value={val.name}
                                                                onChange={(e) => onUpdateStudent(val.id, { name: e.target.value })}
                                                                className="text-sm font-bold bg-transparent outline-none w-full"
                                                            />
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button onClick={() => onEdit(val.id)} className="flex items-center gap-1 p-1 text-slate-500 hover:text-indigo-600 text-[10px] font-medium bg-slate-50 hover:bg-indigo-50 rounded border border-slate-200">
                                                                    <Icon name="settings" size={10} /> Rediger
                                                                </button>
                                                                <button onClick={() => onDeleteStudent(val.id)} className="flex items-center gap-1 p-1 text-slate-500 hover:text-red-600 text-[10px] font-medium bg-slate-50 hover:bg-red-50 rounded border border-slate-200">
                                                                    <Icon name="trash-2" size={10} /> Slett
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <select
                                                                value={val.level || 2}
                                                                onChange={(e) => onUpdateStudent(val.id, { level: parseInt(e.target.value) })}
                                                                className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-slate-50 flex-1 outline-none"
                                                            >
                                                                <option value={1}>Lavt nivå</option>
                                                                <option value={2}>Middels nivå</option>
                                                                <option value={3}>Høyt nivå</option>
                                                            </select>
                                                            <select
                                                                value={val.gender || 'O'}
                                                                onChange={(e) => onUpdateStudent(val.id, { gender: e.target.value })}
                                                                className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-slate-50 flex-1 outline-none"
                                                            >
                                                                <option value="O">Ukjent</option>
                                                                <option value="M">Gutt</option>
                                                                <option value="F">Jente</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {students.length > 0 && (
                                            <button
                                                onClick={onClearRoster}
                                                className="w-full py-1.5 text-xs text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 mt-2"
                                            >
                                                Slett alle elever
                                            </button>
                                        )}
                                    </div>
                                )}

                                {activeTool === 'seating' && (
                                    <div className="space-y-4">
                                        <div className="text-xs text-slate-500 leading-relaxed">
                                            Dra og slipp elever for å bytte plasser manuelt. Bruk "Generer" for automatisk plassering.
                                            {score && score.violations.length > 0 && (
                                                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                                    <h4 className="font-bold text-red-800 mb-1 flex items-center gap-1"><Icon name="alert-circle" size={12} /> {score.violations.length} Regler brutt</h4>
                                                    <ul className="list-disc list-inside space-y-0.5">
                                                        {score.violations.slice(0, 3).map((v, i) => <li key={i}>{v.student.name}</li>)}
                                                        {score.violations.length > 3 && <li>...</li>}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => window.print()}
                                            className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Icon name="printer" size={16} /> Skriv ut / PDF
                                        </button>
                                    </div>
                                )}

                                {activeTool === 'furniture' && (
                                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                                        <h4 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2">
                                            <Icon name="info" size={16} /> Fjern/Legg til
                                        </h4>
                                        <p className="text-xs text-indigo-700 leading-relaxed">
                                            Klikk på en pult i kartet for å fjerne den (lage et hull/gang) eller sette den tilbake.
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-indigo-200">
                                            <label className="block text-xs font-bold text-indigo-900 mb-2">Dimensjoner</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-indigo-700 block mb-1">Rader</label>
                                                    <input type="number" min="2" max="15" value={roomConfig.rows} onChange={e => onUpdateConfig({ rows: parseInt(e.target.value) })} className="w-full p-1 text-sm rounded border border-indigo-200" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-indigo-700 block mb-1">Kolonner</label>
                                                    <input type="number" min="2" max="15" value={roomConfig.cols} onChange={e => onUpdateConfig({ cols: parseInt(e.target.value) })} className="w-full p-1 text-sm rounded border border-indigo-200" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTool === 'group' && (
                                    <div className="space-y-4">
                                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                                            <p className="text-xs text-slate-600 mb-3">Velg pulter manuelt for å lage en gruppe:</p>
                                            <button
                                                onClick={handleCreateGroup}
                                                disabled={selection.length === 0}
                                                className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${selection.length > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                            >
                                                Lag Manuell Gruppe ({selection.length})
                                            </button>
                                        </div>
                                        <button
                                            onClick={onClearGroups}
                                            className="w-full py-2 text-xs text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Slett alle manuelle grupper
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* Main Preview Area */}
                <div className={`flex-1 bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-8 print:p-0 print:bg-white print:block print:overflow-visible transition-colors duration-500 ${isStudentMode ? 'bg-slate-900' : ''}`}>

                    {/* Student View Controls (Minimal) - Hidden on Print */}

                    {/* Print Header */}
                    <div className="hidden print:block w-full mb-6 border-b pb-4">
                        <h1 className="text-2xl font-bold text-slate-900">{classTitle}</h1>
                        <p className="text-sm text-slate-500">Klassekart • {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="w-full h-12 mb-8 bg-white/50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm font-bold uppercase tracking-widest print:border-slate-800 print:text-slate-800">
                        Tavle / Lærers bord
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-4xl max-h-full overflow-auto w-full print:border-none print:shadow-none print:p-0 print:overflow-visible">
                        <GridMap
                            layout={layout}
                            roomConfig={roomConfig}
                            students={students}
                            isFurnitureMode={activeTool === 'furniture'}
                            onFurnitureClick={onFurnitureClick}
                            customGroups={customGroups}

                            // Seating Props (Pass through)
                            onSwap={activeTool === 'seating' ? onSwap : undefined}
                            onAssign={activeTool === 'seating' ? onAssign : undefined}
                            onEdit={onEdit}

                            // Selection Props
                            selection={selection}
                            onToggleSelection={activeTool === 'group' ? handleToggleSelection : undefined}

                            // View Mode
                            isStudentMode={isStudentMode}
                        />
                    </div>
                </div>
            </div>
        );
    };
})();

